-- Auto-insert the firm owner into firm_members on firm creation.
-- Required by the revenue-security-hardening branch: its trial gate reads
-- firm_usage, whose RLS depends on firm_members. Without this trigger,
-- every new signup is locked out of the dashboard on first visit.

create or replace function public.auto_add_firm_owner_to_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.firm_members (user_id, firm_id, role)
  values (new.owner_id, new.id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create or replace trigger trg_firms_add_owner_to_members
  after insert on public.firms
  for each row execute function public.auto_add_firm_owner_to_members();
