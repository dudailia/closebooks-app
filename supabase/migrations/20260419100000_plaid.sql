-- Plaid bank connections per client
create table if not exists plaid_connections (
  id uuid primary key default gen_random_uuid(),
  firm_id text not null,
  client_id text not null,
  access_token_encrypted text not null,
  item_id text not null unique,
  institution_id text,
  institution_name text,
  accounts_json jsonb not null default '[]',
  cursor text,
  status text not null default 'active',
  error_code text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(firm_id, client_id)
);

-- Transactions pulled from Plaid
create table if not exists plaid_transactions (
  id uuid primary key default gen_random_uuid(),
  firm_id text not null,
  client_id text not null,
  plaid_transaction_id text not null unique,
  account_id text not null,
  date date not null,
  name text not null,
  amount numeric not null,
  currency text not null default 'USD',
  category_primary text,
  category_detailed text,
  merchant_name text,
  pending boolean not null default false,
  imported_at timestamptz not null default now()
);

alter table plaid_connections enable row level security;
alter table plaid_transactions enable row level security;

create policy "firm owns connections" on plaid_connections
  for all using (firm_id = auth.uid()::text);

create policy "firm owns transactions" on plaid_transactions
  for all using (firm_id = auth.uid()::text);

create index if not exists plaid_connections_firm_client
  on plaid_connections(firm_id, client_id);

create index if not exists plaid_transactions_firm_client
  on plaid_transactions(firm_id, client_id);

create index if not exists plaid_transactions_plaid_id
  on plaid_transactions(plaid_transaction_id);

create index if not exists plaid_transactions_date
  on plaid_transactions(firm_id, client_id, date desc);
