"use client";

export default function PurchaseOrdersPage() {
  return (
  <section className="min-w-0 flex-1 border-r border-gray-200 bg-[#f5f7fb] text-[#111827]">
          <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Review and manage purchase orders by supplier, stage, and buyer.
              </p>
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Search PO name..."
                    className="h-12 w-full min-w-[260px] rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Supplier"
                    className="h-12 w-full min-w-[180px] rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Stage"
                    className="h-12 w-full min-w-[160px] rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="h-12 rounded-xl bg-gradient-to-r from-[#19c6b4] to-[#3b82f6] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  >
                    Search
                  </button>

                  <button
                    className="h-12 rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Reset
                  </button>

                  <button
                    className="h-12 rounded-xl bg-[#3f8a4d] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    + New PO
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1300px] w-full text-left">
                  <thead className="bg-[#f8fafc] text-sm text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-4 font-semibold">No</th>
                      <th className="px-4 py-4 font-semibold">Name</th>
                      <th className="px-4 py-4 font-semibold">Stage</th>
                      <th className="px-4 py-4 font-semibold">Supplier</th>
                      <th className="px-4 py-4 font-semibold">Sheets</th>
                      <th className="px-4 py-4 font-semibold">ASIN Qty</th>
                      <th className="px-4 py-4 font-semibold">UPC's</th>
                      <th className="px-4 py-4 font-semibold">Total Cost</th>
                      <th className="px-4 py-4 font-semibold">Profit($)</th>
                      <th className="px-4 py-4 font-semibold">PM(%)</th>
                      <th className="px-4 py-4 font-semibold">ROI(%)</th>
                      <th className="px-4 py-4 font-semibold">Buyer</th>
                      <th className="px-4 py-4 font-semibold">Created On</th>
                      <th className="px-4 py-4 font-semibold">Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td colSpan={14} className="px-4 py-16 text-center text-sm text-gray-500">
                        No purchase orders yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
     
  );
}