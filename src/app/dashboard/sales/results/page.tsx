"use client";

import { useMemo, useState } from "react";

type ResultsRow = {
  supplier: string;
  date: string;
  salesRep: string;
  totalSales: number;
  salesPercentOfAll: number;
  grossProfit: number;
  profitPercent: number;
  operatingProfit: number;
  operatingProfitPercent: number;
  profitPercentOfAll: number;
  returnRate: number;
  returnDollars: number;
  returnCogs: number;
  orderedItems: number;
  perAsinSales: number;
  perOrderSale: number;
  opPerAsinProfit: number;
  opPerOrderProfit: number;
  compareToAvgAsinSale: number;
  compareToAvgAsinProfit: number;
  excessInventoryValue: number;
  excessInventorySp: number;
  excessInventoryPercent: number;
  adSpend: number;
  adSales: number;
  acos: number;
  tacos: number;
  roas: number;
};

type AppliedFilters = {
  range: string;
  supplier: string;
  salesRep: string;
  search: string;
  startDate: string;
  endDate: string;
};

const sampleResults: ResultsRow[] = [
  {
    supplier: "ResMed",
    date: "2026-05-01",
    salesRep: "William",
    totalSales: 184250,
    salesPercentOfAll: 32.4,
    grossProfit: 64200,
    profitPercent: 34.8,
    operatingProfit: 48150,
    operatingProfitPercent: 26.1,
    profitPercentOfAll: 35.5,
    returnRate: 3.2,
    returnDollars: 5896,
    returnCogs: 3510,
    orderedItems: 2140,
    perAsinSales: 2710,
    perOrderSale: 86.1,
    opPerAsinProfit: 708,
    opPerOrderProfit: 22.5,
    compareToAvgAsinSale: 18.4,
    compareToAvgAsinProfit: 11.2,
    excessInventoryValue: 18200,
    excessInventorySp: 26400,
    excessInventoryPercent: 6.4,
    adSpend: 9100,
    adSales: 52600,
    acos: 17.3,
    tacos: 4.9,
    roas: 5.78,
  },
  {
    supplier: "Drive Medical",
    date: "2026-05-06",
    salesRep: "Evan",
    totalSales: 126900,
    salesPercentOfAll: 22.3,
    grossProfit: 39240,
    profitPercent: 30.9,
    operatingProfit: 28750,
    operatingProfitPercent: 22.7,
    profitPercentOfAll: 21.2,
    returnRate: 5.6,
    returnDollars: 7106,
    returnCogs: 4210,
    orderedItems: 1685,
    perAsinSales: 1952,
    perOrderSale: 75.3,
    opPerAsinProfit: 442,
    opPerOrderProfit: 17.1,
    compareToAvgAsinSale: 4.2,
    compareToAvgAsinProfit: -1.8,
    excessInventoryValue: 24100,
    excessInventorySp: 32900,
    excessInventoryPercent: 11.9,
    adSpend: 7600,
    adSales: 33600,
    acos: 22.6,
    tacos: 6.0,
    roas: 4.42,
  },
  {
    supplier: "Medline",
    date: "2026-04-22",
    salesRep: "Dalin",
    totalSales: 94200,
    salesPercentOfAll: 16.6,
    grossProfit: 31100,
    profitPercent: 33.0,
    operatingProfit: 21980,
    operatingProfitPercent: 23.3,
    profitPercentOfAll: 16.2,
    returnRate: 2.8,
    returnDollars: 2638,
    returnCogs: 1640,
    orderedItems: 1240,
    perAsinSales: 1570,
    perOrderSale: 76.0,
    opPerAsinProfit: 366,
    opPerOrderProfit: 17.7,
    compareToAvgAsinSale: -2.3,
    compareToAvgAsinProfit: 3.1,
    excessInventoryValue: 9700,
    excessInventorySp: 14100,
    excessInventoryPercent: 4.7,
    adSpend: 4100,
    adSales: 22400,
    acos: 18.3,
    tacos: 4.4,
    roas: 5.46,
  },
  {
    supplier: "Dynarex",
    date: "2026-05-12",
    salesRep: "Yana",
    totalSales: 78600,
    salesPercentOfAll: 13.8,
    grossProfit: 21800,
    profitPercent: 27.7,
    operatingProfit: 14520,
    operatingProfitPercent: 18.5,
    profitPercentOfAll: 10.7,
    returnRate: 7.1,
    returnDollars: 5581,
    returnCogs: 3275,
    orderedItems: 980,
    perAsinSales: 1310,
    perOrderSale: 80.2,
    opPerAsinProfit: 242,
    opPerOrderProfit: 14.8,
    compareToAvgAsinSale: -8.8,
    compareToAvgAsinProfit: -6.4,
    excessInventoryValue: 28900,
    excessInventorySp: 40200,
    excessInventoryPercent: 14.6,
    adSpend: 5200,
    adSales: 18100,
    acos: 28.7,
    tacos: 6.6,
    roas: 3.48,
  },
  {
    supplier: "Cardinal Health",
    date: "2026-04-28",
    salesRep: "William",
    totalSales: 84250,
    salesPercentOfAll: 14.9,
    grossProfit: 28720,
    profitPercent: 34.1,
    operatingProfit: 22180,
    operatingProfitPercent: 26.3,
    profitPercentOfAll: 16.4,
    returnRate: 2.4,
    returnDollars: 2022,
    returnCogs: 1325,
    orderedItems: 1125,
    perAsinSales: 1805,
    perOrderSale: 74.9,
    opPerAsinProfit: 475,
    opPerOrderProfit: 19.7,
    compareToAvgAsinSale: 7.6,
    compareToAvgAsinProfit: 8.4,
    excessInventoryValue: 11200,
    excessInventorySp: 16950,
    excessInventoryPercent: 5.3,
    adSpend: 3950,
    adSales: 28600,
    acos: 13.8,
    tacos: 4.7,
    roas: 7.24,
  },
];

