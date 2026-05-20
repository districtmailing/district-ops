-- Dedupe support for po_line_items (app-enforced; index helps when data is clean).

alter table public.po_line_items
  add column if not exists updated_at timestamptz not null default now();

-- One line per PO + sheet + supplier row + ASIN when row id and ASIN are present.
create unique index if not exists po_line_items_po_sheet_row_asin_uidx
  on public.po_line_items (
    po_id,
    supplier_sheet_id,
    supplier_row_id,
    upper(btrim(asin))
  )
  where supplier_row_id is not null
    and btrim(supplier_row_id) <> ''
    and asin is not null
    and btrim(asin) <> '';

-- Fallback: PO + sheet + UPC + ASIN when row id is missing.
create unique index if not exists po_line_items_po_sheet_upc_asin_uidx
  on public.po_line_items (
    po_id,
    supplier_sheet_id,
    upper(btrim(upc)),
    upper(btrim(asin))
  )
  where (supplier_row_id is null or btrim(supplier_row_id) = '')
    and upc is not null
    and btrim(upc) <> ''
    and asin is not null
    and btrim(asin) <> '';
