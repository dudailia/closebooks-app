-- Run this ONCE if you got: relation "firm_members" does not exist (LINE ~758)
-- when running the combined migration. Do NOT re-run the full combined file from scratch
-- if parts A–D already succeeded — only run this file.
-- Source: same as 20260416000000_firm_members_rls_audit.sql (table BEFORE functions)
-- Firm membership, role-based RLS, audit_log, user_sessions
-- Requires: public.firms, business tables from prior migrations.
-- NOTE: firm_members TABLE must exist BEFORE functions that reference it.

-- ─── firm_members table FIRST (functions below reference this table) ─────────

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

-- ─── Helpers (SECURITY DEFINER — safe after firm_members exists) ─────────────

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

create or replace function public.cb_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.firm_members where user_id = auth.uid() limit 1
$$;

alter table public.firm_members enable row level security;

drop policy if exists "firm_members_select_self" on public.firm_members;
drop policy if exists "firm_members_sel" on public.firm_members;
drop policy if exists "firm_members_select" on public.firm_members;
drop policy if exists "firm_members_insert" on public.firm_members;
drop policy if exists "firm_members_update" on public.firm_members;
drop policy if exists "firm_members_delete" on public.firm_members;

create policy "firm_members_select" on public.firm_members
  for select using (public.cb_is_member_of_firm(firm_id, auth.uid()));

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

-- ─── Drop old cb_firm_id() policies + recreate via helper ───────────────────

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

-- audit_log (append-only)
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

-- user_sessions
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
