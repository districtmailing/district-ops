"use client";

type SortAscDescToggleProps = {
  sortAsc: boolean;
  onChange: (sortAsc: boolean) => void;
  className?: string;
};

/** Matches Supplier Sheet toolbar Asc / Dsc button styling. */
export function SortAscDescToggle({ sortAsc, onChange, className = "" }: SortAscDescToggleProps) {
  return (
    <div className={`flex gap-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`h-10 shrink-0 rounded-l-xl border bg-white px-3 text-sm ${
          sortAsc
            ? "border-[#3b82f6] font-semibold text-[#111827]"
            : "border-gray-300 font-medium text-gray-500"
        }`}
      >
        Asc ↑
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`h-10 shrink-0 rounded-r-xl border border-l-0 bg-white px-3 text-sm ${
          sortAsc
            ? "border-gray-300 font-medium text-gray-500"
            : "border-[#3b82f6] font-semibold text-[#111827]"
        }`}
      >
        Dsc ↓
      </button>
    </div>
  );
}
