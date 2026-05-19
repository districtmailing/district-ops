"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  createPurchaseOrder,
  createPurchaseOrderLineItem,
  listPurchaseOrderLineItemsForSheet,
  listPurchaseOrders,
  parseNumber,
  PurchaseOrder,
} from "@/lib/purchaseOrders";

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

function formatPoDateMmDdYy(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

function deriveSupplierPoPrefix(supplier: string, sheetName: string): string {
  const primary = supplier.trim() || sheetName.trim();
  if (!primary) return "SUPP";

  const words = primary.split(/[\s\-_&]+/).filter(Boolean);
  const letters = (s: string) => s.replace(/[^a-zA-Z]/g, "");

  if (words.length >= 2) {
    const initials = words
      .map((w) => letters(w)[0] || "")
      .join("")
      .toUpperCase();
    if (initials.length >= 3) return initials.slice(0, 5);
  }

  const alpha = primary.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (alpha.length >= 4) return alpha.slice(0, 4);
  if (alpha.length > 0) return alpha;

  const alnum = primary.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return alnum.slice(0, 4) || "SUPP";
}

function buildDefaultPoName(supplier: string, sheetName: string) {
  return `${deriveSupplierPoPrefix(supplier, sheetName)}${formatPoDateMmDdYy()}`;
}

function qaParseMoney(raw: string): number | null {
  const t = raw.replace(/[$,%\s]/g, "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function qaFormatMoney(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function qaFormatPct(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

function qaCalcPmr(
  sellEach: number | null,
  eachCost: number | null,
  discountEach = 0
): { p: number | null; pm: number | null; roi: number | null } {
  if (sellEach === null || eachCost === null) return { p: null, pm: null, roi: null };
  const cost = eachCost - discountEach;
  const p = sellEach - cost;
  const pm = sellEach !== 0 ? (p / sellEach) * 100 : null;
  const roi = cost !== 0 ? (p / cost) * 100 : null;
  return { p, pm, roi };
}

function QuickCostInputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm">
      <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full border-0 bg-transparent text-[12px] font-semibold tabular-nums text-[#111827] outline-none"
      />
    </label>
  );
}

function QuickCostValuePill({
  label,
  value,
  isPct,
}: {
  label: string;
  value: string;
  isPct?: boolean;
}) {
  const raw = isPct ? parseFloat(value.replace("%", "")) : parseFloat(value);
  const neg = Number.isFinite(raw) && raw < 0;
  return (
    <div className="flex items-center justify-between gap-1.5 border-b border-gray-100 px-2 py-1.5 last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
          neg ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
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

  const [itemDetailsModalRowId, setItemDetailsModalRowId] = useState<string | null>(
    null
  );
  const [itemModalSelectedPo, setItemModalSelectedPo] = useState("");
  const [quickWantCase, setQuickWantCase] = useState("");
  const [quickWantEach, setQuickWantEach] = useState("");
  const [quickWantDisc, setQuickWantDisc] = useState("0");
  const [quickNeedCase, setQuickNeedCase] = useState("");
  const [quickNeedEach, setQuickNeedEach] = useState("");
  const [quickNeedDisc, setQuickNeedDisc] = useState("0");
  const [poCaseSize, setPoCaseSize] = useState("");
  const [poAsinAmount, setPoAsinAmount] = useState("");
  const [poUnits, setPoUnits] = useState("");
  const [poCases, setPoCases] = useState("");
  const [poLeftOver, setPoLeftOver] = useState("");
  const [createPoModalOpen, setCreatePoModalOpen] = useState(false);
  const [newPoName, setNewPoName] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [addedPoRowIds, setAddedPoRowIds] = useState<Set<string>>(new Set());
  const [savingPoItem, setSavingPoItem] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [jumpPageInput, setJumpPageInput] = useState("");
  const [toolbarCompact, setToolbarCompact] = useState(true);

  useLayoutEffect(() => {
    const el = document.querySelector("[data-dashboard-sidebar-collapsed]");
    if (!el) return;
    const read = () => {
      const collapsed = el.getAttribute("data-dashboard-sidebar-collapsed") === "true";
      setToolbarCompact(!collapsed);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-dashboard-sidebar-collapsed"] });
    return () => mo.disconnect();
  }, []);

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

  const itemDetailRow = useMemo(() => {
    if (!sheet || !itemDetailsModalRowId) return null;
    return sheet.uploadedRows.find((r) => r.id === itemDetailsModalRowId) ?? null;
  }, [sheet, itemDetailsModalRowId]);

  useEffect(() => {
    if (!itemDetailRow) return;
    const cost = itemDetailRow.cost || "";
    const asinCostRaw =
      itemDetailRow.amazonMatch?.asinCost?.replace(/^\$/, "").trim() || cost;
    setQuickWantCase(cost);
    setQuickWantEach(cost);
    setQuickWantDisc("0");
    setQuickNeedCase(cost);
    setQuickNeedEach(asinCostRaw);
    setQuickNeedDisc("0");
    const caseSize = normalizeNumericString(itemDetailRow.casePack || "1");
    const asinAmount = itemDetailRow.amazonMatch ? "1" : "0";
    setPoCaseSize(caseSize);
    setPoAsinAmount(asinAmount);
    setPoUnits(asinAmount);
    updateCasesFromUnits(asinAmount, caseSize);
  }, [itemDetailsModalRowId, itemDetailRow]);

  const quickSellEach = useMemo(() => {
    if (!itemDetailRow?.amazonMatch?.buyBox) return null;
    return qaParseMoney(itemDetailRow.amazonMatch.buyBox);
  }, [itemDetailRow]);

  const quickWantEachDerived = useMemo(() => {
    if (!itemDetailRow) return qaParseMoney(quickWantEach);
    const eachN = qaParseMoney(quickWantEach);
    if (eachN !== null) return eachN;
    const caseN = qaParseMoney(quickWantCase);
    const cp = parseFloat(String(poCaseSize || itemDetailRow.casePack || "1").replace(/,/g, ""));
    if (caseN !== null && Number.isFinite(cp) && cp > 0) return caseN / cp;
    return eachN;
  }, [itemDetailRow, quickWantCase, quickWantEach, poCaseSize]);

  const quickNeedEachDerived = useMemo(() => {
    if (!itemDetailRow) return qaParseMoney(quickNeedEach);
    const eachN = qaParseMoney(quickNeedEach);
    if (eachN !== null) return eachN;
    const caseN = qaParseMoney(quickNeedCase);
    const cp = parseFloat(String(poCaseSize || itemDetailRow.casePack || "1").replace(/,/g, ""));
    if (caseN !== null && Number.isFinite(cp) && cp > 0) return caseN / cp;
    return eachN;
  }, [itemDetailRow, quickNeedCase, quickNeedEach, poCaseSize]);

  const quickWantMetrics = useMemo(() => {
    const disc = qaParseMoney(quickWantDisc) || 0;
    return qaCalcPmr(quickSellEach, quickWantEachDerived, disc);
  }, [quickSellEach, quickWantEachDerived, quickWantDisc]);

  const quickNeedMetrics = useMemo(() => {
    const disc = qaParseMoney(quickNeedDisc) || 0;
    return qaCalcPmr(quickSellEach, quickNeedEachDerived, disc);
  }, [quickSellEach, quickNeedEachDerived, quickNeedDisc]);

  useEffect(() => {
    if (itemDetailsModalRowId) setItemModalSelectedPo("");
  }, [itemDetailsModalRowId]);

  function normalizeNumericString(value: unknown) {
    const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
    if (!cleaned) return "";
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? String(parsed) : "";
  }

  function calculateQuantityParts(unitsValue: unknown, caseSizeValue: unknown) {
    const units = Number(normalizeNumericString(unitsValue));
    const caseSize = Number(normalizeNumericString(caseSizeValue));
    if (!Number.isFinite(units) || !Number.isFinite(caseSize) || caseSize <= 0) {
      return { cases: "", leftOver: "" };
    }
    return {
      cases: String(Math.floor(units / caseSize)),
      leftOver: String(units % caseSize),
    };
  }

  function updateCasesFromUnits(unitsValue: unknown, caseSizeValue = poCaseSize) {
    const parts = calculateQuantityParts(unitsValue, caseSizeValue);
    setPoCases(parts.cases);
    setPoLeftOver(parts.leftOver);
  }

  function handleCaseSizeChange(value: string) {
    const next = normalizeNumericString(value);
    setPoCaseSize(next);
    updateCasesFromUnits(poUnits, next);
  }

  function handleAsinAmountChange(value: string) {
    const next = normalizeNumericString(value);
    setPoAsinAmount(next);
    setPoUnits(next);
    updateCasesFromUnits(next);
  }

  function handleUnitsChange(value: string) {
    const next = normalizeNumericString(value);
    setPoUnits(next);
    updateCasesFromUnits(next);
  }

  function handleCasesChange(value: string) {
    const next = normalizeNumericString(value);
    const caseSize = Number(normalizeNumericString(poCaseSize));
    setPoCases(next);
    if (!Number.isFinite(caseSize) || caseSize <= 0) {
      setPoUnits("");
      setPoLeftOver("");
      return;
    }
    const nextUnits = String((Number(next) || 0) * caseSize);
    setPoUnits(nextUnits);
    setPoLeftOver("0");
  }

  const loadPurchaseOrders = async () => {
    try {
      const [orders, lineItems] = await Promise.all([
        listPurchaseOrders({ supplierSheetId: sheetId }),
        listPurchaseOrderLineItemsForSheet(sheetId),
      ]);
      setPurchaseOrders(orders);
      setAddedPoRowIds(new Set(lineItems.map((item) => item.supplierRowId).filter(Boolean)));
    } catch (error) {
      console.error("Error loading purchase orders:", {
        message: error && typeof error === "object" && "message" in error ? error.message : undefined,
        code: error && typeof error === "object" && "code" in error ? error.code : undefined,
        details: error && typeof error === "object" && "details" in error ? error.details : undefined,
        hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined,
        error,
      });
      setPurchaseOrders([]);
      setAddedPoRowIds(new Set());
      setToast("Could not load connected POs from Supabase.");
      window.setTimeout(() => setToast(""), 3200);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  useEffect(() => {
    if (!createPoModalOpen || !sheet) return;
    setNewPoName(buildDefaultPoName(sheet.supplier, sheet.sheetName));
  }, [createPoModalOpen, sheet]);

  const handleAddItemToPo = async () => {
    if (!sheet || !itemDetailRow) return;

    if (!itemModalSelectedPo) {
      setToast("Select a PO before adding this item.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    setSavingPoItem(true);

    try {
      const eachCost = quickWantEachDerived ?? parseNumber(itemDetailRow.cost);
      const caseCost = parseNumber(quickWantCase);
      const needEachCost = quickNeedEachDerived ?? parseNumber(itemDetailRow.amazonMatch?.asinCost || "");
      const needCaseCost = parseNumber(quickNeedCase);

      const savedItem = await createPurchaseOrderLineItem({
        poId: itemModalSelectedPo,
        supplierSheetId: sheet.id,
        supplierRowId: itemDetailRow.id,
        asin: itemDetailRow.amazonMatch?.asin || "",
        upc: itemDetailRow.upc,
        itemNumber: itemDetailRow.supplierSku,
        supplierTitle: itemDetailRow.title,
        supplierDescription: itemDetailRow.title,
        supplierImage: "",
        amazonTitle: itemDetailRow.amazonMatch?.title || "",
        amazonImage: itemDetailRow.amazonMatch?.image || "",
        buyBox: parseNumber(itemDetailRow.amazonMatch?.buyBox || ""),
        packSize: itemDetailRow.amazonMatch?.packSize || itemDetailRow.casePack || "",
        caseSize: poCaseSize,
        asinAmount: parseNumber(poAsinAmount),
        units: parseNumber(poUnits),
        cases: parseNumber(poCases),
        leftOver: parseNumber(poLeftOver),
        eachCost,
        caseCost,
        wantCaseCost: caseCost,
        wantEachCost: eachCost,
        wantDiscount: parseNumber(quickWantDisc),
        needCaseCost,
        needEachCost,
        needDiscount: parseNumber(quickNeedDisc),
        profit: quickWantMetrics.p,
        roi: quickWantMetrics.roi,
        pm: quickWantMetrics.pm,
        needProfit: quickNeedMetrics.p,
        needRoi: quickNeedMetrics.roi,
        needPm: quickNeedMetrics.pm,
      });

      setAddedPoRowIds((prev) => new Set(prev).add(savedItem.supplierRowId));
      setToast("Item added to PO");
      setItemDetailsModalRowId(null);
      window.setTimeout(() => setToast(""), 2200);
    } catch (error) {
      console.error("Error adding item to PO:", error);
      setToast("Could not add item to PO.");
      window.setTimeout(() => setToast(""), 2600);
    } finally {
      setSavingPoItem(false);
    }
  };

  const handleCreatePo = async () => {
    if (!sheet) return;
    const name = newPoName.trim();

    if (!name) {
      setToast("Add a PO name to continue.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    try {
      const createdPo = await createPurchaseOrder({
        name,
        supplier: sheet.supplier,
        buyer: sheet.buyer,
        supplierSheetId: sheet.id,
      });
      setPurchaseOrders((prev) => [createdPo, ...prev]);
      setItemModalSelectedPo(createdPo.id);
      setCreatePoModalOpen(false);
      setToast(`PO “${createdPo.name}” created.`);
      window.setTimeout(() => setToast(""), 2400);
    } catch (error) {
      console.error("Error creating PO:", {
        message: error && typeof error === "object" && "message" in error ? error.message : undefined,
        code: error && typeof error === "object" && "code" in error ? error.code : undefined,
        details: error && typeof error === "object" && "details" in error ? error.details : undefined,
        hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined,
        error,
      });
      setToast("Could not create PO.");
      window.setTimeout(() => setToast(""), 2600);
    }
  };

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

  const listTotal = filteredRows.length;
  const listTotalPages = Math.max(1, Math.ceil(listTotal / pageSize));

  const paginatedRows = useMemo(() => {
    const start = (listPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, listPage, pageSize]);

  useEffect(() => {
    setListPage(1);
  }, [search, searchType, matchFilter, eligibleFilter, sheetId, pageSize]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  const matchedCount = sheet?.uploadedRows.filter((row) => !!row.amazonMatch).length || 0;
  const notMatchedCount =
    sheet?.uploadedRows.filter((row) => !row.amazonMatch).length || 0;
  const eligibleCount =
    sheet?.uploadedRows.filter((row) => row.amazonMatch?.eligible).length || 0;

  const listRangeStart = listTotal === 0 ? 0 : (listPage - 1) * pageSize + 1;
  const listRangeEnd = Math.min(listPage * pageSize, listTotal);

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
    className="fixed top-[77px] right-0 z-50 min-w-0 border-b border-gray-200 bg-white"
    style={{ left: "var(--sidebar-width)" }}
  >
    <div className="min-w-0 overflow-x-auto bg-white px-3 py-2 lg:px-5">
      <div className={`flex w-max min-w-0 flex-nowrap items-end ${toolbarCompact ? "gap-1" : "gap-1.5"}`}>
        {/* Back */}
        <div className="flex shrink-0 flex-col">
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <Link
            href="/dashboard/supplier-sheet"
            className="flex h-10 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#b8c7db] bg-white text-[#111827] transition hover:bg-gray-50"
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
        <div
          className={`flex shrink-0 flex-col transition-all duration-200 ${
            toolbarCompact ? "w-[150px] max-w-[160px]" : "w-[170px] max-w-[180px]"
          }`}
        >
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <div
            style={{ backgroundColor: "#f8e68a" }}
            className="flex h-10 w-full min-w-0 max-w-full items-center overflow-hidden rounded-xl border border-[#ead46d] px-2"
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
        <div className="flex w-[105px] shrink-0 flex-col">
          <p className="mb-1 text-xs font-medium leading-tight text-gray-500">Search Type</p>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm"
          >
            <option>UPC</option>
            <option>ASIN</option>
            <option>Title</option>
            <option>Item #</option>
          </select>
        </div>

        {/* Search */}
        <div
          className={`flex min-w-0 flex-col ${
            toolbarCompact
              ? "w-[120px] max-w-[140px] shrink"
              : "w-[200px] max-w-[220px] shrink-0"
          }`}
        >
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            Search
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white text-sm outline-none ${
              toolbarCompact ? "px-2" : "px-3"
            }`}
          />
        </div>

        {/* Variety View */}
        <div className="flex w-fit shrink-0 flex-col">
          <p className="mb-1 whitespace-nowrap text-xs font-medium leading-tight text-gray-500">Variety View</p>
          <div className="flex h-10 shrink-0 items-center">
            <button type="button" className="relative h-7 w-11 shrink-0 rounded-full bg-gray-300">
              <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>

        {/* Connected POs */}
        <div
          className={`flex shrink-0 flex-col ${toolbarCompact ? "w-[110px] min-w-0" : "w-[125px]"}`}
        >
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            Connected POs
          </p>
          <select
            className="h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-sm"
            value=""
            onChange={(event) => {
              if (event.target.value) window.location.href = `/dashboard/purchase-order/${event.target.value}`;
            }}
          >
            <option value="">{purchaseOrders.length ? "Connected POs" : "No POs"}</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.name}
              </option>
            ))}
          </select>
        </div>

        {/* Link */}
        <div className="flex shrink-0 flex-col">
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <button
            type="button"
            className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-[#8aa6d8] bg-white text-[22px] text-[#334155]"
          >
            🔗
          </button>
        </div>

        {/* Sort By */}
        <div
          className={`flex shrink-0 flex-col ${
            toolbarCompact ? "w-[80px] min-w-0" : "w-[125px]"
          }`}
        >
          <p className="mb-1 text-xs font-medium leading-tight text-gray-500">Sort By</p>
          <select
            className={`h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white text-sm ${
              toolbarCompact ? "px-1.5" : "px-3"
            }`}
          >
            <option>Amazon Title</option>
          </select>
        </div>

        {/* Asc / Dsc */}
        <div className="flex shrink-0 flex-col">
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <div className="flex gap-0">
            <button type="button" className="h-10 shrink-0 rounded-l-xl border border-[#3b82f6] bg-white px-3 text-sm font-semibold text-[#111827]">
              Asc ↑
            </button>
            <button type="button" className="h-10 shrink-0 rounded-r-xl border border-l-0 border-gray-300 bg-white px-3 text-sm font-medium text-gray-500">
              Dsc ↓
            </button>
          </div>
        </div>

        {/* Source Filter */}
        <div className="flex shrink-0 flex-col">
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-[#111827]"
          >
            <span>⚑</span>
            <span>Source filter</span>
          </button>
        </div>

        {/* Create ASIN */}
        <div className="flex shrink-0 flex-col">
          <p className="invisible mb-1 select-none text-xs font-medium leading-tight text-gray-500" aria-hidden="true">
            .
          </p>
          <button
            type="button"
            style={{ backgroundColor: "#22c55e" }}
            className={`h-10 shrink-0 whitespace-nowrap rounded-xl text-sm font-semibold text-white shadow-sm ${
              toolbarCompact ? "min-w-[8.5rem] px-2" : "min-w-[9.5rem] px-3"
            }`}
          >
            CREATE ASIN +
          </button>
        </div>
      </div>
    </div>
  </div>

 <div className="pb-[68px]" style={{ paddingTop: "120px" }}>
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
  className="sticky z-40 min-h-[52px] border-b border-[#d7dde7] bg-[#f0f1f3] text-[13px] font-semibold uppercase tracking-wide text-gray-600"
  style={{
    top: "157px",
    display: "grid",
    gridTemplateColumns: sheetColumns,
    boxShadow: "0 -4px 0 0 #f0f1f3",
  }}
>
  <div className="flex min-h-[52px] items-center justify-center px-4 py-3 text-center leading-snug">
    Image / Detail
  </div>

  <div className="flex min-h-[52px] items-center justify-center border-l border-[#d7dde7] px-4 py-3 text-center leading-snug">
    Cost
  </div>

  <div className="flex min-h-[52px] items-center justify-center border-l border-[#d7dde7] px-4 py-3 text-center leading-snug">
    Quantity / Profit
  </div>

  <div className="flex min-h-[52px] items-center justify-center border-l border-[#d7dde7] px-4 py-3 text-center leading-snug">
    Info
  </div>

  <div className="flex min-h-[52px] items-center justify-center border-l border-[#d7dde7] px-4 py-3 text-center leading-snug">
    ASIN
  </div>
</div>

    {filteredRows.length === 0 ? (
      <div className="p-10 text-center text-gray-500">No rows found.</div>
    ) : (
      paginatedRows.map((row) => (
        <div key={row.id} className="border-x border-[#c9ced6]">
       {/* SUPPLIER ROW */}
<div
  className="relative z-0 grid"
  style={{
    gridTemplateColumns: sheetColumns,
    background: "linear-gradient(0deg, rgba(34,197,94,0.12), rgba(34,197,94,0.12)), #eef7ee",
    boxShadow: "inset 0 -3px 0 #065f46",
  }}
>
  
  {/* COLUMN 1 — IMAGE / DETAIL */}
<div className="min-w-0 px-2.5 py-2">
  <div className="flex h-[128px] min-h-[128px] min-w-0 items-stretch gap-2 overflow-hidden">
    {/* IMAGE BOX */}
    <div className="h-[122px] w-[102px] shrink-0 self-center overflow-hidden rounded-xl border-2 border-[#16a34a] bg-white shadow-sm">
      <div className="relative flex h-full min-h-0 items-center justify-center bg-[#f6f7f4] p-0.5">
        <button
          type="button"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md text-[#2563eb] hover:bg-white"
          title="Edit Image"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
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

        <div className="flex h-[96px] w-[84px] items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-11 w-11 text-gray-300"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 15l-5-5L5 20" />
          </svg>
        </div>
      </div>
    </div>

    {/* UPC / DESC BOX */}
<div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-[#cfd8cc] bg-white shadow-sm">
  <div
    className="grid h-full min-h-0 w-full"
    style={{
      gridTemplateColumns: "auto minmax(0, 1fr)",
      gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
    }}
  >
    {/* ROW 1 LEFT — UPC */}
    <div className="flex h-full min-h-0 items-center gap-0.5 border-r border-b border-[#cfd5cd] bg-white px-2 py-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#159a84]">
        <path d="M3 4V20" stroke="#159a84" strokeWidth="2" />
        <path d="M6 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M8 4V20" stroke="#159a84" strokeWidth="2.5" />
        <path d="M11 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M14 4V20" stroke="#159a84" strokeWidth="2" />
        <path d="M17 4V20" stroke="#159a84" strokeWidth="1.5" />
        <path d="M20 4V20" stroke="#159a84" strokeWidth="2.5" />
      </svg>

      <span className="whitespace-nowrap text-[12px] font-semibold text-[#159a84]">
        UPC
      </span>
    </div>

    {/* ROW 1 RIGHT — UPC VALUE */}
    <div className="flex h-full min-h-0 w-full min-w-0 items-center gap-1 border-b border-[#cfd5cd] bg-[#f0f1f3] px-2 py-2">
      <div
        style={{ backgroundColor: "#22c55e" }}
        className="flex min-h-[22px] min-w-0 flex-1 max-w-full items-center rounded-full px-1.5 py-0.5 text-white shadow-sm"
      >
        <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left text-[12px] font-bold tabular-nums tracking-wide">
          {row.upc || "—"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => copyText(row.upc || "")}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
        title="Copy UPC"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>

    {/* ROW 2 LEFT — DESC */}
    <div className="flex h-full min-h-0 items-center gap-0.5 border-r border-[#cfd5cd] bg-white px-2 py-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]">
        <circle cx="12" cy="12" r="10" fill="#9ca3af" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>

      <span className="truncate text-[11px] text-[#7a808c]">
        Desc:
      </span>
    </div>

    {/* ROW 2 RIGHT — DESC VALUE */}
    <div className="flex h-full min-h-0 w-full min-w-0 items-stretch gap-1 bg-[#f0f1f3] px-2 py-2">
      <p
        className="min-h-0 min-w-0 flex-1 self-center text-[13px] leading-snug text-[#111827]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
        title={row.title || ""}
      >
        {row.title || "—"}
      </p>

      <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 self-stretch py-0">
        <button
          type="button"
          onClick={() => copyText(row.title || "")}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
          title="Copy Description"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#2563eb] hover:bg-white"
          title="Edit Description"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14.05 6.19L17.8 9.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

    {/* ITEM / SIZE BOX */}
<div className="h-[122px] w-[102px] shrink-0 self-center overflow-hidden rounded-xl border border-[#cfd8cc] bg-white shadow-sm">
  <div className="grid h-full min-h-0 grid-rows-[1fr_1fr]">
    {/* ITEM ROW */}
    <div className="border-b border-[#cfd5cd] bg-white px-2 py-2">
      <div className="flex min-w-0 items-center justify-between gap-0.5">
        <div className="flex min-w-0 items-center gap-0.5">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#22a06b]">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="truncate text-[12px] font-semibold text-[#22a06b]">Item</span>
        </div>

        <button
          type="button"
          onClick={() => copyText(row.supplierSku || "")}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[#aab4c7] hover:bg-white"
          title="Copy Item #"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-0.5 min-w-0 rounded-[4px] bg-[#c8f0df] px-1.5 py-0.5">
        <span className="block truncate text-[12px] font-bold text-[#4b5563]">
          {row.supplierSku || "—"}
        </span>
      </div>
    </div>

    {/* SIZE ROW */}
    <div className="bg-white px-2 py-2">
      <div className="flex min-w-0 items-center gap-0.5">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#7c58d6]">
          <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 7H17V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="truncate text-[11px] font-semibold text-[#7c58d6]">Size</span>
      </div>

      <div className="mt-0.5 min-w-0">
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
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full grid-rows-2 gap-2 overflow-hidden"
    style={{ gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)" }}
  >
    
    {/* TOP ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      {/* CASE COST */}
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2.5 py-2 shadow-sm">
        <p className="whitespace-nowrap text-[11px] leading-tight text-gray-500">Case cost ($)</p>
        <input
          value={row.cost || ""}
          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
          className="mt-0.5 w-full min-h-0 bg-transparent text-[15px] font-semibold leading-tight text-[#111827] outline-none"
        />
      </div>

      {/* EACH COST */}
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2.5 py-2 shadow-sm">
        <p className="whitespace-nowrap text-[11px] leading-tight text-gray-500">Each cost ($)</p>
        <input
          value={row.cost || ""}
          onChange={(e) => updateRowField(row.id, "cost", e.target.value)}
          className="mt-0.5 w-full min-h-0 bg-transparent text-[15px] font-semibold leading-tight text-[#111827] outline-none"
        />
      </div>
    </div>

    {/* BOTTOM ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      
      {/* DISC */}
      <div className="flex min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex items-center border-r border-[#d7dde7] bg-white px-2 text-[11px] text-gray-600">
          Disc:
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center bg-[#f3f4f6]">
          <span className="rounded-[6px] bg-[#e6d7b5] px-2 py-0.5 text-[13px] font-bold text-[#7a5c00]">
            0
          </span>
        </div>
      </div>

      {/* SSH */}
      <div className="flex min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex items-center border-r border-[#d7dde7] bg-white px-2 text-[11px] text-gray-600">
          SSH
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#f3f4f6]">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#2563eb]">
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
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full grid-cols-2 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm"
    style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}
  >
    {/* ROW 1 LEFT */}
    <div className="flex min-h-0 items-center gap-1 border-r border-b border-[#d7dde7] bg-[#f3f4ef] px-2 py-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#7c58d6]">
        <rect x="3" y="10" width="5" height="8" rx="1.5" fill="currentColor" />
        <rect x="9.5" y="6" width="5" height="12" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="16" y="3" width="5" height="15" rx="1.5" fill="currentColor" opacity="0.8" />
      </svg>
      <span className="truncate text-[11px] font-semibold text-[#7c58d6]">Case Size</span>
    </div>

    {/* ROW 1 RIGHT */}
    <div className="flex min-h-0 items-center border-b border-[#d7dde7] bg-white px-2 py-1.5">
      <span className="inline-flex min-w-[32px] items-center justify-center rounded-[6px] bg-[#8b6edb] px-2 py-0.5 text-[11px] font-bold text-white">
        {row.casePack || "—"}
      </span>
    </div>

    {/* ROW 2 LEFT */}
    <div className="flex min-h-0 items-center gap-1 border-r border-b border-[#d7dde7] bg-[#f3f4ef] px-2 py-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#5f6368]">
        <path
          d="M4 16.5L16.5 4a2.12 2.12 0 0 1 3 3L7 19.5 3 20l.5-4Z"
          fill="currentColor"
        />
        <path d="M13.5 7.5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="truncate text-[11px] font-medium text-[#5f6368]">UOM</span>
    </div>

    {/* ROW 2 RIGHT */}
    <div className="flex min-h-0 items-center border-b border-[#d7dde7] bg-white px-2 py-1.5">
      <span className="text-[13px] font-semibold leading-none text-[#111827]">EA</span>
    </div>

    {/* ROW 3 LEFT */}
    <div className="flex min-h-0 items-center gap-1 border-r border-[#d7dde7] bg-[#f3f4ef] px-2 py-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#4338ca]">
        <circle cx="5" cy="6" r="1.8" fill="currentColor" />
        <circle cx="5" cy="12" r="1.8" fill="currentColor" />
        <circle cx="5" cy="18" r="1.8" fill="currentColor" />
        <path d="M10 6h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 18h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="truncate text-[11px] font-semibold text-[#4338ca]">Supp Qty</span>
    </div>

    {/* ROW 3 RIGHT */}
    <div className="flex min-h-0 items-center bg-white px-2 py-1.5">
      <span className="text-[13px] font-semibold leading-none text-[#0f8f6f]">
        {row.quantity || "0"}
      </span>
    </div>
  </div>
</div>
  {/* COLUMN 4 — INFO */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div className="flex h-[128px] min-h-[128px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] px-2 py-2">
    <input
      value={row.customInfo1 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo1", e.target.value)}
      placeholder="Custom info"
      className="h-9 w-full min-w-0 rounded-md border border-gray-200/90 bg-white px-2.5 text-left text-[13px] leading-tight text-[#111827] shadow-none outline-none transition-colors placeholder:text-gray-400 focus:border-[#cbd5e1] focus:ring-0 truncate"
    />

    <input
      value={row.customInfo2 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo2", e.target.value)}
      placeholder="Custom info"
      className="h-9 w-full min-w-0 rounded-md border border-gray-200/90 bg-white px-2.5 text-left text-[13px] leading-tight text-[#111827] shadow-none outline-none transition-colors placeholder:text-gray-400 focus:border-[#cbd5e1] focus:ring-0 truncate"
    />

    <input
      value={row.customInfo3 || ""}
      onChange={(e) => updateRowField(row.id, "customInfo3", e.target.value)}
      placeholder="Custom info"
      className="h-9 w-full min-w-0 rounded-md border border-gray-200/90 bg-white px-2.5 text-left text-[13px] leading-tight text-[#111827] shadow-none outline-none transition-colors placeholder:text-gray-400 focus:border-[#cbd5e1] focus:ring-0 truncate"
    />
  </div>
</div>

  {/* COLUMN 5 — ASIN */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full min-w-0 grid-rows-2 gap-2 overflow-hidden"
    style={{ gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)" }}
  >
    {/* TOP BOX */}
    <div className="flex min-h-0 min-w-0 flex-nowrap items-center gap-1 overflow-hidden whitespace-nowrap rounded-2xl border border-[#cfd8cc] bg-white px-2 py-1.5 shadow-sm">
      <span className="shrink-0 text-[12px] font-medium leading-none text-[#111827]">+ Added</span>

      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-3.5 w-3.5 shrink-0 text-[#f59e0b]"
      >
        <path d="M10.59 2.59A2 2 0 0 1 12 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.59 1.41l-7.82 7.82a2 2 0 0 1-2.82 0l-5-5a2 2 0 0 1 0-2.82l7.82-7.82ZM17.5 7A1.5 1.5 0 1 0 17.5 4a1.5 1.5 0 0 0 0 3Z" />
      </svg>

      <span className="shrink-0 text-[12px] font-bold leading-none text-[#f59e0b]">
        {row.amazonMatch ? "1 ASIN" : "0 ASIN"}
      </span>
    </div>

    {/* BOTTOM BOX */}
<button
  type="button"
  className="relative flex h-full min-h-0 flex-nowrap cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] px-2 py-1.5 pr-9 text-center text-[12px] shadow-sm hover:bg-[#e5e7eb]"
>
  {/* CENTERED TEXT */}
  <span className="shrink-0 font-medium leading-none text-[#111827]">
    Add More ASIN
  </span>

  {/* RIGHT ARROWS */}
  <div className="pointer-events-none absolute right-1.5 flex items-center">
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#2F80ED]">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    
  </div>
</button>
  </div>
</div>
</div>






         {/* AMAZON MATCH ROW */}
<div
  className="relative z-0 grid bg-[#f8faf7]"
  style={{
    gridTemplateColumns: sheetColumns,
    boxShadow: "inset 0 -3px 0 #f59e0b",
  }}
>
  {/* COLUMN 1 — IMAGE / DETAIL */}
<div className="min-w-0 px-2.5 py-2">
  <div className="flex h-[128px] min-h-[128px] w-full min-w-0 items-stretch gap-2 overflow-hidden">
    
    {/* AMAZON IMAGE BOX */}
    <div className="h-[122px] w-[102px] shrink-0 self-center overflow-hidden rounded-xl border-2 border-[#f59e0b] bg-white shadow-sm">
      <div className="relative flex h-full min-h-0 items-center justify-center bg-white p-0.5">
        <div className="flex h-[96px] w-[84px] items-center justify-center">
          {row.amazonMatch?.image ? (
            <img
              src={row.amazonMatch.image}
              alt={row.amazonMatch.title || "Amazon match"}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-11 w-11 text-gray-300"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="M21 15l-5-5L5 20" />
            </svg>
          )}
        </div>
      </div>
    </div>

    {/* TITLE / AMAZON QTY BOX */}
<div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-xl border border-[#cfd8cc] bg-white shadow-sm">
  <div
    className="grid min-h-0 w-full flex-1 grid-rows-2"
    style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}
  >
    {/* ROW 1 LEFT */}
    <div className="flex items-center gap-1 border-r border-b border-[#d7dde7] bg-white px-2 py-2">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]">
        <circle cx="12" cy="12" r="10" fill="#9ca3af" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>
      <span className="truncate text-[11px] text-[#7a808c]">Desc</span>
    </div>

   {/* ROW 1 RIGHT */}
<div className="flex min-h-0 min-w-0 items-start gap-1 border-b border-[#d7dde7] bg-[#f0f1f3] px-2 py-2">
  <p
    className="min-h-0 min-w-0 flex-1 text-[12px] leading-snug text-[#111827]"
    style={{
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      wordBreak: "break-word",
    }}
    title={row.amazonMatch?.title || ""}
  >
    {row.amazonMatch?.title || "No Amazon title"}
  </p>

  <button
    type="button"
    onClick={() => copyText(row.amazonMatch?.title || "")}
    className="flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-md text-[#aab4c7] hover:bg-white"
    title="Copy Amazon Title"
  >
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
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
    <div className="flex min-h-0 items-center gap-1 border-r border-[#d7dde7] bg-white px-2 py-2">
      <span className="text-[14px] font-bold leading-none text-[#f59e0b]">a</span>
      <span className="truncate text-[11px] font-semibold text-[#f59e0b]">Qty</span>
    </div>

    {/* ROW 2 RIGHT */}
    <div className="flex min-h-0 min-w-0 items-center gap-1.5 bg-[#f0f1f3] px-2 py-2">
      <span className="shrink-0 rounded-md bg-[#ffbd6b] px-2 py-0.5 text-[12px] font-bold leading-tight text-black">
        {row.amazonMatch?.fbaQty ?? 0}
      </span>

      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#111827]">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <rect x="11" y="10" width="2" height="6" rx="1" fill="white" />
        <circle cx="12" cy="7" r="1.5" fill="white" />
      </svg>
    </div>
  </div>
</div>

    {/* PACK SIZE / BUY BOX BOXES */}
    <div className="grid h-[122px] w-[102px] shrink-0 grid-rows-2 gap-2 self-center">
      <div className="min-h-0 w-full overflow-hidden rounded-2xl border-2 border-[#15803d] bg-white px-2 py-2 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">Pack Size:</p>
        <p className="truncate text-[13px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.packSize || "1"}
        </p>
      </div>

      <div className="min-h-0 w-full overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2 py-2 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">Buy box ($)</p>
        <p className="truncate text-[13px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.buyBox || "—"}
        </p>
      </div>
    </div>

  </div>
</div>



{/* COLUMN 2 — COST */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full grid-rows-2 gap-2 overflow-hidden"
    style={{ gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)" }}
  >

    {/* TOP ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2.5 py-2 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">
          Shipping Cost ...
        </p>
        <p className="text-[14px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.shippingCost || "0.1"}
        </p>
      </div>

      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2.5 py-2 shadow-sm">
        <p className="truncate text-[11px] font-semibold leading-tight text-gray-500">
          Prep Cost ($)
        </p>
        <p className="text-[14px] font-semibold leading-tight text-[#334155]">
          {row.amazonMatch?.prepCost || "0"}
        </p>
      </div>
    </div>

    {/* BOTTOM ROW */}
    <div className="grid min-h-0 grid-cols-2 gap-2">
      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex h-[22px] min-h-0 items-center justify-between border-b border-[#d7dde7] px-2">
          <span className="truncate text-[11px] font-medium text-[#111827]">Total Fee</span>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6b7280] text-[9px] font-bold text-white">
            i
          </span>
        </div>

        <div className="flex min-h-0 items-center gap-2 px-2 py-1 text-[#334155]">
          <span className="text-[12px]">$</span>
          <span className="truncate text-[13px] font-semibold leading-tight">
            {row.amazonMatch?.totalFee || "20.13"}
          </span>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
        <div className="flex h-[22px] min-h-0 items-center gap-1 border-b border-[#d7dde7] px-2">
          <span className="text-[12px] font-bold text-[#f59e0b]">a</span>
          <span className="truncate text-[11px] font-medium text-[#f59e0b]">
            ASIN COST
          </span>
        </div>

        <div className="flex min-h-0 items-center gap-2 px-2 py-1 text-[#334155]">
          <span className="text-[12px]">$</span>
          <span className="truncate text-[13px] font-semibold leading-tight">
            {row.amazonMatch?.asinCost || "54.35"}
          </span>
        </div>
      </div>
    </div>

  </div>
</div>

{/* COLUMN 3 — QUANTITY / PROFIT */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full grid-rows-3 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm"
    style={{ gridTemplateColumns: "0.85fr 3.15fr" }}
  >
    {/* ROW 1 — ROI */}
    <div className="flex min-h-0 items-center gap-1 border-r border-b border-[#d7dde7] bg-white px-2 py-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#6b7280]">
        <path d="M4 12h16M12 4l-4 4 4 4M12 20l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[12px] font-medium text-[#334155]">ROI</span>
    </div>

    <div className="flex min-h-0 min-w-0 items-center justify-between gap-1 border-b border-[#d7dde7] bg-[#f3f4f6] px-2 py-1">
      <span className="min-w-0 truncate rounded-md bg-[#f8dce4] px-1.5 py-0.5 text-[12px] font-bold text-[#be123c]">
        {row.amazonMatch?.roi || "-12.84%"}
      </span>

      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>

    {/* ROW 2 — PM */}
    <div className="flex min-h-0 items-center gap-1 border-r border-b border-[#d7dde7] bg-white px-2 py-1.5">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#6b7280]">
        <path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[12px] font-medium text-[#334155]">PM</span>
    </div>

    <div className="flex min-h-0 min-w-0 items-center justify-between gap-1 border-b border-[#d7dde7] bg-[#f3f4f6] px-2 py-1">
      <span className="min-w-0 truncate rounded-md bg-[#f8dce4] px-1.5 py-0.5 text-[12px] font-bold text-[#be123c]">
        {row.amazonMatch?.pm || "-10.33%"}
      </span>

      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>

    {/* ROW 3 — PROFIT */}
    <div className="flex min-h-0 items-center gap-1 border-r border-[#d7dde7] bg-white px-2 py-1">
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#6b7280]">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span className="text-[12px] font-medium text-[#334155]">P</span>
    </div>

    <div className="flex min-h-0 min-w-0 items-center justify-between gap-1 bg-[#f3f4f6] px-2 py-1">
      <span className="min-w-0 truncate rounded-md bg-[#f8dce4] px-1.5 py-0.5 text-[12px] font-bold text-[#be123c]">
        {row.amazonMatch?.profit || "$ -6.98"}
      </span>

      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9ca3af]">
        <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5 text-white">
          <rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  </div>
</div>











{/* COLUMN 4 — INFO */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div className="flex h-[128px] min-h-[128px] w-full items-start justify-start gap-2 pl-0.5 pt-0.5">
    <button
      type="button"
      title="View Product"
      className="shrink-0 rounded-lg p-1.5 text-[#2563eb] transition hover:bg-blue-50/90 hover:text-[#1d4ed8]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.75">
        <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
      </svg>
    </button>

    <button
      type="button"
      title="View Pricing"
      className="shrink-0 rounded-lg p-1.5 text-[#2563eb] transition hover:bg-blue-50/90 hover:text-[#1d4ed8]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.75">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L4 13.83V4h9.83l6.76 6.76a2 2 0 0 1 0 2.83Z" strokeLinejoin="round" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
      </svg>
    </button>
  </div>
</div>











{/* COLUMN 5 — ASIN */}
<div className="border-l border-[#d7dde7] px-2.5 py-2">
  <div
    className="grid h-[128px] min-h-[128px] w-full min-w-0 gap-2 overflow-hidden"
    style={{ gridTemplateRows: "minmax(0, 1fr) auto" }}
  >

    {/* TOP ASIN / SALES RANK BOX */}
    <div className="flex min-h-0 h-full flex-col overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white shadow-sm">
      {/* ASIN ROW */}
      <div className="flex shrink-0 flex-nowrap items-center justify-between gap-1 whitespace-nowrap border-b border-[#d7dde7] px-2.5 py-2">
        <span className="min-w-0 truncate rounded-md bg-[#ffbd6b] px-1.5 py-0.5 text-[11px] font-bold leading-none text-black">
          {row.amazonMatch?.asin || "B07F35ZMYM"}
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* OPEN ONLINE */}
          <button type="button" className="text-[#111827]" title="Open ASIN">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
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
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M6 15V7C6 5.9 6.9 5 8 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* DELETE */}
          <button type="button" className="text-red-600" title="Delete ASIN">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M4 7h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
              <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* SALES RANK / CATEGORY ROW */}
      <div className="grid min-h-0 flex-1 grid-cols-[36px_minmax(0,1fr)] items-stretch">
        <div className="flex min-h-0 items-center justify-center border-r border-[#d7dde7] bg-white px-0 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#facc15] text-[11px] text-white">
            ★
          </span>
        </div>

        <div className="flex min-h-0 min-w-0 items-center justify-between gap-1 bg-[#f8faf7] px-2 py-2">
          <span className="min-w-0 truncate text-[11px] font-medium leading-tight text-[#334155]">
            {row.amazonMatch?.salesRank || "782"} - {row.amazonMatch?.tags || "Kitchen"}
          </span>

          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9ca3af] text-[9px] font-bold text-white">
            i
          </span>
        </div>
      </div>
    </div>

    <button
  type="button"
  onClick={() => setItemDetailsModalRowId(row.id)}
  className="flex h-9 min-h-0 shrink-0 flex-nowrap cursor-pointer items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-2xl px-2 py-1 text-[12px] font-semibold leading-none text-white shadow-sm"
  style={{
    backgroundColor: addedPoRowIds.has(row.id) ? "#15803d" : "#43586a",
    boxShadow: `inset 0 0 0 9999px ${addedPoRowIds.has(row.id) ? "#15803d" : "#43586a"}`,
  }}
>
  <span className="shrink-0">{addedPoRowIds.has(row.id) ? "ON PO" : "ADD TO PO"}</span>
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
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

      <footer
        className="fixed bottom-0 z-40 flex min-h-[56px] max-h-16 flex-nowrap items-center justify-between gap-4 overflow-x-auto border-t border-gray-200 bg-white px-4 py-2 text-[13px] text-[#111827]"
        style={{ left: "var(--sidebar-width)", right: 0 }}
      >
        <p className="min-w-0 shrink-0 whitespace-nowrap font-medium text-gray-700">
          {listRangeStart}-{listRangeEnd} of {listTotal}{" "}
          <span className="text-gray-500">(T. ASIN Count: {sheet.asins})</span>
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setListPage((p) => Math.max(1, p - 1))}
            disabled={listPage <= 1}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="min-w-[2.25rem] select-none text-center text-sm font-semibold tabular-nums text-gray-900">
            {listPage}
          </span>
          <button
            type="button"
            onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
            disabled={listPage >= listTotalPages}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <label className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-gray-600">
            Jump to Page
            <input
              type="number"
              min={1}
              max={listTotalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const raw = parseInt(jumpPageInput.trim(), 10);
                if (!Number.isFinite(raw)) return;
                setListPage(Math.min(listTotalPages, Math.max(1, raw)));
                setJumpPageInput("");
              }}
              placeholder={`1–${listTotalPages}`}
              className="h-9 w-16 rounded-md border border-gray-300 bg-white px-2 text-xs tabular-nums outline-none focus:border-[#2563eb]"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const raw = parseInt(jumpPageInput.trim(), 10);
              if (!Number.isFinite(raw)) return;
              setListPage(Math.min(listTotalPages, Math.max(1, raw)));
              setJumpPageInput("");
            }}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            Go
          </button>
          <label className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-gray-600">
            Page Size
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-[#2563eb]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </footer>

      {itemDetailsModalRowId && itemDetailRow && sheet && (
        <div
          role="presentation"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6 sm:px-6"
          onClick={() => setItemDetailsModalRowId(null)}
        >
          <div
            role="dialog"
            aria-labelledby="supplier-item-details-title"
            className="flex max-h-[88vh] w-[min(90vw,960px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-2.5">
              <h2
                id="supplier-item-details-title"
                className="text-[14px] font-semibold tracking-tight text-[#0f172a]"
              >
                Supplier Item Details
              </h2>
              <button
                type="button"
                onClick={() => setItemDetailsModalRowId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <span className="text-base leading-none">✕</span>
              </button>
            </div>

            <div className="flex shrink-0 items-end gap-0 border-b border-gray-200 bg-[#f8fafc] px-2">
              <div className="relative flex items-center">
                <span className="px-2.5 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#2563eb]">
                  QUICK ADD
                </span>
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563eb]"
                  aria-hidden
                />
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="px-2.5 pb-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500"
              >
                PURCHASE HISTORY
              </button>
              <button
                type="button"
                tabIndex={-1}
                className="px-2.5 pb-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500"
              >
                SS HISTORY
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc]/80 p-2.5 sm:p-3">
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-2 py-1.5">
                  <span className="max-w-[140px] truncate rounded bg-[#fde68a] px-2 py-0.5 font-mono text-[11px] font-bold text-[#78350f]">
                    {itemDetailRow.amazonMatch?.asin || "—"}
                  </span>
                  <button
                    type="button"
                    title="Open on Amazon"
                    disabled={!itemDetailRow.amazonMatch?.asin}
                    onClick={() => {
                      const a = itemDetailRow.amazonMatch?.asin;
                      if (a) window.open(`https://www.amazon.com/dp/${a}`, "_blank", "noopener,noreferrer");
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
                      <path d="M14 5h5v5M10 14L19 5M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Copy ASIN"
                    onClick={() => copyText(itemDetailRow.amazonMatch?.asin || "")}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="10" height="10" rx="2" />
                      <path d="M6 15V7C6 5.9 6.9 5 8 5H16" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600"
                    title={itemDetailRow.amazonMatch?.eligible ? "Eligible" : "Not eligible / store"}
                  >
                    {itemDetailRow.amazonMatch?.eligible ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gray-400" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                    )}
                  </span>
                  <button
                    type="button"
                    title="Verified"
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-emerald-600" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Refresh"
                    onClick={() => {
                      setToast("Refreshing item (preview).");
                      window.setTimeout(() => setToast(""), 1600);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0 1 14 0M19 15a7 7 0 0 1-14 0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Notes"
                    onClick={() => {
                      const n = notesByRow[itemDetailRow.id]?.trim();
                      setToast(n ? `Notes: ${n}` : "No notes for this item.");
                      window.setTimeout(() => setToast(""), 2600);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" strokeLinejoin="round" />
                      <path d="M14 2v6h6M8 13h8M8 17h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-2 p-2 lg:flex-row lg:items-stretch lg:gap-2">
                  <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center self-start rounded-md border border-gray-200 bg-white lg:h-[100px] lg:w-[100px]">
                    {itemDetailRow.amazonMatch?.image ? (
                      <img
                        src={itemDetailRow.amazonMatch.image}
                        alt=""
                        className="max-h-[84px] max-w-[84px] object-contain lg:max-h-[92px] lg:max-w-[92px]"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-300">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="8.5" cy="9.5" r="1.5" />
                        <path d="M21 15l-5-5L5 20" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-gray-200">
                    <table className="w-full border-collapse text-[11px]">
                      <tbody>
                        {(
                          [
                            ["Desc", itemDetailRow.amazonMatch?.title || itemDetailRow.title || "—"],
                            [
                              "Total Fee",
                              (() => {
                                const tf = itemDetailRow.amazonMatch?.totalFee;
                                if (tf == null || tf === "") return "—";
                                const s = String(tf);
                                return s.startsWith("$") ? s : `$${s}`;
                              })(),
                            ],
                            ["Verify Level", "—"],
                          ] as const
                        ).map(([label, val]) => (
                          <tr key={label} className="border-b border-gray-200 last:border-b-0">
                            <td className="w-[88px] whitespace-nowrap border-r border-gray-200 bg-white px-2 py-1.5 font-medium text-gray-600">
                              {label}
                            </td>
                            <td className="bg-[#f1f5f9] px-2 py-1.5 font-medium text-[#111827]">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="min-w-0 w-full shrink-0 overflow-hidden rounded-md border border-gray-200 lg:w-[140px] xl:w-[152px]">
                    <table className="w-full border-collapse text-[11px]">
                      <tbody>
                        {(
                          [
                            ["Weight", "—"],
                            ["Amazon Qty", itemDetailRow.amazonMatch != null ? String(itemDetailRow.amazonMatch.fbaQty) : "—"],
                            ["L x W x H", "—"],
                            ["Rank", itemDetailRow.amazonMatch?.salesRank || "—"],
                          ] as const
                        ).map(([label, val]) => (
                          <tr key={label} className="border-b border-gray-200 last:border-b-0">
                            <td className="whitespace-nowrap border-r border-gray-200 bg-white px-2 py-1.5 font-medium text-gray-600">
                              {label}
                            </td>
                            <td className="bg-[#f1f5f9] px-2 py-1.5 font-medium tabular-nums text-[#111827]">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-1.5 lg:grid-cols-1 lg:gap-1.5 xl:grid-cols-2">
                    {(
                      [
                        ["Pack Size", itemDetailRow.amazonMatch?.packSize || itemDetailRow.casePack || "—"],
                        [
                          "Buy Box",
                          (() => {
                            const bb = itemDetailRow.amazonMatch?.buyBox;
                            if (bb == null || bb === "") return "—";
                            const s = String(bb);
                            return s.startsWith("$") ? s : `$${s}`;
                          })(),
                        ],
                        ["Min BB", "—"],
                        ["Max BB", "—"],
                      ] as const
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-md border border-amber-200/80 bg-[#fffbeb] px-2 py-1.5 shadow-sm"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-900/70">{k}</p>
                        <p className="mt-0.5 truncate text-[12px] font-bold tabular-nums text-amber-950">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Quantity Details
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemToPo}
                    disabled={savingPoItem}
                    className="shrink-0 rounded-md bg-[#1d4ed8] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1e40af]"
                  >
                    {savingPoItem ? "ADDING..." : "ADD NOW"}
                  </button>
                </div>
                <div className="flex flex-wrap items-end gap-1.5">
                  {(
                    [
                      ["Case Size", poCaseSize, handleCaseSizeChange],
                      ["ASIN Amount", poAsinAmount, handleAsinAmountChange],
                      ["Units", poUnits, handleUnitsChange],
                      ["Cases", poCases, handleCasesChange],
                      ["Left Over", poLeftOver, setPoLeftOver],
                    ] as const
                  ).map(([label, val, onChange]) => (
                    <div key={label} className="min-w-[4.25rem] flex-1 basis-[4.25rem]">
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                        {label}
                      </label>
                      <input
                        inputMode="decimal"
                        value={val}
                        onChange={(event) => onChange(event.target.value)}
                        className="h-8 w-full rounded border border-gray-300 bg-white px-1.5 text-[11px] font-medium tabular-nums text-[#111827] outline-none"
                      />
                    </div>
                  ))}
                  <div className="min-w-[6.5rem] flex-[1.25] basis-[7rem]">
                    <label
                      htmlFor="supplier-item-po-select"
                      className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Select PO
                    </label>
                    <div className="flex items-center gap-1">
                      <select
                        id="supplier-item-po-select"
                        value={itemModalSelectedPo}
                        onChange={(e) => setItemModalSelectedPo(e.target.value)}
                        className="h-8 min-w-0 flex-1 rounded border border-gray-300 bg-white px-1.5 text-[11px] font-medium text-[#111827] outline-none focus:border-[#2563eb]"
                      >
                        <option value="">Select…</option>
                        {purchaseOrders.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setCreatePoModalOpen(true)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#22c55e] text-sm font-bold leading-none text-white shadow-sm hover:bg-[#16a34a]"
                        aria-label="Create new PO"
                        title="Create new PO"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-sky-200/90 bg-white shadow-sm">
                  <div className="shrink-0 border-b border-gray-200 bg-gradient-to-r from-sky-50 via-white to-white px-2 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-sky-900/90">
                      Want Cost
                    </span>
                  </div>
                  <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 divide-x divide-gray-200">
                    <div className="flex min-w-0 flex-col gap-1.5 bg-[#f8fafc] p-2">
                      <QuickCostInputRow label="Case ($)" value={quickWantCase} onChange={setQuickWantCase} />
                      <QuickCostInputRow label="Each ($)" value={quickWantEach} onChange={setQuickWantEach} />
                      <QuickCostInputRow label="Discount" value={quickWantDisc} onChange={setQuickWantDisc} />
                    </div>
                    <div className="flex min-w-0 flex-col bg-white">
                      <div className="shrink-0 border-b border-gray-100 bg-[#fafafa] px-2 py-1 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500">Result</span>
                      </div>
                      <QuickCostValuePill label="P" value={qaFormatMoney(quickWantMetrics.p)} />
                      <QuickCostValuePill label="PM" value={qaFormatPct(quickWantMetrics.pm)} isPct />
                      <QuickCostValuePill label="ROI" value={qaFormatPct(quickWantMetrics.roi)} isPct />
                    </div>
                  </div>
                </div>
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-violet-200/90 bg-white shadow-sm">
                  <div className="shrink-0 border-b border-gray-200 bg-gradient-to-r from-violet-50 via-white to-white px-2 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-violet-900/90">
                      Need Cost
                    </span>
                  </div>
                  <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 divide-x divide-gray-200">
                    <div className="flex min-w-0 flex-col gap-1.5 bg-[#f8fafc] p-2">
                      <QuickCostInputRow label="Case ($)" value={quickNeedCase} onChange={setQuickNeedCase} />
                      <QuickCostInputRow label="Each ($)" value={quickNeedEach} onChange={setQuickNeedEach} />
                      <QuickCostInputRow label="Discount" value={quickNeedDisc} onChange={setQuickNeedDisc} />
                    </div>
                    <div className="flex min-w-0 flex-col bg-white">
                      <div className="shrink-0 border-b border-gray-100 bg-[#fafafa] px-2 py-1 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500">Result</span>
                      </div>
                      <QuickCostValuePill label="P" value={qaFormatMoney(quickNeedMetrics.p)} />
                      <QuickCostValuePill label="PM" value={qaFormatPct(quickNeedMetrics.pm)} isPct />
                      <QuickCostValuePill label="ROI" value={qaFormatPct(quickNeedMetrics.roi)} isPct />
                    </div>
                  </div>
                </div>
                <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex h-8 shrink-0 items-center border-b border-gray-200 bg-[#fafafa] px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Item Details
                    </span>
                  </div>
                  <div className="divide-y divide-gray-200 text-[11px]">
                    <div className="flex min-h-[30px] items-center gap-2 px-2">
                      <span className="w-12 shrink-0 bg-white font-medium text-gray-600">UPC</span>
                      <span className="min-w-0 flex-1 truncate bg-[#f1f5f9] px-2 py-1.5 font-mono font-medium text-[#111827]">
                        {itemDetailRow.upc || "—"}
                      </span>
                    </div>
                    <div className="flex min-h-[30px] items-center gap-2 px-2">
                      <span className="w-12 shrink-0 bg-white font-medium text-gray-600">Item</span>
                      <span className="min-w-0 flex-1 truncate bg-[#f1f5f9] px-2 py-1.5 font-medium text-[#111827]">
                        {itemDetailRow.supplierSku || "—"}
                      </span>
                    </div>
                    <div className="flex min-h-[30px] items-center gap-2 px-2">
                      <span className="w-12 shrink-0 bg-white font-medium text-gray-600">Size</span>
                      <span className="min-w-0 flex-1 truncate bg-[#f1f5f9] px-2 py-1.5 font-medium text-[#111827]">
                        {itemDetailRow.casePack || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createPoModalOpen && sheet && (
        <div
          role="presentation"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-8"
          onClick={() => setCreatePoModalOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="create-po-title"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="create-po-title"
              className="text-xl font-semibold text-[#111827]"
            >
              Create new PO
            </h2>
            <div className="mt-6">
              <label
                htmlFor="new-po-name"
                className="block text-sm font-medium text-gray-700"
              >
                New PO Name
              </label>
              <input
                id="new-po-name"
                type="text"
                value={newPoName}
                onChange={(e) => setNewPoName(e.target.value.toUpperCase())}
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold tracking-wide text-[#111827] outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
              />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreatePoModalOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePo}
                className="rounded-xl bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#16a34a]"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-6 z-[120] rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-2xl">
          <p className="text-lg font-semibold text-gray-900">{toast}</p>
        </div>
      )}
    </section>
  );
}