-- firms.owner_id can't be changed from a signed-in session.
-- Written 2026-10-01 on branch `overnight`. NOT APPLIED. docs/engine/rls-audit.md, F14.
--
-- Before: "firms_update" (20260416000000_firm_members_rls_audit.sql:397-398)
-- lets an owner or admin update any column, including owner_id, so an admin
-- could make themselves (or anyone without a firm) the owner. The app finds
-- "my firm" by owner_id in many places (src/lib/db.ts getFirmId,
-- src/lib/supabase/firmScope.ts).
--
-- A policy's WITH CHECK can't compare old and new values, so this uses a
-- trigger. It refuses an owner_id change when the request comes from the
-- REST API as anon or authenticated. The service role and direct database
-- sessions (SQL editor, migrations) can still change it, for a deliberate
-- ownership transfer. No app code updates owner_id.

create or replace function public.cb_pin_firm_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if new.owner_id is distinct from old.owner_id and jwt_role in ('anon', 'authenticated') then
    raise exception 'firms.owner_id can only be changed by the service role' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_firms_pin_owner on public.firms;
create trigger trg_firms_pin_owner
  before update on public.firms
  for each row execute function public.cb_pin_firm_owner();
