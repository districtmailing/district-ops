"use client";

import type { PoAggregateStats } from "@/lib/poStats";
import type { PurchaseOrderLineItem } from "@/lib/purchaseOrders";

function money(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type PoStatsPanelProps = {
  stats: PoAggregateStats;
  lineItems: PurchaseOrderLineItem[];
  onCopyWantToGot: () => void;
  onCopyNeedToGot: () => void;
};

export function PoStatsPanel({
  stats,
  lineItems,
  onCopyWantToGot,
  onCopyNeedToGot,
}: PoStatsPanelProps) {
  const statRows = [
    ["Total Inventory Cost", money(stats.totalInventoryCost)],
    ["Total Profit", money(stats.totalProfit)],
    ["Profit Margin", `${stats.profitMargin.toFixed(2)}%`],
    ["ROI", `${stats.roi.toFixed(2)}%`],
    ["Total Revenue", money(stats.totalRevenue)],
    ["Total Unit Qty", stats.totalUnitQty.toLocaleString()],
    ["Total Cases", stats.totalCases.toLocaleString()],
    ["Unique ASINs", String(stats.uniqueAsins)],
    ["Total ASIN Qty", stats.totalAsinQty.toLocaleString()],
    ["Total PO Weight", stats.totalPoWeight > 0 ? `${stats.totalPoWeight.toFixed(2)} lb` : "—"],
    ["Total Shipment Cost", money(stats.totalShipmentCost)],
    ["Total Prep Cost", money(stats.totalPrepCost)],
  ];

  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
      <div className="rounded-lg border border-[#86efac] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#4ade80] px-3 py-1.5 text-sm font-bold text-white">
          Statistics Block
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3 text-[11px]">
          {statRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2 border-b border-gray-100 py-1">
              <span className="text-gray-600">{label}</span>
              <span className="font-bold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
        <p className="border-t border-gray-100 px-3 py-1 text-[10px] text-gray-500">
          {lineItems.length} line item{lineItems.length === 1 ? "" : "s"} in this PO
        </p>
      </div>

      <div className="rounded-lg border border-[#86efac] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#4ade80] px-3 py-1.5 text-sm font-bold text-white">
          View Options
        </div>
        <div className="space-y-2 p-3 text-[11px]">
          <label className="block">
            <span className="font-semibold text-gray-700">PO Report</span>
            <select className="mt-1 h-8 w-full rounded border border-gray-300 px-2 text-xs">
              <option>Summary</option>
              <option>Line Items</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[#86efac] bg-white shadow-sm">
        <div className="rounded-t-lg bg-[#4ade80] px-3 py-1.5 text-sm font-bold text-white">
          Copy Price Options
        </div>
        <div className="flex flex-col gap-2 p-3">
          <button
            type="button"
            onClick={onCopyWantToGot}
            className="rounded-lg border border-[#93c5fd] bg-[#dbeafe] px-3 py-2 text-[11px] font-bold text-[#1e40af] hover:bg-[#bfdbfe]"
          >
            WANT COST &gt;&gt; GOT COST
          </button>
          <button
            type="button"
            onClick={onCopyNeedToGot}
            className="rounded-lg border border-[#93c5fd] bg-[#dbeafe] px-3 py-2 text-[11px] font-bold text-[#1e40af] hover:bg-[#bfdbfe]"
          >
            NEED COST &gt;&gt; GOT COST
          </button>
        </div>
      </div>
    </div>
  );
}
