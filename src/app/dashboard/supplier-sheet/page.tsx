"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

type SupplierRow = Record<string, string>;

type AmazonMatch = {
  asin: string;
  title: string;
  image: string;
  fbaQty: number;
  eligible: boolean;
  note: string;
};

type UploadedSheetRow = {
  id: string;
  upc: string;
  title: string;
  supplierSku: string;
  brand: string;
  cost: string;
  quantity: string;
  casePack: string;
  amazonMatch: AmazonMatch | null;
};

type UploadedSheet = {
  id: string;
  sheetName: string;
  supplier: string;
  status: "Uploaded";
  rows: number;
  bad: number;
  upcs: number;
  noAsin: number;
  asins: number;
  buyer: string;
  progress: number;
  date: string;
  uploadedRows: UploadedSheetRow[];
};

type MappingFields = {
  upc: string;
  title: string;
  cost: string;
  supplierSku: string;
  brand: string;
  quantity: string;
  modelNumber: string;
  ean: string;
  mapPrice: string;
  msrp: string;
  casePack: string;
  packSize: string;
  custom1: string;
  custom2: string;
  custom3: string;
};

const initialSuppliers = ["ResMed", "Country Life", "ABC Supply"];

const initialSheets: UploadedSheet[] = [
  {
    id: "1",
    sheetName: "ResMed - Tony (1)",
    supplier: "—",
    status: "Uploaded",
    rows: 10,
    bad: 0,
    upcs: 10,
    noAsin: 10,
    asins: 0,
    buyer: "Dalin",
    progress: 100,
    date: "Apr 13",
    uploadedRows: [],
  },
  {
    id: "2",
    sheetName: "Country Life - Bio Line (2)",
    supplier: "test",
    status: "Uploaded",
    rows: 256,
    bad: 0,
    upcs: 256,
    noAsin: 256,
    asins: 0,
    buyer: "Dalin",
    progress: 100,
    date: "Dec 22",
    uploadedRows: [],
  },
];

const emptyMapping: MappingFields = {
  upc: "",
  title: "",
  cost: "",
  supplierSku: "",
  brand: "",
  quantity: "",
  modelNumber: "",
  ean: "",
  mapPrice: "",
  msrp: "",
  casePack: "",
  packSize: "",
  custom1: "",
  custom2: "",
  custom3: "",
};

function normalizeValue(value: unknown) {
  return String(value ?? "").trim();
}

function countValidRows(rows: SupplierRow[], mapping: MappingFields) {
  return rows.filter((row) => {
    const upc = normalizeValue(row[mapping.upc]);
    const title = normalizeValue(row[mapping.title]);
    const cost = normalizeValue(row[mapping.cost]);
    return Boolean(upc && title && cost);
  }).length;
}

function countInvalidRows(rows: SupplierRow[], mapping: MappingFields) {
  return rows.length - countValidRows(rows, mapping);
}

