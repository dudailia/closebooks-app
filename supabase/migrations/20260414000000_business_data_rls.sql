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
