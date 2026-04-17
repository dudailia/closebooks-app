-- QuickBooks Online: sync cache, client mapping, connection extras, sync history

create table if not exists public.qbo_connections (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid not null unique references public.firms(id) on delete cascade,
  user_id uuid references auth.users not null,
  realm_id text not null,
  company_name text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  last_sync_at timestamptz,
  total_synced int default 0,
  connected_at timestamptz,
  last_error_code text,
  last_error_message text,
  last_error_at timestamptz,
  auto_sync_enabled boolean not null default false,
  next_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Extend qbo_connections (safe if table already exists from manual SQL)
alter table if exists public.qbo_connections
  add column if not exists connected_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists last_error_message text,
  add column if not exists last_error_at timestamptz,
  add column if not exists auto_sync_enabled boolean not null default false,
  add column if not exists next_sync_at timestamptz;

update public.qbo_connections
set connected_at = coalesce(connected_at, created_at)
where connected_at is null;

-- Cached QBO chart of accounts (per firm + realm)
create table if not exists public.qbo_accounts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  realm_id text not null,
  qbo_id text not null,
  name text not null,
  account_type text,
  account_sub_type text,
  active boolean default true,
  parent_qbo_id text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (firm_id, realm_id, qbo_id)
);

create index if not exists idx_qbo_accounts_firm on public.qbo_accounts (firm_id);

-- Vendors / customers (AR)
create table if not exists public.qbo_vendors (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  realm_id text not null,
  qbo_id text not null,
  display_name text,
  company_name text,
  active boolean default true,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (firm_id, realm_id, qbo_id)
);

create index if not exists idx_qbo_vendors_firm on public.qbo_vendors (firm_id);

create table if not exists public.qbo_customers (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  realm_id text not null,
  qbo_id text not null,
  display_name text,
  company_name text,
  active boolean default true,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (firm_id, realm_id, qbo_id)
);

create index if not exists idx_qbo_customers_firm on public.qbo_customers (firm_id);

-- Bank / cash activity (Purchase + Deposit rows as proxy for banking activity)
create table if not exists public.qbo_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  realm_id text not null,
  qbo_id text not null,
  entity_type text not null,
  txn_date date,
  amount numeric,
  description text,
  account_qbo_id text,
  raw jsonb default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  unique (firm_id, realm_id, qbo_id, entity_type)
);

create index if not exists idx_qbo_bank_tx_firm on public.qbo_bank_transactions (firm_id);

-- Per-client QBO mapping + auto-sync
create table if not exists public.qbo_client_settings (
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_key text not null,
  client_name text not null,
  qbo_account_mapping jsonb not null default '{}'::jsonb,
  auto_sync_enabled boolean not null default false,
  next_sync_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (firm_id, client_key)
);

create index if not exists idx_qbo_client_settings_next on public.qbo_client_settings (firm_id, next_sync_at)
  where auto_sync_enabled = true;

-- Sync run history
create table if not exists public.qbo_sync_runs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  realm_id text not null,
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  pulled_accounts int default 0,
  pulled_vendors int default 0,
  pulled_customers int default 0,
  pulled_bank int default 0,
  pushed_journal int default 0,
  error_count int default 0,
  error_message text,
  details jsonb default '{}'::jsonb
);

create index if not exists idx_qbo_sync_runs_firm on public.qbo_sync_runs (firm_id, started_at desc);

-- RLS: service role only for these tables (API uses service role); deny anon
alter table public.qbo_accounts enable row level security;
alter table public.qbo_vendors enable row level security;
alter table public.qbo_customers enable row level security;
alter table public.qbo_bank_transactions enable row level security;
alter table public.qbo_client_settings enable row level security;
alter table public.qbo_sync_runs enable row level security;

-- No policies: locked to service role (same pattern as qbo_connections in comments)
