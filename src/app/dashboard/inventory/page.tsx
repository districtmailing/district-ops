"use client";

import { useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  title: string;
  sku: string;
  fnsku: string;
  asin: string;
  upc: string;
  ean: string;
  image: string;
  notes: string;
  location: string;
  drafts: number;
  working: number;
  shipped: number;
  availableQty: number;
};

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    title: "Dr Bronner's Baby Soap Liquid Castile, 8 Fl Oz",
    sku: "UG-EG0E-0X35",
    fnsku: "X0052LOYTB",
    asin: "B00LH3SLAU",
    upc: "018787775080",
    ean: "0018787775080",
    image: "https://m.media-amazon.com/images/I/61f2D0D8QGL._AC_SL1500_.jpg",
    notes: "",
    location: "A-12",
    drafts: 0,
    working: 0,
    shipped: 0,
    availableQty: 212,
  },
  {
    id: "2",
    title: "Yogi Tea, Stomach Ease, 16 Count",
    sku: "NQ-2PKS-ZI7B",
    fnsku: "X0052LOSS3",
    asin: "B00FYD3JFG",
    upc: "076950450677",
    ean: "0076950450677",
    image: "https://m.media-amazon.com/images/I/81A0YpL0r3L._AC_SL1500_.jpg",
    notes: "",
    location: "B-04",
    drafts: 0,
    working: 0,
    shipped: 0,
    availableQty: 145,
  },
  {
    id: "3",
    title: "SYLVANIA 921 Basic Miniature Bulb, Contains 2 Bulbs",
    sku: "MI-0175-9354",
    fnsku: "X0052K852T",
    asin: "B000J2NZHO",
    upc: "046135336095",
    ean: "0046135336095",
    image: "https://m.media-amazon.com/images/I/71mR9L2Yh-L._AC_SL1500_.jpg",
    notes: "",
    location: "C-19",
    drafts: 0,
    working: 0,
    shipped: 0,
    availableQty: 500,
  },
  {
    id: "4",
    title: "SYLVANIA 7506 Basic Miniature Bulb, Contains 2 Bulbs",
    sku: "MI-0175-5512",
    fnsku: "X0052K6KMB",
    asin: "B000J2KPMC",
    upc: "046135336118",
    ean: "0046135336118",
    image: "https://m.media-amazon.com/images/I/71mR9L2Yh-L._AC_SL1500_.jpg",
    notes: "",
    location: "C-20",
    drafts: 0,
    working: 0,
    shipped: 0,
    availableQty: 100,
  },
];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState("Date Added");
const [uploadDraftModalOpen, setUploadDraftModalOpen] = useState(false);
const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();

    let items = [...mockInventory];

    if (term) {
      items = items.filter((item) => {
        const haystack = [
  item.title,
  item.sku,
  item.fnsku,
  item.asin,
  item.location,
]
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      });
    }

       if (sortBy === "SKU (A - Z)") {
      items.sort((a, b) => a.sku.localeCompare(b.sku));
    }

    if (sortBy === "SKU (Z - A)") {
      items.sort((a, b) => b.sku.localeCompare(a.sku));
    }

    if (sortBy === "FNSKU (A - Z)") {
      items.sort((a, b) => a.fnsku.localeCompare(b.fnsku));
    }

    if (sortBy === "FNSKU (Z - A)") {
      items.sort((a, b) => b.fnsku.localeCompare(a.fnsku));
    }

    if (sortBy === "Title (A - Z)") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "Title (Z - A)") {
      items.sort((a, b) => b.title.localeCompare(a.title));
    }

    if (sortBy === "Size tier (Low - High)") {
      items.sort((a, b) => a.availableQty - b.availableQty);
    }

    if (sortBy === "Size tier (High - Low)") {
      items.sort((a, b) => b.availableQty - a.availableQty);
    }

    return items;
  }, [search, sortBy]);

  const selectedCount = selectedIds.length;

const selectedSkuCount = selectedIds.filter((id) =>
  filteredInventory.some((item) => item.id === id)
).length;

const totalSelectedUnits = selectedIds.reduce((sum, id) => {
  return sum + (quantities[id] || 0);
}, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredInventory.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const updateQty = (id: string, value: string, maxQty: number) => {
  const cleaned = value.replace(/[^\d]/g, "");
  const parsed = Number(cleaned);

  if (!cleaned || Number.isNaN(parsed) || parsed <= 0) {
    setQuantities((prev) => ({ ...prev, [id]: 0 }));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    return;
  }

  const finalQty = Math.min(parsed, maxQty);

  setQuantities((prev) => ({
    ...prev,
    [id]: finalQty,
  }));

  setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
};

  const createDraftShipment = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one product.");
      return;
    }

    const hasQty = selectedIds.some((id) => (quantities[id] || 0) > 0);

    if (!hasQty) {
      alert("Please enter quantity for at least one selected product.");
      return;
    }

    alert("Next step: create a draft shipment from selected products.");
  };

 const addProducts = () => {
  alert("Next step: open add product modal or add product page.");
};

