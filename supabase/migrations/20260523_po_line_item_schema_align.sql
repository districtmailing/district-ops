-- Run in Supabase SQL Editor if Add to PO / line-item updates fail on missing columns.
-- Safe to run multiple times (IF NOT EXISTS).

alter table public.po_line_items
  add column if not exists quantity numeric,
  add column if not exists asin_qty numeric,
  add column if not exists produced_qty numeric,
  add column if not exists case_qty numeric;

alter table public.po_line_items
  add column if not exists updated_at timestamptz default now();

update public.po_line_items
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;
