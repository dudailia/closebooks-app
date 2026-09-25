-- Auto-create a firm + trial row for every new auth user.
--
-- Before this, the firm row was only created client-side by dbEnsureFirm()
-- when signUp() returned an immediate session. With email confirmation ON
-- (and for Google OAuth sign-ups) that never happened, so new users had no
-- firm and no firm_usage trial row and were redirected to /pricing on their
-- first dashboard visit.
--
-- The firms insert also fires trg_firms_add_owner_to_members
-- (20260424000000), which adds the owner to firm_members.

-- ─── 1. Function ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_firm_id uuid;
begin
  begin
    insert into public.firms (owner_id, name)
    values (
      new.id,
      coalesce(
        nullif(left(btrim(new.raw_user_meta_data->>'firm_name'), 200), ''),
        nullif(left(split_part(coalesce(new.email, ''), '@', 1), 200), ''),
        'My Firm'
      )
    )
    on conflict (owner_id) do nothing;

    select id into v_firm_id from public.firms where owner_id = new.id;

    -- Same columns dbEnsureFirm writes (src/lib/db.ts).
    if v_firm_id is not null then
      insert into public.firm_usage (firm_id, trial_started_at, plan_status, closes_used)
      values (v_firm_id, now(), 'free', 0)
      on conflict (firm_id) do nothing;
    end if;
  exception when others then
    -- Never block a signup. The inner block rolls back any partial insert.
    raise warning 'handle_new_user: could not create firm for user %: % (SQLSTATE %)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

-- ─── 2. Trigger ──────────────────────────────────────────────────────────────

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 3. Backfill existing users with no firm (safe to re-run) ────────────────

with new_firms as (
  insert into public.firms (owner_id, name)
  select
    u.id,
    coalesce(
      nullif(left(btrim(u.raw_user_meta_data->>'firm_name'), 200), ''),
      nullif(left(split_part(coalesce(u.email, ''), '@', 1), 200), ''),
      'My Firm'
    )
  from auth.users u
  where not exists (select 1 from public.firms f where f.owner_id = u.id)
  on conflict (owner_id) do nothing
  returning id
)
insert into public.firm_usage (firm_id, trial_started_at, plan_status, closes_used)
select id, now(), 'free', 0
from new_firms
on conflict (firm_id) do nothing;
