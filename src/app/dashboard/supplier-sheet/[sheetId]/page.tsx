"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type AmazonMatch = {
  asin: string;
  title: string;
  image: string;
  fbaQty: number;
  eligible: boolean;
  note: string;
  packSize?: string;
  buyBox?: string;
  shippingCost?: string;
  prepCost?: string;
  totalFee?: string;
  asinCost?: string;
  roi?: string;
  pm?: string;
  profit?: string;
  salesRank?: string;
  poHistory?: string;
  tags?: string;
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
  customInfo1?: string;
  customInfo2?: string;
  customInfo3?: string;
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

const fallbackSheets: UploadedSheet[] = [
  {
    id: "1",
    sheetName: "ResMed - Tony (1)",
    supplier: "ResMed",
    status: "Uploaded",
    rows: 10,
    bad: 0,
    upcs: 10,
    noAsin: 8,
    asins: 2,
    buyer: "Dalin",
    progress: 100,
    date: "04/13/26",
    uploadedRows: [
      {
        id: "r1",
        upc: "619498388103",
        title: "HumidX 6pk Standard for AirMini",
        supplierSku: "38013",
        brand: "ResMed",
        cost: "18.50",
        quantity: "24",
        casePack: "6",
        amazonMatch: {
          asin: "B08TEST123",
          title: "ResMed HumidX Standard for AirMini - 6 Pack",
          image: "https://via.placeholder.com/120x120?text=ASIN",
          fbaQty: 14,
          eligible: true,
          note: "Good match based on UPC and title.",
        },
      },
      {
        id: "r2",
        upc: "619498380100",
        title: "AirMini Setup Pack",
        supplierSku: "38010",
        brand: "ResMed",
        cost: "24.75",
        quantity: "12",
        casePack: "4",
        amazonMatch: null,
      },
    ],
  },
];