const tableColumns: { label: string; key: keyof ResultsRow; type?: "currency" | "percent" | "number" | "pill" }[] = [
  { label: "Supplier", key: "supplier" },
  { label: "Total Sales", key: "totalSales", type: "currency" },
  { label: "Sales % of All", key: "salesPercentOfAll", type: "percent" },
  { label: "Gross Profit", key: "grossProfit", type: "currency" },
  { label: "Profit %", key: "profitPercent", type: "pill" },
  { label: "Operating Profit", key: "operatingProfit", type: "currency" },
  { label: "Operating Profit %", key: "operatingProfitPercent", type: "pill" },
  { label: "Profit % of All", key: "profitPercentOfAll", type: "percent" },
  { label: "Return Rate", key: "returnRate", type: "pill" },
  { label: "Return $", key: "returnDollars", type: "currency" },
  { label: "Return COGS", key: "returnCogs", type: "currency" },
  { label: "Ordered Items", key: "orderedItems", type: "number" },
  { label: "Per ASIN Sales", key: "perAsinSales", type: "currency" },
  { label: "Per Order Sale", key: "perOrderSale", type: "currency" },
  { label: "OP Per ASIN Profit", key: "opPerAsinProfit", type: "currency" },
  { label: "OP Per Order Profit", key: "opPerOrderProfit", type: "currency" },
  { label: "Compare to Avg ASIN Sale", key: "compareToAvgAsinSale", type: "percent" },
  { label: "Compare to Avg ASIN Profit", key: "compareToAvgAsinProfit", type: "percent" },
  { label: "Excess Inventory Value", key: "excessInventoryValue", type: "currency" },
  { label: "Excess Inventory SP", key: "excessInventorySp", type: "currency" },
  { label: "Excess Inventory %", key: "excessInventoryPercent", type: "percent" },
  { label: "AD Spend", key: "adSpend", type: "currency" },
  { label: "AD Sales", key: "adSales", type: "currency" },
  { label: "ACoS", key: "acos", type: "pill" },
  { label: "TACoS", key: "tacos", type: "pill" },
  { label: "RoAS", key: "roas", type: "pill" },
];

