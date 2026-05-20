"use client";

function IconButton({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#2563eb]"
    >
      {children}
    </button>
  );
}

export function PoRowActionColumn({
  checked,
  onCheckedChange,
  showSelectAll = false,
  onSelectAll,
  allSelected,
}: {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  showSelectAll?: boolean;
  onSelectAll?: (v: boolean) => void;
  allSelected?: boolean;
}) {
  if (showSelectAll) {
    return (
      <div className="flex h-full min-h-[52px] items-center justify-center px-1">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll?.(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Select all rows"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-gray-300"
        aria-label="Select row"
      />
      <IconButton title="Refresh">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
          <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" strokeLinecap="round" />
          <path d="M18 4v4h-4M6 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
      <IconButton title="Assign user">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
        </svg>
      </IconButton>
      <IconButton title="Note">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" strokeLinejoin="round" />
          <path d="M14 2v6h6M8 13h8M8 17h6" strokeLinecap="round" />
        </svg>
      </IconButton>
      <IconButton title="Shopping bag">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.75">
          <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
        </svg>
      </IconButton>
      <IconButton title="SS History">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </IconButton>
    </div>
  );
}
