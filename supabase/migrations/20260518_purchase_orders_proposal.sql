-- Proposal: purchase order persistence for supplier sheet -> PO workflow.
-- Apply this migration before relying on Supabase persistence in production.

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text,
  name text not null,
  supplier text,
  stage text not null default 'Sourcing',
  buyer text,
  notes text,
  supplier_sheet_id text,
  created_by uuid,
  team_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.po_line_items (
  id uuid primary key default gen_random_uuid(),
  po_id text not null,
  supplier_sheet_id text,
  supplier_row_id text,
  asin text,
  upc text,
  item_number text,
  supplier_title text,
  amazon_title text,
  supplier_image text,
  amazon_image text,
  image_url text,
  buy_box numeric,
  pack_size numeric,
  case_size numeric,
  asin_amount numeric,
  units numeric,
  cases numeric,
  left_over numeric,
  each_cost numeric,
  case_cost numeric,
  want_case_cost numeric,
  want_each_cost numeric,
  want_discount numeric,
  need_case_cost numeric,
  need_each_cost numeric,
  need_discount numeric,
  profit numeric,
  profit_margin numeric,
  roi numeric,
  need_profit numeric,
  need_profit_margin numeric,
  need_roi numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_order_documents (
  id uuid primary key default gen_random_uuid(),
  po_id text not null,
  document_type text not null,
  file_name text not null,
  file_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists po_line_items_po_id_idx
  on public.po_line_items(po_id);

create index if not exists po_line_items_supplier_sheet_idx
  on public.po_line_items(supplier_sheet_id);

create index if not exists purchase_order_documents_po_id_idx
  on public.purchase_order_documents(po_id);

alter table public.purchase_orders add column if not exists po_number text;
alter table public.purchase_orders add column if not exists supplier text;
alter table public.purchase_orders add column if not exists stage text not null default 'Sourcing';
alter table public.purchase_orders add column if not exists buyer text;
alter table public.purchase_orders add column if not exists notes text;
alter table public.purchase_orders add column if not exists supplier_sheet_id text;
alter table public.purchase_orders add column if not exists created_by uuid;
alter table public.purchase_orders add column if not exists team_id uuid;
alter table public.purchase_orders add column if not exists created_at timestamptz not null default now();
alter table public.purchase_orders add column if not exists updated_at timestamptz not null default now();

alter table public.po_line_items add column if not exists asin_amount numeric;
alter table public.po_line_items add column if not exists supplier_image text;
alter table public.po_line_items add column if not exists amazon_image text;
alter table public.po_line_items add column if not exists units numeric;
alter table public.po_line_items add column if not exists cases numeric;
alter table public.po_line_items add column if not exists left_over numeric;
alter table public.po_line_items add column if not exists want_case_cost numeric;
alter table public.po_line_items add column if not exists want_each_cost numeric;
alter table public.po_line_items add column if not exists want_discount numeric;
alter table public.po_line_items add column if not exists need_case_cost numeric;
alter table public.po_line_items add column if not exists need_each_cost numeric;
alter table public.po_line_items add column if not exists need_discount numeric;
alter table public.po_line_items add column if not exists need_profit numeric;
alter table public.po_line_items add column if not exists need_profit_margin numeric;
alter table public.po_line_items add column if not exists need_roi numeric;

alter table public.purchase_order_documents add column if not exists notes text;
alter table public.purchase_order_documents add column if not exists file_url text;

alter table public.purchase_orders enable row level security;
alter table public.po_line_items enable row level security;
alter table public.purchase_order_documents enable row level security;

drop policy if exists "purchase_orders_authenticated_select" on public.purchase_orders;
drop policy if exists "purchase_orders_authenticated_insert" on public.purchase_orders;
drop policy if exists "purchase_orders_authenticated_update" on public.purchase_orders;
drop policy if exists "po_line_items_authenticated_select" on public.po_line_items;
drop policy if exists "po_line_items_authenticated_insert" on public.po_line_items;
drop policy if exists "po_line_items_authenticated_update" on public.po_line_items;
drop policy if exists "purchase_order_documents_authenticated_select" on public.purchase_order_documents;
drop policy if exists "purchase_order_documents_authenticated_insert" on public.purchase_order_documents;
drop policy if exists "purchase_order_documents_authenticated_update" on public.purchase_order_documents;

create policy "purchase_orders_authenticated_select"
  on public.purchase_orders for select
  to authenticated
  using (true);

create policy "purchase_orders_authenticated_insert"
  on public.purchase_orders for insert
  to authenticated
  with check (true);

create policy "purchase_orders_authenticated_update"
  on public.purchase_orders for update
  to authenticated
  using (true)
  with check (true);

create policy "po_line_items_authenticated_select"
  on public.po_line_items for select
  to authenticated
  using (true);

create policy "po_line_items_authenticated_insert"
  on public.po_line_items for insert
  to authenticated
  with check (true);

create policy "po_line_items_authenticated_update"
  on public.po_line_items for update
  to authenticated
  using (true)
  with check (true);

create policy "purchase_order_documents_authenticated_select"
  on public.purchase_order_documents for select
  to authenticated
  using (true);

create policy "purchase_order_documents_authenticated_insert"
  on public.purchase_order_documents for insert
  to authenticated
  with check (true);

create policy "purchase_order_documents_authenticated_update"
  on public.purchase_order_documents for update
  to authenticated
  using (true)
  with check (true);
