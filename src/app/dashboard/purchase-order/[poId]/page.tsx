"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { PoDetailLineRow } from "@/components/purchase-order/PoDetailLineRow";
import { PoDetailToolbar } from "@/components/purchase-order/PoDetailToolbar";
import { PoRowActionColumn } from "@/components/purchase-order/PoRowActionColumn";
import { PoStatsPanel } from "@/components/purchase-order/PoStatsPanel";
import { calculatePoStats } from "@/lib/poStats";
import {
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrderDocuments,
  listPurchaseOrderLineItems,
  listPurchaseOrders,
  mergePoLineItemsForDisplay,
  moveLineItemsToPo,
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderLineItem,
  savePurchaseOrderDocumentMetadata,
  updatePurchaseOrder,
  updatePurchaseOrderLineItem,
} from "@/lib/purchaseOrders";
import { supabase } from "@/lib/supabase";
import { normalizePoStage } from "@/lib/poStageStyles";
import {
  DASHBOARD_CONTENT_PADDING_TOP,
  DASHBOARD_STICKY_HEADER_TOP,
  PO_DETAIL_GRID_COLUMNS,
} from "@/lib/sheetRowLayout";

const TABLE_COLUMNS = [
  "",
  "Option / UPC",
  "ASIN",
  "Cost Info",
  "Quantity / Min-Max",
] as const;

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


