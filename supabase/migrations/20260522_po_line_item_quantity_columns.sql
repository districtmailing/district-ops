-- Align quantity column aliases on po_line_items for consistent reads/writes.

alter table public.po_line_items add column if not exists quantity numeric;
alter table public.po_line_items add column if not exists asin_qty numeric;
alter table public.po_line_items add column if not exists produced_qty numeric;
alter table public.po_line_items add column if not exists case_qty numeric;
