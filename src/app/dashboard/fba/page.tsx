"use client";

import { useMemo, useState } from "react";

type WorkingShipment = {
  id: string;
  shipmentId: string;
  type: "SPD" | "LTL/FTL";
  status: "Working" | "Receiving" | "In Transit";
  prepType: "Case-packed" | "Individual units";
  progressCurrent: number;
  progressTotal: number;
  destination: string;
  from: string;
  updatedAt: string;
};

const mockWorkingShipments: WorkingShipment[] = [
  {
    id: "1",
    shipmentId: "FBA18BBC3KW3, 6P5W26JL",
    type: "SPD",
    status: "In Transit",
    prepType: "Individual units",
    progressCurrent: 0,
    progressTotal: 918,
    destination: "PBI3: PORT SAINT LUCIE, FL",
    from: "DISTRICT MAILING",
    updatedAt: "09 Apr 2026, 15:45:33",
  },
  {
    id: "2",
    shipmentId: "FBA199P293BW, 36640UAD",
    type: "SPD",
    status: "Receiving",
    prepType: "Case-packed",
    progressCurrent: 202,
    progressTotal: 200,
    destination: "PBI3: PORT SAINT LUCIE, FL",
    from: "DISTRICT MAILING",
    updatedAt: "30 Mar 2026, 15:47:41",
  },
  {
    id: "3",
    shipmentId: "FBA190LPU2PE, 41TS9QVC",
    type: "LTL/FTL",
    status: "Receiving",
    prepType: "Case-packed",
    progressCurrent: 5257,
    progressTotal: 5476,
    destination: "TMB8: HOMESTEAD, FL",
    from: "DISTRICT MAILING",
    updatedAt: "27 Mar 2026, 13:25:34",
  },
];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-6h6v6" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h10l6 6v8a2 2 0 0 1-2 2H4z" />
      <path d="M14 5v6h6" />
    </svg>
  );
}

function FbaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h13v10H3z" />
      <path d="M16 10h3l2 2v5h-5z" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="18.5" cy="18.5" r="1.5" />
    </svg>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.min((current / safeTotal) * 100, 100);
  const label = `${current} of ${total}`;

  return (
    <div className="w-[170px]">
      <div className="h-7 overflow-hidden rounded-lg bg-[#8d8d8d]">
        <div
          className="flex h-full items-center justify-center rounded-lg bg-gradient-to-r from-[#d6973f] to-[#cf7d36] text-sm font-semibold text-white"
          style={{ width: `${percent}%` }}
        >
          {percent > 22 ? label : ""}
        </div>
      </div>
      {percent <= 22 && (
        <div className="mt-1 text-center text-xs font-semibold text-gray-600">{label}</div>
      )}
    </div>
  );
}

function ActionIcon({
  children,
  colorClass = "text-gray-500",
  title,
  onClick,
}: {
  children: React.ReactNode;
  colorClass?: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white transition hover:bg-gray-50 ${colorClass}`}
    >
      {children}
    </button>
  );
}

export default function WorkingFbaShipmentsPage() {
  const [search, setSearch] = useState("");

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return mockWorkingShipments.filter((shipment) => {
      if (!term) return true;

      return [
        shipment.shipmentId,
        shipment.type,
        shipment.status,
        shipment.prepType,
        shipment.destination,
        shipment.from,
        shipment.updatedAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [search]);

  return (
  <section className="min-w-0 flex-1 border-r border-gray-200 bg-[#f5f7fb] text-[#111827]">
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-5 lg:px-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">FBA Shipments</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Track active working shipments, progress, destinations, and receiving flow.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard/shipment"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <HomeIcon />
                  Shipments
                </a>

                <a
                  href="/dashboard/inventory"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <InventoryIcon />
                  FBA Inventory
                </a>

                <a
                  href="/dashboard/drafts"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <DraftIcon />
                  Draft Shipments
                </a>

                <a
                  href="/dashboard/fba"
                  className="flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#111827]"
                >
                  <FbaIcon />
                  FBA Shipments
                </a>

                <a
                  href="/dashboard/shipped"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <TruckIcon />
                  Shipped to Amazon
                </a>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-[#f8fafc] px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-gray-500">
                    Active shipments: <span className="font-semibold text-[#111827]">{filteredShipments.length}</span>
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search shipment id, type, status, prep type, destination..."
                    className="h-11 w-full max-w-md rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1300px] w-full text-left">
                  <thead className="bg-[#f8fafc] text-sm text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-4 font-semibold">Shipment ID</th>
                      <th className="px-4 py-4 font-semibold">Type</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Prep Type</th>
                      <th className="px-4 py-4 font-semibold">Progress</th>
                      <th className="px-4 py-4 font-semibold">Destination</th>
                      <th className="px-4 py-4 font-semibold">From</th>
                      <th className="px-4 py-4 font-semibold">Created / Updated</th>
                      <th className="px-4 py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => (
                        <tr key={shipment.id} className="border-b border-gray-200 last:border-b-0 hover:bg-[#fafcff]">
                          <td className="px-4 py-5 align-middle">
                            <div className="min-w-[220px]">
                              <p className="font-semibold leading-6 text-[#1f3b5b]">{shipment.shipmentId}</p>
                            </div>
                          </td>

                          <td className="px-4 py-5 align-middle">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                shipment.type === "SPD"
                                  ? "bg-[#eef6ff] text-[#2563eb]"
                                  : "bg-[#fff7ed] text-[#b45309]"
                              }`}
                            >
                              {shipment.type}
                            </span>
                          </td>

                          <td className="px-4 py-5 align-middle text-sm font-semibold text-gray-700">
                            {shipment.status}
                          </td>

                          <td className="px-4 py-5 align-middle text-sm text-gray-500">
                            {shipment.prepType}
                          </td>

                          <td className="px-4 py-5 align-middle">
                            <ProgressBar current={shipment.progressCurrent} total={shipment.progressTotal} />
                          </td>

                          <td className="px-4 py-5 align-middle text-sm text-gray-700">
                            {shipment.destination}
                          </td>

                          <td className="px-4 py-5 align-middle text-sm text-gray-700">
                            {shipment.from}
                          </td>

                          <td className="px-4 py-5 align-middle text-sm text-gray-500">
                            {shipment.updatedAt}
                          </td>

                          <td className="px-4 py-5 align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <ActionIcon
                                title="View"
                                colorClass="text-[#3b82f6]"
                                onClick={() => alert(`View ${shipment.shipmentId}`)}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </ActionIcon>

                              <ActionIcon
                                title="Download"
                                colorClass="text-[#d6973f]"
                                onClick={() => alert(`Download ${shipment.shipmentId}`)}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 3v12" />
                                  <path d="m7 10 5 5 5-5" />
                                  <path d="M4 21h16" />
                                </svg>
                              </ActionIcon>

                              <ActionIcon
                                title="Details"
                                colorClass="text-[#19c6b4]"
                                onClick={() => alert(`Details ${shipment.shipmentId}`)}
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M12 8h.01" />
                                  <path d="M11 12h1v4h1" />
                                </svg>
                              </ActionIcon>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
    
  );
}