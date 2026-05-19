"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getPurchaseOrder,
  listPurchaseOrderDocuments,
  listPurchaseOrderLineItems,
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderLineItem,
  savePurchaseOrderDocumentMetadata,
  updatePurchaseOrder,
} from "@/lib/purchaseOrders";
import { supabase } from "@/lib/supabase";

const PO_STAGES = ["Sourcing", "Ordered", "Received", "Closed"];

const columns: { label: string; key: keyof PurchaseOrderLineItem; kind?: "money" | "percent" | "number" | "image" }[] = [
  { label: "Option / UPC", key: "upc" },
  { label: "ASIN", key: "asin" },
  { label: "Cost Info", key: "eachCost", kind: "money" },
  { label: "Quantity / Min-Max", key: "units", kind: "number" },
  { label: "Cases", key: "cases", kind: "number" },
  { label: "Left Over", key: "leftOver", kind: "number" },
  { label: "Buy Box", key: "buyBox", kind: "money" },
  { label: "Profit", key: "profit", kind: "money" },
  { label: "PM", key: "pm", kind: "percent" },
  { label: "ROI", key: "roi", kind: "percent" },
];

function formatMoney(value: number | null) {
  if (value === null) return "—";
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number | null) {
  if (value === null) return "—";
  return value.toLocaleString();
}