const syncInventory = () => {
  alert("Next step: sync inventory with Amazon / internal database.");
};

const printSelectedUnits = () => {
  if (selectedIds.length === 0) {
    alert("Please select at least one product to print.");
    return;
  }

  alert(`Next step: print selected units for ${selectedIds.length} selected SKU(s).`);
};

const openUploadDraftShipment = () => {
  setUploadDraftModalOpen(true);
};

const downloadTemplate = () => {
  alert("Next step: download draft shipment template file.");
};

const uploadShipmentFile = () => {
  alert("Next step: upload shipment file.");
};

  const allVisibleSelected =
    filteredInventory.length > 0 &&
    filteredInventory.every((item) => selectedIds.includes(item.id));
const brandGreen = "#19c6b4";
const brandBlue = "#3b82f6";
const iconStroke = brandGreen;
const iconBlue = brandBlue;

const SyncIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke={iconStroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 16.5a3.5 3.5 0 0 0-1.8-6.5A5.5 5.5 0 0 0 7.6 8.4 4 4 0 0 0 8 16.5" />
    <path d="M12 10v8" />
    <path d="m8.5 14 3.5 4 3.5-4" />
  </svg>
);

const PrintIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={iconBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 9V4h10v5" />
    <path d="M7 17h10v3H7z" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M17 13h.01" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const RowPrintIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={iconBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 9V4h10v5" />
    <path d="M7 17h10v3H7z" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
  </svg>
);

  return (
  <>
    <section className="min-w-0 flex-1 border-r border-gray-200 bg-[#f5f7fb] text-[#111827]">
  <div className="border-b border-gray-200 bg-white">
    <div className="px-6 py-5 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">FBA Inventory</h2>
<p className="mt-0.5 text-sm text-gray-500">
  Select products, enter quantities, and create draft FBA shipments.
</p>
        </div>

        <div />
      </div>
    </div>

    <div className="border-t border-gray-200 px-6 py-3 lg:px-8">
  <div className="flex flex-wrap items-center gap-3">
    <a
      href="/dashboard/shipments"
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
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 10v9h14v-9" />
        <path d="M9 19v-6h6v6" />
      </svg>
      Shipments
    </a>

    <a
      href="/dashboard/inventory"
      className="flex items-center gap-2 rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-semibold text-[#111827]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h10l6 6v8a2 2 0 0 1-2 2H4z" />
        <path d="M14 5v6h6" />
      </svg>
      Draft Shipments
    </a>

    <a
      href="/dashboard/shipments/fba"
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8" />
      </svg>
      FBA Shipments
    </a>

    <a
      href="/dashboard/shipments/shipped"
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="relative flex flex-wrap items-center gap-3">
  <div
    className="relative"
    onMouseEnter={() => setHoveredAction("sync")}
    onMouseLeave={() => setHoveredAction(null)}
  >
    <button
      onClick={syncInventory}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#458550] bg-white transition hover:bg-[#f3fbf5]"
    >
      <SyncIcon />
    </button>

    {hoveredAction === "sync" && (
      <div className="absolute left-0 top-[58px] z-20 whitespace-nowrap rounded-lg bg-[#2f2f2f] px-4 py-2 text-sm font-medium text-white shadow-lg">
        Synchronize inventory data
      </div>
    )}
  </div>

  <div className="flex h-12 min-w-[56px] items-center justify-center rounded-xl border border-gray-300 bg-[#f8fafc] px-4 text-lg font-semibold text-gray-700">
    {selectedSkuCount}
  </div>

  <div
    className="relative"
    onMouseEnter={() => setHoveredAction("print")}
    onMouseLeave={() => setHoveredAction(null)}
  >
    <button
      onClick={printSelectedUnits}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2f80ed] bg-white transition hover:bg-[#f4f9ff]"
    >
      <PrintIcon />
    </button>

    {hoveredAction === "print" && (
      <div className="absolute left-0 top-[58px] z-20 whitespace-nowrap rounded-lg bg-[#2f2f2f] px-4 py-2 text-sm font-medium text-white shadow-lg">
        Print {selectedSkuCount} selected FNSKU labels
      </div>
    )}
  </div>

  <div
    className="relative"
    onMouseEnter={() => setHoveredAction("upload")}
    onMouseLeave={() => setHoveredAction(null)}
  >
    <button
      onClick={openUploadDraftShipment}
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] shadow-sm transition hover:opacity-95"
    >
      <UploadIcon />
    </button>

    {hoveredAction === "upload" && (
      <div className="absolute left-0 top-[58px] z-20 whitespace-nowrap rounded-lg bg-[#2f2f2f] px-4 py-2 text-sm font-medium text-white shadow-lg">
        Upload draft shipment
      </div>
    )}
  </div>

  <button
    onClick={createDraftShipment}
    className="flex h-12 items-center rounded-xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] px-5 text-sm font-semibold text-white shadow-sm"
  >
    <FolderIcon />
    Create Draft FBA Shipment
  </button>
