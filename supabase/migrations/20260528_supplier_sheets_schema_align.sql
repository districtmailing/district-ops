-- Run if 20260527 failed because supplier_sheets already existed (older schema)

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplier_sheets'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) then
    alter table public.supplier_sheets
      alter column id set default gen_random_uuid();
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplier_sheet_rows'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) then
    alter table public.supplier_sheet_rows
      alter column id set default gen_random_uuid();
  end if;
end $$;

alter table public.supplier_sheets add column if not exists name text;
alter table public.supplier_sheets add column if not exists sheet_name text;
alter table public.supplier_sheets add column if not exists supplier_name text;
alter table public.supplier_sheets add column if not exists original_file_name text;
alter table public.supplier_sheets add column if not exists row_count integer not null default 0;
alter table public.supplier_sheets add column if not exists bad_count integer not null default 0;
alter table public.supplier_sheets add column if not exists upc_count integer not null default 0;
alter table public.supplier_sheets add column if not exists no_asin_count integer not null default 0;
alter table public.supplier_sheets add column if not exists asin_count integer not null default 0;
alter table public.supplier_sheets add column if not exists buyer text;
alter table public.supplier_sheets add column if not exists progress integer not null default 100;
alter table public.supplier_sheets add column if not exists created_by uuid;
alter table public.supplier_sheets add column if not exists team_id uuid;
alter table public.supplier_sheets add column if not exists created_at timestamptz not null default now();
alter table public.supplier_sheets add column if not exists updated_at timestamptz not null default now();

alter table public.supplier_sheet_rows add column if not exists row_index integer;
alter table public.supplier_sheet_rows add column if not exists item_number text;
alter table public.supplier_sheet_rows add column if not exists supplier_sku text;
alter table public.supplier_sheet_rows add column if not exists amazon_match jsonb;
alter table public.supplier_sheet_rows add column if not exists raw_data jsonb;
alter table public.supplier_sheet_rows add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'supplier_sheet_rows'
      and column_name = 'row_sort'
  ) then
    update public.supplier_sheet_rows
    set row_index = row_sort
    where row_index is null and row_sort is not null;
  end if;
end $$;

update public.supplier_sheets
set name = sheet_name
where (name is null or name = '')
  and sheet_name is not null;

alter table public.supplier_sheets enable row level security;
alter table public.supplier_sheet_rows enable row level security;

grant select, insert, update, delete on public.supplier_sheets to authenticated;
grant select, insert, update, delete on public.supplier_sheet_rows to authenticated;

drop policy if exists "Allow all supplier_sheets" on public.supplier_sheets;
drop policy if exists "Allow all supplier_sheet_rows" on public.supplier_sheet_rows;
drop policy if exists "supplier_sheets_authenticated_select" on public.supplier_sheets;
drop policy if exists "supplier_sheets_authenticated_insert" on public.supplier_sheets;
drop policy if exists "supplier_sheets_authenticated_update" on public.supplier_sheets;
drop policy if exists "supplier_sheets_authenticated_delete" on public.supplier_sheets;
drop policy if exists "supplier_sheet_rows_authenticated_select" on public.supplier_sheet_rows;
drop policy if exists "supplier_sheet_rows_authenticated_insert" on public.supplier_sheet_rows;
drop policy if exists "supplier_sheet_rows_authenticated_update" on public.supplier_sheet_rows;
drop policy if exists "supplier_sheet_rows_authenticated_delete" on public.supplier_sheet_rows;

create policy "supplier_sheets_authenticated_select"
  on public.supplier_sheets for select to authenticated using (true);

create policy "supplier_sheets_authenticated_insert"
  on public.supplier_sheets for insert to authenticated with check (true);

create policy "supplier_sheets_authenticated_update"
  on public.supplier_sheets for update to authenticated using (true) with check (true);

create policy "supplier_sheets_authenticated_delete"
  on public.supplier_sheets for delete to authenticated using (true);

create policy "supplier_sheet_rows_authenticated_select"
  on public.supplier_sheet_rows for select to authenticated using (true);

create policy "supplier_sheet_rows_authenticated_insert"
  on public.supplier_sheet_rows for insert to authenticated with check (true);

create policy "supplier_sheet_rows_authenticated_update"
  on public.supplier_sheet_rows for update to authenticated using (true) with check (true);

create policy "supplier_sheet_rows_authenticated_delete"
  on public.supplier_sheet_rows for delete to authenticated using (true);
