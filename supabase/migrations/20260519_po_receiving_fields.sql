-- Receiving quantities on PO line items

alter table public.po_line_items add column if not exists expected_cases numeric;
alter table public.po_line_items add column if not exists expected_units numeric;
alter table public.po_line_items add column if not exists invoiced_cases numeric;
alter table public.po_line_items add column if not exists invoiced_units numeric;
alter table public.po_line_items add column if not exists received_cases numeric;
alter table public.po_line_items add column if not exists received_units numeric;
alter table public.po_line_items add column if not exists damaged_cases numeric;
alter table public.po_line_items add column if not exists damaged_units numeric;
alter table public.po_line_items add column if not exists expired_cases numeric;
alter table public.po_line_items add column if not exists expired_units numeric;
alter table public.po_line_items add column if not exists prep_instruction text;
alter table public.po_line_items add column if not exists fba_qty numeric;
alter table public.po_line_items add column if not exists shipment_plan text;
alter table public.po_line_items add column if not exists pick_location text;
alter table public.po_line_items add column if not exists expiration_date text;

drop policy if exists "purchase_orders_authenticated_delete" on public.purchase_orders;
create policy "purchase_orders_authenticated_delete"
  on public.purchase_orders for delete
  to authenticated
  using (true);

drop policy if exists "po_line_items_authenticated_delete" on public.po_line_items;
create policy "po_line_items_authenticated_delete"
  on public.po_line_items for delete
  to authenticated
  using (true);
