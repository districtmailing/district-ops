-- Supplier sheet persistence (mirrors purchase_orders authenticated RLS pattern)

create table if not exists public.supplier_sheets (
  id text primary key,
  name text,
  sheet_name text,
  supplier_name text,
  original_file_name text,
  row_count integer not null default 0,
  bad_count integer not null default 0,
  upc_count integer not null default 0,
  no_asin_count integer not null default 0,
  asin_count integer not null default 0,
  buyer text,
  progress integer not null default 100,
  created_by uuid,
  team_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_sheet_rows (
  id text primary key,
  supplier_sheet_id text not null references public.supplier_sheets(id) on delete cascade,
  row_index integer not null default 0,
  upc text,
  item_number text,
  supplier_sku text,
  title text,
  description text,
  image_url text,
  each_cost numeric,
  case_cost numeric,
  quantity numeric,
  brand text,
  case_pack text,
  amazon_match jsonb,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_sheets_team_idx
  on public.supplier_sheets(team_id);

create index if not exists supplier_sheets_created_by_idx
  on public.supplier_sheets(created_by);

create index if not exists supplier_sheet_rows_sheet_idx
  on public.supplier_sheet_rows(supplier_sheet_id);

create index if not exists supplier_sheet_rows_sheet_row_idx
  on public.supplier_sheet_rows(supplier_sheet_id, row_index);

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

alter table public.supplier_sheet_rows add column if not exists row_index integer not null default 0;
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
      and table_name = 'supplier_sheets'
      and column_name = 'sheet_name'
  ) then
    update public.supplier_sheets
    set name = sheet_name
    where (name is null or name = '')
      and sheet_name is not null;
  end if;
end $$;

delete from public.supplier_sheets
where coalesce(name, sheet_name) in (
  'ResMed - Tony (1)',
  'Country Life - Bio Line (2)',
  'Country Life - Bio Line'
);

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
