create table if not exists public.entity_groups (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  parent_client_id text references public.clients(id) on delete set null,
  consolidation_method text not null default 'full',
  currency text not null default 'USD',
  fiscal_year_end text not null default '12-31',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_entity_groups_firm on public.entity_groups(firm_id);
alter table public.entity_groups enable row level security;
drop policy if exists "entity_groups_firm" on public.entity_groups;
create policy "entity_groups_firm" on public.entity_groups for all
  using (public.cb_user_has_firm_access(firm_id))
  with check (public.cb_user_has_firm_access(firm_id));

create table if not exists public.entity_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.entity_groups(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  ownership_percentage numeric(5,2) not null default 100.00,
  relationship_type text not null default 'subsidiary',
  created_at timestamptz not null default now(),
  unique(group_id, client_id)
);
create index if not exists idx_entity_group_members_group on public.entity_group_members(group_id);
alter table public.entity_group_members enable row level security;
drop policy if exists "entity_group_members_firm" on public.entity_group_members;
create policy "entity_group_members_firm" on public.entity_group_members for all
  using (exists (select 1 from public.entity_groups g where g.id = group_id and public.cb_user_has_firm_access(g.firm_id)))
  with check (exists (select 1 from public.entity_groups g where g.id = group_id and public.cb_user_has_firm_access(g.firm_id)));

create table if not exists public.intercompany_transactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.entity_groups(id) on delete cascade,
  from_client_id text not null references public.clients(id) on delete cascade,
  to_client_id text not null references public.clients(id) on delete cascade,
  amount numeric(15,2) not null,
  description text,
  account_code text,
  period text not null,
  eliminated boolean not null default false,
  ai_detected boolean not null default false,
  confidence numeric(4,3),
  created_at timestamptz not null default now()
);
create index if not exists idx_intercompany_group on public.intercompany_transactions(group_id, period);
alter table public.intercompany_transactions enable row level security;
drop policy if exists "intercompany_transactions_firm" on public.intercompany_transactions;
create policy "intercompany_transactions_firm" on public.intercompany_transactions for all
  using (exists (select 1 from public.entity_groups g where g.id = group_id and public.cb_user_has_firm_access(g.firm_id)))
  with check (exists (select 1 from public.entity_groups g where g.id = group_id and public.cb_user_has_firm_access(g.firm_id)));
