-- Core tables required before business_data_rls and cb_firm_id().
-- Run first on empty Supabase projects.

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Firm',
  created_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists public.clients (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  business_name text not null,
  industry text,
  contact_email text not null default '',
  accounting_software text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_firm on public.clients (firm_id);

create table if not exists public.jobs (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_name text not null,
  created_at timestamptz not null default now(),
  status text not null default 'review',
  total_transactions int default 0,
  auto_categorized int default 0,
  approved int default 0,
  flagged int default 0,
  chart_of_accounts jsonb default '[]'::jsonb
);

create index if not exists idx_jobs_firm on public.jobs (firm_id);

create table if not exists public.transactions (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  date text not null,
  description text not null,
  amount numeric not null,
  type text not null,
  original_description text,
  suggested_category text,
  suggested_account_code text,
  confidence numeric default 0,
  status text default 'pending',
  final_category text,
  final_account_code text,
  notes text
);

create index if not exists idx_transactions_job on public.transactions (job_id);

-- Owner-scoped RLS (replaced later by firm_members policies in 20260416000000)
alter table public.firms enable row level security;
alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "firms_owner_all" on public.firms;
create policy "firms_owner_all" on public.firms
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "clients_owner_firm" on public.clients;
create policy "clients_owner_firm" on public.clients for all
  using (firm_id in (select id from public.firms where owner_id = auth.uid()))
  with check (firm_id in (select id from public.firms where owner_id = auth.uid()));

drop policy if exists "jobs_owner_firm" on public.jobs;
create policy "jobs_owner_firm" on public.jobs for all
  using (firm_id in (select id from public.firms where owner_id = auth.uid()))
  with check (firm_id in (select id from public.firms where owner_id = auth.uid()));

drop policy if exists "tx_owner_via_job" on public.transactions;
create policy "tx_owner_via_job" on public.transactions for all
  using (
    exists (
      select 1
      from public.jobs j
      join public.firms f on f.id = j.firm_id
      where j.id = transactions.job_id and f.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      join public.firms f on f.id = j.firm_id
      where j.id = transactions.job_id and f.owner_id = auth.uid()
    )
  );
