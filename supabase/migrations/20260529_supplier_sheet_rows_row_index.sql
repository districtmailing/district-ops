-- Fix supplier_sheet_rows when legacy schema used row_sort instead of row_index

alter table public.supplier_sheet_rows add column if not exists row_index integer;

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

alter table public.supplier_sheet_rows add column if not exists item_number text;
alter table public.supplier_sheet_rows add column if not exists amazon_match jsonb;
alter table public.supplier_sheet_rows add column if not exists raw_data jsonb;
