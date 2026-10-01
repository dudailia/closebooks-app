-- Record who approved each transaction: the AI at upload ('ai'), a firm rule
-- ('rule') or a reviewer ('reviewer'). Used by the close report to count
-- auto-approved rows. Nullable: existing rows keep null ("not recorded").
alter table public.transactions
  add column if not exists approved_by text;

-- Make PostgREST see the new column right away.
notify pgrst, 'reload schema';
