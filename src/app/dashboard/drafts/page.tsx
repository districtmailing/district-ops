"use client";

import { useMemo, useState } from "react";

type DraftShipment = {
  id: string;
  name: string;
  from: string;
  partneredCarrier: boolean;
  type: "SPD" | "LTL/FTL";
  skus: number;
  units: number;
  created: string;
  stage: "Drafts" | "Created To Shipment" | "Deleted";
};

const mockDraftShipments: DraftShipment[] = [
  {
    id: "1",
    name: "JON-BILLY-MARQUES-MD/BOVEDA-04/08/26",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "LTL/FTL",
    skus: 6,
    units: 1020,
    created: "08 Apr 2026, 16:07:58",
    stage: "Drafts",
  },
  {
    id: "2",
    name: "TEST-MIX",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "LTL/FTL",
    skus: 53,
    units: 4567,
    created: "08 Apr 2026, 15:42:50",
    stage: "Drafts",
  },
  {
    id: "3",
    name: "SLEEPHAP-JON-BILLY",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "LTL/FTL",
    skus: 7,
    units: 590,
    created: "01 Apr 2026, 16:10:04",
    stage: "Drafts",
  },
  {
    id: "4",
    name: "FBA STA (03/13/2026 15:39)-MIT2 - COPY",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "LTL/FTL",
    skus: 19,
    units: 132,
    created: "13 Mar 2026, 09:45:04",
    stage: "Drafts",
  },
  {
    id: "5",
    name: "JON-SKUDRAFT03/09/26",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "LTL/FTL",
    skus: 17,
    units: 1405,
    created: "09 Mar 2026, 12:14:35",
    stage: "Drafts",
  },
  {
    id: "6",
    name: "OLD-DRAFT-TEST",
    from: "DISTRICT MAILING",
    partneredCarrier: false,
    type: "SPD",
    skus: 4,
    units: 220,
    created: "02 Mar 2026, 08:11:20",
    stage: "Deleted",
  },
  {
    id: "7",
    name: "MOVED-TO-SHIPMENT-01",
    from: "DISTRICT MAILING",
    partneredCarrier: true,
    type: "SPD",
    skus: 11,
    units: 840,
    created: "28 Mar 2026, 14:20:51",
    stage: "Created To Shipment",
  },
];

type StageFilter = "Drafts" | "Created To Shipment" | "Deleted";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

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

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <rect x="5" y="5" width="10" height="10" rx="2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function DraftShipmentsPage() {
  const [stageFilter, setStageFilter] = useState<StageFilter>("Drafts");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredDrafts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return mockDraftShipments.filter((shipment) => {
      const stageMatch = shipment.stage === stageFilter;
      const searchMatch =
        !term ||
        [
          shipment.name,
          shipment.from,
          shipment.type,
          shipment.created,
          String(shipment.skus),
          String(shipment.units),
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return stageMatch && searchMatch;
    });
  }, [stageFilter, search]);

  const allVisibleSelected =
    filteredDrafts.length > 0 &&
    filteredDrafts.every((shipment) => selectedIds.includes(shipment.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredDrafts.map((shipment) => shipment.id);

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleMerge = () => {
    if (selectedIds.length < 2) {
      alert("Select at least 2 draft shipments to merge.");
      return;
    }

    alert(`Next step: merge ${selectedIds.length} draft shipments.`);
  };

  return (
  <section className="min-w-0 flex-1 border-r border-gray-200 bg-[#f5f7fb] text-[#111827]">
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-5 lg:px-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Draft Shipments</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Review, organize, merge, and prepare shipment drafts before sending them into FBA workflow.
                </p>
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
                  className="flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#111827]"
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
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <TruckIcon />
                  Shipped to Amazon
                </a>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-6">
                  {(["Drafts", "Created To Shipment", "Deleted"] as StageFilter[]).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        setStageFilter(stage);
                        setSelectedIds([]);
                      }}
                      className="flex items-center gap-3 text-sm font-medium text-gray-700"
                    >
                      <span
                        className={`h-5 w-5 rounded-full border-2 ${
                          stageFilter === stage
                            ? "border-[#d6973f]"
                            : "border-gray-300"
                        }`}
                      />
                      {stage}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleMerge}
                  className="h-12 rounded-xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  Merge Draft Shipments
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-[#f8fafc] px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-[#111827]">{filteredDrafts.length}</span> shipment{filteredDrafts.length === 1 ? "" : "s"}
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search draft name, from, type, date, skus, units..."
                    className="h-11 w-full max-w-md rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-left">
                  <thead className="bg-[#f8fafc] text-sm text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          className="h-5 w-5 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-4 font-semibold">Draft Name</th>
                      <th className="px-4 py-4 font-semibold">From</th>
                      <th className="px-4 py-4 font-semibold text-center">Partnered Carrier</th>
                      <th className="px-4 py-4 font-semibold text-center">Type</th>
                      <th className="px-4 py-4 font-semibold text-center">SKUs</th>
                      <th className="px-4 py-4 font-semibold text-center">Units</th>
                      <th className="px-4 py-4 font-semibold">Created</th>
                      <th className="px-4 py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDrafts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                          No draft shipments found for this view.
                        </td>
                      </tr>
                    ) : (
                      filteredDrafts.map((shipment) => {
                        const selected = selectedIds.includes(shipment.id);

                        return (
                          <tr
                            key={shipment.id}
                            className="border-b border-gray-200 last:border-b-0 hover:bg-[#fafcff]"
                          >
                            <td className="px-4 py-5 align-middle">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelect(shipment.id)}
                                className="h-5 w-5 rounded border-gray-300"
                              />
                            </td>

                            <td className="px-4 py-5 align-middle">
                              <div className="min-w-[220px]">
                                <p className="font-semibold leading-6 text-[#1f3b5b]">
                                  {shipment.name}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-5 align-middle text-sm text-gray-700">
                              {shipment.from}
                            </td>

                            <td className="px-4 py-5 align-middle text-center">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold ${
                                  shipment.partneredCarrier
                                    ? "bg-[#d6973f] text-white"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {shipment.partneredCarrier ? "✓" : "—"}
                              </span>
                            </td>

                            <td className="px-4 py-5 align-middle text-center">
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

                            <td className="px-4 py-5 align-middle text-center text-sm font-medium text-gray-700">
                              {formatNumber(shipment.skus)}
                            </td>

                            <td className="px-4 py-5 align-middle text-center text-sm font-medium text-gray-700">
                              {formatNumber(shipment.units)}
                            </td>

                            <td className="px-4 py-5 align-middle text-sm text-gray-500">
                              {shipment.created}
                            </td>

                            <td className="px-4 py-5 align-middle">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-[#d6973f] transition hover:bg-gray-50"
                                  title="Open"
                                  onClick={() => alert(`Open ${shipment.name}`)}
                                >
                                  <DraftIcon />
                                </button>

                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-[#3b82f6] transition hover:bg-gray-50"
                                  title="Duplicate"
                                  onClick={() => alert(`Duplicate ${shipment.name}`)}
                                >
                                  <DuplicateIcon />
                                </button>

                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-[#d6973f] transition hover:bg-gray-50"
                                  title="Download"
                                  onClick={() => alert(`Download ${shipment.name}`)}
                                >
                                  <DownloadIcon />
                                </button>

                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-[#ef4444] transition hover:bg-gray-50"
                                  title="Delete"
                                  onClick={() => alert(`Delete ${shipment.name}`)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
     
  );
}