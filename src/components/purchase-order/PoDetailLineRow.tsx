"use client";

import type { PurchaseOrderLineItem } from "@/lib/purchaseOrders";
import { getLineItemUnits } from "@/lib/purchaseOrders";
import {
  PO_DETAIL_GRID_COLUMNS,
  SHEET_CARD,
  SHEET_IMAGE_BOX_BASE,
  SHEET_IMAGE_INNER,
  SHEET_ROW_HEIGHT_CLASS,
  SHEET_ROW_ORANGE_DIVIDER,
} from "@/lib/sheetRowLayout";
import { PoRowActionColumn } from "@/components/purchase-order/PoRowActionColumn";

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString();
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function PoDetailLineRow({
  item,
  index,
  selected,
  onSelectedChange,
}: {
  item: PurchaseOrderLineItem;
  index: number;
  selected?: boolean;
  onSelectedChange?: (v: boolean) => void;
}) {
  const units = getLineItemUnits(item);
  const totalCost = (item.eachCost ?? 0) * (units ?? 0);
  const imageSrc = item.amazonImage || item.supplierImage;

  return (
    <div
      className="relative grid overflow-visible bg-[#f8faf7]"
      style={{
        gridTemplateColumns: PO_DETAIL_GRID_COLUMNS,
        boxShadow: SHEET_ROW_ORANGE_DIVIDER,
      }}
    >
      <div className="sticky left-0 z-30 border-r border-[#d7dde7] bg-[#f8faf7] px-0.5">
        <PoRowActionColumn checked={selected} onCheckedChange={onSelectedChange} />
      </div>

      {/* OPTION / UPC */}
      <div className="min-w-0 border-l border-[#d7dde7] px-2.5 py-2">
        <div className={`flex ${SHEET_ROW_HEIGHT_CLASS} w-full min-w-0 items-stretch gap-2 overflow-hidden`}>
          <div className={`${SHEET_IMAGE_BOX_BASE} border-[#f59e0b]`}>
            <div className="relative flex h-full min-h-0 items-center justify-center bg-white p-0.5">
              <div className={SHEET_IMAGE_INNER}>
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-11 w-11 text-gray-300">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9.5" r="1.5" />
                    <path d="M21 15l-5-5L5 20" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className={`h-full min-h-0 min-w-0 flex-1 ${SHEET_CARD}`}>
            <div
              className="grid h-full min-h-0 w-full"
              style={{
                gridTemplateColumns: "auto minmax(0, 1fr)",
                gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
              }}
            >
              <div className="flex h-full min-h-0 items-center gap-0.5 border-r border-b border-[#cfd5cd] bg-white px-2 py-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-[#159a84]">
                  <path d="M3 4V20" stroke="#159a84" strokeWidth="2" />
                  <path d="M6 4V20" stroke="#159a84" strokeWidth="1.5" />
                  <path d="M8 4V20" stroke="#159a84" strokeWidth="2.5" />
                  <path d="M11 4V20" stroke="#159a84" strokeWidth="1.5" />
                  <path d="M14 4V20" stroke="#159a84" strokeWidth="2" />
                </svg>
                <span className="max-w-[72px] truncate rounded-full bg-[#dcfce7] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#166534]">
                  {item.upc || "—"}
                </span>
              </div>
              <div className="flex min-h-0 min-w-0 items-start border-b border-[#cfd5cd] bg-[#f0f1f3] px-2 py-2">
                <p
                  className="min-h-0 min-w-0 flex-1 text-[12px] leading-snug text-[#111827]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  title={item.supplierTitle}
                >
                  {item.supplierTitle || "—"}
                </p>
              </div>
              <div className="flex h-full min-h-0 items-center gap-0.5 border-r border-[#cfd5cd] bg-white px-2 py-2">
                <span className="text-[11px] font-semibold text-gray-500">#</span>
                <span className="text-[11px] font-bold text-[#111827]">{index}</span>
              </div>
              <div className="flex min-h-0 min-w-0 flex-col justify-center bg-[#f0f1f3] px-2 py-1.5 text-[11px] text-gray-600">
                <p>
                  Item <span className="font-semibold text-[#111827]">{item.itemNumber || "—"}</span>
                </p>
                <p className="truncate">
                  Case UPC <span className="font-semibold text-[#111827]">{item.upc || "—"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASIN */}
      <div className="border-l border-[#d7dde7] px-2.5 py-2">
        <div className={`flex ${SHEET_ROW_HEIGHT_CLASS} w-full min-w-0 items-stretch gap-2 overflow-hidden`}>
          <div className={`${SHEET_IMAGE_BOX_BASE} border-[#f59e0b]`}>
            <div className="flex h-full items-center justify-center bg-white p-0.5">
              <div className={SHEET_IMAGE_INNER}>
                {item.amazonImage ? (
                  <img src={item.amazonImage} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
            </div>
          </div>

          <div className={`min-h-0 min-w-0 flex-1 ${SHEET_CARD}`}>
            <div className="grid h-full min-h-0 grid-rows-[1fr_auto]">
              <div
                className="grid min-h-0 flex-1"
                style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}
              >
                <div className="flex items-center gap-1 border-r border-b border-[#d7dde7] bg-white px-2 py-1.5">
                  <span className="rounded-md bg-[#ffedd5] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#9a3412]">
                    {item.asin || "—"}
                  </span>
                </div>
                <div className="border-b border-[#d7dde7] bg-[#f0f1f3] px-2 py-1.5">
                  <p
                    className="text-[11px] leading-snug text-[#111827]"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.amazonTitle || "No Amazon title"}
                  </p>
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-1 border-t border-[#d7dde7] p-1">
                <div className="rounded-lg border border-[#d7dde7] bg-white px-2 py-1 text-[10px]">
                  <p className="text-gray-500">Buy Box</p>
                  <p className="font-bold">{formatMoney(item.buyBox)}</p>
                </div>
                <div className="rounded-lg border border-[#d7dde7] bg-white px-2 py-1 text-[10px]">
                  <p className="text-gray-500">Pack Size</p>
                  <p className="font-bold">{item.packSize || "—"}</p>
                </div>
                <div className="rounded-lg border border-[#d7dde7] bg-white px-2 py-1 text-[10px]">
                  <p className="text-gray-500">Ship Cost</p>
                  <p className="font-bold">—</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px]">
                  <p className="font-semibold text-amber-900">ASIN COST</p>
                  <p className="font-bold">{formatMoney(item.wantEachCost ?? item.eachCost)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid h-[122px] w-[102px] shrink-0 grid-rows-2 gap-2 self-center">
            <div className="min-h-0 overflow-hidden rounded-2xl border-2 border-[#15803d] bg-white px-2 py-2 shadow-sm">
              <p className="text-[10px] font-semibold text-gray-500">ASIN PO QTY</p>
              <p className="text-[13px] font-bold text-[#334155]">{formatNumber(units)}</p>
            </div>
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#cfd8cc] bg-white px-2 py-2 shadow-sm">
              <p className="text-[10px] font-semibold text-gray-500">FBA QTY</p>
              <p className="text-[13px] font-bold text-[#334155]">{formatNumber(item.fbaQty ?? null)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* COST INFO */}
      <div className="border-l border-[#d7dde7] px-2.5 py-2">
        <div className={`grid ${SHEET_ROW_HEIGHT_CLASS} w-full grid-rows-[minmax(0,1fr)_auto] gap-1.5`}>
          <div className="grid min-h-0 grid-cols-3 gap-1.5">
            <div className={`min-h-0 ${SHEET_CARD} px-2 py-1.5 text-[10px]`}>
              <p className="font-bold text-sky-800">Want Cost</p>
              <p className="mt-1 text-gray-500">Each</p>
              <p className="font-bold">{formatMoney(item.wantEachCost ?? item.eachCost)}</p>
              <p className="mt-0.5 text-gray-500">Case</p>
              <p className="font-bold">{formatMoney(item.wantCaseCost ?? item.caseCost)}</p>
            </div>
            <div className={`min-h-0 ${SHEET_CARD} px-2 py-1.5 text-[10px]`}>
              <p className="font-bold text-violet-800">Got Cost</p>
              <p className="mt-1 text-gray-500">Each</p>
              <p className="font-bold">{formatMoney(item.needEachCost)}</p>
              <p className="mt-0.5 text-gray-500">Case</p>
              <p className="font-bold">{formatMoney(item.needCaseCost)}</p>
            </div>
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#86efac] bg-[#ecfdf5] px-2 py-1.5 text-[10px] shadow-sm">
              <p className="font-bold text-[#166534]">Actual Cost</p>
              <p className="mt-1 font-bold text-[#166534]">TC {formatMoney(totalCost)}</p>
              <p className="mt-0.5">Each {formatMoney(item.eachCost)}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[9px]">
            {[
              ["Total Cost", formatMoney(totalCost)],
              ["Profit", formatMoney(item.profit)],
              ["ROI", formatPercent(item.roi)],
              ["Total Profit", formatMoney(item.profit)],
              ["Margin", formatPercent(item.pm)],
            ].map(([label, val]) => (
              <div key={label} className="rounded-md border border-[#86efac] bg-[#ecfdf5] px-1 py-1 text-center">
                <p className="truncate font-semibold text-[#166534]">{label}</p>
                <p className="truncate font-bold text-[#111827]">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUANTITY / MIN-MAX */}
      <div className="border-l border-[#d7dde7] px-2.5 py-2">
        <div className={`grid ${SHEET_ROW_HEIGHT_CLASS} w-full grid-rows-2 gap-2`}>
          <div className="grid min-h-0 grid-cols-2 gap-2">
            {[
              ["Min BB", formatMoney(item.buyBox)],
              ["Max BB", formatMoney(item.buyBox)],
              ["Each Qty", formatNumber(units)],
              ["Case Qty", formatNumber(item.cases)],
            ].map(([label, val]) => (
              <div key={label} className={`min-h-0 ${SHEET_CARD} px-2.5 py-2`}>
                <p className="text-[10px] font-semibold text-gray-500">{label}</p>
                <p className="text-[14px] font-bold text-[#111827]">{val}</p>
              </div>
            ))}
          </div>
          <div className="grid min-h-0 grid-cols-1 gap-1.5">
            <div className={`${SHEET_CARD} px-2.5 py-1.5`}>
              <p className="text-[10px] font-semibold text-gray-500">Left Over</p>
              <p className="text-[13px] font-bold">{formatNumber(item.leftOver)}</p>
            </div>
            <div className={`${SHEET_CARD} px-2.5 py-1.5`}>
              <p className="text-[10px] font-semibold text-gray-500">Total UPC / Case Qty</p>
              <p className="text-[13px] font-bold">
                {formatNumber(units)} / {formatNumber(item.cases)}
              </p>
            </div>
            <div className={`${SHEET_CARD} px-2.5 py-1.5`}>
              <p className="text-[10px] font-semibold text-gray-500">Case Size</p>
              <p className="text-[13px] font-bold">{item.caseSize || item.packSize || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
