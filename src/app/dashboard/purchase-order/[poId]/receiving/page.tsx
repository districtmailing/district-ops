"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getPurchaseOrder,
  listPurchaseOrderLineItems,
  mergePoLineItemsForDisplay,
  PurchaseOrder,
  PurchaseOrderLineItem,
  updatePurchaseOrder,
  updatePurchaseOrderLineItem,
} from "@/lib/purchaseOrders";

function formatQty(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function parseQty(value: string) {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

type QtyField =
  | "invoicedCases"
  | "invoicedUnits"
  | "receivedCases"
  | "receivedUnits"
  | "damagedCases"
  | "damagedUnits"
  | "expiredCases"
  | "expiredUnits";

export default function PoReceivingPage() {
  const params = useParams();
  const router = useRouter();
  const poId = String(params.poId);

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLines, setReportLines] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [order, items] = await Promise.all([
          getPurchaseOrder(poId),
          listPurchaseOrderLineItems(poId),
        ]);
        setPurchaseOrder(order);
        setLineItems(mergePoLineItemsForDisplay(items));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [poId]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lineItems;
    return lineItems.filter((item) =>
      [item.asin, item.upc, item.supplierTitle, item.itemNumber]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [lineItems, search]);

  const updateQty = async (itemId: string, field: QtyField, value: string) => {
    const parsed = parseQty(value);
    const updated = await updatePurchaseOrderLineItem(itemId, { [field]: parsed });
    setLineItems((prev) => prev.map((row) => (row.id === itemId ? updated : row)));
  };

  const generateDiscrepancyReport = () => {
    const lines: string[] = [];
    filteredItems.forEach((item) => {
      const issues: string[] = [];
      const expC = item.expectedCases ?? item.cases ?? 0;
      const expU = item.expectedUnits ?? item.units ?? 0;
      const invC = item.invoicedCases ?? 0;
      const invU = item.invoicedUnits ?? 0;
      const recC = item.receivedCases ?? 0;
      const recU = item.receivedUnits ?? 0;

      if (invC !== expC || invU !== expU) {
        issues.push(`Invoiced ${invC}/${invU} vs expected ${expC}/${expU}`);
      }
      if (recC !== invC || recU !== invU) {
        issues.push(`Received ${recC}/${recU} vs invoiced ${invC}/${invU}`);
      }
      if ((item.damagedUnits ?? 0) > 0 || (item.expiredUnits ?? 0) > 0) {
        issues.push(
          `Damaged ${item.damagedCases ?? 0}/${item.damagedUnits ?? 0}, Expired ${item.expiredCases ?? 0}/${item.expiredUnits ?? 0}`
        );
      }
      if (issues.length > 0) {
        lines.push(`${item.asin || item.upc || item.id}: ${issues.join("; ")}`);
      }
    });

    if (lines.length === 0) {
      lines.push("No discrepancies found for the current filters.");
    }
    setReportLines(lines);
    setReportOpen(true);
  };

  const completePo = async () => {
    await updatePurchaseOrder(poId, { stage: "Receiving" });
    router.push(`/dashboard/purchase-order/${poId}`);
  };

  if (loading) {
    return (
      <section className="flex-1 bg-[#f0f2f5] p-6">
        <div className="rounded-2xl border bg-white p-8">Loading receiving...</div>
      </section>
    );
  }

  if (!purchaseOrder) {
    return (
      <section className="flex-1 bg-[#f0f2f5] p-6">
        <div className="rounded-2xl border bg-white p-8">Purchase order not found.</div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-[#f0f2f5] text-[#111827]">
      <div className="sticky top-[77px] z-40 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/purchase-order/${poId}`} className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold">
            ←
          </Link>
          <span className="rounded-lg border-2 border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-bold uppercase">
            {purchaseOrder.name}
          </span>
          <h1 className="text-lg font-bold">PO Receiving</h1>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={completePo} className="rounded-lg bg-[#22c55e] px-3 py-1.5 text-xs font-bold text-white">
              COMPLETE PO
            </button>
            <button type="button" className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-gray-900">
              Upload
            </button>
            <button
              type="button"
              onClick={generateDiscrepancyReport}
              className="rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-bold text-white"
            >
              Report
            </button>
            <button type="button" className="rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-bold text-white">
              + CREATE SHIPMENT PLAN
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ASIN / SKU / UPC / ..."
            className="h-8 w-48 rounded-lg border border-gray-300 px-2 text-xs"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-auto p-3">
        <table className="w-full min-w-[1200px] border-collapse bg-white text-left text-[11px] shadow-sm">
          <thead className="bg-[#e8ecf1] text-[10px] font-bold uppercase">
            <tr>
              <th className="border px-2 py-2">UPC / ASIN</th>
              <th className="border px-2 py-2">Expected</th>
              <th className="border px-2 py-2">Invoiced</th>
              <th className="border px-2 py-2">Received</th>
              <th className="border px-2 py-2">Damaged</th>
              <th className="border px-2 py-2">Expired</th>
              <th className="border px-2 py-2">Shipment</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No line items on this PO yet.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="border px-2 py-2">
                    <p className="font-mono text-[10px] text-emerald-800">{item.upc || "—"}</p>
                    <p className="mt-1 font-mono text-[10px] text-amber-900">{item.asin || "—"}</p>
                    <p className="mt-1 line-clamp-2 text-gray-700">{item.supplierTitle || item.amazonTitle}</p>
                  </td>
                  <td className="border px-2 py-2">
                    <p>CS {formatQty(item.expectedCases ?? item.cases)}</p>
                    <p>EA {formatQty(item.expectedUnits ?? item.units)}</p>
                  </td>
                  {(
                    [
                      ["invoicedCases", "invoicedUnits"],
                      ["receivedCases", "receivedUnits"],
                      ["damagedCases", "damagedUnits"],
                      ["expiredCases", "expiredUnits"],
                    ] as const
                  ).map(([caseField, unitField]) => (
                    <td key={caseField} className="border px-2 py-2">
                      <label className="block text-[9px] text-gray-500">CS</label>
                      <input
                        className="mb-1 w-14 rounded border px-1 py-0.5"
                        value={formatQty(item[caseField])}
                        onChange={(e) => updateQty(item.id, caseField, e.target.value)}
                      />
                      <label className="block text-[9px] text-gray-500">EA</label>
                      <input
                        className="w-14 rounded border px-1 py-0.5"
                        value={formatQty(item[unitField])}
                        onChange={(e) => updateQty(item.id, unitField, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="border px-2 py-2">
                    <p className="text-[10px] text-gray-600">PO QTY: {formatQty(item.units)}</p>
                    <p className="text-[10px] text-gray-600">FBA: {formatQty(item.fbaQty)}</p>
                    <input
                      className="mt-1 w-full rounded border px-1 py-0.5"
                      placeholder="Shipment plan"
                      value={item.shipmentPlan}
                      onChange={async (e) => {
                        const updated = await updatePurchaseOrderLineItem(item.id, {
                          shipmentPlan: e.target.value,
                        });
                        setLineItems((prev) =>
                          prev.map((row) => (row.id === item.id ? updated : row))
                        );
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={() => setReportOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Receiving / Discrepancy Report</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {reportLines.map((line) => (
                <li key={line} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setReportOpen(false)} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
