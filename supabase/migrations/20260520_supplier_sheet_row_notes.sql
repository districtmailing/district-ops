-- Notes for supplier sheet rows / Amazon matches

create table if not exists public.supplier_sheet_row_notes (
  id uuid primary key default gen_random_uuid(),
  supplier_sheet_id text not null,
  supplier_row_id text not null,
  asin text,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_sheet_row_notes_sheet_row_key unique (supplier_sheet_id, supplier_row_id)
);

create index if not exists supplier_sheet_row_notes_sheet_idx
  on public.supplier_sheet_row_notes(supplier_sheet_id);

alter table public.supplier_sheet_row_notes enable row level security;

create policy "Allow all supplier_sheet_row_notes"
  on public.supplier_sheet_row_notes
  for all
  using (true)
  with check (true);
