"use client";

import { useState } from "react";

export default function ShipmentsPage() {
  const [range, setRange] = useState<"7" | "14" | "30">("14");

  const summaryCards = [
    {
      label: "Units Today",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      label: "Units This Week",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 5h18" />
          <path d="M3 12h18" />
          <path d="M3 19h18" />
        </svg>
      ),
    },
    {
      label: "Units This Month",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M3 12h18" />
        </svg>
      ),
    },
    {
      label: "Total Shipped",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7h13v10H3z" />
          <path d="M16 10h3l2 2v5h-5z" />
          <circle cx="7.5" cy="18.5" r="1.5" />
          <circle cx="18.5" cy="18.5" r="1.5" />
        </svg>
      ),
    },
    {
      label: "Draft Shipments",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h10l6 6v8a2 2 0 0 1-2 2H4z" />
          <path d="M14 5v6h6" />
        </svg>
      ),
    },
    {
      label: "Active FBA Shipments",
      value: 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 20h8" />
        </svg>
      ),
    },
  ];

  const recentShipments = [
    {
      name: "No shipments yet",
      type: "—",
      status: "—",
      units: 0,
      updated: "—",
    },
  ];

  const statusOverview = [
    { label: "Draft", value: 0 },
    { label: "In Progress", value: 0 },
    { label: "Shipped", value: 0 },
    { label: "Receiving", value: 0 },
  ];

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
                <a
                  href="/dashboard"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Overview
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Sales
              </p>
              <div className="space-y-1">
                <a
                  href="/dashboard/pipeline"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Pipeline
                </a>
                <a
                  href="/dashboard/activity"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
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

                <a
                  href="/dashboard/purchase-orders"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-white"
                >
                  Purchase Orders
                </a>

                <a
                  href="/dashboard/inventory"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-white"
                >
                  Inventory
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin
              </p>
              <div className="space-y-1">
                <a
                  href="/dashboard/team"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Team
                </a>
                <a
                  href="/dashboard/settings"
                  className="block rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </a>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 border-r border-gray-200">
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-5 lg:px-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Track FBA prep activity, shipment flow, and shipped inventory performance.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard/shipments"
                  className="flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#111827]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10.5 12 4l9 6.5" />
                    <path d="M5 10v9h14v-9" />
                    <path d="M9 19v-6h6v6" />
                  </svg>
                  Shipments
                </a>

                <a
                  href="/dashboard/inventory"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </svg>
                  FBA Inventory
                </a>

                <a
                  href="/dashboard/shipments/drafts"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 5h10l6 6v8a2 2 0 0 1-2 2H4z" />
                    <path d="M14 5v6h6" />
                  </svg>
                  Draft Shipments
                </a>

                <a
                  href="/dashboard/shipments/fba"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="14" rx="2" />
                    <path d="M8 20h8" />
                  </svg>
                  FBA Shipments
                </a>

                <a
                  href="/dashboard/shipments/shipped"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7h13v10H3z" />
                    <path d="M16 10h3l2 2v5h-5z" />
                    <circle cx="7.5" cy="18.5" r="1.5" />
                    <circle cx="18.5" cy="18.5" r="1.5" />
                  </svg>
                  Shipped to Amazon
                </a>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.label}</p>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-[#111827]">
                        {card.value}
                      </p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#19c6b4]">
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-[#111827]">Shipment Activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Watch shipment prep and shipping movement over time.
                  </p>
                </div>

                <div className="inline-flex rounded-2xl border border-gray-200 bg-[#f8fafc] p-1">
                  <button
                    onClick={() => setRange("7")}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                      range === "7"
                        ? "bg-white text-[#111827] shadow-sm"
                        : "text-gray-500 hover:text-[#111827]"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setRange("14")}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                      range === "14"
                        ? "bg-white text-[#111827] shadow-sm"
                        : "text-gray-500 hover:text-[#111827]"
                    }`}
                  >
                    14 Days
                  </button>
                  <button
                    onClick={() => setRange("30")}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                      range === "30"
                        ? "bg-white text-[#111827] shadow-sm"
                        : "text-gray-500 hover:text-[#111827]"
                    }`}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc]">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-500">No shipment data yet</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Create your first shipment to see activity here.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-[#111827]">Recent Shipments</h3>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-sm font-medium text-gray-500">
                    0 items
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] text-sm text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Shipment</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Units</th>
                        <th className="px-4 py-3 font-medium">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentShipments.map((shipment, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-4 text-sm text-gray-700">{shipment.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{shipment.type}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{shipment.status}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{shipment.units}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{shipment.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-[#111827]">Shipment Status Overview</h3>
                  <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-medium text-gray-600">
                    Current
                  </span>
                </div>

                <div className="mt-6 space-y-5">
                  {statusOverview.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                        <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-[#e5edf5]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#19c6b4] to-[#3b82f6]"
                          style={{ width: "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}