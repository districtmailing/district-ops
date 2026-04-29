"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

const activeTabStyle =
  "#4ade80"; // light blue test

// other options to test:
// "bg-[#1d4ed8] text-white"   // dark blue test
// "bg-[#16a34a] text-white.    #2F80ED - blue in seller    #67C23A green in comp"   // green test

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  matchPaths?: string[];
};

function NavItem({
  href,
  label,
  icon,
  collapsed,
  matchPaths = [],
}: NavItemProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  

  const isActive = pathname === href || matchPaths.includes(pathname);

  

  return (
   <Link
  href={href}
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.right + 16,
      y: rect.top + rect.height / 2,
    });
    setHovered(true);
  }}
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.right + 16,
      y: rect.top + rect.height / 2,
    });
  }}
  onMouseLeave={() => setHovered(false)}
  className={`relative w-full rounded-2xl transition-all duration-200 ${
    collapsed
      ? "flex items-center justify-center px-3 py-3"
      : "flex items-center gap-3 px-4 py-3"
  } ${
    isActive
      ? "text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-100"
  }`}
  style={isActive ? { backgroundColor: activeTabStyle } : undefined}
>
      <span
        className={`shrink-0 ${
          isActive ? "text-white" : "text-gray-500"
        }`}
      >
        {icon}
      </span>

      {!collapsed && (
        <span className={`truncate text-[15px] ${isActive ? "font-black" : "font-semibold"}`}>
          {label}
        </span>
      )}

      {collapsed &&
  hovered &&
  typeof document !== "undefined" &&
  createPortal(
    <div
      className="pointer-events-none fixed z-[2147483647] -translate-y-1/2"
      style={{
        left: `${tooltipPos.x}px`,
        top: `${tooltipPos.y}px`,
      }}
    >
      <div className="whitespace-nowrap rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg">
        {label}
      </div>
    </div>,
    document.body
  )}
    </Link>
  );
}

function SectionLabel({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) return <div className="h-3" />;

  return (
    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
      {children}
    </p>
  );
}

function SellerCompLogoFull() {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 64 64"
        className="h-12 w-12 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 18H20L24 38C24.6 40.6 26.9 42.5 29.6 42.5H45.5C48 42.5 50.2 40.8 50.8 38.4L55 22H23.5"
          stroke="#67C23A"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="31" cy="50" r="3.8" fill="#67C23A" />
        <circle cx="46" cy="50" r="3.8" fill="#67C23A" />
        <rect x="30" y="29" width="5" height="9" rx="1" fill="#F4C430" />
        <rect x="38" y="25" width="5" height="13" rx="1" fill="#41C7D9" />
        <rect x="46" y="21" width="5" height="17" rx="1" fill="#2F80ED" />
        <path
          d="M26 35L38 23L43 28L56 15"
          stroke="#F59E0B"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52 15H56V19"
          stroke="#F59E0B"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="leading-none">
        <div className="text-[26px] font-extrabold tracking-tight leading-none">
  <span style={{ color: "#2F80ED" }}>Seller</span>
  <span style={{ color: "#67C23A" }}>Comp</span>
</div>
      </div>
    </div>
  );
}

function SellerCompLogoMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 18H20L24 38C24.6 40.6 26.9 42.5 29.6 42.5H45.5C48 42.5 50.2 40.8 50.8 38.4L55 22H23.5"
        stroke="#67C23A"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="50" r="3.8" fill="#67C23A" />
      <circle cx="46" cy="50" r="3.8" fill="#67C23A" />
      <rect x="30" y="29" width="5" height="9" rx="1" fill="#F4C430" />
      <rect x="38" y="25" width="5" height="13" rx="1" fill="#41C7D9" />
      <rect x="46" y="21" width="5" height="17" rx="1" fill="#2F80ED" />
      <path
        d="M26 35L38 23L43 28L56 15"
        stroke="#F59E0B"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 15H56V19"
        stroke="#F59E0B"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