function getDefaultSheetNameFromFile(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

export default function SupplierSheetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [sheets, setSheets] = useState<UploadedSheet[]>([]);

  useEffect(() => {
  const savedSheets = window.localStorage.getItem("supplierSheets");

  if (savedSheets) {
    try {
      setSheets(JSON.parse(savedSheets));
      return;
    } catch (error) {
      console.error("Failed to parse supplierSheets from localStorage", error);
    }
  }

  setSheets(initialSheets);
}, []);

useEffect(() => {
  if (sheets.length > 0) {
    window.localStorage.setItem("supplierSheets", JSON.stringify(sheets));
  }
}, [sheets]);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [mappingExpanded, setMappingExpanded] = useState(true);

  const [sheetName, setSheetName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [suppliers, setSuppliers] = useState<string[]>(initialSuppliers);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState("");

  const [selectedFileName, setSelectedFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<SupplierRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<MappingFields>(emptyMapping);
  const [mappingError, setMappingError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [toast, setToast] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const validRows = useMemo(
    () => countValidRows(parsedRows, mapping),
    [parsedRows, mapping]
  );

  const invalidRows = useMemo(
    () => countInvalidRows(parsedRows, mapping),
    [parsedRows, mapping]
  );

  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const matchesSearch =
        !search.trim() ||
        [sheet.sheetName, sheet.supplier, sheet.buyer, sheet.date, sheet.status]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesSupplier =
        supplierFilter === "All Suppliers" || sheet.supplier === supplierFilter;

      return matchesSearch && matchesSupplier;
    });
  }, [sheets, search, supplierFilter]);

  const resetUploadState = () => {
    setShowMapping(false);
    setMappingExpanded(true);
    setSheetName("");
    setSelectedSupplier("");
    setAddingSupplier(false);
    setNewSupplier("");
    setSelectedFileName("");
    setParsedRows([]);
    setHeaders([]);
    setMapping(emptyMapping);
    setMappingError("");
    setUploadError("");
  };

  const closeUpload = () => {
    setUploadOpen(false);
    resetUploadState();
  };

  const guessHeader = (allHeaders: string[], keywords: string[]) => {
    return (
      allHeaders.find((header) =>
        keywords.some((keyword) =>
          header.trim().toLowerCase().includes(keyword.toLowerCase())
        )
      ) || ""
    );
  };

  const handleFileParse = (file: File) => {
    setSelectedFileName(file.name);
    setUploadError("");

    if (!sheetName.trim()) {
      setSheetName(getDefaultSheetNameFromFile(file.name));
    }

    Papa.parse<SupplierRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<SupplierRow>) => {
        if (results.errors.length) {
          setUploadError("There was a problem reading this file.");
          setParsedRows([]);
          setHeaders([]);
          setShowMapping(false);
          return;
        }

        const cleaned = (results.data || []).filter((row: SupplierRow) =>
          Object.values(row).some((value) => normalizeValue(value) !== "")
        );

        if (!cleaned.length) {
          setUploadError("This file appears to be empty.");
          setParsedRows([]);
          setHeaders([]);
          setShowMapping(false);
          return;
        }

        const detectedHeaders = Object.keys(cleaned[0] || {});
        setParsedRows(cleaned);
        setHeaders(detectedHeaders);
        setShowMapping(true);

        setMapping({
          upc: guessHeader(detectedHeaders, ["upc", "barcode"]),
          title: guessHeader(detectedHeaders, [
            "description",
            "title",
            "product",
            "name",
          ]),
          cost: guessHeader(detectedHeaders, ["cost", "price"]),
          supplierSku: guessHeader(detectedHeaders, ["item #", "sku", "supplier sku"]),
          brand: guessHeader(detectedHeaders, ["brand"]),
          quantity: guessHeader(detectedHeaders, ["quantity", "qty"]),
          modelNumber: guessHeader(detectedHeaders, ["model"]),
          ean: guessHeader(detectedHeaders, ["ean"]),
          mapPrice: guessHeader(detectedHeaders, ["map"]),
          msrp: guessHeader(detectedHeaders, ["msrp"]),
          casePack: guessHeader(detectedHeaders, ["case pack", "case"]),
          packSize: guessHeader(detectedHeaders, ["pack size"]),
          custom1: "",
          custom2: "",
          custom3: "",
        });
      },
      error: () => {
        setUploadError("Unable to parse this file.");
      },
    });
  };

  const handleAddSupplier = () => {
    const cleaned = newSupplier.trim();
    if (!cleaned) return;

    if (!suppliers.includes(cleaned)) {
      setSuppliers((prev) => [...prev, cleaned]);
    }

    setSelectedSupplier(cleaned);
    setAddingSupplier(false);
    setNewSupplier("");
  };

  const handleUploadSheet = () => {
    if (!sheetName.trim()) {
      setUploadError("Sheet Name is required.");
      return;
    }

    if (!selectedFileName || !parsedRows.length) {
      setUploadError("Please upload a file.");
      return;
    }

    if (!mapping.upc || !mapping.title || !mapping.cost) {
      setMappingError("UPC, Product Title, and Cost Of Goods are required.");
      return;
    }

    const uploadedRows: UploadedSheetRow[] = parsedRows.map((row) => ({
      id: crypto.randomUUID(),
      upc: normalizeValue(row[mapping.upc]),
      title: normalizeValue(row[mapping.title]),
      supplierSku: normalizeValue(row[mapping.supplierSku]),
      brand: normalizeValue(row[mapping.brand]),
      cost: normalizeValue(row[mapping.cost]),
      quantity: normalizeValue(row[mapping.quantity]),
      casePack: normalizeValue(row[mapping.casePack]),
      amazonMatch: null,
    }));

    const newSheet: UploadedSheet = {
      id: crypto.randomUUID(),
      sheetName: sheetName.trim(),
      supplier: selectedSupplier || "—",
      status: "Uploaded",
      rows: parsedRows.length,
      bad: invalidRows,
      upcs: validRows,
      noAsin: validRows,
      asins: 0,
      buyer: "Dalin",
      progress: 100,
      date: new Date().toLocaleDateString("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "2-digit",
}),
      uploadedRows,
    };

    setSheets((prev) => [newSheet, ...prev]);
    closeUpload();
    setToast("Sheet uploaded successfully");
    window.setTimeout(() => setToast(""), 2500);
  };

  const renderSelect = (
    label: string,
    value: string,
    field: keyof MappingFields,
    required = false
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      <select
        value={value}
        onChange={(e) =>
          setMapping((prev) => ({ ...prev, [field]: e.target.value }))
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none"
      >
        <option value="">-- None --</option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </div>
  );

  const downloadCsvTemplate = () => {
    const csvTemplate = [
      [
        "UPC",
        "Product Title",
        "Cost Of Goods",
        "Supplier SKU",
        "Brand",
        "Quantity",
        "Model Number",
        "EAN",
        "MAP Price",
        "MSRP",
        "Case Pack",
        "Pack Size",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supplier_sheet_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = async () => {
    const XLSX = await import("xlsx");

  

    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "UPC",
        "Product Title",
        "Cost Of Goods",
        "Supplier SKU",
        "Brand",
        "Quantity",
        "Model Number",
        "EAN",
        "MAP Price",
        "MSRP",
        "Case Pack",
        "Pack Size",
      ],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "supplier_sheet_template.xlsx");
  };

  const deleteSheet = (sheetId: string) => {
    setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
  };
  const retrySheetLoad = (sheetId: string) => {
  setToast("Retrying sheet...");
  router.push(`/dashboard/supplier-sheet/${sheetId}`);
};

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8fa] text-[#111827]">
      <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-[#111827]">
              Supplier Sheets
            </h2>
            <p className="mt-1 text-base text-gray-500">
              Manage and track your uploaded supplier catalogs
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Create PO
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Upload Sheet
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8">
        <div className="rounded-2xl border border-[#f1d27a] bg-[#fff7df] px-5 py-4 text-[#8a6500]">
          Connect your Amazon Seller account in Settings → Integrations to enable
          product matching.
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row">
          <input
            type="text"
            placeholder="Search by Sheet Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none placeholder:text-gray-400"
          />

          <select className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none">
            <option>Sheet Name</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none"
          >
            <option>All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier}>{supplier}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.16em] text-gray-500">
                <tr className="border-b border-gray-200">
  <th className="w-[20%] px-3 py-4 text-left font-semibold">Sheet Name</th>
  <th className="w-[10%] px-3 py-4 text-left font-semibold">Supplier</th>
  <th className="w-[9%] px-3 py-4 text-center font-semibold">Status</th>
  <th className="w-[5%] px-3 py-4 text-center font-semibold">Rows</th>
  <th className="w-[5%] px-3 py-4 text-center font-semibold text-red-500">Bad</th>
  <th className="w-[6%] px-3 py-4 text-center font-semibold">UPCs</th>
  <th className="w-[8%] px-3 py-4 text-center font-semibold whitespace-nowrap text-yellow-600">NO ASIN</th>
  <th className="w-[6%] px-3 py-4 text-center font-semibold text-green-600">ASINS</th>
  <th className="w-[7%] px-3 py-4 text-center font-semibold">Buyer</th>
  <th className="w-[11%] px-3 py-4 text-center font-semibold">Progress</th>
  <th className="w-[6%] px-3 py-4 text-center font-semibold">Date</th>
  <th className="w-[90px] px-3 py-4 text-right font-semibold">Actions</th>
</tr>
              </thead>

              <tbody>
                {filteredSheets.map((sheet) => (
                  <tr
  key={sheet.id}
  className="border-b border-gray-100 text-sm text-gray-800 hover:bg-[#f9fbfc]"
>
  <td className="px-3 py-4">
  <button
    onClick={() => router.push(`/dashboard/supplier-sheet/${sheet.id}`)}
    className="block w-full max-w-[160px] truncate text-left font-semibold text-[#3b82f6] transition hover:text-[#2563eb]"
    style={{
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    }}
    title={sheet.sheetName}
  >
    {sheet.sheetName}
  </button>
</td>

  <td className="px-3 py-4">{sheet.supplier}</td>

  <td className="px-3 py-4 text-center">
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
      {sheet.status}
    </span>
  </td>

  <td className="px-3 py-4 text-center">{sheet.rows}</td>
  <td className="px-3 py-4 text-center text-red-500">{sheet.bad}</td>
  <td className="px-3 py-4 text-center">{sheet.upcs}</td>
  <td className="px-3 py-4 text-center whitespace-nowrap text-yellow-600">{sheet.noAsin}</td>
  <td className="px-3 py-4 text-center text-green-600">{sheet.asins}</td>
  <td className="px-3 py-4 text-center">{sheet.buyer}</td>

  <td className="px-3 py-4">
    <div className="flex items-center justify-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500"
          style={{ width: `${sheet.progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{sheet.progress}%</span>
    </div>
  </td>

  <td className="px-3 py-4 text-center whitespace-nowrap text-gray-500">
    {sheet.date}
  </td>
                    <td className="px-4 py-5">
  <div className="flex items-center justify-end gap-2">
    
    {/* Retry */}
    <div
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "9999px",
        background: "#58b7d6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => retrySheetLoad(sheet.id)}
        title="Retry Load"
        style={{
          all: "unset",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          className="h-4 w-4"
        >
          <path d="M20 11a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v5h-5" />
        </svg>
      </button>
    </div>

    {/* Delete */}
    <div
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "9999px",
        background: "#e45a72",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => deleteSheet(sheet.id)}
        title="Delete Sheet"
        style={{
          all: "unset",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          className="h-4 w-4"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>

  </div>
</td>
                  </tr>
                ))}

                {filteredSheets.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-16 text-center text-gray-500">
                      No supplier sheets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (!sheetName.trim()) {
            setSheetName(getDefaultSheetNameFromFile(file.name));
          }

          handleFileParse(file);
          e.currentTarget.value = "";
        }}
      />

      {uploadOpen && (
        <div className="fixed inset-0 z-[100] bg-black/35" onClick={closeUpload}>
          <div
            className="absolute inset-y-0 right-0 w-full max-w-[760px] border-l border-gray-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <h3 className="text-3xl font-bold text-[#111827]">
                  Upload Supplier Sheet
                </h3>
                <button
                  onClick={closeUpload}
                  className="text-2xl text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sheet Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="e.g., Tech Distributors - Q4"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Supplier
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none"
                    >
                      <option value="">Select (optional)</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-7">
                    <button
                      onClick={() => setAddingSupplier((prev) => !prev)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50"
                    >
                      New
                    </button>
                  </div>
                </div>

                {addingSupplier && (
                  <div className="mt-4 flex gap-3">
                    <input
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                      placeholder="Enter new supplier"
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleAddSupplier}
                      className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3 font-semibold text-white"
                    >
                      Save Supplier
                    </button>
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(false);

                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;

                    if (!sheetName.trim()) {
                      setSheetName(getDefaultSheetNameFromFile(file.name));
                    }

                    handleFileParse(file);
                  }}
                  className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDraggingFile
                      ? "border-[#4ade80] bg-[#f0fdf4]"
                      : "border-[#7dd3fc] bg-[#f8fcff]"
                  }`}
                >
                  {!selectedFileName ? (
                    <>
                      <div className="text-4xl text-gray-500">📄</div>
                      <p className="mt-3 text-2xl font-medium text-gray-800">
                        Drop file or click to browse
                      </p>
                      <p className="mt-2 text-base text-gray-500">CSV, XLSX, XLS</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-[#7dd3fc] bg-white p-5 text-left">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {selectedFileName}
                        </p>
                        <p className="mt-1 text-base text-gray-500">
                          {parsedRows.length} rows · {validRows} valid · {invalidRows} invalid
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileName("");
                          setParsedRows([]);
                          setHeaders([]);
                          setMapping(emptyMapping);
                          setShowMapping(false);
                          setMappingError("");
                          setUploadError("");
                        }}
                        className="text-base text-gray-500 hover:text-gray-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Need a template?
                      </p>
                      <p className="mt-0.5 text-xs text-green-700">
                        Download a ready-to-use supplier sheet template.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={downloadCsvTemplate}
                        className="rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                      >
                        CSV
                      </button>
                      <button
                        onClick={downloadExcelTemplate}
                        className="rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                      >
                        Excel
                      </button>
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {uploadError}
                  </div>
                )}

                {showMapping && (
                  <>
                    <div className="mt-6 rounded-xl border border-gray-200 bg-[#f8fafc]">
                      <button
                        type="button"
                        onClick={() => setMappingExpanded((prev) => !prev)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-semibold text-gray-800"
                      >
                        <span>Column Mapping (auto-detected)</span>
                        <span>{mappingExpanded ? "⌃" : "⌄"}</span>
                      </button>
                    </div>

                    {mappingExpanded && (
                      <>
                        <p className="mt-4 text-sm text-gray-500">
                          Required fields: UPC<span className="text-red-500">*</span>,
                          Product Title<span className="text-red-500">*</span>, Price/Cost Of
                          Goods<span className="text-red-500">*</span>
                        </p>

                        <div className="mt-4 rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
                          <p className="text-lg font-medium text-gray-800">
                            How is the cost displayed in this sheet?
                          </p>

                          <div className="mt-4 flex flex-wrap gap-8">
                            <label className="flex items-start gap-3">
                              <input type="radio" defaultChecked name="costType" className="mt-1" />
                              <span>
                                <span className="block text-lg font-medium text-gray-800">
                                  Per Unit
                                </span>
                                <span className="block text-sm text-gray-500">
                                  Cost shown is for each individual unit
                                </span>
                              </span>
                            </label>

                            <label className="flex items-start gap-3">
                              <input type="radio" name="costType" className="mt-1" />
                              <span>
                                <span className="block text-lg font-medium text-gray-800">
                                  Per Case
                                </span>
                                <span className="block text-sm text-gray-500">
                                  Cost shown is for the entire case
                                </span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          {renderSelect("Upc", mapping.upc, "upc", true)}
                          {renderSelect("Ean", mapping.ean, "ean")}
                          {renderSelect("Supplier Sku", mapping.supplierSku, "supplierSku")}
                          {renderSelect("Model Number", mapping.modelNumber, "modelNumber")}
                          {renderSelect("Product Title", mapping.title, "title", true)}
                          {renderSelect("Brand", mapping.brand, "brand")}
                          {renderSelect("Cost Of Goods", mapping.cost, "cost", true)}
                          {renderSelect("Quantity", mapping.quantity, "quantity")}
                          {renderSelect("Map Price", mapping.mapPrice, "mapPrice")}
                          {renderSelect("Msrp", mapping.msrp, "msrp")}
                          {renderSelect("Case Pack", mapping.casePack, "casePack")}
                          {renderSelect("Pack Size", mapping.packSize, "packSize")}
                        </div>

                        <div className="mt-5 rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
                          <p className="text-lg font-semibold text-gray-800">
                            Custom Columns (Optional)
                          </p>
                          <p className="mt-2 text-sm text-gray-500">
                            Add up to 3 custom columns to display extra data.
                          </p>

                          <div className="mt-4 grid gap-4 md:grid-cols-3">
                            {renderSelect("Custom 1", mapping.custom1, "custom1")}
                            {renderSelect("Custom 2", mapping.custom2, "custom2")}
                            {renderSelect("Custom 3", mapping.custom3, "custom3")}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!mapping.upc || !mapping.title || !mapping.cost) {
                              setMappingError(
                                "UPC, Product Title, and Cost Of Goods are required."
                              );
                              return;
                            }
                            setMappingError("");
                          }}
                          className="mt-5 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50"
                        >
                          Reprocess with new mapping
                        </button>

                        {mappingError && (
                          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {mappingError}
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                        <p className="text-4xl font-bold text-green-600">{validRows}</p>
                        <p className="mt-2 text-gray-600">Valid Rows</p>
                      </div>

                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <p className="text-4xl font-bold text-red-600">{invalidRows}</p>
                        <p className="mt-2 text-gray-600">Invalid Rows</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 bg-white px-6 py-5">
                <div className="flex items-center justify-between">
                  <div />
                  <div className="flex gap-3">
                    <button
                      onClick={closeUpload}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadSheet}
                      className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3 font-semibold text-white shadow-sm"
                    >
                      Upload Sheet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-2xl">
          <p className="text-lg font-semibold text-gray-900">{toast}</p>
          <p className="mt-1 text-gray-500">Upload completed successfully</p>
        </div>
      )}
    </section>
  );
}