-- ═══════════════════════════════════════════════════════════════════════════
-- CLOSEBOOKS: PASTE ENTIRE FILE INTO SUPABASE SQL EDITOR → RUN ONCE
-- Order: core tables → subscriptions → business RLS → stripe cols → members+audit
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── A) Core: firms, clients, jobs, transactions (must run first) ────────

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

-- ─── B) subscriptions stub if missing ─────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  customer_email text,
  status text not null default 'active',
  amount_total int,
  currency text,
  checkout_session_id text,
  plan_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ─── C) Business tables + first RLS (20260414000000) ─────────────────────

-- CloseBooks: business-critical data in Postgres with RLS (replaces localStorage)
-- Run after existing firms/clients/jobs/transactions schema.

-- ─── Helper: firm scope ─────────────────────────────────────────────────────

create or replace function public.cb_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.firms where owner_id = auth.uid() limit 1
$$;

-- ─── Deadlines (calendar) ───────────────────────────────────────────────────

create table if not exists public.deadlines (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  client_name text,
  title text not null,
  due_date date not null,
  type text not null default 'custom',
  status text not null default 'upcoming',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deadlines_firm_client on public.deadlines (firm_id, client_id);
create index if not exists idx_deadlines_firm_due on public.deadlines (firm_id, due_date);

alter table public.deadlines enable row level security;

create policy "deadlines_select_own_firm" on public.deadlines
  for select using (firm_id = public.cb_firm_id());

create policy "deadlines_insert_own_firm" on public.deadlines
  for insert with check (firm_id = public.cb_firm_id());

create policy "deadlines_update_own_firm" on public.deadlines
  for update using (firm_id = public.cb_firm_id());

create policy "deadlines_delete_own_firm" on public.deadlines
  for delete using (firm_id = public.cb_firm_id());

-- ─── In-app messages ─────────────────────────────────────────────────────────

create table if not exists public.firm_messages (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  client_name text not null,
  thread_id text not null default 'default',
  sender_type text not null check (sender_type in ('firm', 'client', 'system')),
  direction text not null check (direction in ('outbound', 'inbound')),
  content text not null,
  message_type text not null default 'message',
  attachment_names jsonb default '[]',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_firm_messages_firm_client on public.firm_messages (firm_id, client_id);
create index if not exists idx_firm_messages_firm_created on public.firm_messages (firm_id, created_at desc);

alter table public.firm_messages enable row level security;

create policy "firm_messages_all_own_firm" on public.firm_messages
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Compliance tasks ───────────────────────────────────────────────────────

create table if not exists public.compliance_tasks (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  client_name text,
  task_type text,
  title text not null,
  status text not null default 'open',
  due_date date,
  assigned_to text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compliance_tasks_firm on public.compliance_tasks (firm_id, client_id);

alter table public.compliance_tasks enable row level security;

create policy "compliance_tasks_all_own_firm" on public.compliance_tasks
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Billing: invoices, rate cards, engagement letters ────────────────────────

create table if not exists public.invoices (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_firm on public.invoices (firm_id);

alter table public.invoices enable row level security;

create policy "invoices_all_own_firm" on public.invoices
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.rate_cards (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_cards enable row level security;

create policy "rate_cards_all_own_firm" on public.rate_cards
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.engagement_letters (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_engagement_letters_firm on public.engagement_letters (firm_id);

alter table public.engagement_letters enable row level security;

create policy "engagement_letters_all_own_firm" on public.engagement_letters
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Firm usage / trial ───────────────────────────────────────────────────────

create table if not exists public.firm_usage (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  closes_used int not null default 0,
  trial_started_at timestamptz,
  plan_status text not null default 'free',
  trial_activated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.firm_usage enable row level security;

create policy "firm_usage_all_own_firm" on public.firm_usage
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Notifications ───────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_firm on public.notifications (firm_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_all_own_firm" on public.notifications
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.notification_read_state (
  firm_id uuid not null references public.firms(id) on delete cascade,
  notification_id text not null,
  primary key (firm_id, notification_id)
);

alter table public.notification_read_state enable row level security;

create policy "notification_read_state_all_own_firm" on public.notification_read_state
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Document requests (checklists) ───────────────────────────────────────────

create table if not exists public.document_requests (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_requests_firm on public.document_requests (firm_id);

alter table public.document_requests enable row level security;

create policy "document_requests_all_own_firm" on public.document_requests
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Pipeline (engagement deals) ──────────────────────────────────────────────

create table if not exists public.pipeline_entries (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_pipeline_firm on public.pipeline_entries (firm_id);

alter table public.pipeline_entries enable row level security;

create policy "pipeline_entries_all_own_firm" on public.pipeline_entries
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Vault ───────────────────────────────────────────────────────────────────

create table if not exists public.vault_documents (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vault_docs_firm on public.vault_documents (firm_id);

alter table public.vault_documents enable row level security;

create policy "vault_documents_all_own_firm" on public.vault_documents
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.vault_document_requests (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vault_req_firm on public.vault_document_requests (firm_id);

alter table public.vault_document_requests enable row level security;

create policy "vault_document_requests_all_own_firm" on public.vault_document_requests
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Activity feed ───────────────────────────────────────────────────────────

create table if not exists public.activity_events (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_firm on public.activity_events (firm_id, created_at desc);

alter table public.activity_events enable row level security;

create policy "activity_events_all_own_firm" on public.activity_events
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Audit trail (per job) ────────────────────────────────────────────────────

create table if not exists public.audit_events (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  job_id text not null references public.jobs(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_firm_job on public.audit_events (firm_id, job_id);

alter table public.audit_events enable row level security;

create policy "audit_events_all_own_firm" on public.audit_events
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Firm settings (branding, inbox slug) ─────────────────────────────────────

create table if not exists public.firm_settings (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.firm_settings enable row level security;

create policy "firm_settings_all_own_firm" on public.firm_settings
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Regulatory alert statuses ───────────────────────────────────────────────

create table if not exists public.regulatory_alert_statuses (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  alert_id text not null,
  client_name text not null default '__global__',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (firm_id, alert_id, client_name)
);

create index if not exists idx_reg_alert_firm on public.regulatory_alert_statuses (firm_id);

alter table public.regulatory_alert_statuses enable row level security;

create policy "regulatory_alert_statuses_all_own_firm" on public.regulatory_alert_statuses
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Corrections, advisory memos, copilot ────────────────────────────────────

create table if not exists public.corrections (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_corrections_firm on public.corrections (firm_id);

alter table public.corrections enable row level security;

create policy "corrections_all_own_firm" on public.corrections
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.advisory_memos (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_advisory_memos_firm on public.advisory_memos (firm_id);

alter table public.advisory_memos enable row level security;

create policy "advisory_memos_all_own_firm" on public.advisory_memos
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.copilot_config (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.copilot_config enable row level security;

create policy "copilot_config_all_own_firm" on public.copilot_config
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.copilot_runs (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_copilot_runs_firm on public.copilot_runs (firm_id);

alter table public.copilot_runs enable row level security;

create policy "copilot_runs_all_own_firm" on public.copilot_runs
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Integrations (demo QBO connection metadata — tokens stay in qbo_connections)

create table if not exists public.integration_connections (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  qbo_demo jsonb,
  updated_at timestamptz not null default now()
);

alter table public.integration_connections enable row level security;

create policy "integration_connections_all_own_firm" on public.integration_connections
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Benchmark / network opt-in ────────────────────────────────────────────────

create table if not exists public.benchmark_contributions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_benchmark_firm on public.benchmark_contributions (firm_id);

alter table public.benchmark_contributions enable row level security;

create policy "benchmark_contributions_all_own_firm" on public.benchmark_contributions
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.network_preferences (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  benchmark_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.network_preferences enable row level security;

create policy "network_preferences_all_own_firm" on public.network_preferences
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Portal token map, tax drafts, audit defense, team, referrals, autopilot

create table if not exists public.portal_client_tokens (
  client_name_key text not null,
  firm_id uuid not null references public.firms(id) on delete cascade,
  token text not null,
  meta jsonb default '{}'::jsonb,
  primary key (firm_id, client_name_key)
);

alter table public.portal_client_tokens enable row level security;

create policy "portal_client_tokens_all_own_firm" on public.portal_client_tokens
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.tax_return_drafts (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_tax_drafts_firm on public.tax_return_drafts (firm_id);

alter table public.tax_return_drafts enable row level security;

create policy "tax_return_drafts_all_own_firm" on public.tax_return_drafts
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.audit_defense_audits (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_audit_defense_firm on public.audit_defense_audits (firm_id);

alter table public.audit_defense_audits enable row level security;

create policy "audit_defense_audits_all_own_firm" on public.audit_defense_audits
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.team_members (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_firm on public.team_members (firm_id);

alter table public.team_members enable row level security;

create policy "team_members_all_own_firm" on public.team_members
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.referral_stats (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.referral_stats enable row level security;

create policy "referral_stats_all_own_firm" on public.referral_stats
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.autopilot_preferences (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.autopilot_preferences enable row level security;

create policy "autopilot_preferences_all_own_firm" on public.autopilot_preferences
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.agent_preferences (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agent_preferences enable row level security;

create policy "agent_preferences_all_own_firm" on public.agent_preferences
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.developer_settings (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  api_key text,
  webhook_url text,
  updated_at timestamptz not null default now()
);

alter table public.developer_settings enable row level security;

create policy "developer_settings_all_own_firm" on public.developer_settings
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.insights_cache (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.insights_cache enable row level security;

create policy "insights_cache_all_own_firm" on public.insights_cache
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.client_close_statuses (
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_key text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (firm_id, client_key)
);

alter table public.client_close_statuses enable row level security;

create policy "client_close_statuses_all_own_firm" on public.client_close_statuses
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- ─── Time tracking sessions ─────────────────────────────────────────────────

create table if not exists public.time_sessions (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_sessions_firm on public.time_sessions (firm_id);

alter table public.time_sessions enable row level security;

create policy "time_sessions_all_own_firm" on public.time_sessions
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.firm_ui_preferences (
  firm_id uuid primary key references public.firms(id) on delete cascade,
  hourly_rate numeric,
  updated_at timestamptz not null default now()
);

alter table public.firm_ui_preferences enable row level security;

create policy "firm_ui_preferences_all_own_firm" on public.firm_ui_preferences
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

create table if not exists public.portal_inbound_uploads (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_portal_inbound_firm on public.portal_inbound_uploads (firm_id);

alter table public.portal_inbound_uploads enable row level security;

create policy "portal_inbound_uploads_all_own_firm" on public.portal_inbound_uploads
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());

-- Optional: extend subscriptions plan_slug if not exists (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'plan_slug'
  ) then
    alter table public.subscriptions add column plan_slug text;
  end if;
end $$;

-- ─── D) Stripe columns on subscriptions (20260415000001) ─────────────────

-- Production subscription columns for Stripe + access control

alter table public.subscriptions add column if not exists firm_id uuid references public.firms(id) on delete set null;
alter table public.subscriptions add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists billing_interval text;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists trial_end timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean default false;
alter table public.subscriptions add column if not exists payment_failed_at timestamptz;
alter table public.subscriptions add column if not exists grace_period_end timestamptz;

create index if not exists idx_subscriptions_firm on public.subscriptions (firm_id);
create index if not exists idx_subscriptions_email on public.subscriptions (customer_email);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own_firm" on public.subscriptions;
drop policy if exists "subscriptions_select_own_email" on public.subscriptions;

-- JWT email must match subscription row (middleware / client reads)
create policy "subscriptions_select_own_email" on public.subscriptions
  for select using (
    customer_email is not null
    and lower(trim(customer_email)) = lower(trim((auth.jwt() ->> 'email')::text))
  );

-- ─── E) Firm members + audit RLS (20260416000000) ─────────────────────────

-- Firm membership, role-based RLS, audit_log, user_sessions
-- Requires: public.firms, business tables from prior migrations.

-- ─── Helper: membership check without RLS recursion ───────────────────────────

create or replace function public.cb_is_member_of_firm(check_firm uuid, check_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.firm_members fm
    where fm.firm_id = check_firm and fm.user_id = check_user
  );
$$;

create or replace function public.cb_member_firm_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.firm_members where user_id = auth.uid()
$$;

create or replace function public.cb_user_has_firm_access(check_firm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cb_is_member_of_firm(check_firm, auth.uid())
$$;

create or replace function public.cb_role_for_firm(fid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select fm.role::text from public.firm_members fm
  where fm.user_id = auth.uid() and fm.firm_id = fid
  limit 1
$$;

create or replace function public.cb_role_rank(role text)
returns int
language sql
immutable
as $$
  select case role
    when 'readonly' then 1
    when 'staff' then 2
    when 'senior_accountant' then 3
    when 'admin' then 4
    when 'owner' then 5
    else 0
  end
$$;

create or replace function public.cb_can_write_firm(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.cb_role_rank(public.cb_role_for_firm(fid)), 0) >= public.cb_role_rank('staff')
$$;

create or replace function public.cb_can_manage_billing(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cb_role_for_firm(fid) in ('owner', 'admin')
$$;

create or replace function public.cb_can_approve(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.cb_role_rank(public.cb_role_for_firm(fid)), 0) >= public.cb_role_rank('senior_accountant')
$$;

-- Compat: first firm for session
create or replace function public.cb_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.firm_members where user_id = auth.uid() limit 1
$$;

-- ─── firm_members table ─────────────────────────────────────────────────────

create table if not exists public.firm_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'senior_accountant', 'staff', 'readonly')),
  created_at timestamptz not null default now(),
  primary key (user_id, firm_id)
);

create index if not exists idx_firm_members_firm on public.firm_members (firm_id);
create index if not exists idx_firm_members_user on public.firm_members (user_id);

insert into public.firm_members (user_id, firm_id, role)
select f.owner_id, f.id, 'owner'::text
from public.firms f
where not exists (
  select 1 from public.firm_members fm
  where fm.user_id = f.owner_id and fm.firm_id = f.id
)
on conflict do nothing;

alter table public.firm_members enable row level security;

drop policy if exists "firm_members_select_self" on public.firm_members;
drop policy if exists "firm_members_sel" on public.firm_members;

create policy "firm_members_select" on public.firm_members
  for select using (public.cb_is_member_of_firm(firm_id, auth.uid()));

-- Owner can insert self before any membership row exists; admins invite others
create policy "firm_members_insert" on public.firm_members
  for insert with check (
    (
      user_id = auth.uid()
      and exists (select 1 from public.firms f where f.id = firm_id and f.owner_id = auth.uid())
    )
    or public.cb_can_manage_billing(firm_id)
  );

create policy "firm_members_update" on public.firm_members
  for update using (public.cb_can_manage_billing(firm_id));

create policy "firm_members_delete" on public.firm_members
  for delete using (public.cb_can_manage_billing(firm_id));

-- ─── Drop old cb_firm_id() policies (owner-only) + recreate via helper ──────

do $drop$
declare
  r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'deadlines','firm_messages','compliance_tasks','invoices','rate_cards','engagement_letters',
        'firm_usage','notifications','notification_read_state','document_requests','pipeline_entries',
        'vault_documents','vault_document_requests','activity_events','audit_events','firm_settings',
        'regulatory_alert_statuses','corrections','advisory_memos','copilot_config','copilot_runs',
        'integration_connections','benchmark_contributions','network_preferences','portal_client_tokens',
        'tax_return_drafts','audit_defense_audits','team_members','referral_stats','autopilot_preferences',
        'agent_preferences','developer_settings','insights_cache','client_close_statuses','time_sessions',
        'firm_ui_preferences','portal_inbound_uploads'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $drop$;

-- Deadlines
create policy "deadlines_select" on public.deadlines for select
  using (public.cb_user_has_firm_access(firm_id));
create policy "deadlines_insert" on public.deadlines for insert
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
create policy "deadlines_update" on public.deadlines for update
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
create policy "deadlines_delete" on public.deadlines for delete
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- firm_messages
create policy "firm_messages_select" on public.firm_messages for select using (public.cb_user_has_firm_access(firm_id));
create policy "firm_messages_all" on public.firm_messages for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- compliance_tasks
create policy "compliance_select" on public.compliance_tasks for select using (public.cb_user_has_firm_access(firm_id));
create policy "compliance_insert" on public.compliance_tasks for insert
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
create policy "compliance_update" on public.compliance_tasks for update
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
create policy "compliance_delete" on public.compliance_tasks for delete
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id));

-- Billing
create policy "invoices_select" on public.invoices for select using (public.cb_user_has_firm_access(firm_id));
create policy "invoices_all" on public.invoices for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "rate_cards_select" on public.rate_cards for select using (public.cb_user_has_firm_access(firm_id));
create policy "rate_cards_all" on public.rate_cards for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "engagement_letters_select" on public.engagement_letters for select using (public.cb_user_has_firm_access(firm_id));
create policy "engagement_letters_all" on public.engagement_letters for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

-- firm_usage
create policy "firm_usage_select" on public.firm_usage for select using (public.cb_user_has_firm_access(firm_id));
create policy "firm_usage_all" on public.firm_usage for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- notifications
create policy "notifications_select" on public.notifications for select using (public.cb_user_has_firm_access(firm_id));
create policy "notifications_all" on public.notifications for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "nrs_select" on public.notification_read_state for select using (public.cb_user_has_firm_access(firm_id));
create policy "nrs_all" on public.notification_read_state for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- document_requests, pipeline, vault
create policy "docreq_select" on public.document_requests for select using (public.cb_user_has_firm_access(firm_id));
create policy "docreq_all" on public.document_requests for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "pipe_select" on public.pipeline_entries for select using (public.cb_user_has_firm_access(firm_id));
create policy "pipe_all" on public.pipeline_entries for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "vaultd_select" on public.vault_documents for select using (public.cb_user_has_firm_access(firm_id));
create policy "vaultd_all" on public.vault_documents for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "vdr_select" on public.vault_document_requests for select using (public.cb_user_has_firm_access(firm_id));
create policy "vdr_all" on public.vault_document_requests for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- activity_events, audit_events
create policy "act_select" on public.activity_events for select using (public.cb_user_has_firm_access(firm_id));
create policy "act_all" on public.activity_events for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "aud_ev_select" on public.audit_events for select using (public.cb_user_has_firm_access(firm_id));
create policy "aud_ev_all" on public.audit_events for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- firm_settings
create policy "fs_select" on public.firm_settings for select using (public.cb_user_has_firm_access(firm_id));
create policy "fs_all" on public.firm_settings for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "ras_select" on public.regulatory_alert_statuses for select using (public.cb_user_has_firm_access(firm_id));
create policy "ras_all" on public.regulatory_alert_statuses for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "corr_select" on public.corrections for select using (public.cb_user_has_firm_access(firm_id));
create policy "corr_all" on public.corrections for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id));

create policy "adv_select" on public.advisory_memos for select using (public.cb_user_has_firm_access(firm_id));
create policy "adv_all" on public.advisory_memos for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "cc_select" on public.copilot_config for select using (public.cb_user_has_firm_access(firm_id));
create policy "cc_all" on public.copilot_config for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "cr_select" on public.copilot_runs for select using (public.cb_user_has_firm_access(firm_id));
create policy "cr_all" on public.copilot_runs for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "int_select" on public.integration_connections for select using (public.cb_user_has_firm_access(firm_id));
create policy "int_all" on public.integration_connections for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "bench_select" on public.benchmark_contributions for select using (public.cb_user_has_firm_access(firm_id));
create policy "bench_all" on public.benchmark_contributions for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "netp_select" on public.network_preferences for select using (public.cb_user_has_firm_access(firm_id));
create policy "netp_all" on public.network_preferences for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "pct_select" on public.portal_client_tokens for select using (public.cb_user_has_firm_access(firm_id));
create policy "pct_all" on public.portal_client_tokens for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "trd_select" on public.tax_return_drafts for select using (public.cb_user_has_firm_access(firm_id));
create policy "trd_all" on public.tax_return_drafts for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "ada_select" on public.audit_defense_audits for select using (public.cb_user_has_firm_access(firm_id));
create policy "ada_all" on public.audit_defense_audits for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id));

-- App team_members table (not auth)
create policy "tm_select" on public.team_members for select using (public.cb_user_has_firm_access(firm_id));
create policy "tm_all" on public.team_members for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "ref_select" on public.referral_stats for select using (public.cb_user_has_firm_access(firm_id));
create policy "ref_all" on public.referral_stats for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "ap_sel" on public.autopilot_preferences for select using (public.cb_user_has_firm_access(firm_id));
create policy "ap_all" on public.autopilot_preferences for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "ag_sel" on public.agent_preferences for select using (public.cb_user_has_firm_access(firm_id));
create policy "ag_all" on public.agent_preferences for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "dev_sel" on public.developer_settings for select using (public.cb_user_has_firm_access(firm_id));
create policy "dev_all" on public.developer_settings for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "ins_sel" on public.insights_cache for select using (public.cb_user_has_firm_access(firm_id));
create policy "ins_all" on public.insights_cache for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "ccs_sel" on public.client_close_statuses for select using (public.cb_user_has_firm_access(firm_id));
create policy "ccs_all" on public.client_close_statuses for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_approve(firm_id));

create policy "ts_sel" on public.time_sessions for select using (public.cb_user_has_firm_access(firm_id));
create policy "ts_all" on public.time_sessions for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "fui_sel" on public.firm_ui_preferences for select using (public.cb_user_has_firm_access(firm_id));
create policy "fui_all" on public.firm_ui_preferences for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create policy "piu_sel" on public.portal_inbound_uploads for select using (public.cb_user_has_firm_access(firm_id));
create policy "piu_all" on public.portal_inbound_uploads for all
  using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

-- Core tables (if exist)
do $core$
declare
  r record;
begin
  if to_regclass('public.firms') is not null then
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'firms'
    loop execute format('drop policy if exists %I on public.firms', r.policyname); end loop;
    alter table public.firms enable row level security;
    execute $p$
      create policy "firms_select" on public.firms for select
        using (public.cb_user_has_firm_access(id) or owner_id = auth.uid());
      create policy "firms_insert" on public.firms for insert
        with check (owner_id = auth.uid());
      create policy "firms_update" on public.firms for update
        using (public.cb_user_has_firm_access(id) and public.cb_can_manage_billing(id));
    $p$;
  end if;

  if to_regclass('public.clients') is not null then
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'clients'
    loop execute format('drop policy if exists %I on public.clients', r.policyname); end loop;
    alter table public.clients enable row level security;
    execute $p$
      create policy "clients_select" on public.clients for select using (public.cb_user_has_firm_access(firm_id));
      create policy "clients_all" on public.clients for all
        using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
        with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
    $p$;
  end if;

  if to_regclass('public.jobs') is not null then
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'jobs'
    loop execute format('drop policy if exists %I on public.jobs', r.policyname); end loop;
    alter table public.jobs enable row level security;
    execute $p$
      create policy "jobs_select" on public.jobs for select using (public.cb_user_has_firm_access(firm_id));
      create policy "jobs_all" on public.jobs for all
        using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
        with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
    $p$;
  end if;

  if to_regclass('public.transactions') is not null then
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'transactions'
    loop execute format('drop policy if exists %I on public.transactions', r.policyname); end loop;
    alter table public.transactions enable row level security;
    execute $p$
      create policy "tx_select" on public.transactions for select
        using (exists (
          select 1 from public.jobs j
          where j.id = job_id and public.cb_user_has_firm_access(j.firm_id)
        ));
      create policy "tx_all" on public.transactions for all
        using (exists (
          select 1 from public.jobs j
          where j.id = job_id and public.cb_user_has_firm_access(j.firm_id) and public.cb_can_write_firm(j.firm_id)
        ))
        with check (exists (
          select 1 from public.jobs j
          where j.id = job_id and public.cb_user_has_firm_access(j.firm_id) and public.cb_can_write_firm(j.firm_id)
        ));
    $p$;
  end if;
end $core$;

-- subscriptions: firm members OR billing email
drop policy if exists "subscriptions_select_own_email" on public.subscriptions;
drop policy if exists "subscriptions_select_firm" on public.subscriptions;

create policy "subscriptions_select" on public.subscriptions for select using (
  (firm_id is not null and public.cb_user_has_firm_access(firm_id))
  or (
    customer_email is not null
    and lower(trim(customer_email)) = lower(trim((auth.jwt() ->> 'email')::text))
  )
);

-- ─── audit_log (append-only) ─────────────────────────────────────────────────

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  details_json jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_firm_created on public.audit_log (firm_id, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select" on public.audit_log;
drop policy if exists "audit_log_insert" on public.audit_log;

create policy "audit_log_select" on public.audit_log for select
  using (firm_id is not null and public.cb_user_has_firm_access(firm_id) and public.cb_can_manage_billing(firm_id));

create policy "audit_log_insert" on public.audit_log for insert
  with check (
    firm_id is not null
    and public.cb_user_has_firm_access(firm_id)
    and user_id = auth.uid()
  );

-- ─── user_sessions ───────────────────────────────────────────────────────────

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_label text,
  ip_address inet,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user on public.user_sessions (user_id, last_seen_at desc);

alter table public.user_sessions enable row level security;

drop policy if exists "user_sessions_own" on public.user_sessions;
drop policy if exists "user_sessions_select" on public.user_sessions;

create policy "user_sessions_select" on public.user_sessions for select using (user_id = auth.uid());
create policy "user_sessions_insert" on public.user_sessions for insert with check (user_id = auth.uid());
create policy "user_sessions_update" on public.user_sessions for update using (user_id = auth.uid());
create policy "user_sessions_delete" on public.user_sessions for delete using (user_id = auth.uid());
