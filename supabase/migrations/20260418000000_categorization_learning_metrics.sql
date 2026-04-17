-- Learning rules (vendor/description → GL) and per-close AI metrics

create table if not exists public.categorization_learning_rules (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_key text not null default '_global',
  vendor_key text not null,
  description_pattern text,
  correct_account_code text not null,
  correct_account_name text not null,
  hit_count int not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (firm_id, client_key, vendor_key)
);

create index if not exists idx_cat_learn_firm_client on public.categorization_learning_rules (firm_id, client_key);

alter table public.categorization_learning_rules enable row level security;

-- Service role from API routes; optional select for firm members via policy
create policy "cat_learn_select" on public.categorization_learning_rules
  for select using (public.cb_user_has_firm_access(firm_id));
create policy "cat_learn_all" on public.categorization_learning_rules
  for all using (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id))
  with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create table if not exists public.categorization_metrics (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  job_id text,
  client_name text,
  total_transactions int not null default 0,
  auto_approved int not null default 0,
  pending_review int not null default 0,
  flagged int not null default 0,
  learned_applied int not null default 0,
  haiku_batches int not null default 0,
  sonnet_batches int not null default 0,
  estimated_cost_usd numeric(12, 6),
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cat_metrics_firm on public.categorization_metrics (firm_id, created_at desc);

alter table public.categorization_metrics enable row level security;

create policy "cat_metrics_select" on public.categorization_metrics
  for select using (public.cb_user_has_firm_access(firm_id));
create policy "cat_metrics_insert" on public.categorization_metrics
  for insert with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));

create table if not exists public.categorization_feedback (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  job_id text,
  transaction_id text,
  client_key text,
  suggested_account_code text,
  final_account_code text,
  was_ai_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cat_feedback_firm on public.categorization_feedback (firm_id, created_at desc);

alter table public.categorization_feedback enable row level security;

create policy "cat_feedback_select" on public.categorization_feedback
  for select using (public.cb_user_has_firm_access(firm_id));
create policy "cat_feedback_insert" on public.categorization_feedback
  for insert with check (public.cb_user_has_firm_access(firm_id) and public.cb_can_write_firm(firm_id));