</div>

    <div className="flex flex-wrap items-center gap-4">
      

      <button
        onClick={addProducts}
        className="h-12 rounded-xl bg-[#3f8a4d] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
      >
        + ADD PRODUCTS
      </button>
    </div>
  </div>
</div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1080px] w-full text-left">
                  <thead className="bg-[#f8fafc] text-sm text-gray-600">
  <tr className="border-b border-gray-200 bg-white">
    <th colSpan={8} className="px-4 py-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="font-medium">Total Units:</span>
    <span className="rounded-lg border border-gray-300 bg-[#f8fafc] px-3 py-2 font-semibold text-[#111827]">
      {totalSelectedUnits}
    </span>
  </div>

  <div className="flex items-center gap-2">
    <span className="font-medium text-gray-600">Sort By:</span>
    <select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
>
  <option>Date Added</option>
  <option>SKU (A - Z)</option>
  <option>SKU (Z - A)</option>
  <option>FNSKU (A - Z)</option>
  <option>FNSKU (Z - A)</option>
  <option>Title (A - Z)</option>
  <option>Title (Z - A)</option>
  <option>Size tier (Low - High)</option>
  <option>Size tier (High - Low)</option>
</select>
  </div>
</div>
    </th>
  </tr>

  <tr className="border-b border-gray-200">
    <th className="px-4 py-4">
      <input
        type="checkbox"
        checked={allVisibleSelected}
        onChange={toggleSelectAllVisible}
        className="h-5 w-5 rounded border-gray-300"
      />
    </th>
    <th className="px-4 py-4 font-semibold">Qty</th>
    <th className="px-4 py-4 font-semibold">
      <div className="space-y-2">
        <p>Title / SKU / FNSKU / ASIN / UPC / EAN</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder=""
          className="h-11 w-full max-w-[260px] rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
        />
      </div>
    </th>
    <th className="px-4 py-4 font-semibold">Notes</th>
    <th className="px-4 py-4 font-semibold">Location</th>
    <th className="px-4 py-4 font-semibold text-center">Drafts</th>
    <th className="px-4 py-4 font-semibold text-center">Working</th>
    <th className="px-4 py-4 font-semibold text-center">Shipped</th>
  </tr>
</thead>

                  <tbody>
                    {filteredInventory.map((item) => {
                      const selected = selectedIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 last:border-b-0 hover:bg-[#fafcff]"
                        >
                          <td className="px-4 py-5 align-top">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelect(item.id)}
                              className="mt-3 h-5 w-5 rounded border-gray-300"
                            />
                          </td>

                          <td className="px-4 py-5 align-top">
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
  <input
    type="text"
    inputMode="numeric"
    value={quantities[item.id] ? String(quantities[item.id]) : ""}
    onChange={(e) => updateQty(item.id, e.target.value, item.availableQty)}
    placeholder="0"
    className="h-10 w-10 rounded-lg border border-gray-300 bg-white px-1 text-center text-sm text-gray-700 outline-none"
  />

  <button
    type="button"
    onClick={() => alert(`Next step: print label for ${item.fnsku}`)}
    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3b82f6] bg-white transition hover:bg-[#f4f9ff]"
    title={`Print ${item.fnsku}`}
  >
    <RowPrintIcon />
  </button>
</div>

    <p className="text-xs text-gray-400">
      Avail: {item.availableQty}
    </p>
  </div>
</td>

                          <td className="px-4 py-5 align-top">
                            <div className="flex min-w-[360px] gap-4">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-16 w-16 rounded-lg border border-gray-200 object-contain bg-white"
                              />

                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-5 text-[#1f4f82]">
  {item.title}
</p>

                                <p className="mt-1 text-sm text-gray-600">
                                  SKU: <span className="font-medium">{item.sku}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  FNSKU: <span className="font-medium">{item.fnsku}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  ASIN: <span className="font-medium">{item.asin}</span>
                                </p>
                            
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-5 align-top text-sm text-gray-600">
                            {item.notes || "—"}
                          </td>

                          <td className="px-4 py-5 align-top text-sm text-gray-600">
                            {item.location || "—"}
                          </td>

                          <td className="px-4 py-5 align-top text-center text-sm font-medium text-gray-700">
                            {item.drafts}
                          </td>

                          <td className="px-4 py-5 align-top text-center text-sm font-medium text-gray-700">
                            {item.working}
                          </td>

                          <td className="px-4 py-5 align-top text-center text-sm font-medium text-gray-700">
                            {item.shipped}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
               </section>
      

      {uploadDraftModalOpen && (
        <div
          onClick={() => setUploadDraftModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Upload Draft Shipment
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a shipment file or download the template first.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setUploadDraftModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-500 hover:bg-gray-50"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Download Template
              </button>

              <button
                type="button"
                onClick={uploadShipmentFile}
                className="rounded-2xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] px-5 py-4 text-sm font-semibold text-white shadow-sm"
              >
                Upload Shipment File
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}