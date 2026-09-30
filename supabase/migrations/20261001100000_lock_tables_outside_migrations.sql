-- Lock tables the code uses but the migrations never define (docs/engine/rls-audit.md, F15).
--
-- qbo_connections holds QuickBooks OAuth access and refresh tokens. It exists
-- only as commented SQL in .env.example, so whether RLS is on in the live
-- database is unknown. The app reads and writes it only with the service role,
-- which keeps its own privileges. This makes sure anon and signed-in users can't
-- reach it through the REST API, whatever state it is in. No-op if the table
-- doesn't exist.

do $$
begin
  if to_regclass('public.qbo_connections') is not null then
    execute 'alter table public.qbo_connections enable row level security';
    execute 'revoke all on table public.qbo_connections from anon, authenticated';
  end if;
end
$$;

notify pgrst, 'reload schema';
