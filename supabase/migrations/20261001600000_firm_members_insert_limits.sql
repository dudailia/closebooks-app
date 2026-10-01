-- firm_members: limit who can be added with which role; make cb_firm_id() deterministic.
-- Written 2026-10-01 on branch `overnight`. NOT APPLIED. docs/engine/rls-audit.md, F5.
--
-- Before (20260416000000_firm_members_rls_audit.sql:141-154):
--   * an owner or admin could insert a row for any user_id with any role,
--     including 'owner', and update any row to any role;
--   * cb_firm_id() (0416:119-127) returned `firm_id ... limit 1` with no
--     order by, so for a user in two firms the firm it picked was undefined.
--     category_rules and ai_conversations are scoped by cb_firm_id(), while
--     the app writes them with the firm it finds by owner_id
--     (src/lib/supabase/firmScope.ts), so a user added to a second firm could
--     find their rules and conversations empty and their writes refused.
--
-- After:
--   * insert: the firm's owner may add their own 'owner' row (the signup
--     trigger does this; it is security definer and not affected by RLS).
--     Owners and admins may add other users as senior_accountant, staff or
--     readonly. Only the owner may add an admin. Nobody may add a second
--     'owner' row.
--   * update: same role limits on the new row; an admin can't promote anyone
--     to admin or owner.
--   * cb_firm_id(): the firm the caller owns first, then their oldest
--     membership. That matches the app's owner_id lookup for owners.
--
-- Still open: a user is added without their consent. The app has no
-- invitation flow (no code inserts firm_members); a real fix needs an
-- invitations table the invitee accepts. Being added doesn't expose the
-- invitee's own firm to the inviter.
-- No app code inserts or updates firm_members, so nothing in the app changes.

create or replace function public.cb_is_firm_owner(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.firms f where f.id = fid and f.owner_id = auth.uid())
$$;

drop policy if exists "firm_members_insert" on public.firm_members;
create policy "firm_members_insert" on public.firm_members
  for insert with check (
    (user_id = auth.uid() and role = 'owner' and public.cb_is_firm_owner(firm_id))
    or (
      public.cb_can_manage_billing(firm_id)
      and user_id <> auth.uid()
      and (role in ('senior_accountant', 'staff', 'readonly')
           or (role = 'admin' and public.cb_is_firm_owner(firm_id)))
    )
  );

drop policy if exists "firm_members_update" on public.firm_members;
create policy "firm_members_update" on public.firm_members
  for update
  using (public.cb_can_manage_billing(firm_id))
  with check (
    public.cb_can_manage_billing(firm_id)
    and (role in ('senior_accountant', 'staff', 'readonly')
         or (role = 'admin' and public.cb_is_firm_owner(firm_id))
         or (role = 'owner' and user_id = auth.uid() and public.cb_is_firm_owner(firm_id)))
  );

create or replace function public.cb_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select fm.firm_id
  from public.firm_members fm
  left join public.firms f on f.id = fm.firm_id
  where fm.user_id = auth.uid()
  order by (f.owner_id = auth.uid()) desc nulls last, fm.created_at asc, fm.firm_id
  limit 1
$$;
