"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { listPurchaseOrders } from "@/lib/purchaseOrders";

type PoRow = {
  id: string;
  name: string;
  stage: string;
  supplier: string;
  sheets: number;
  asinQty: number;
  upcCount: number;
  totalCost: number;
  profit: number;
  pm: number;
  roi: number;
  buyer: string;
  createdOn: string;
};

function parseSlashDate(s: string): number {
  const [mm, dd, yy] = s.split("/").map(Number);
  if (!mm || !dd || !yy) return 0;
  return new Date(yy, mm - 1, dd).getTime();
}

const STAGES = ["Sourcing", "Ordered", "Received", "Closed"] as const;

function StagePill({ stage }: { stage: string }) {
  return (
    <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-900">
      {stage}
    </span>
  );
}

function SheetsPill({ n }: { n: number }) {
  return (
    <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-bold text-sky-950">
      {n}
    </span>
  );
}

function CountPill({ n, tone }: { n: number; tone: "amber" | "green" }) {
  const cls =
    tone === "amber"
      ? "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80"
      : "bg-emerald-800 text-white ring-1 ring-emerald-900/30";
  return (
    <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${cls}`}>
      {n}
    </span>
  );
}

function CostPill({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-[4.75rem] justify-center rounded-full bg-slate-200/90 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-900">
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

function ProfitPill({ value }: { value: number }) {
  const neg = value < 0;
  return (
    <span
      className={`inline-flex min-w-[4.75rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        neg ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"
      }`}
    >
      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

function PctPill({ value }: { value: number }) {
  const neg = value < 0;
  const s = `${value.toFixed(2)}%`;
  return (
    <span
      className={`inline-flex min-w-[3.5rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        neg ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900"
      }`}
    >
      {s}
    </span>
  );
}

export default function PurchaseOrdersPage() {
  const [poRows, setPoRows] = useState<PoRow[]>([]);
  const [loadMessage, setLoadMessage] = useState("");
  const [searchType, setSearchType] = useState("Name");
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("All");
  const [stage, setStage] = useState("All");
  const [sortBy, setSortBy] = useState("Created On");
  const [sortAsc, setSortAsc] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");
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
    const loadPurchaseOrders = async () => {
      try {
        const savedOrders = await listPurchaseOrders();
        setLoadMessage("");

        setPoRows(
          savedOrders.map((order) => ({
            id: order.id,
            name: order.name,
            stage: order.stage || "Sourcing",
            supplier: order.supplier || "—",
            sheets: 0,
            asinQty: 0,
            upcCount: 0,
            totalCost: 0,
            profit: 0,
            pm: 0,
            roi: 0,
            buyer: order.buyer || "—",
            createdOn: new Date(order.createdAt || Date.now()).toLocaleDateString("en-US"),
          }))
        );
      } catch (error) {
        console.error("Error loading purchase orders:", {
          message: error && typeof error === "object" && "message" in error ? error.message : undefined,
          code: error && typeof error === "object" && "code" in error ? error.code : undefined,
          details: error && typeof error === "object" && "details" in error ? error.details : undefined,
          hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined,
          error,
        });
        setPoRows([]);
        setLoadMessage("Could not load purchase orders from Supabase.");
      }
    };

    loadPurchaseOrders();
  }, []);

  const filteredRows = useMemo(() => {
    let rows = [...poRows];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        if (searchType === "Name") return r.name.toLowerCase().includes(q);
        if (searchType === "Supplier") return r.supplier.toLowerCase().includes(q);
        if (searchType === "Buyer") return r.buyer.toLowerCase().includes(q);
        return (
          r.name.toLowerCase().includes(q) ||
          r.supplier.toLowerCase().includes(q) ||
          r.buyer.toLowerCase().includes(q)
        );
      });
    }
    if (supplier !== "All") {
      rows = rows.filter((r) => r.supplier === supplier);
    }
    if (stage !== "All") {
      rows = rows.filter((r) => r.stage === stage);
    }
    if (fromDate) {
      rows = rows.filter((r) => {
        const rowT = parseSlashDate(r.createdOn);
        const from = new Date(fromDate + "T00:00:00").getTime();
        return rowT >= from;
      });
    }
    if (toDate) {
      rows = rows.filter((r) => {
        const rowT = parseSlashDate(r.createdOn);
        const to = new Date(toDate + "T23:59:59").getTime();
        return rowT <= to;
      });
    }
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "Created On") {
        cmp = parseSlashDate(a.createdOn) - parseSlashDate(b.createdOn);
      } else if (sortBy === "Name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "Total Cost") {
        cmp = a.totalCost - b.totalCost;
      } else {
        cmp = a.name.localeCompare(b.name);
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [poRows, search, searchType, supplier, stage, sortBy, sortAsc, fromDate, toDate]);

  const availableSuppliers = useMemo(() => {
    return Array.from(new Set(poRows.map((row) => row.supplier).filter(Boolean))).sort();
  }, [poRows]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageNumbers = useMemo(() => {
    const max = totalPages;
    const cur = safePage;
    if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
    const out: (number | "gap")[] = [];
    const windowStart = Math.max(2, cur - 1);
    const windowEnd = Math.min(max - 1, cur + 1);
    out.push(1);
    if (windowStart > 2) out.push("gap");
    for (let i = windowStart; i <= windowEnd; i += 1) {
      if (i > 1 && i < max) out.push(i);
    }
    if (windowEnd < max - 1) out.push("gap");
    if (max > 1) out.push(max);
    return out;
  }, [safePage, totalPages]);

  const resetFilters = () => {
    setSearchType("Name");
    setSearch("");
    setSupplier("All");
    setStage("All");
    setSortBy("Created On");
    setSortAsc(false);
    setFromDate("");
    setToDate("");
    setPage(1);
    setJumpInput("");
  };

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col border-r border-gray-200 bg-[#f0f2f5] text-[#111827]">
      <div className="min-w-0 flex-1 px-3 pb-20 pt-0 sm:px-4 lg:px-5">
        <div className="min-w-0 -mx-3 overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm sm:-mx-4 lg:-mx-5">
          <table className="w-full min-w-[1180px] border-collapse text-left text-[12px]">
            <thead className="sticky top-[77px] z-50 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)]">
              <tr>
                <td colSpan={14} className="border-b border-gray-200 bg-white p-0 align-bottom">
                  <div className="flex min-w-0 flex-nowrap items-end gap-x-1.5 overflow-x-auto px-2 py-1.5 sm:gap-x-2">
          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[76px]" : "min-w-[88px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">Search Type</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-8 w-full min-w-0 rounded-md border border-gray-300 bg-white px-1.5 text-[12px] font-medium text-gray-800 outline-none focus:border-[#1e3a5f]"
            >
              <option>Name</option>
              <option>Supplier</option>
              <option>Buyer</option>
            </select>
          </div>

          <div
            className={`flex min-w-0 flex-1 flex-col ${toolbarCompact ? "max-w-[120px] sm:max-w-[150px]" : "max-w-[220px] sm:max-w-[260px]"}`}
          >
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-8 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 text-[12px] outline-none focus:border-[#1e3a5f]"
            />
          </div>

          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[86px]" : "min-w-[100px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">Supplier</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-1.5 text-[12px] outline-none focus:border-[#1e3a5f]"
            >
              <option>All</option>
              {availableSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[86px]" : "min-w-[100px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-1.5 text-[12px] outline-none focus:border-[#1e3a5f]"
            >
              <option>All</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[108px]" : "min-w-[120px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-1.5 text-[12px] outline-none focus:border-[#1e3a5f]"
            >
              <option>Created On</option>
              <option>Name</option>
              <option>Total Cost</option>
            </select>
          </div>

          <div className="flex shrink-0 flex-col">
            <span className="mb-0.5 invisible h-[14px] text-[10px] select-none" aria-hidden>
              .
            </span>
            <div className="flex h-8 overflow-hidden rounded-md border border-gray-300">
              <button
                type="button"
                onClick={() => {
                  setSortAsc(true);
                  setPage(1);
                }}
                className={`px-2.5 text-[11px] font-semibold ${sortAsc ? "bg-[#1e3a5f] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Asc ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortAsc(false);
                  setPage(1);
                }}
                className={`border-l border-gray-300 px-2.5 text-[11px] font-semibold ${!sortAsc ? "bg-[#1e3a5f] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Dsc ↓
              </button>
            </div>
          </div>

          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[108px]" : "min-w-[118px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-1 text-[11px] outline-none focus:border-[#1e3a5f]"
            />
          </div>

          <div className={`flex shrink-0 flex-col ${toolbarCompact ? "min-w-[108px]" : "min-w-[118px]"}`}>
            <label className="mb-0.5 text-[10px] font-medium leading-none text-gray-500">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 bg-white px-1 text-[11px] outline-none focus:border-[#1e3a5f]"
            />
          </div>

          <div className="flex shrink-0 flex-col">
            <span className="mb-0.5 invisible h-[14px] select-none" aria-hidden>
              .
            </span>
            <div className="flex h-8 items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="h-8 shrink-0 rounded-md bg-[#1e3a5f] px-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#152a45] sm:px-3"
              >
                Search
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="h-8 shrink-0 rounded-md bg-[#fb7185] px-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#f43f5e] sm:px-3"
              >
                Reset
              </button>
              <button
                type="button"
                title="Add purchase order"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#22c55e] text-lg font-bold leading-none text-white shadow-sm hover:bg-[#16a34a]"
              >
                +
              </button>
            </div>
          </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-300 bg-[#e8ecf1] text-[11px] font-bold uppercase tracking-wide text-gray-800 shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">No</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2">Name</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2">Stage</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2">Supplier</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">Sheets</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">ASIN Qty</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">UPC&apos;s</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">Total Cost</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">Profit($)</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">PM(%)</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2 text-center">ROI(%)</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2">Buyer</th>
                <th className="whitespace-nowrap border-r border-gray-200 bg-[#e8ecf1] px-2 py-2">Created On</th>
                <th className="whitespace-nowrap bg-[#e8ecf1] px-2 py-2 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="bg-white">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="border-t border-gray-200 px-2 py-10 text-center text-[13px] text-gray-500">
                      {loadMessage || "No purchase orders found."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, idx) => (
                    <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50/80">
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center tabular-nums text-gray-700">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5">
                        <Link
                          href={`/dashboard/purchase-order/${row.id}`}
                          className="inline-flex max-w-[200px] items-center gap-1 truncate text-left font-semibold text-[#2563eb] hover:underline"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" strokeLinejoin="round" />
                            <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="truncate">{row.name}</span>
                        </Link>
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5">
                        <StagePill stage={row.stage} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-gray-800">{row.supplier}</td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <SheetsPill n={row.sheets} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <CountPill n={row.asinQty} tone="amber" />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <CountPill n={row.upcCount} tone="green" />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <CostPill value={row.totalCost} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <ProfitPill value={row.profit} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <PctPill value={row.pm} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-center">
                        <PctPill value={row.roi} />
                      </td>
                      <td className="border-r border-gray-200 px-2 py-1.5 text-gray-800">{row.buyer}</td>
                      <td className="border-r border-gray-200 px-2 py-1.5 tabular-nums text-gray-800">{row.createdOn}</td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          title="Delete"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 7V4h6v3" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      <footer
        className="fixed bottom-0 z-[60] flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-200 bg-white px-3 py-2 text-[12px] text-[#111827] sm:px-4"
        style={{ left: "var(--sidebar-width)", right: 0 }}
      >
        <p className="min-w-0 shrink-0 whitespace-nowrap font-medium text-gray-700">
          {total === 0 ? "0" : `${start}-${end}`} of {total}
        </p>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-800 disabled:opacity-40 hover:bg-gray-50 sm:px-3"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-0.5">
            {pageNumbers.map((n, i) =>
              n === "gap" ? (
                <span key={`gap-${i}`} className="px-0.5 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2 text-[12px] font-bold tabular-nums ${
                    n === safePage ? "bg-[#1e3a5f] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-800 disabled:opacity-40 hover:bg-gray-50 sm:px-3"
          >
            Next →
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-gray-600">
            Jump to Page
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const raw = parseInt(jumpInput.trim(), 10);
                if (!Number.isFinite(raw)) return;
                setPage(Math.min(totalPages, Math.max(1, raw)));
                setJumpInput("");
              }}
              placeholder={`1–${totalPages}`}
              className="h-8 w-14 rounded-md border border-gray-300 bg-white px-1.5 text-[11px] tabular-nums outline-none focus:border-[#1e3a5f]"
            />
          </label>
          <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-gray-600">
            Page Size
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-gray-300 bg-white px-1.5 text-[11px] outline-none focus:border-[#1e3a5f]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </footer>
      {loadMessage && (
        <div className="fixed bottom-16 right-4 z-[80] max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-lg">
          {loadMessage}
        </div>
      )}
    </section>
  );
}
