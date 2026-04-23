-- category_rules: learned CPA rules that auto-apply during categorization
create table if not exists public.category_rules (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_category_rules_firm on public.category_rules (firm_id);

alter table public.category_rules enable row level security;

drop policy if exists "category_rules_all_own_firm" on public.category_rules;
create policy "category_rules_all_own_firm" on public.category_rules
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());