const searchableItems = [
  { id: 1, title: "AirFit F20 Cushion Medium", sku: "F20-MED", asin: "B0GNM98QGQ", upc: "123456789001" },
  { id: 2, title: "AirFit F20 Cushion Large", sku: "F20-LRG", asin: "B0GNMVL917", upc: "123456789002" },
  { id: 3, title: "AirFit F20 Frame", sku: "F20-FRAME", asin: "B0GDZLFB6G", upc: "123456789003" },
  { id: 4, title: "Purchase Order 1001", sku: "PO-1001", asin: "", upc: "" },
  { id: 5, title: "Supplier Sheet - ResMed", sku: "SUP-RESMED", asin: "", upc: "" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  getUser();
}, []);
  const [searchOpen, setSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [helpHovered, setHelpHovered] = useState(false);
const [helpTooltipPos, setHelpTooltipPos] = useState({ x: 0, y: 0 });
const [logoutHovered, setLogoutHovered] = useState(false);
const [logoutTooltipPos, setLogoutTooltipPos] = useState({ x: 0, y: 0 });
const pathname = usePathname();
const handleLogout = async () => {
  await supabase.auth.signOut();
  window.localStorage.clear();
  window.location.href = "/";
};

const filteredItems = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  if (q.length < 2) return [];

  return searchableItems.filter((item) =>
    [item.title, item.sku, item.asin, item.upc]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q))
  );
}, [searchQuery]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div
  className="flex min-h-screen w-full"
  style={
    {
      "--sidebar-width": collapsed ? "88px" : "280px",
    } as React.CSSProperties
  }
>
        <aside
  className={`sticky top-0 h-screen flex flex-col overflow-visible border-r border-gray-200 bg-white transition-all duration-300 ${
    collapsed ? "w-[88px]" : "w-[280px]"
  }`}
>
          <div className="relative flex items-center justify-between px-6 py-4">
            {!collapsed ? (
  <div className="flex items-center">
    <SellerCompLogoFull />
  </div>
) : (
  <div className="mx-auto flex items-center justify-center">
    <SellerCompLogoMark />
  </div>
)}

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                aria-label="Collapse sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </div>

          {collapsed && (
            <div className="flex justify-center border-b border-gray-200 px-3 py-4">
              <button
                onClick={() => setCollapsed(false)}
                className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                aria-label="Expand sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          <div className={`flex-1 space-y-6 overflow-y-auto overflow-x-visible py-6 ${collapsed ? "px-3" : "px-4"}`}>
            <div>
              <SectionLabel collapsed={collapsed}>Dashboard</SectionLabel>
              <div className="space-y-1">
                <NavItem
                  href="/dashboard"
                  label="Overview"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>}
                />
              </div>
            </div>

            <div>
              <SectionLabel collapsed={collapsed}>Sales</SectionLabel>
              <div className="space-y-1">
                <NavItem
                  href="/dashboard/pipeline"
                  label="Pipeline"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16" /><path d="M7 16V8" /><path d="M12 16V5" /><path d="M17 16v-4" /></svg>}
                />
                <NavItem
                  href="/dashboard/activity"
                  label="Activity"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                />
              </div>
            </div>

            <div>
              <SectionLabel collapsed={collapsed}>Operations</SectionLabel>
              <div className="space-y-1">
                <NavItem
                  href="/dashboard/shipment"
                  label="Shipments"
                  collapsed={collapsed}
                  matchPaths={[
                    "/dashboard/inventory",
                    "/dashboard/drafts",
                    "/dashboard/fba",
                    "/dashboard/shipped",
                  ]}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
                />
                <NavItem
  href="/dashboard/supplier-sheet"
  label="Supplier Sheet"
  collapsed={collapsed}
  matchPaths={
    pathname.startsWith("/dashboard/supplier-sheet/")
      ? [pathname]
      : []
  }
  icon={
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <path d="M8 9h2" />
    </svg>
  }
/>
                <NavItem
                  href="/dashboard/purchase-order"
                  label="Purchase Orders"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
                />
              </div>
            </div>

            <div>
              <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
              <div className="space-y-1">
                <NavItem
                  href="/dashboard/team"
                  label="Team"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                />
                <NavItem
                  href="/dashboard/settings"
                  label="Settings"
                  collapsed={collapsed}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}
                />
              </div>
            </div>
          </div>

          <div className={`border-t border-gray-200 p-4 ${collapsed ? "flex justify-center" : ""}`}>
            <button
  onClick={handleLogout}
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLogoutTooltipPos({
      x: rect.right + 16,
      y: rect.top + rect.height / 2,
    });
    setLogoutHovered(true);
  }}
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLogoutTooltipPos({
      x: rect.right + 16,
      y: rect.top + rect.height / 2,
    });
  }}
  onMouseLeave={() => setLogoutHovered(false)}
  className={`relative flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600 ${
  collapsed ? "justify-center" : "w-full"
}`}
>
              <span className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              {!collapsed && <span className="font-semibold">Logout</span>}
              {collapsed &&
  logoutHovered &&
  typeof document !== "undefined" &&
  createPortal(
    <div
      className="pointer-events-none fixed z-[2147483647] -translate-y-1/2"
      style={{
        left: `${logoutTooltipPos.x}px`,
        top: `${logoutTooltipPos.y}px`,
      }}
    >
      <div className="whitespace-nowrap rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg">
        Logout
      </div>
    </div>,
    document.body
  )}
            </button>
          </div>
        </aside>
        

        <div className="flex min-w-0 flex-1 flex-col">
         <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
  <div className="relative flex items-center justify-between px-8 py-4">
 
  {/* Left help button */}