const rangeOptions = ["Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Quarter to Date", "Custom"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getRangeDates(range: string, startDate: string, endDate: string) {
  const end = new Date();
  const start = new Date();

  if (range === "Last 7 Days") start.setDate(end.getDate() - 7);
  if (range === "Last 30 Days") start.setDate(end.getDate() - 30);
  if (range === "This Month") start.setDate(1);
  if (range === "Last Month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  }
  if (range === "Quarter to Date") {
    const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  }
  if (range === "Custom") {
    return {
      start: new Date(`${startDate}T00:00:00`),
      end: new Date(`${endDate}T23:59:59`),
    };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function metricPillClass(label: string, value: number) {
  if (label === "Return Rate" || label === "ACoS" || label === "TACoS") {
    if (value <= 5) return "bg-emerald-50 text-emerald-700";
    if (value <= 18) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-700";
  }

  if (label === "RoAS") {
    if (value >= 6) return "bg-emerald-50 text-emerald-700";
    if (value >= 4) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-700";
  }

  if (value >= 30) return "bg-emerald-50 text-emerald-700";
  if (value >= 20) return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function renderValue(row: ResultsRow, column: (typeof tableColumns)[number]) {
  const value = row[column.key];

  if (typeof value === "string") return value;
  if (column.type === "currency") return formatCurrency(value);
  if (column.type === "number") return formatNumber(value);
  if (column.type === "percent") return formatPercent(value);
  if (column.type === "pill") {
    const display = column.key === "roas" ? value.toFixed(2) : formatPercent(value);
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${metricPillClass(column.label, value)}`}>
        {display}
      </span>
    );
  }

  return value;
}

export default function SalesResultsPage() {
  const [range, setRange] = useState("Last 30 Days");
  const [supplier, setSupplier] = useState("All Suppliers");
  const [salesRep, setSalesRep] = useState("All Reps");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-05-31");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    range: "Last 30 Days",
    supplier: "All Suppliers",
    salesRep: "All Reps",
    search: "",
    startDate: "2026-04-01",
    endDate: "2026-05-31",
  });

  const suppliers = useMemo(
    () => ["All Suppliers", ...Array.from(new Set(sampleResults.map((row) => row.supplier))).sort()],
    []
  );
  const salesReps = useMemo(
    () => ["All Reps", ...Array.from(new Set(sampleResults.map((row) => row.salesRep))).sort()],
    []
  );

  const filteredRows = useMemo(() => {
    const { start, end } = getRangeDates(
      appliedFilters.range,
      appliedFilters.startDate,
      appliedFilters.endDate
    );
    const searchValue = appliedFilters.search.trim().toLowerCase();

    return sampleResults.filter((row) => {
      const rowDate = new Date(`${row.date}T12:00:00`);
      const dateMatch = rowDate >= start && rowDate <= end;
      const supplierMatch =
        appliedFilters.supplier === "All Suppliers" || row.supplier === appliedFilters.supplier;
      const repMatch = appliedFilters.salesRep === "All Reps" || row.salesRep === appliedFilters.salesRep;
      const searchMatch = !searchValue || row.supplier.toLowerCase().includes(searchValue);

      return dateMatch && supplierMatch && repMatch && searchMatch;
    });
  }, [appliedFilters]);

  const summary = useMemo(() => {
    const totalSales = filteredRows.reduce((sum, row) => sum + row.totalSales, 0);
    const grossProfit = filteredRows.reduce((sum, row) => sum + row.grossProfit, 0);
    const operatingProfit = filteredRows.reduce((sum, row) => sum + row.operatingProfit, 0);
    const adSpend = filteredRows.reduce((sum, row) => sum + row.adSpend, 0);
    const adSales = filteredRows.reduce((sum, row) => sum + row.adSales, 0);
    const returnDollars = filteredRows.reduce((sum, row) => sum + row.returnDollars, 0);

    return {
      totalSales,
      grossProfit,
      operatingProfit,
      profitPercent: totalSales ? (grossProfit / totalSales) * 100 : 0,
      returnRate: totalSales ? (returnDollars / totalSales) * 100 : 0,
      adSpend,
      acos: adSales ? (adSpend / adSales) * 100 : 0,
      roas: adSpend ? adSales / adSpend : 0,
    };
  }, [filteredRows]);

  const summaryCards = [
    { label: "Total Sales", value: formatCurrency(summary.totalSales) },
    { label: "Gross Profit", value: formatCurrency(summary.grossProfit) },
    { label: "Operating Profit", value: formatCurrency(summary.operatingProfit) },
    { label: "Profit %", value: formatPercent(summary.profitPercent) },
    { label: "Return Rate", value: formatPercent(summary.returnRate) },
    { label: "AD Spend", value: formatCurrency(summary.adSpend) },
    { label: "ACoS", value: formatPercent(summary.acos) },
    { label: "RoAS", value: summary.roas.toFixed(2) },
  ];

  const applyFilters = () => {
    setAppliedFilters({ range, supplier, salesRep, search, startDate, endDate });
  };

  const resetFilters = () => {
    setRange("Last 30 Days");
    setSupplier("All Suppliers");
    setSalesRep("All Reps");
    setSearch("");
    setStartDate("2026-04-01");
    setEndDate("2026-05-31");
    setAppliedFilters({
      range: "Last 30 Days",
      supplier: "All Suppliers",
      salesRep: "All Reps",
      search: "",
      startDate: "2026-04-01",
      endDate: "2026-05-31",
    });
  };

  return (
    <section className="min-w-0 flex-1 bg-[#f6f8fb] text-[#111827]">
      <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Results</h2>
          <p className="text-sm text-gray-500">
            Supplier profit, ad, return, and operating performance by period.
          </p>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[160px_190px_170px_1fr_auto_auto]">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="h-11 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-3 text-sm outline-none"
            >
              {rangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
              className="h-11 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-3 text-sm outline-none"
            >
              {suppliers.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={salesRep}
              onChange={(event) => setSalesRep(event.target.value)}
              className="h-11 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-3 text-sm outline-none"
            >
              {salesReps.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search supplier..."
              className="h-11 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 text-sm outline-none placeholder:text-gray-400"
            />

            <button
              onClick={applyFilters}
              className="h-11 cursor-pointer rounded-2xl border border-[#4ade80] bg-[#4ade80] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Apply
            </button>

            <button
              onClick={resetFilters}
              className="h-11 cursor-pointer rounded-2xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          {range === "Custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 rounded-2xl border border-gray-300 bg-white px-3 text-sm outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-10 rounded-2xl border border-gray-300 bg-white px-3 text-sm outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#111827]">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h3 className="text-lg font-bold">Supplier Results</h3>
              <p className="text-xs text-gray-500">
                Placeholder data structured for a future Supabase-backed results table.
              </p>
            </div>
            <span className="rounded-full bg-[#eef8f0] px-3 py-1 text-xs font-semibold text-[#16a34a]">
              {filteredRows.length} rows
            </span>
          </div>

          <div className="max-h-[620px] overflow-auto">
            <table className="min-w-[3000px] border-separate border-spacing-0 text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#f0f1f3] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column.key} className="border-b border-gray-200 px-3 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => (
                  <tr key={`${row.supplier}-${row.date}`} className="hover:bg-[#f8fafc]">
                    {tableColumns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                        {renderValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-4 py-14 text-center text-sm text-gray-500">
                      No supplier results match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
