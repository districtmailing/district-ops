export function formatPoDateMmDdYy(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

/**
 * Supplier prefix for default PO name: sanitized uppercase name, max 12 chars, then MMDDYY.
 * Examples: ResMed -> RESMED051926, React Health -> REACTHEALTH051926, missing -> PO051926
 */
export function deriveSupplierPoPrefix(supplier: string, sheetName: string): string {
  const primary = supplier.trim() || sheetName.trim();
  if (!primary) return "PO";

  const sanitized = primary.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!sanitized) return "PO";

  return sanitized.slice(0, 12);
}

export function buildDefaultPoName(supplier: string, sheetName: string, date = new Date()) {
  return `${deriveSupplierPoPrefix(supplier, sheetName)}${formatPoDateMmDdYy(date)}`;
}