function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(2)}%`;
}

function renderCell(item: PurchaseOrderLineItem, column: (typeof columns)[number]) {
  const value = item[column.key];

  if (column.label === "Option / UPC") {
    return (
      <div className="min-w-0">
        <p className="truncate font-bold text-gray-900">{item.itemNumber || "—"}</p>
        <p className="truncate font-mono text-[11px] text-gray-500">{item.upc || "—"}</p>
        <p className="truncate text-[11px] text-gray-600">{item.supplierTitle || "—"}</p>
      </div>
    );
  }

  if (column.label === "ASIN") {
    return (
      <div className="flex min-w-[260px] items-center gap-2">
        {item.amazonImage ? (
          <img src={item.amazonImage} alt="" className="h-10 w-10 shrink-0 rounded-md object-contain" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">—</span>
        )}
        <div className="min-w-0">
          <p className="truncate rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-900">{item.asin || "—"}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-gray-700">{item.amazonTitle || "No Amazon match title"}</p>
        </div>
      </div>
    );
  }

  if (column.label === "Cost Info") {
    return (
      <div className="space-y-0.5 text-[11px]">
        <p><span className="text-gray-500">Want:</span> {formatMoney(item.wantEachCost ?? item.eachCost)} each / {formatMoney(item.wantCaseCost ?? item.caseCost)} case</p>
        <p><span className="text-gray-500">Need:</span> {formatMoney(item.needEachCost)} each / {formatMoney(item.needCaseCost)} case</p>
      </div>
    );
  }

  if (column.label === "Quantity / Min-Max") {
    return (
      <div className="space-y-0.5 text-[11px]">
        <p><span className="text-gray-500">Units:</span> {formatNumber(item.units)}</p>
        <p><span className="text-gray-500">Case Size:</span> {item.caseSize || "—"} · <span className="text-gray-500">ASIN Amt:</span> {formatNumber(item.asinAmount)}</p>
      </div>
    );
  }

  if (column.kind === "image") {
    const src = String(value || "");
    return src ? (
      <img src={src} alt="" className="h-10 w-10 rounded-md object-contain" />
    ) : (
      <span className="text-gray-400">—</span>
    );
  }

  if (column.kind === "money") return formatMoney(value as number | null);
  if (column.kind === "number") return formatNumber(value as number | null);
  if (column.kind === "percent") {
    const parsed = value as number | null;
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${parsed !== null && parsed < 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"}`}>
        {formatPercent(parsed)}
      </span>
    );
  }

  return String(value || "—");
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const poId = String(params.poId);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [documents, setDocuments] = useState<PurchaseOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof PurchaseOrderLineItem>("createdAt");
  const [stage, setStage] = useState("Sourcing");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [documentType, setDocumentType] = useState<PurchaseOrderDocument["documentType"]>("Invoice");
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [loadMessage, setLoadMessage] = useState("");

  useEffect(() => {
    const loadPo = async () => {
      setLoading(true);
      try {
        const [order, items, docs] = await Promise.all([
          getPurchaseOrder(poId),
          listPurchaseOrderLineItems(poId),
          listPurchaseOrderDocuments(poId),
        ]);

        setPurchaseOrder(order);
        setStage(order?.stage || "Sourcing");
        setNotesDraft(order?.notes || "");
        setLineItems(items);
        setDocuments(docs);
        setLoadMessage(order ? "" : "Purchase order not found.");
      } catch (error) {
        console.error("Error loading purchase order detail:", {
          message: error && typeof error === "object" && "message" in error ? error.message : undefined,
          code: error && typeof error === "object" && "code" in error ? error.code : undefined,
          details: error && typeof error === "object" && "details" in error ? error.details : undefined,
          hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined,
          error,
        });
        setPurchaseOrder(null);
        setLineItems([]);
        setDocuments([]);
        setLoadMessage("Could not load this PO from Supabase.");
      } finally {
        setLoading(false);
      }
    };

    loadPo();
  }, [poId]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query
      ? lineItems.filter((item) =>
          [
            item.supplierTitle,
            item.amazonTitle,
            item.asin,
            item.upc,
            item.itemNumber,
            item.supplierSheetId,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
      : [...lineItems];

    return rows.sort((a, b) => String(b[sortBy] || "").localeCompare(String(a[sortBy] || "")));
  }, [lineItems, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const totalCost = filteredItems.reduce((sum, item) => sum + (item.caseCost || item.eachCost || 0), 0);
  const totalProfit = filteredItems.reduce((sum, item) => sum + (item.profit || 0), 0);

  const changeStage = async (nextStage: string) => {
    setStage(nextStage);
    await updatePurchaseOrder(poId, { stage: nextStage });
    setPurchaseOrder((prev) => (prev ? { ...prev, stage: nextStage } : prev));
  };

  const saveNotes = async () => {
    await updatePurchaseOrder(poId, { notes: notesDraft });
    setPurchaseOrder((prev) => (prev ? { ...prev, notes: notesDraft } : prev));
    setToast("PO notes saved");
    window.setTimeout(() => setToast(""), 1800);
  };

  const uploadDocument = async (file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const storagePath = `${poId}/${documentType.toLowerCase()}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage
        .from("purchase-order-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (error) {
        setToast(`Upload failed: ${error.message}`);
        window.setTimeout(() => setToast(""), 2600);
        return;
      }

      const { data } = supabase.storage.from("purchase-order-documents").getPublicUrl(storagePath);
      const savedDoc = await savePurchaseOrderDocumentMetadata({
        poId,
        documentType,
        fileName: file.name,
        storagePath,
        publicUrl: data.publicUrl,
      });
      setDocuments((prev) => [savedDoc, ...prev.filter((doc) => doc.documentType !== documentType)]);
      setToast(`${documentType} uploaded`);
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-1 bg-[#f0f2f5] p-6 text-[#111827]">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">Loading purchase order...</div>
      </section>
    );
  }

  if (!purchaseOrder) {
    return (
      <section className="flex-1 bg-[#f0f2f5] p-6 text-[#111827]">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-bold text-gray-900">Purchase order not found</p>
          <p className="mt-2 text-sm text-gray-600">
            This PO could not be found in Supabase or local saved purchase orders.
          </p>
          {loadMessage && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              {loadMessage}
            </p>
          )}
          <Link href="/dashboard/purchase-order" className="mt-5 inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            Back to POs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col border-r border-gray-200 bg-[#f0f2f5] text-[#111827]">
      <div className="sticky top-[77px] z-40 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link href="/dashboard/purchase-order" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            ← POs
          </Link>
          <button
            type="button"
            onClick={() => setDocumentModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#8aa6d8] bg-white text-[#334155] hover:bg-gray-50"
            title="PO documents and notes"
          >
            📎
          </button>
          <div className="min-w-[180px] flex-1">
            <p className="truncate text-lg font-bold">{purchaseOrder?.name || poId}</p>
            <p className="text-xs text-gray-500">{lineItems.length} line items · {formatMoney(totalCost)} cost · {formatMoney(totalProfit)} profit</p>
          </div>
          <select
            value={stage}
            onChange={(event) => changeStage(event.target.value)}
            className="h-9 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold outline-none"
          >
            {PO_STAGES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search inside PO..."
            className="h-9 w-[220px] rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as keyof PurchaseOrderLineItem)}
            className="h-9 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none"
          >
            <option value="createdAt">Newest</option>
            <option value="supplierTitle">Supplier Title</option>
            <option value="asin">ASIN</option>
            <option value="upc">UPC</option>
            <option value="profit">Profit</option>
          </select>
        </div>
      </div>

      <div className="min-w-0 flex-1 px-3 pb-20 sm:px-4 lg:px-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[calc(100vh-220px)] overflow-auto">
            <table className="w-full min-w-[1900px] border-collapse text-left text-[12px]">
              <thead className="sticky top-0 z-20 bg-[#e8ecf1] text-[11px] font-bold uppercase tracking-wide text-gray-800">
                <tr>
                  <th className="border-r border-gray-200 px-2 py-2 text-center">No</th>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap border-r border-gray-200 px-2 py-2">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-gray-500">
                      No line items saved to this purchase order yet.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="border-r border-gray-200 px-2 py-2 text-center tabular-nums text-gray-600">
                        {(safePage - 1) * pageSize + index + 1}
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="max-w-[240px] truncate border-r border-gray-200 px-2 py-2 text-gray-800">
                          {renderCell(item, column)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer
        className="fixed bottom-0 z-[60] flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-2 text-[12px] text-[#111827]"
        style={{ left: "var(--sidebar-width)", right: 0 }}
      >
        <p className="font-medium text-gray-700">
          {filteredItems.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, filteredItems.length)}`} of {filteredItems.length}
        </p>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}/page</option>)}
          </select>
          <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage <= 1} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
          <span className="font-bold tabular-nums">{safePage} / {totalPages}</span>
          <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage >= totalPages} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
        </div>
      </footer>

      {documentModalOpen && purchaseOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={() => setDocumentModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{purchaseOrder.name}</h2>
                <p className="mt-1 text-sm text-gray-500">Notes, invoice, BOL, and purchase order documents.</p>
              </div>
              <button onClick={() => setDocumentModalOpen(false)} className="rounded-xl px-3 py-2 text-xl text-gray-500 hover:bg-gray-100">×</button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-gray-700">Notes</span>
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
                placeholder="Add PO notes..."
              />
            </label>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label>
                <span className="text-sm font-semibold text-gray-700">Document Type</span>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value as PurchaseOrderDocument["documentType"])} className="mt-2 h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm">
                  <option>Invoice</option>
                  <option>BOL</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="flex-1">
                <span className="text-sm font-semibold text-gray-700">Upload / Replace</span>
                <input
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadDocument(file);
                    event.currentTarget.value = "";
                  }}
                  className="mt-2 block w-full text-sm"
                  disabled={uploading}
                />
              </label>
              <button onClick={saveNotes} className="h-10 rounded-xl bg-[#22c55e] px-4 text-sm font-semibold text-white hover:bg-[#16a34a]">
                Save Notes
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 bg-[#f8fafc] px-3 py-2 text-sm font-semibold">Existing Documents</div>
              <div className="divide-y divide-gray-100">
                {documents.length === 0 ? (
                  <p className="px-3 py-5 text-sm text-gray-500">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{doc.documentType}</p>
                        <p className="text-xs text-gray-500">{doc.fileName}</p>
                      </div>
                      {doc.publicUrl ? (
                        <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No public URL</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 right-6 z-[10000] rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-900 shadow-2xl">
          {toast}
        </div>
      )}
      {loadMessage && (
        <div className="fixed bottom-20 left-[calc(var(--sidebar-width)+1rem)] z-[10000] max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-lg">
          {loadMessage}
        </div>
      )}
    </section>
  );
}
