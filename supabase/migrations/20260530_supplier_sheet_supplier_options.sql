-- Saved supplier names for the upload dropdown (per team)

create table if not exists public.supplier_sheet_supplier_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  team_id uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists supplier_sheet_supplier_options_team_name_idx
  on public.supplier_sheet_supplier_options(team_id, lower(name));

create index if not exists supplier_sheet_supplier_options_team_idx
  on public.supplier_sheet_supplier_options(team_id);

alter table public.supplier_sheet_supplier_options enable row level security;

grant select, insert, update, delete on public.supplier_sheet_supplier_options to authenticated;

drop policy if exists "supplier_sheet_supplier_options_authenticated_select"
  on public.supplier_sheet_supplier_options;
drop policy if exists "supplier_sheet_supplier_options_authenticated_insert"
  on public.supplier_sheet_supplier_options;
drop policy if exists "supplier_sheet_supplier_options_authenticated_delete"
  on public.supplier_sheet_supplier_options;

create policy "supplier_sheet_supplier_options_authenticated_select"
  on public.supplier_sheet_supplier_options for select to authenticated using (true);

create policy "supplier_sheet_supplier_options_authenticated_insert"
  on public.supplier_sheet_supplier_options for insert to authenticated with check (true);

create policy "supplier_sheet_supplier_options_authenticated_delete"
  on public.supplier_sheet_supplier_options for delete to authenticated using (true);
