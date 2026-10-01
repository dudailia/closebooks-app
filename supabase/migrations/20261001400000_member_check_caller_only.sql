-- cb_is_member_of_firm answers only about the caller.
-- Written 2026-10-01 on branch `overnight`. NOT APPLIED. docs/engine/rls-audit.md, F10.
--
-- Before (20260416000000_firm_members_rls_audit.sql:29-40): a security definer
-- function, executable by every role (Postgres default), that answers "is user
-- X a member of firm Y" for any X and Y, bypassing RLS on firm_members. Anyone
-- with the anon key and two UUIDs could ask it over /rest/v1/rpc.
--
-- After: same signature, but it returns true only when check_user is the
-- caller (auth.uid()). Every caller in the repo passes auth.uid(): the
-- firm_members select policy (0416:139), cb_user_has_firm_access (0416:59) and
-- the Plaid/bank-rec policies (20260422000000_fix_rls_security.sql:27-59), so
-- none of them changes behaviour. No execute grant is revoked, because RLS
-- policies call this function as the querying role and would start erroring.
--
-- Not covered: service-role code asking about another user. There is none in
-- src/ today (no .rpc('cb_is_member_of_firm') call).

create or replace function public.cb_is_member_of_firm(check_firm uuid, check_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- coalesce: false, not null, when there is no signed-in user.
  select coalesce(check_user = auth.uid(), false)
    and exists (
      select 1 from public.firm_members fm
      where fm.firm_id = check_firm and fm.user_id = check_user
    );
$$;