function StatCard({
  value,
  label,
  tone = "default",
}: {
  value: number | string;
  label: string;
  tone?: "default" | "red" | "yellow" | "green" | "blue";
}) {
  const toneMap = {
    default: {
      border: "border-gray-200",
      bg: "bg-white",
      value: "text-[#111827]",
      label: "text-gray-500",
    },
    red: {
      border: "border-red-200",
      bg: "bg-red-50",
      value: "text-red-600",
      label: "text-red-500",
    },
    yellow: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      value: "text-yellow-700",
      label: "text-yellow-700",
    },
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      value: "text-green-700",
      label: "text-green-700",
    },
    blue: {
      border: "border-sky-200",
      bg: "bg-sky-50",
      value: "text-sky-700",
      label: "text-sky-700",
    },
  };

  const styles = toneMap[tone];
  

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} px-5 py-5 shadow-sm`}>
      <p className={`text-3xl font-bold ${styles.value}`}>{value}</p>
      <p className={`mt-1 text-sm font-medium ${styles.label}`}>{label}</p>
    </div>
  );
}

function CopyPill({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      onClick={() => onCopy(value)}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#59b7d8] hover:text-[#0f172a]"
      title={`Copy ${label}`}
    >
      <span className="text-gray-400">{label}</span>
      <span>{value || "—"}</span>
    </button>
  );
}

export default function SupplierSheetDetailPage() {
    const sheetColumns = "2.1fr 1fr 1fr 0.75fr 0.9fr";
  const params = useParams();
  const sheetId = String(params.sheetId);

  const [sheets, setSheets] = useState<UploadedSheet[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("UPC");
  const [matchFilter, setMatchFilter] = useState("All");
  const [eligibleFilter, setEligibleFilter] = useState("All");
  const [toast, setToast] = useState("");

  const [editableSheetName, setEditableSheetName] = useState("");
const renameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [notesByRow, setNotesByRow] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedSheets = window.localStorage.getItem("supplierSheets");

    if (savedSheets) {
      try {
        const parsed = JSON.parse(savedSheets) as UploadedSheet[];
        setSheets(parsed);
        setLoaded(true);
        return;
      } catch (error) {
        console.error("Failed to parse supplierSheets from localStorage", error);
      }
    }

    setSheets(fallbackSheets);
    setLoaded(true);
  }, []);

  const sheet = useMemo(() => {
    return sheets.find((item) => item.id === sheetId) || null;
  }, [sheets, sheetId]);

  useEffect(() => {
    if (!sheet) return;

    const initialNotes: Record<string, string> = {};
    sheet.uploadedRows.forEach((row) => {
      initialNotes[row.id] = row.amazonMatch?.note || "";
    });
    setNotesByRow(initialNotes);
  }, [sheet]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`Copied: ${value}`);
      window.setTimeout(() => setToast(""), 1800);
    } catch {
      setToast("Copy failed");
      window.setTimeout(() => setToast(""), 1800);
    }
  };

  const updateSheetName = (nextName: string) => {
  setEditableSheetName(nextName);

  if (renameTimeoutRef.current) {
    clearTimeout(renameTimeoutRef.current);
  }

  renameTimeoutRef.current = setTimeout(() => {
    setSheets((prev) => {
      const updated = prev.map((item) =>
        item.id === sheetId
          ? {
              ...item,
              sheetName: nextName.trim() || "Untitled Sheet",
            }
          : item
      );

      window.localStorage.setItem("supplierSheets", JSON.stringify(updated));
      return updated;
    });

    setToast("Sheet name saved");
    window.setTimeout(() => setToast(""), 1200);
  }, 500);
};

  useEffect(() => {
  if (!sheet) return;
  setEditableSheetName(sheet.sheetName || "");
}, [sheet]);
const updateRowField = (
  rowId: string,
  field: keyof UploadedSheetRow,
  value: string
) => {
  setSheets((prev) => {
    const updated = prev.map((sheetItem) => {
      if (sheetItem.id !== sheetId) return sheetItem;

      return {
        ...sheetItem,
        uploadedRows: sheetItem.uploadedRows.map((row) =>
          row.id === rowId ? { ...row, [field]: value } : row
        ),
      };
    });

    window.localStorage.setItem("supplierSheets", JSON.stringify(updated));
    return updated;
  });
};
const updateAmazonMatchField = (
  rowId: string,
  field: keyof AmazonMatch,
  value: string
) => {
  setSheets((prev) => {
    const updated = prev.map((sheetItem) => {
      if (sheetItem.id !== sheetId) return sheetItem;

      return {
        ...sheetItem,
        uploadedRows: sheetItem.uploadedRows.map((row) => {
          if (row.id !== rowId || !row.amazonMatch) return row;

          return {
            ...row,
            amazonMatch: {
              ...row.amazonMatch,
              [field]: value,
            },
          };
        }),
      };
    });

    window.localStorage.setItem("supplierSheets", JSON.stringify(updated));
    return updated;
  });
};


  const filteredRows = useMemo(() => {
    if (!sheet) return [];

    let rows = [...sheet.uploadedRows];

    if (search.trim()) {
      const query = search.toLowerCase();

      rows = rows.filter((row) => {
        const amazonTitle = row.amazonMatch?.title || "";
        const amazonAsin = row.amazonMatch?.asin || "";

        if (searchType === "UPC") {
          return row.upc.toLowerCase().includes(query);
        }

        if (searchType === "Title") {
          return [row.title, amazonTitle].join(" ").toLowerCase().includes(query);
        }

        if (searchType === "Item #") {
          return row.supplierSku.toLowerCase().includes(query);
        }

        if (searchType === "ASIN") {
          return amazonAsin.toLowerCase().includes(query);
        }

        return (
          row.upc.toLowerCase().includes(query) ||
          row.title.toLowerCase().includes(query) ||
          row.supplierSku.toLowerCase().includes(query) ||
          amazonAsin.toLowerCase().includes(query) ||
          amazonTitle.toLowerCase().includes(query)
        );
      });
    }

    if (matchFilter === "Matched") {
      rows = rows.filter((row) => !!row.amazonMatch);
    }

    if (matchFilter === "No Match") {
      rows = rows.filter((row) => !row.amazonMatch);
    }

    if (eligibleFilter === "Eligible") {
      rows = rows.filter((row) => row.amazonMatch?.eligible === true);
    }

    if (eligibleFilter === "Not Eligible") {
      rows = rows.filter(
        (row) => row.amazonMatch && row.amazonMatch.eligible === false
      );
    }

    return rows;
  }, [sheet, search, searchType, matchFilter, eligibleFilter]);

  const matchedCount = sheet?.uploadedRows.filter((row) => !!row.amazonMatch).length || 0;
  const notMatchedCount =
    sheet?.uploadedRows.filter((row) => !row.amazonMatch).length || 0;
  const eligibleCount =
    sheet?.uploadedRows.filter((row) => row.amazonMatch?.eligible).length || 0;

  if (!loaded) {
    return (
      <section className="min-h-screen bg-[#f7f8fa] px-6 pt-6 pb-6 text-[#111827] lg:px-8">
        <div className="mx-auto max-w-[1800px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            Loading sheet...
          </div>
        </div>
      </section>
    );
  }

  if (!sheet) {
    return (
      <section className="min-h-screen bg-[#f7f8fa] px-6 pt-6 pb-6 text-[#111827] lg:px-8">
        <div className="mx-auto max-w-[1800px]">
          <Link
            href="/dashboard/supplier-sheet"
            className="mb-4 inline-flex text-sm font-medium text-[#3b82f6] hover:underline"
          >
            ← Back to Supplier Sheets
          </Link>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold">Sheet not found</h1>
            <p className="mt-2 text-gray-500">
              This sheet does not exist or has not been saved yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  
    return (
  <section className="min-h-screen bg-[#f7f8fa] text-[#111827]">
  <div
    className="fixed top-[77px] right-0 z-[60] border-b border-gray-200 bg-white"
    style={{ left: "var(--sidebar-width)" }}
  >
    <div className="bg-white px-4 py-2 lg:px-6">
      <div className="flex w-full gap-2 overflow-hidden items-start">
        {/* Back */}
        <div className="h-[58px] shrink-0 flex flex-col justify-end">
          <div className="mb-1 h-4" />
          <Link
            href="/dashboard/supplier-sheet"
            className="flex h-10 w-11 items-center justify-center rounded-xl border border-[#b8c7db] bg-white text-[#111827] transition hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#111827]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        </div>

        {/* Sheet Name */}
        <div className="h-[58px] min-w-0 w-[62px] max-w-[62px] shrink basis-[62px] flex flex-col justify-end transition-all duration-200">
          <div className="mb-1 h-4" />
          <div
            style={{ backgroundColor: "#f8e68a" }}
            className="flex h-10 w-full min-w-0 items-center rounded-xl border border-[#ead46d] px-2"
          >
            <input
              value={editableSheetName}
              onChange={(e) => updateSheetName(e.target.value)}
              className="w-full min-w-0 truncate bg-transparent text-[14px] font-semibold text-[#111827] outline-none"
              placeholder="Sheet"
              title={editableSheetName}
            />
          </div>
        </div>

        {/* Search Type */}
        <div className="w-[105px] shrink-0">
          <p className="mb-1 text-xs font-medium text-gray-500">Search Type</p>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm"
          >
            <option>UPC</option>
            <option>ASIN</option>
            <option>Title</option>
            <option>Item #</option>
          </select>
        </div>

        {/* Search */}
        <div className="min-w-[120px] flex-1">
          <p className="mb-1 text-xs font-medium text-gray-500">Search</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none"
          />
        </div>

        {/* Variety View */}
        <div className="w-[95px] shrink-0">
          <p className="mb-1 text-xs font-medium text-gray-500">Variety View</p>
          <button className="relative h-7 w-11 rounded-full bg-gray-300">
            <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Connected POs */}
        <div className="w-[125px] shrink-0">
          <p className="mb-1 text-xs font-medium text-gray-500">Connected POs</p>
          <select className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm">
            <option>Connected POs</option>
          </select>
        </div>

        {/* Link */}
        <div className="h-[58px] shrink-0 flex flex-col justify-end">
          <div className="mb-1 h-4" />
          <button className="flex h-10 w-11 items-center justify-center rounded-xl border border-[#8aa6d8] bg-white text-[22px] text-[#334155]">
            🔗
          </button>
        </div>

        {/* Sort By */}
        <div className="w-[125px] shrink-0">
          <p className="mb-1 text-xs font-medium text-gray-500">Sort By</p>
          <select className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm">
            <option>Amazon Title</option>
          </select>
        </div>

        {/* Asc / Dsc */}
        <div className="h-[58px] shrink-0 flex flex-col justify-end">
          <div className="mb-1 h-4" />
          <div className="flex gap-0">
            <button className="h-10 rounded-l-xl border border-[#3b82f6] bg-white px-3 text-sm font-semibold text-[#111827]">
              Asc ↑
            </button>
            <button className="h-10 rounded-r-xl border border-l-0 border-gray-300 bg-white px-3 text-sm font-medium text-gray-500">
              Dsc ↓
            </button>
          </div>
        </div>

        {/* Source Filter */}
        <div className="h-[58px] shrink-0 flex flex-col justify-end">
          <div className="mb-1 h-4" />
          <button className="flex h-10 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-[#111827]">
            <span>⚑</span>
            <span>Source filter</span>
          </button>
        </div>

        {/* Create ASIN */}
        <div className="h-[58px] shrink-0 flex flex-col justify-end">
          <div className="mb-1 h-4" />
          <button
            style={{ backgroundColor: "#22c55e" }}
            className="h-10 rounded-xl px-3 text-sm font-semibold text-white shadow-sm"
          >
            CREATE ASIN +
          </button>
        </div>
      </div>
    </div>
  </div>

 <div style={{ paddingTop: "120px" }}>
  <div className="px-4 pb-4 lg:px-6">
    <div className="flex flex-nowrap gap-5 overflow-x-auto">
      <div className="min-w-0 flex-1">
        <StatCard value={sheet.rows} label="Total Products" tone="default" />
      </div>

      <div className="min-w-0 flex-1">
        <StatCard value={matchedCount} label="Matched ASINs" tone="green" />
      </div>

      <div className="min-w-0 flex-1">
        <StatCard value={notMatchedCount} label="No Match Found" tone="yellow" />
      </div>

      <div className="min-w-0 flex-1">
        <StatCard value={sheet.bad} label="No UPC (Title Only)" tone="red" />
      </div>
    </div>
  </div>

  {/* ROWS */}
  <div className="mt-6 rounded-2xl bg-white shadow-sm">
    <div
  className="sticky z-[100] rounded-t-2xl border-b border-[#d7dde7] bg-[#f0f1f3] text-sm font-semibold uppercase tracking-wide text-gray-600"
  style={{
    top: "161px",
    display: "grid",
    gridTemplateColumns: sheetColumns,
  }}
>
  <div className="flex items-center justify-center px-5 py-4 text-center">
    Image / Detail
  </div>

  <div className="flex items-center justify-center border-l border-[#d7dde7] px-5 py-4 text-center">
    Cost
  </div>

  <div className="flex items-center justify-center border-l border-[#d7dde7] px-5 py-4 text-center">
    Quantity / Profit
  </div>

  <div className="flex items-center justify-center border-l border-[#d7dde7] px-5 py-4 text-center">
    Info
  </div>

  <div className="flex items-center justify-center border-l border-[#d7dde7] px-5 py-4 text-center">
    ASIN
  </div>
</div>

    {filteredRows.length === 0 ? (
      <div className="p-10 text-center text-gray-500">No rows found.</div>
    ) : (
      filteredRows.map((row) => (
        <div key={row.id} className="border-x border-[#c9ced6]">
       {/* SUPPLIER ROW */}
<div
  className="relative z-10 grid"
  style={{
    gridTemplateColumns: sheetColumns,
    background: "linear-gradient(0deg, rgba(34,197,94,0.12), rgba(34,197,94,0.12)), #eef7ee",
    boxShadow: "inset 0 -3px 0 #065f46",
  }}
>
  
  {/* COLUMN 1 — IMAGE / DETAIL */}
<div className="min-w-0 px-3 py-2">
  <div className="flex h-[118px] min-w-0 gap-3">
    {/* IMAGE BOX */}
    <div className="w-[132px] shrink-0 overflow-hidden rounded-2xl border-2 border-[#16a34a] bg-white shadow-sm">
      <div className="relative flex h-full items-center justify-center bg-[#f6f7f4] p-1">
        <button
          type="button"
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md text-[#2563eb] hover:bg-white"
          title="Edit Image"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M14.05 6.19L17.8 9.94"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex h-[92px] w-[92px] items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-16 w-16 text-gray-300"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 15l-5-5L5 20" />
          </svg>
        </div>
      </div>
    </div>

    {/* UPC / DESC BOX */}
<div className="min-w-0 flex-1 max-w-[420px] overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
  <div
    className="grid h-full grid-rows-2"
    style={{ gridTemplateColumns: "1fr 3fr" }}
  >
    {/* ROW 1 LEFT — UPC */}
    <div className="flex items-center gap-2 border-r border-b border-[#cfd5cd] bg-white px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#159a84]">
        <path d="M3 4V20" stroke="#159a84" strokeWidth="2" />
        <path d="M6 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M8 4V20" stroke="#159a84" strokeWidth="2.5" />
        <path d="M11 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M14 4V20" stroke="#159a84" strokeWidth="2" />
        <path d="M17 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M20 4V20" stroke="#159a84" strokeWidth="2.5" />
      </svg>

      <span className="truncate text-[13px] font-semibold text-[#159a84]">
        UPC
      </span>
    </div>

    {/* ROW 1 RIGHT — UPC VALUE */}
    <div className="flex min-w-0 items-center justify-between border-b border-[#cfd5cd] bg-[#f0f1f3] px-3">
      <div
        style={{ backgroundColor: "#22c55e" }}
        className="inline-flex min-w-0 items-center rounded-full px-5 py-2 text-white shadow-sm"
      >
        <span className="truncate text-[12px] font-bold">
          {row.upc || "—"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => copyText(row.upc || "")}
        className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
        title="Copy UPC"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>

    {/* ROW 2 LEFT — DESC */}
    <div className="flex items-center gap-2 border-r border-[#cfd5cd] bg-white px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#9ca3af]">
        <circle cx="12" cy="12" r="10" fill="#9ca3af" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>

      <span className="truncate text-[13px] text-[#7a808c]">
        Desc:
      </span>
    </div>

    {/* ROW 2 RIGHT — DESC VALUE */}
    <div className="flex min-w-0 items-start justify-between bg-[#f0f1f3] px-3 pt-3 pb-2">
      <p
        className="min-w-0 flex-1 text-[14px] leading-[1.3] text-[#111827]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
        title={row.title || ""}
      >
        {row.title || "—"}
      </p>

      <div className="ml-3 flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => copyText(row.title || "")}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
          title="Copy Description"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#2563eb] hover:bg-white"
          title="Edit Description"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14.05 6.19L17.8 9.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

    {/* ITEM / SIZE BOX */}
<div className="w-[108px] min-w-[108px] max-w-[108px] basis-[108px] flex-none overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
  <div className="grid h-full grid-rows-[52px_1fr]">
    {/* ITEM ROW */}
    <div className="border-b border-[#cfd5cd] bg-white px-2 py-2">
      <div className="flex min-w-0 items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#22a06b]">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="truncate text-[13px] font-semibold text-[#22a06b]">Item</span>
        </div>

        <button
          type="button"
          onClick={() => copyText(row.supplierSku || "")}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
          title="Copy Item #"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-1.5 min-w-0 rounded-[5px] bg-[#c8f0df] px-2 py-1">
        <span className="block truncate text-[14px] font-bold text-[#4b5563]">
          {row.supplierSku || "—"}
        </span>
      </div>
    </div>

    {/* SIZE ROW */}
    <div className="bg-white px-2 py-2">
      <div className="flex min-w-0 items-center gap-1">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#7c58d6]">
          <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 7H17V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="truncate text-[11px] font-semibold text-[#7c58d6]">Size</span>
      </div>

      <div className="mt-1.5 min-w-0">
        <span className="block truncate text-[11px] font-semibold text-[#111827]">
          {row.casePack || "—"}
        </span>
      </div>
    </div>
  </div>
</div>
  </div>
</div>

  {/* COLUMN 2 — COST */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-[118px] grid-rows-2 gap-3">
    
    {/* TOP ROW */}
    <div className="grid grid-cols-2 gap-3">
      {/* CASE COST */}
      <div className="rounded-2xl border border-[#cfd8cc] bg-white px-3 py-2 shadow-sm">
        <p className="text-[12px] text-gray-500">Case cost ($)</p>
        <input
          value={row.cost || ""}
          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
          className="mt-1 w-full bg-transparent text-[18px] font-semibold text-[#111827] outline-none"
        />
      </div>

      {/* EACH COST */}
      <div className="rounded-2xl border border-[#cfd8cc] bg-white px-3 py-2 shadow-sm">
        <p className="text-[12px] text-gray-500">Each cost ($)</p>
        <input
          value={row.cost || ""}
          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
          className="mt-1 w-full bg-transparent text-[18px] font-semibold text-[#111827] outline-none"
        />
      </div>
    </div>

    {/* BOTTOM ROW */}
    <div className="grid grid-cols-2 gap-3">
      
      {/* DISC */}
      <div className="flex overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex items-center border-r border-[#d7dde7] bg-white px-3 text-[14px] text-gray-600">
          Disc:
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#f3f4f6]">
          <span className="rounded-[8px] bg-[#e6d7b5] px-3 py-1 text-[16px] font-bold text-[#7a5c00]">
            0
          </span>
        </div>
      </div>

      {/* SSH */}
      <div className="flex overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex items-center border-r border-[#d7dde7] bg-white px-3 text-[14px] text-gray-600">
          SSH
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#f3f4f6]">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#2563eb]">
            <circle cx="5" cy="6" r="1.5" fill="currentColor" />
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="5" cy="18" r="1.5" fill="currentColor" />
            <path d="M10 6h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 18h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

    </div>
  </div>
</div>

  {/* COLUMN 3 — QUANTITY / PROFIT */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-[118px] grid-cols-2 grid-rows-3 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
    {/* ROW 1 LEFT */}
    <div className="flex items-center gap-2 border-r border-b border-[#d7dde7] bg-[#f3f4ef] px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#7c58d6]">
        <rect x="3" y="10" width="5" height="8" rx="1.5" fill="currentColor" />
        <rect x="9.5" y="6" width="5" height="12" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="16" y="3" width="5" height="15" rx="1.5" fill="currentColor" opacity="0.8" />
      </svg>
      <span className="truncate text-[13px] font-semibold text-[#7c58d6]">Case Size</span>
    </div>

    {/* ROW 1 RIGHT */}
    <div className="flex items-center border-b border-[#d7dde7] bg-white px-3">
      <span className="inline-flex min-w-[38px] items-center justify-center rounded-[8px] bg-[#8b6edb] px-3 py-1 text-[13px] font-bold text-white">
        {row.casePack || "—"}
      </span>
    </div>

    {/* ROW 2 LEFT */}
    <div className="flex items-center gap-2 border-r border-b border-[#d7dde7] bg-[#f3f4ef] px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#5f6368]">
        <path
          d="M4 16.5L16.5 4a2.12 2.12 0 0 1 3 3L7 19.5 3 20l.5-4Z"
          fill="currentColor"
        />
        <path d="M13.5 7.5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="truncate text-[13px] font-medium text-[#5f6368]">UOM</span>
    </div>

    {/* ROW 2 RIGHT */}
    <div className="flex items-center border-b border-[#d7dde7] bg-white px-3">
      <span className="text-[16px] font-semibold text-[#111827]">EA</span>
    </div>

    {/* ROW 3 LEFT */}
    <div className="flex items-center gap-2 border-r border-[#d7dde7] bg-[#f3f4ef] px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#4338ca]">
        <circle cx="5" cy="6" r="1.8" fill="currentColor" />
        <circle cx="5" cy="12" r="1.8" fill="currentColor" />
        <circle cx="5" cy="18" r="1.8" fill="currentColor" />
        <path d="M10 6h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 18h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="truncate text-[13px] font-semibold text-[#4338ca]">Supp Qty</span>
    </div>

    {/* ROW 3 RIGHT */}
    <div className="flex items-center bg-white px-3">
      <span className="text-[16px] font-semibold text-[#0f8f6f]">
        {row.quantity || "0"}
      </span>
    </div>
  </div>
</div>
  {/* COLUMN 4 — INFO */}
<div className="min-h-[188px] border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-[118px] grid-rows-3 gap-2 rounded-2xl border border-[#cfd8cc] bg-white p-2 shadow-sm">
    
    <input
      value={row.customInfo1 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo1", e.target.value)}
      placeholder="Custom info"
      className="h-full w-full rounded-[10px] border border-[#d7dde7] bg-white px-3 text-[13px] text-[#111827] outline-none truncate"
    />

    <input
      value={row.customInfo2 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo2", e.target.value)}
      placeholder="Custom info"
      className="h-full w-full rounded-[10px] border border-[#d7dde7] bg-white px-3 text-[13px] text-[#111827] outline-none truncate"
    />

    <input
      value={row.customInfo3 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo3", e.target.value)}
      placeholder="Custom info"
      className="h-full w-full rounded-[10px] border border-[#d7dde7] bg-white px-3 text-[13px] text-[#111827] outline-none truncate"
    />

  </div>
</div>

  {/* COLUMN 5 — ASIN */}
<div className="min-h-[188px] border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-full grid-rows-2 gap-3">
    {/* TOP BOX */}
    <div className="flex items-center rounded-2xl border border-[#cfd8cc] bg-white px-4 py-4 shadow-sm">
      <span className="text-[15px] font-medium text-[#111827]">+ Added</span>

      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="ml-2 h-5 w-5 text-[#f59e0b]"
      >
        <path d="M10.59 2.59A2 2 0 0 1 12 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.59 1.41l-7.82 7.82a2 2 0 0 1-2.82 0l-5-5a2 2 0 0 1 0-2.82l7.82-7.82ZM17.5 7A1.5 1.5 0 1 0 17.5 4a1.5 1.5 0 0 0 0 3Z" />
      </svg>

      <span className="ml-2 text-[15px] font-bold text-[#f59e0b]">
        {row.amazonMatch ? "1 ASIN" : "0 ASIN"}
      </span>
    </div>

    {/* BOTTOM BOX */}
<button
  type="button"
  className="relative flex cursor-pointer items-center justify-center rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] px-4 py-4 pr-12 text-center shadow-sm hover:bg-[#e5e7eb]"
>
  {/* CENTERED TEXT */}
  <span className="text-[15px] font-medium text-[#111827]">
    Add More ASIN
  </span>

  {/* RIGHT ARROWS */}
  <div className="pointer-events-none absolute right-2 flex items-center">
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[#2F80ED]">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    
  </div>
</button>
  </div>
</div>
</div>






         {/* AMAZON MATCH ROW */}
<div
  className="grid bg-[#f8faf7]"
  style={{
    gridTemplateColumns: sheetColumns,
    boxShadow: "inset 0 -3px 0 #f59e0b",
  }}
>
  {/* COLUMN 1 — IMAGE / DETAIL */}
<div className="min-w-0 px-3 py-2">
  <div className="flex h-[118px] min-w-0 gap-3">
    
    {/* AMAZON IMAGE BOX */}
    <div className="w-[132px] shrink-0 overflow-hidden rounded-2xl border-2 border-[#f59e0b] bg-white shadow-sm">
      <div className="relative flex h-full items-center justify-center bg-white p-1">
        {row.amazonMatch?.image ? (
          <img
            src={row.amazonMatch.image}
            alt={row.amazonMatch.title || "Amazon match"}
            className="max-h-[100px] max-w-[100px] object-contain"
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-16 w-16 text-gray-300"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 15l-5-5L5 20" />
          </svg>
        )}
      </div>
    </div>

    {/* TITLE / AMAZON QTY BOX */}
<div className="min-w-0 flex-1 max-w-[420px] overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
  <div
    className="grid h-full grid-rows-2"
    style={{ gridTemplateColumns: "1fr 3fr" }}
  >
    {/* ROW 1 LEFT */}
    <div className="flex items-center gap-2 border-r border-b border-[#d7dde7] bg-white px-3">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#9ca3af]">
        <circle cx="12" cy="12" r="10" fill="#9ca3af" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>
      <span className="truncate text-[13px] text-[#7a808c]">Desc</span>
    </div>

   {/* ROW 1 RIGHT */}
<div className="flex min-w-0 items-start justify-between border-b border-[#d7dde7] bg-[#f0f1f3] px-3 pt-3 pb-2">
  <p
    className="min-w-0 flex-1 text-[14px] leading-[1.3] text-[#111827]"
    style={{
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }}
    title={row.amazonMatch?.title || ""}
  >
    {row.amazonMatch?.title || "No Amazon title"}
  </p>

  <button
    type="button"
    onClick={() => copyText(row.amazonMatch?.title || "")}
    className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
    title="Copy Amazon Title"
  >
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect
        x="9"
        y="9"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 15V7C6 5.9 6.9 5 8 5H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </button>
</div>

    {/* ROW 2 LEFT */}
    <div className="flex items-center gap-2 border-r border-[#d7dde7] bg-white px-3">
      <span className="text-[18px] font-bold text-[#f59e0b]">a</span>
      <span className="truncate text-[13px] font-semibold text-[#f59e0b]">Qty</span>
    </div>

    {/* ROW 2 RIGHT */}
    <div className="flex min-w-0 items-center gap-3 bg-[#f0f1f3] px-3">
      <span className="rounded-lg bg-[#ffbd6b] px-4 py-2 text-[16px] font-bold text-black">
        {row.amazonMatch?.fbaQty ?? 0}
      </span>

      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#111827]">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>
    </div>
  </div>
</div>

    {/* PACK SIZE / BUY BOX BOXES */}
    <div className="w-[132px] shrink-0 grid grid-rows-2 gap-3">
      <div className="rounded-2xl border-2 border-[#15803d] bg-white px-3 py-2 shadow-sm">
        <p className="text-[12px] font-semibold text-gray-500">Pack Size:</p>
        <p className="text-[18px] font-semibold text-[#334155]">
          {row.amazonMatch?.packSize || "1"}
        </p>
      </div>

      <div className="rounded-2xl border border-[#cfd8cc] bg-white px-3 py-2 shadow-sm">
        <p className="text-[12px] font-semibold text-gray-500">Buy box ($)</p>
        <p className="text-[18px] font-semibold text-[#334155]">
          {row.amazonMatch?.buyBox || "—"}
        </p>
      </div>
    </div>

  </div>
</div>



{/* COLUMN 2 — COST */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-full grid-rows-2 gap-2">

    {/* TOP ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      <div className="min-h-0 rounded-2xl border border-[#cfd8cc] bg-white px-3 py-1.5 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">
          Shipping Cost ...
        </p>
        <p className="text-[17px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.shippingCost || "0.1"}
        </p>
      </div>

      <div className="min-h-0 rounded-2xl border border-[#cfd8cc] bg-white px-3 py-1.5 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">
          Prep Cost ($)
        </p>
        <p className="text-[17px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.prepCost || "0"}
        </p>
      </div>
    </div>

    {/* BOTTOM ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex h-[28px] items-center justify-between border-b border-[#d7dde7] px-3">
          <span className="truncate text-[14px] font-medium text-[#111827]">Total Fee</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6b7280] text-[11px] font-bold text-white">
            i
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 text-[#334155]">
          <span className="text-[16px]">$</span>
          <span className="text-[17px] font-semibold">
            {row.amazonMatch?.totalFee || "20.13"}
          </span>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex h-[28px] items-center gap-2 border-b border-[#d7dde7] px-3">
          <span className="text-[17px] font-bold text-[#f59e0b]">a</span>
          <span className="truncate text-[14px] font-medium text-[#f59e0b]">
            ASIN COST
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 text-[#334155]">
          <span className="text-[16px]">$</span>
          <span className="text-[17px] font-semibold">
            {row.amazonMatch?.asinCost || "54.35"}
          </span>
        </div>
      </div>
    </div>

  </div>
</div>

{/* COLUMN 3 — QUANTITY / PROFIT */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div
    className="grid h-full grid-rows-3 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm"
    style={{ gridTemplateColumns: "0.85fr 3.15fr" }}
  >
    {/* ROW 1 — ROI */}
    <div className="flex items-center gap-1.5 border-r border-b border-[#d7dde7] bg-white px-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#6b7280]">
        <path d="M4 12h16M12 4l-4 4 4 4M12 20l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[13px] font-medium text-[#334155]">ROI</span>
    </div>

    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#d7dde7] bg-[#f3f4f6] px-2">
      <span className="truncate rounded-lg bg-[#f8dce4] px-2.5 py-1 text-[14px] font-bold text-[#be123c]">
        {row.amazonMatch?.roi || "-12.84%"}
      </span>

      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>

    {/* ROW 2 — PM */}
    <div className="flex items-center gap-1.5 border-r border-b border-[#d7dde7] bg-white px-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#6b7280]">
        <path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[13px] font-medium text-[#334155]">PM</span>
    </div>

    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[#d7dde7] bg-[#f3f4f6] px-2">
      <span className="truncate rounded-lg bg-[#f8dce4] px-2.5 py-1 text-[14px] font-bold text-[#be123c]">
        {row.amazonMatch?.pm || "-10.33%"}
      </span>

      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>

    {/* ROW 3 — PROFIT */}
    <div className="flex items-center gap-1.5 border-r border-[#d7dde7] bg-white px-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#6b7280]">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span className="text-[13px] font-medium text-[#334155]">P</span>
    </div>

    <div className="flex min-w-0 items-center justify-between gap-2 bg-[#f3f4f6] px-2">
      <span className="truncate rounded-lg bg-[#f8dce4] px-2.5 py-1 text-[14px] font-bold text-[#be123c]">
        {row.amazonMatch?.profit || "$ -6.98"}
      </span>

      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  </div>
</div>











{/* COLUMN 4 — INFO */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div className="flex h-full items-start justify-center gap-6 rounded-2xl border border-[#cfd8cc] bg-white py-4 shadow-sm">

    {/* SHOPPING BAG */}
    <button type="button" title="View Product" className="text-[#3b6cb7] hover:opacity-80">
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M6 8h12l-1 12H7L6 8Z"
          fill="currentColor"
        />
        <path
          d="M9 8V6a3 3 0 0 1 6 0v2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>

    {/* PRICE TAG */}
    <button type="button" title="View Pricing" className="text-[#1d4ed8] hover:opacity-80">
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <path
          d="M20 13l-7 7-9-9V4h7l9 9Z"
          fill="currentColor"
        />
        <circle cx="7.5" cy="7.5" r="1.5" fill="white" />
      </svg>
    </button>

  </div>
</div>











{/* COLUMN 5 — ASIN */}
<div className="border-l border-[#d7dde7] px-3 py-2">
  <div className="grid h-full grid-rows-[1fr_1fr] gap-2">

    {/* TOP ASIN / SALES RANK BOX */}
    <div className="overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
      {/* ASIN ROW */}
      <div className="flex items-center justify-between border-b border-[#d7dde7] px-3 py-2">
        <span className="truncate rounded-lg bg-[#ffbd6b] px-3 py-1.5 text-[15px] font-bold text-black">
          {row.amazonMatch?.asin || "B07F35ZMYM"}
        </span>

        <div className="ml-2 flex shrink-0 items-center gap-1">
          {/* OPEN ONLINE */}
          <button type="button" className="text-[#111827]" title="Open ASIN">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M14 5h5v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 14L19 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* COPY */}
          <button
            type="button"
            onClick={() => copyText(row.amazonMatch?.asin || "")}
            className="text-[#aab4c7]"
            title="Copy ASIN"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* DELETE */}
          <button type="button" className="text-red-600" title="Delete ASIN">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M4 7h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
              <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* SALES RANK / CATEGORY ROW */}
      <div className="grid grid-cols-[44px_minmax(0,1fr)]">
        <div className="flex items-center justify-center border-r border-[#d7dde7] bg-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#facc15] text-white">
            ★
          </span>
        </div>

        <div className="flex min-w-0 items-start justify-between bg-[#f8faf7] px-3 pt-1 pb-2">
          <span className="truncate text-[15px] font-medium text-[#334155] leading-none pt-[2px]">
  {row.amazonMatch?.salesRank || "782"} - {row.amazonMatch?.tags || "Kitchen"}
</span>

          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9ca3af] text-[11px] font-bold text-white">
            i
          </span>
        </div>
      </div>
    </div>

    <button
  type="button"
  className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-[17px] font-semibold text-white shadow-sm"
  style={{
    backgroundColor: "#43586a",
    boxShadow: "inset 0 0 0 9999px #43586a",
  }}
>
  <span>ADD TO PO</span>
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
    <path
      d="M9 6l6 6-6 6"
      stroke="white"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</button>

  </div>
</div>
</div>
</div>
      ))
    )}
  </div>
</div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-2xl">
          <p className="text-lg font-semibold text-gray-900">{toast}</p>
        </div>
      )}
    </section>
  );
}