export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = String(params.poId);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [documents, setDocuments] = useState<PurchaseOrderDocument[]>([]);
  const [allPurchaseOrders, setAllPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [asinFilter, setAsinFilter] = useState("all");
  const [sortBy, setSortBy] = useState<keyof PurchaseOrderLineItem>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [toolbarCompact, setToolbarCompact] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState("Sourcing");
  const [poNameDraft, setPoNameDraft] = useState("");
  const [editingPoName, setEditingPoName] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetPoId, setMoveTargetPoId] = useState("");
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
        setStage(normalizePoStage(order?.stage || "Sourcing"));
        setPoNameDraft(order?.name || "");
        setNotesDraft(order?.notes || "");
        setLineItems(mergePoLineItemsForDisplay(items));
        setDocuments(docs);
        if (order?.supplierSheetId) {
          const relatedPos = await listPurchaseOrders({ supplierSheetId: order.supplierSheetId });
          setAllPurchaseOrders(relatedPos.filter((po) => po.id !== poId));
        } else {
          setAllPurchaseOrders([]);
        }
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

  useLayoutEffect(() => {
    const el = document.querySelector("[data-dashboard-sidebar-collapsed]");
    if (!el) return;
    const read = () => {
      setToolbarCompact(el.getAttribute("data-dashboard-sidebar-collapsed") === "true");
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-dashboard-sidebar-collapsed"] });
    return () => mo.disconnect();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = [...lineItems];
    if (asinFilter === "with-asin") {
      rows = rows.filter((item) => item.asin.trim().length > 0);
    } else if (asinFilter === "no-asin") {
      rows = rows.filter((item) => !item.asin.trim());
    }
    if (query) {
      rows = rows.filter((item) =>
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
      );
    }

    return rows.sort((a, b) => {
      const cmp = String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""), undefined, {
        numeric: true,
      });
      return sortAsc ? cmp : -cmp;
    });
  }, [lineItems, search, asinFilter, sortBy, sortAsc]);

  const poStats = useMemo(() => calculatePoStats(lineItems), [lineItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((item) => selectedRowIds.has(item.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      pageItems.forEach((item) => {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      });
      return next;
    });
  };

  const copyPoLink = () => {
    const url = window.location.href;
    void navigator.clipboard.writeText(url);
    setToast("PO link copied");
    window.setTimeout(() => setToast(""), 1800);
  };
  const totalCost = filteredItems.reduce((sum, item) => sum + (item.caseCost || item.eachCost || 0), 0);
  const totalProfit = filteredItems.reduce((sum, item) => sum + (item.profit || 0), 0);

  const changeStage = async (nextStage: string) => {
    setStage(nextStage);
    await updatePurchaseOrder(poId, { stage: nextStage });
    setPurchaseOrder((prev) => (prev ? { ...prev, stage: nextStage } : prev));
  };

  const savePoName = async () => {
    const trimmed = poNameDraft.trim();
    if (!trimmed) return;
    await updatePurchaseOrder(poId, { name: trimmed });
    setPurchaseOrder((prev) => (prev ? { ...prev, name: trimmed } : prev));
    setEditingPoName(false);
    setToast("PO name saved");
    window.setTimeout(() => setToast(""), 1800);
  };

  const handleDeletePo = async () => {
    const confirmed = window.confirm(
      `Delete PO "${purchaseOrder?.name}" and all line items? This cannot be undone.`
    );
    if (!confirmed) return;
    await deletePurchaseOrder(poId);
    router.push("/dashboard/purchase-order");
  };

  const handleMoveAllItems = async () => {
    if (!moveTargetPoId || lineItems.length === 0) return;
    await moveLineItemsToPo(
      lineItems.map((item) => item.id),
      moveTargetPoId
    );
    setMoveModalOpen(false);
    router.push(`/dashboard/purchase-order/${moveTargetPoId}`);
  };

  const copyWantToGot = async () => {
    await Promise.all(
      lineItems.map((item) =>
        updatePurchaseOrderLineItem(item.id, {
          needEachCost: item.wantEachCost ?? item.eachCost,
          needCaseCost: item.wantCaseCost ?? item.caseCost,
        })
      )
    );
    const items = await listPurchaseOrderLineItems(poId);
    setLineItems(mergePoLineItemsForDisplay(items));
    setToast("Copied want costs to need");
    window.setTimeout(() => setToast(""), 1800);
  };

  const copyNeedToGot = async () => {
    setToast("Need costs are already in the Got column for this view.");
    window.setTimeout(() => setToast(""), 1800);
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
    <section className="min-h-screen bg-[#f7f8fa] text-[#111827]">
      <PoDetailToolbar
        poId={poId}
        poName={purchaseOrder.name}
        poNameDraft={poNameDraft}
        editingPoName={editingPoName}
        stage={stage}
        search={search}
        asinFilter={asinFilter}
        sortBy={sortBy}
        sortAsc={sortAsc}
        statsOpen={statsOpen}
        toolbarCompact={toolbarCompact}
        onPoNameDraftChange={setPoNameDraft}
        onStartEditName={() => setEditingPoName(true)}
        onSavePoName={savePoName}
        onStageChange={changeStage}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onAsinFilterChange={(v) => { setAsinFilter(v); setPage(1); }}
        onSortByChange={(v) => setSortBy(v as keyof PurchaseOrderLineItem)}
        onSortAscChange={setSortAsc}
        onToggleStats={() => setStatsOpen((v) => !v)}
        onCopyLink={copyPoLink}
        onOpenComments={() => setCommentsModalOpen(true)}
        onOpenMove={() => setMoveModalOpen(true)}
        onOpenDocuments={() => setDocumentModalOpen(true)}
      />

      <div className="pb-[68px]" style={{ paddingTop: DASHBOARD_CONTENT_PADDING_TOP }}>
        {statsOpen && (
          <div className="px-4 pb-3 lg:px-6">
            <PoStatsPanel
              stats={poStats}
              lineItems={lineItems}
              onCopyWantToGot={copyWantToGot}
              onCopyNeedToGot={copyNeedToGot}
            />
          </div>
        )}

        <div className="mt-2 px-4 lg:px-6">
          <div className="overflow-hidden rounded-2xl border border-[#c9ced6] bg-white shadow-sm">
            <div
              className="sticky z-40 grid min-h-[52px] border-b border-[#d7dde7] bg-[#f0f1f3] text-[11px] font-bold uppercase tracking-wide text-gray-700"
              style={{
                top: DASHBOARD_STICKY_HEADER_TOP,
                gridTemplateColumns: PO_DETAIL_GRID_COLUMNS,
              }}
            >
              {TABLE_COLUMNS.map((column, i) => (
                <div
                  key={column || "actions"}
                  className={`flex min-h-[52px] items-center justify-center border-r border-[#d7dde7] px-2 py-2 last:border-r-0 ${
                    i === 0 ? "sticky left-0 z-50 bg-[#f0f1f3]" : ""
                  }`}
                >
                  {i === 0 ? (
                    <PoRowActionColumn
                      showSelectAll
                      allSelected={allPageSelected}
                      onSelectAll={toggleSelectAll}
                    />
                  ) : (
                    column
                  )}
                </div>
              ))}
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              {pageItems.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-gray-500">
                  No line items saved to this purchase order yet. Add items from the supplier sheet.
                </p>
              ) : (
                pageItems.map((item, index) => (
                  <PoDetailLineRow
                    key={item.id}
                    item={item}
                    index={(safePage - 1) * pageSize + index + 1}
                    selected={selectedRowIds.has(item.id)}
                    onSelectedChange={(checked) => {
                      setSelectedRowIds((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(item.id);
                        else next.delete(item.id);
                        return next;
                      });
                    }}
                  />
                ))
              )}
            </div>
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

      {commentsModalOpen && purchaseOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={() => setCommentsModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">PO Comments</h2>
            <p className="mt-1 text-sm text-gray-500">{purchaseOrder.name}</p>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="mt-4 min-h-[160px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
              placeholder="Add comments for this purchase order..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCommentsModalOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={async () => { await saveNotes(); setCommentsModalOpen(false); }} className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {moveModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={() => setMoveModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Move items to another PO</h2>
            <p className="mt-1 text-sm text-gray-500">All {lineItems.length} line items will move to the selected PO.</p>
            <select value={moveTargetPoId} onChange={(e) => setMoveTargetPoId(e.target.value)} className="mt-4 h-10 w-full rounded-xl border border-gray-300 px-3 text-sm">
              <option value="">Select PO...</option>
              {allPurchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>{po.name}</option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setMoveModalOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={handleMoveAllItems} disabled={!moveTargetPoId} className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Move All</button>
            </div>
          </div>
        </div>
      )}

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
