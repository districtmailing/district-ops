"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItemBase =
  "block rounded-xl px-4 py-3 font-medium transition";

const navItemInactive =
  "text-gray-700 hover:bg-gray-100";

const navItemActive =
  "bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-sm font-extrabold";

function NavItem({
  href,
  label,
  matchPaths = [],
}: {
  href: string;
  label: string;
  matchPaths?: string[];
}) {
  const pathname = usePathname();

  const isActive =
    pathname === href || matchPaths.includes(pathname);

  return (
    <Link
      href={href}
      className={`${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-gray-200 bg-white lg:block">
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
                <NavItem href="/dashboard" label="Overview" />
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Sales
              </p>

              <div className="space-y-1">
                <NavItem href="/dashboard/pipeline" label="Pipeline" />
                <NavItem href="/dashboard/activity" label="Activity" />
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operations
              </p>

              <div className="space-y-1">
                <NavItem
  href="/dashboard/shipment"
  label="Shipments"
  matchPaths={[
    "/dashboard/inventory",
    "/dashboard/drafts",
    "/dashboard/fba",
    "/dashboard/shipped",
  ]}
/>
                <NavItem href="/dashboard/supplier-sheet" label="Supplier Sheet" />
                <NavItem href="/dashboard/purchase-order" label="Purchase Orders" />
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin
              </p>

              <div className="space-y-1">
                <NavItem href="/dashboard/team" label="Team" />
                <NavItem href="/dashboard/settings" label="Settings" />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">{children}</section>
      </div>
    </main>
  );
}