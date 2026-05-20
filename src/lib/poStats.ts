import type { PurchaseOrderLineItem } from "@/lib/purchaseOrders";

export type PoAggregateStats = {
  totalInventoryCost: number;
  totalProfit: number;
  totalUnitQty: number;
  totalCases: number;
  totalPoWeight: number;
  profitMargin: number;
  roi: number;
  uniqueAsins: number;
  totalAsinQty: number;
  totalRevenue: number;
  totalShipmentCost: number;
  totalPrepCost: number;
};

function lineInventoryCost(item: PurchaseOrderLineItem) {
  const units = item.units ?? item.asinAmount ?? 0;
  const each = item.eachCost ?? item.wantEachCost ?? 0;
  const caseCost = item.caseCost ?? item.wantCaseCost ?? 0;
  if (units && each) return units * each;
  if (item.cases && caseCost) return item.cases * caseCost;
  return caseCost || each || 0;
}

function lineRevenue(item: PurchaseOrderLineItem) {
  const units = item.units ?? item.asinAmount ?? 0;
  const sell = item.buyBox ?? 0;
  if (units && sell) return units * sell;
  return sell;
}

export function calculatePoStats(items: PurchaseOrderLineItem[]): PoAggregateStats {
  const totalInventoryCost = items.reduce((sum, item) => sum + lineInventoryCost(item), 0);
  const totalProfit = items.reduce((sum, item) => sum + (item.profit ?? 0), 0);
  const totalUnitQty = items.reduce(
    (sum, item) => sum + (item.units ?? item.asinAmount ?? 0),
    0
  );
  const totalCases = items.reduce((sum, item) => sum + (item.cases ?? 0), 0);
  const totalRevenue = items.reduce((sum, item) => sum + lineRevenue(item), 0);
  const totalShipmentCost = items.length * 0;
  const totalPrepCost = items.length * 0;
  const totalPoWeight = 0;

  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const roi =
    totalInventoryCost > 0 ? (totalProfit / totalInventoryCost) * 100 : 0;

  const uniqueAsins = new Set(
    items.map((item) => item.asin).filter(Boolean)
  ).size;
  const totalAsinQty = items.reduce(
    (sum, item) => sum + (item.asinAmount ?? item.units ?? 0),
    0
  );

  return {
    totalInventoryCost,
    totalProfit,
    totalUnitQty,
    totalCases,
    totalPoWeight,
    profitMargin,
    roi,
    uniqueAsins,
    totalAsinQty,
    totalRevenue,
    totalShipmentCost,
    totalPrepCost,
  };
}
