-- Persist split lines and who chose the account, both used by journal entries.
-- Both columns are nullable: existing rows keep null and load as before.
alter table public.transactions
  add column if not exists splits jsonb,
  add column if not exists categorization_source text;

-- Make PostgREST see the new columns right away.
notify pgrst, 'reload schema';
