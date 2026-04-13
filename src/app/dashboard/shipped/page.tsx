"use client";

import { useMemo, useState } from "react";

type ShippedShipment = {
  id: string;
  groupName: string;
  shipmentName: string;
  shipmentId: string;
  type: "SPD" | "LTL/FTL";
  status: "IN_TRANSIT" | "RECEIVING";
  receivedCurrent: number;
  receivedTotal: number;
  destination: string;
  from: string;
  updatedAt: string;
};

const mockShippedShipments: ShippedShipment[] = [
  {
    id: "1",
    groupName: "JON-BILLY-MARQUES-AZ-AT-KW-04/09/26",
    shipmentName: "FBA STA (04/09/2026 21:45)-PBI3",
    shipmentId: "FBA19BBC3KW3, 6P5W26JL",
    type: "SPD",
    status: "IN_TRANSIT",
    receivedCurrent: 0,
    receivedTotal: 918,
    destination: "PBI3: PORT SAINT LUCIE, FL",
    from: "DISTRICT MAILING",
    updatedAt: "09 Apr 2026, 15:45:33",
  },
  {
    id: "2",
    groupName: "JON-BILLY-ML-03/30/26",
    shipmentName: "FBA STA (03/30/2026 21:47)-PBI3",
    shipmentId: "FBA199P293BW, 36640UAD",
    type: "SPD",
    status: "RECEIVING",
    receivedCurrent: 202,
    receivedTotal: 200,
    destination: "PBI3: PORT SAINT LUCIE, FL",
    from: "DISTRICT MAILING",
    updatedAt: "30 Mar 2026, 15:47:41",
  },
  {
    id: "3",
    groupName: "JON-BILLY-MARQU-SOVE-CS-03/27/26",
    shipmentName: "FBA STA (03/27/2026 19:25)-TMB8",
    shipmentId: "FBA190LPU2PE, 41TS9QVC",
    type: "LTL/FTL",
    status: "RECEIVING",
    receivedCurrent: 5257,
    receivedTotal: 5476,
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

function ReceivedBar({ current, total }: { current: number; total: number }) {
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

function ActionButton({
  children,
  label,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition ${
        danger
          ? "bg-[#ff4d4f] text-white hover:opacity-90"
          : "bg-[#d6973f] text-white hover:opacity-90"
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function MiniIconButton({
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

export default function ShippedToAmazonPage() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("12 months");

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return mockShippedShipments.filter((shipment) => {
      if (!term) return true;

      return [
        shipment.groupName,
        shipment.shipmentName,
        shipment.shipmentId,
        shipment.type,
        shipment.status,
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
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="border-b border-gray-200 px-6 py-6">
            <h1 className="text-2xl font-bold tracking-tight">District</h1>
            <p className="text-sm text-gray-500">Internal Hub</p>
          </div>

          <div className="space-y-6 px-4 py-6">
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Dashboard
              </p>
              <div className="space-y-1">
                <a href="/dashboard" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Overview
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Sales
              </p>
              <div className="space-y-1">
                <a href="/dashboard/pipeline" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Pipeline
                </a>
                <a href="/dashboard/activity" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Activity
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operations
              </p>
              <div className="rounded-2xl bg-[#eef6ff] p-2 space-y-1">
                <div className="rounded-xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] px-4 py-3 font-semibold text-white shadow-sm">
                  Shipments
                </div>

                <a href="/dashboard/purchase-orders" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-white">
                  Purchase Orders
                </a>

                <a href="/dashboard/inventory" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-white">
                  Inventory
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin
              </p>
              <div className="space-y-1">
                <a href="/dashboard/team" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Team
                </a>
                <a href="/dashboard/settings" className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Settings
                </a>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 border-r border-gray-200">
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-5 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Shipped to Amazon</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Review shipped loads, receiving progress, labels, scans, and shipment completion.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Show shipments shipped in the last:</span>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  >
                    <option>1 month</option>
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>12 months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard/shipments"
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
                  href="/dashboard/shipments/drafts"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <DraftIcon />
                  Draft Shipments
                </a>

                <a
                  href="/dashboard/shipments/fba"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <FbaIcon />
                  FBA Shipments
                </a>

                <a
                  href="/dashboard/shipments/shipped"
                  className="flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#111827]"
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
                    Showing <span className="font-semibold text-[#111827]">{filteredShipments.length}</span> shipped shipment{filteredShipments.length === 1 ? "" : "s"}
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search shipment id, name, type, status, destination..."
                    className="h-11 w-full max-w-md rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6 p-4">
                {filteredShipments.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-12 text-center text-sm text-gray-500">
                    No shipped shipments found.
                  </div>
                ) : (
                  filteredShipments.map((shipment) => (
                    <div key={shipment.id} className="overflow-hidden rounded-2xl border border-gray-200">
                      <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-4 py-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <p className="text-2xl font-semibold text-[#1f3b5b]">{shipment.groupName}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ActionButton label="Review Complete Shipment" onClick={() => alert(`Review ${shipment.groupName}`)}>
                            <span className="sr-only">Review</span>
                          </ActionButton>
                          <ActionButton label="Pack & Scan" onClick={() => alert(`Pack & Scan ${shipment.groupName}`)}>
                            <span className="sr-only">Pack & Scan</span>
                          </ActionButton>
                          <ActionButton label="Print All Labels" onClick={() => alert(`Print labels ${shipment.groupName}`)}>
                            <span className="sr-only">Print</span>
                          </ActionButton>
                          <ActionButton danger label="Delete" onClick={() => alert(`Delete ${shipment.groupName}`)}>
                            <span className="sr-only">Delete</span>
                          </ActionButton>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-[1200px] w-full text-left">
                          <thead className="bg-[#f8fafc] text-sm text-gray-600">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-4 font-semibold">Shipment</th>
                              <th className="px-4 py-4 font-semibold">Type</th>
                              <th className="px-4 py-4 font-semibold">Status</th>
                              <th className="px-4 py-4 font-semibold">Received</th>
                              <th className="px-4 py-4 font-semibold">Destination</th>
                              <th className="px-4 py-4 font-semibold">From</th>
                              <th className="px-4 py-4 font-semibold">Created / Updated</th>
                              <th className="px-4 py-4 font-semibold text-center">Actions</th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr className="bg-white">
                              <td className="px-4 py-5 align-middle">
                                <p className="text-sm text-gray-500">{shipment.shipmentName}</p>
                                <p className="text-xl font-semibold text-[#1f3b5b]">{shipment.shipmentId}</p>
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

                              <td className="px-4 py-5 align-middle">
                                <ReceivedBar current={shipment.receivedCurrent} total={shipment.receivedTotal} />
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
                                  <MiniIconButton
                                    title="Duplicate"
                                    colorClass="text-[#3b82f6]"
                                    onClick={() => alert(`Duplicate ${shipment.shipmentId}`)}
                                  >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="10" height="10" rx="2" />
                                      <rect x="5" y="5" width="10" height="10" rx="2" />
                                    </svg>
                                  </MiniIconButton>

                                  <MiniIconButton
                                    title="Download"
                                    colorClass="text-[#d6973f]"
                                    onClick={() => alert(`Download ${shipment.shipmentId}`)}
                                  >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 3v12" />
                                      <path d="m7 10 5 5 5-5" />
                                      <path d="M4 21h16" />
                                    </svg>
                                  </MiniIconButton>

                                  <MiniIconButton
                                    title="Location"
                                    colorClass="text-[#19c6b4]"
                                    onClick={() => alert(`Location ${shipment.shipmentId}`)}
                                  >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                                      <circle cx="12" cy="11" r="2" />
                                    </svg>
                                  </MiniIconButton>

                                  <MiniIconButton
                                    title="More"
                                    colorClass="text-[#d6973f]"
                                    onClick={() => alert(`More ${shipment.shipmentId}`)}
                                  >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="5" r="1" />
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="12" cy="19" r="1" />
                                    </svg>
                                  </MiniIconButton>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}