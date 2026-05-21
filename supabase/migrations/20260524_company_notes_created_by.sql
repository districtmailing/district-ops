alter table public.company_notes
  add column if not exists created_by uuid,
  add column if not exists created_by_name text;
