"use client";

import Link from "next/link";
import { SortAscDescToggle } from "@/components/ui/SortAscDescToggle";
import { PO_STAGES, getPoStageSelectClasses } from "@/lib/poStageStyles";
import { DASHBOARD_TOOLBAR_TOP } from "@/lib/sheetRowLayout";

const TOOLBAR_BTN =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-[#111827] transition hover:bg-gray-50";
const TOOLBAR_ICON_BTN =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-[#111827]";

export function PoDetailToolbar({
  poId,
  poName,
  poNameDraft,
  editingPoName,
  stage,
  search,
  asinFilter,
  sortBy,
  sortAsc,
  statsOpen,
  toolbarCompact,
  onPoNameDraftChange,
  onStartEditName,
  onSavePoName,
  onStageChange,
  onSearchChange,
  onAsinFilterChange,
  onSortByChange,
  onSortAscChange,
  onToggleStats,
  onCopyLink,
  onOpenComments,
  onOpenMove,
  onOpenDocuments,
}: {
  poId: string;
  poName: string;
  poNameDraft: string;
  editingPoName: boolean;
  stage: string;
  search: string;
  asinFilter: string;
  sortBy: string;
  sortAsc: boolean;
  statsOpen: boolean;
  toolbarCompact: boolean;
  onPoNameDraftChange: (v: string) => void;
  onStartEditName: () => void;
  onSavePoName: () => void;
  onStageChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onAsinFilterChange: (v: string) => void;
  onSortByChange: (v: string) => void;
  onSortAscChange: (v: boolean) => void;
  onToggleStats: () => void;
  onCopyLink: () => void;
  onOpenComments: () => void;
  onOpenMove: () => void;
  onOpenDocuments: () => void;
}) {
  const gap = toolbarCompact ? "gap-1" : "gap-1.5";

  return (
    <div
      className="fixed right-0 z-50 min-w-0 border-b border-gray-200 bg-white"
      style={{ left: "var(--sidebar-width)", top: DASHBOARD_TOOLBAR_TOP }}
    >
      <div className="min-w-0 overflow-x-auto bg-white px-3 py-2 lg:px-5">
        <div className={`flex w-max min-w-full flex-nowrap items-center ${gap}`}>
          {/* LEFT */}
          <Link href="/dashboard/purchase-order" className={`${TOOLBAR_BTN} w-11`} title="Back">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          {editingPoName ? (
            <input
              value={poNameDraft}
              onChange={(e) => onPoNameDraftChange(e.target.value)}
              onBlur={onSavePoName}
              onKeyDown={(e) => e.key === "Enter" && onSavePoName()}
              className="h-10 min-w-[140px] max-w-[200px] rounded-xl border-2 border-amber-300 bg-amber-50 px-2 text-sm font-bold uppercase outline-none"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={onStartEditName}
              className="h-10 max-w-[200px] truncate rounded-xl border-2 border-amber-300 bg-amber-50 px-2.5 text-sm font-bold uppercase text-gray-900"
              title={poName}
            >
              {poName} ✎
            </button>
          )}

          <select
            value={stage}
            onChange={(e) => onStageChange(e.target.value)}
            className={`h-10 rounded-xl border px-2 text-xs font-semibold outline-none ${getPoStageSelectClasses(stage)}`}
          >
            {PO_STAGES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />

          {/* CENTER */}
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in..."
            className={`h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#2563eb] ${
              toolbarCompact ? "w-[120px]" : "w-[180px]"
            }`}
          />
          <select
            value={asinFilter}
            onChange={(e) => onAsinFilterChange(e.target.value)}
            className="h-10 w-[100px] shrink-0 rounded-xl border border-gray-300 bg-white px-2 text-xs outline-none"
          >
            <option value="all">ASIN Type</option>
            <option value="with-asin">With ASIN</option>
            <option value="no-asin">No ASIN</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="h-10 w-[100px] shrink-0 rounded-xl border border-gray-300 bg-white px-2 text-xs outline-none"
          >
            <option value="createdAt">Sort By</option>
            <option value="supplierTitle">Title</option>
            <option value="asin">ASIN</option>
            <option value="profit">Profit</option>
          </select>
          <SortAscDescToggle sortAsc={sortAsc} onChange={onSortAscChange} />

          <span className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />

          {/* RIGHT */}
          <button type="button" onClick={onCopyLink} className={TOOLBAR_ICON_BTN} title="Copy link">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggleStats}
            className={`${TOOLBAR_ICON_BTN} ${statsOpen ? "border-[#4ade80] bg-[#ecfdf5] text-[#166534]" : ""}`}
            title="PO Stats"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V5M10 19V9M16 19v-6M22 19V3" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" onClick={onOpenDocuments} className={TOOLBAR_ICON_BTN} title="Cost / documents">
            <span className="text-sm font-bold">$</span>
          </button>
          <Link
            href={`/dashboard/purchase-order/${poId}/receiving`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm ring-1 ring-[#1d4ed8]/40 hover:bg-[#1d4ed8]"
            title="Receiving"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
              <path
                d="M2 8.5h12.2M2 8.5l2.2-3h8.3l2.2 3M14.2 8.5v8.2H2V8.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.2 12.5h3.1l2.7 2.7v1.5h-5.8v-4.2Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="6.2" cy="17.2" r="1.35" fill="currentColor" stroke="none" />
              <circle cx="17.2" cy="17.2" r="1.35" fill="currentColor" stroke="none" />
            </svg>
          </Link>
          <button type="button" className={TOOLBAR_ICON_BTN} title="Amazon" aria-label="Amazon">
            <span className="text-xs font-bold text-[#f59e0b]">a</span>
          </button>
          <button type="button" onClick={onOpenComments} className={TOOLBAR_ICON_BTN} title="Alerts / comments">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" onClick={onOpenMove} className={TOOLBAR_ICON_BTN} title="Move items">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l-3 3 3 3M19 15l3-3-3-3M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
