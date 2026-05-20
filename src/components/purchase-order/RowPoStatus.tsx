"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState } from "react";
import type { RowPoConnection } from "@/lib/purchaseOrders";

function formatPoDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function RowPoStatus({
  connections,
  className = "",
}: {
  connections: RowPoConnection[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const latest = connections[0];
  const showPopover = connections.length > 1;

  useLayoutEffect(() => {
    if (!open || !showPopover || !anchorRef.current) {
      setPopoverPos(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popoverHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;
      setPopoverPos({
        top: showAbove ? rect.top - popoverHeight - 4 : rect.bottom + 4,
        left: rect.left,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, showPopover, connections.length]);

  if (connections.length === 0) return null;

  const popover =
    open && showPopover && popoverPos && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[99999] w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <p className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-800">
              Added POs
            </p>
            <ul className="max-h-48 overflow-y-auto">
              {connections.map((item) => (
                <li
                  key={`${item.poId}-${item.createdAt}`}
                  className="border-b border-gray-50 px-3 py-1.5 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/purchase-order/${item.poId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0 truncate text-[11px] font-semibold text-gray-800 hover:text-[#2563eb]"
                    >
                      {item.poName}
                    </Link>
                    <span className="shrink-0 rounded bg-[#dbeafe] px-1.5 py-0.5 text-[10px] font-bold text-[#1d4ed8] tabular-nums">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] text-gray-500">
                    Added {formatPoDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className={`relative overflow-visible ${className}`.trim()}
      onMouseEnter={() => showPopover && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-[#b8d4e8] bg-[#e8f4fc] px-2 py-0.5">
        <Link
          href={`/dashboard/purchase-order/${latest.poId}`}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 truncate text-[10px] font-semibold text-[#334155] hover:underline"
          title={latest.poName}
        >
          PO: {latest.poName}
        </Link>
        <span
          className="shrink-0 rounded-full bg-[#64748b] px-1.5 py-0.5 text-[9px] font-bold text-white tabular-nums"
          title="Quantity on this PO"
        >
          {latest.quantity}
        </span>
        {showPopover && (
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#94a3b8] text-[9px] font-bold text-white"
            aria-hidden
          >
            i
          </span>
        )}
      </div>
      {popover}
    </div>
  );
}
