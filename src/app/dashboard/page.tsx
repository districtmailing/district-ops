"use client";

import { useState } from "react";

const summaryCards = [
  {
    label: "Today's Revenue",
    value: "$0",
    subtext: "0 orders • 0 units",
    iconBg: "bg-[#e8fbf7]",
    iconText: "text-[#19c6b4]",
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
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "30-Day Revenue",
    value: "$0",
    subtext: "0 orders",
    iconBg: "bg-[#eafaf3]",
    iconText: "text-[#10b981]",
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
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    ),
  },
  {
    label: "30-Day Units",
    value: "0",
    subtext: "units sold",
    iconBg: "bg-[#ebf3ff]",
    iconText: "text-[#3b82f6]",
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
        <path d="M12 2 20 6.5v11L12 22l-8-4.5v-11L12 2Z" />
        <path d="M12 22V12" />
        <path d="M20 6.5 12 12 4 6.5" />
      </svg>
    ),
  },
  {
    label: "30-Day Orders",
    value: "0",
    subtext: "total orders",
    iconBg: "bg-[#f3ebff]",
    iconText: "text-[#7c3aed]",
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
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H7" />
      </svg>
    ),
  },
  {
    label: "30-Day Refunds",
    value: "$0",
    subtext: "0 refunds",
    valueClass: "text-[#ef4444]",
    iconBg: "bg-[#ffeded]",
    iconText: "text-[#ef4444]",
    icon: (
  <svg
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Dollar */}
    <path d="M12 2v20" />
    <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />

    {/* Slash */}
    <path d="M4 4l16 16" />
  </svg>
),
  },
  {
    label: "30-Day Net",
    value: "$0",
    subtext: "after refunds",
    iconBg: "bg-[#eafaf3]",
    iconText: "text-[#10b981]",
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
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    ),
  },
];

const RANGE_OPTIONS = [
  "Last 7 Days",
  "Last 14 Days",
  "Last 30 Days",
  "Quarterly",
  "Yearly",
  "Custom Range",
];

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState("Last 30 Days");
  const [rangeOpen, setRangeOpen] = useState(false);

  return (
    <section className="flex-1 bg-[#f6f8fb]">
      {/* TOP BAR - KEEP THIS STYLE */}
      <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
              Sales Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here’s what’s happening currently.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setRangeOpen((prev) => !prev)}
              className="flex min-w-[220px] items-center justify-between rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <span>{selectedRange}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-500 transition ${
                  rangeOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            

            {rangeOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[220px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                {RANGE_OPTIONS.map((option) => {
                  const isActive = selectedRange === option;

                  return (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedRange(option);
                        setRangeOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? "bg-teal-400 text-[#111827] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-4">
                        {isActive && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      

      {/* DASHBOARD BODY */}
      <div className="px-6 py-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
  {summaryCards.map((card) => (
    <div
      key={card.label}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 whitespace-nowrap">
  {card.label}
</p>

          <p
            className={`mt-3 text-4xl font-bold tracking-tight ${
              card.valueClass || "text-[#111827]"
            }`}
          >
            {card.value}
          </p>

          <p className="mt-2 text-sm text-gray-500 whitespace-nowrap">
  {card.subtext}
</p>
        </div>

        <div
  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconText} mt-6 ml-2`}
>
  {card.icon}
</div>
      </div>
    </div>
  ))}
</div>



<div className="mt-6 grid gap-6 xl:grid-cols-2">
  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="text-2xl font-semibold text-[#111827]">Revenue Trend</h3>

    <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc]">
      <div className="text-center">
        <p className="text-2xl font-semibold text-gray-500">
          No sales data available for this period
        </p>
      </div>
    </div>
  </div>

  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="text-2xl font-semibold text-[#111827]">Units Sold</h3>

    <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc]">
      <div className="text-center">
        <p className="text-2xl font-semibold text-gray-500">
          No units data available for this period
        </p>
      </div>
    </div>
  </div>
</div>

        {/* ACTIVITY FEED */}
        <div className="mt-10">
          <h3 className="text-3xl font-semibold text-[#111827]">
            Activity Feed
          </h3>

          <div className="mt-6 min-h-[160px] rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-[100px] items-center justify-center">
              <p className="text-lg text-gray-400">
                Recent PO and shipment activity will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}