<div
  className="relative flex w-[60px] shrink-0 items-center justify-center"
  style={{ marginLeft: "40px" }}
>
  <button
    type="button"
    onMouseEnter={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHelpTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom - 1,
      });
      setHelpHovered(true);
    }}
    onMouseMove={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHelpTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom - 1,
      });
    }}
    onMouseLeave={() => setHelpHovered(false)}
    className="flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
  >
    <img
      src="/yes.png"
      alt="Help Center"
      className="pointer-events-none h-12 w-12 object-contain"
    />
  </button>

  {helpHovered && (
    <div
      className="pointer-events-none fixed z-[2147483647] -translate-x-1/2"
      style={{
        left: `${helpTooltipPos.x}px`,
        top: `${helpTooltipPos.y}px`,
      }}
    >
      <div className="whitespace-nowrap rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg">
        Help Center
      </div>
    </div>
  )}
</div>

  {/* Search bar centered */}
<div className="flex flex-1 justify-center px-6">
  <div className="flex w-full max-w-[620px] items-center gap-2">
  {/* Icon OUTSIDE */}
  <span className="text-gray-400 translate-y-[2px] -ml-[5px]">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  </span>

  {/* Input */}
  <div className="flex-1">
    <input
      type="text"
      placeholder="Search by ASIN, UPC, title, or SKU..."
      onFocus={() => setSearchOpen(true)}
      onClick={() => setSearchOpen(true)}
      readOnly
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:border-teal-400 cursor-text"
    />
  </div>
</div>
</div>


    {/* Right side */}
<div className="ml-auto flex items-center gap-4">
  <div className="flex items-center gap-3">
    <div
  style={{
  background: "linear-gradient(135deg, #22d3ee, #25d0c7, #2f80ed)",
  width: "42px",
  height: "42px",
  minWidth: "42px",
  minHeight: "42px",
}}
  className="flex shrink-0 items-center justify-center rounded-full text-[20px] font-bold text-white shadow-md"
>
 {user?.email === "district.mailing@gmail.com"
  ? "DM"
  : (
      (user?.user_metadata?.first_name?.[0] || "") +
      (user?.user_metadata?.last_name?.[0] || "")
    ).toUpperCase() || "U"}
</div>

    <span className="text-[16px] font-semibold text-black">
  {user?.email === "district.mailing@gmail.com"
    ? "Dalin Marinos"
    : user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : "User"}
</span>

    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-gray-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </div>
</div>

  </div>
</header>


             {searchOpen && (
  <div
    onClick={() => {
      setSearchOpen(false);
      setSearchQuery("");
    }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  className="mx-auto bg-white p-8 shadow-2xl overflow-hidden"
  style={{
    width: "820px",
    maxWidth: "calc(100vw - 48px)",
    minHeight: "520px",
    borderRadius: "36px",
  }}
>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center text-[#111827]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <h3 className="text-3xl font-bold tracking-tight text-[#111827]">
            Search Products
          </h3>
        </div>

        <button
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
          className="text-4xl leading-none text-gray-400 transition hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {/* Search input */}
      <div className="mt-6">
        <div className="relative">
         
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ASIN, UPC, title, or SKU..."
            className="h-[72px] w-full rounded-[24px] border border-gray-300 bg-[#f8f8f8] px-6 text-[18px] text-[#111827] outline-none placeholder:text-gray-400 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Body */}
      <div className="mt-8 flex min-h-[280px] flex-col">
        {searchQuery.trim().length < 2 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[18px] font-medium text-gray-700">
              Enter at least 2 characters to search
            </p>

            <p className="mt-3 text-[15px] text-gray-500">
              Search by ASIN, UPC, product title, or SKU
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[18px] font-medium text-gray-700">
              No matching items found
            </p>

            <p className="mt-3 text-[15px] text-gray-500">
              Try a different ASIN, UPC, title, or SKU
            </p>
          </div>
        ) : (
          <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-gray-200">
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-start justify-between bg-white px-5 py-4 text-left transition hover:bg-gray-50"
                >
                  <div>
                    <div className="text-[17px] font-semibold text-[#111827]">
                      {item.title}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-[14px] text-gray-500">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      {item.asin && <span>ASIN: {item.asin}</span>}
                      {item.upc && <span>UPC: {item.upc}</span>}
                    </div>
                  </div>

                  <span className="ml-6 text-sm font-medium text-gray-700">
                    Open
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
          <section className="min-w-0 flex-1">{children}</section>
        </div>
      </div>
    </main>
  );
}