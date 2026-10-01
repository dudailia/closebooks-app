-- firm_usage: members can read their firm's trial state but not change it.
--
-- Before: "firm_usage_all" (20260416000000_firm_members_rls_audit.sql:224-226)
-- let any staff+ member insert, update or delete the row, including
-- trial_started_at and plan_status, which the server-side access gate reads
-- (src/lib/routeSubscription.ts, src/lib/middlewareSubscription.ts). A member
-- could restart their own trial with the anon key. See docs/engine/rls-audit.md, F7.
--
-- After:
--   * select: unchanged ("firm_usage_select", members of the firm).
--   * no insert/update/delete policy: direct writes from anon/authenticated are refused.
--   * the trial row is created by the signup trigger (handle_new_user, security
--     definer) or by cb_ensure_firm_usage() below, both with trial_started_at = now().
--   * the app counts a close with cb_record_close_used(), which can only add 1
--     to closes_used.
--   * plan_status / trial_* changes are server-only (service role).

drop policy if exists "firm_usage_all" on public.firm_usage;
drop policy if exists "firm_usage_all_own_firm" on public.firm_usage;  -- 0414 name, in case it survived

-- Create the firm's trial row if it doesn't exist. Never changes an existing row.
create or replace function public.cb_ensure_firm_usage(fid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cb_user_has_firm_access(fid) then
    raise exception 'not a member of firm %', fid using errcode = '42501';
  end if;
  insert into public.firm_usage (firm_id, trial_started_at, plan_status, closes_used)
  values (fid, now(), 'free', 0)
  on conflict (firm_id) do nothing;
end;
$$;

-- Add one close to the firm's counter. Returns the new count.
create or replace function public.cb_record_close_used(fid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not (public.cb_user_has_firm_access(fid) and public.cb_can_write_firm(fid)) then
    raise exception 'not allowed for firm %', fid using errcode = '42501';
  end if;
  update public.firm_usage
     set closes_used = closes_used + 1, updated_at = now()
   where firm_id = fid
  returning closes_used into n;
  return n;
end;
$$;

revoke all on function public.cb_ensure_firm_usage(uuid) from public, anon;
revoke all on function public.cb_record_close_used(uuid) from public, anon;
grant execute on function public.cb_ensure_firm_usage(uuid) to authenticated;
grant execute on function public.cb_record_close_used(uuid) to authenticated;

notify pgrst, 'reload schema';
