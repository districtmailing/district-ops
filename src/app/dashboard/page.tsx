export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-72 border-r border-gray-200 bg-white lg:block">
          <div className="px-6 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold tracking-tight">District</h1>
            <p className="text-sm text-gray-500">Internal Hub</p>
          </div>

          <div className="px-4 py-6 space-y-6">

            {/* DASHBOARD */}
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Dashboard
              </p>

              <div className="rounded-2xl bg-[#eef6ff] p-2">
                <div className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 font-semibold text-white shadow-sm">
                  Overview
                </div>
              </div>
            </div>

            {/* SALES */}
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Sales
              </p>

              <div className="space-y-1">
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Pipeline
                </div>
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Activity
                </div>
              </div>
            </div>

            {/* OPERATIONS */}
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operations
              </p>

              <div className="space-y-1">
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Purchase Orders
                </div>
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Inventory
                </div>
              </div>
            </div>

            {/* ADMIN */}
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin
              </p>

              <div className="space-y-1">
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Team
                </div>
                <div className="rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100">
                  Settings
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1">
          {/* TOP BAR */}
          <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back. Here’s what’s happening today.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:border-teal-400 sm:w-72"
                />
                <div className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700">
                  Dalin Marinos
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD BODY */}
          <div className="px-6 py-6 lg:px-8">

            {/* TOP CARDS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Calls Today</p>
                <p className="mt-3 text-3xl font-bold">18</p>
                <p className="mt-2 text-sm text-teal-600">+4 from yesterday</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Follow-Ups Due</p>
                <p className="mt-3 text-3xl font-bold">11</p>
                <p className="mt-2 text-sm text-amber-600">3 overdue</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Open Purchase Orders</p>
                <p className="mt-3 text-3xl font-bold">4</p>
                <p className="mt-2 text-sm text-gray-500">2 arriving this week</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="mt-3 text-3xl font-bold">9</p>
                <p className="mt-2 text-sm text-red-500">Needs review</p>
              </div>
            </div>

            {/* MAIN GRID */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">

              {/* RECENT ACTIVITY */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Recent Activity</h3>
                  <button className="text-sm font-medium text-teal-600 hover:underline">
                    View All
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">Called Cedar Bear</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Follow-up scheduled for Thursday at 2:00 PM
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">Billy logged 5 new call attempts</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Activity updated across current pipeline
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">New PO created for Nordic Naturals</p>
                    <p className="mt-1 text-sm text-gray-500">
                      PO-1048 submitted and waiting on receiving
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">Inventory alert triggered for ResMed F20</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Suggested restock review based on recent velocity
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">Top Reps Today</h3>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="font-medium">Dalin</span>
                      <span className="font-semibold text-teal-600">22 calls</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="font-medium">Billy</span>
                      <span className="font-semibold text-teal-600">17 calls</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="font-medium">Jon</span>
                      <span className="font-semibold text-teal-600">13 calls</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold">Today’s Focus</h3>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl bg-[#eef6ff] px-4 py-3 text-sm text-gray-700">
                      Follow up with 11 active leads
                    </div>
                    <div className="rounded-xl bg-[#eef6ff] px-4 py-3 text-sm text-gray-700">
                      Review 4 open purchase orders
                    </div>
                    <div className="rounded-xl bg-[#eef6ff] px-4 py-3 text-sm text-gray-700">
                      Check 9 low stock items
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER GRID */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Purchase Orders</h3>
                  <button className="text-sm font-medium text-teal-600 hover:underline">
                    View All
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">PO-1048 · Nordic Naturals</p>
                    <p className="mt-1 text-sm text-gray-500">$8,420 · Awaiting receiving</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">PO-1049 · ResMed</p>
                    <p className="mt-1 text-sm text-gray-500">$12,770 · In transit</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">PO-1050 · Thorne</p>
                    <p className="mt-1 text-sm text-gray-500">$5,980 · Pending confirmation</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Inventory Watchlist</h3>
                  <button className="text-sm font-medium text-teal-600 hover:underline">
                    Review
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">ResMed AirTouch F20 Cushion</p>
                    <p className="mt-1 text-sm text-gray-500">12 days of stock left</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">Good Day Chocolate Sleep</p>
                    <p className="mt-1 text-sm text-gray-500">Restock suggested this week</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium">Boveda 62% Packs</p>
                    <p className="mt-1 text-sm text-gray-500">Velocity increased 18% this month</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
