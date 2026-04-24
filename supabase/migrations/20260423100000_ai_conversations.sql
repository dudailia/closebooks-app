create table if not exists public.ai_conversations (
  id text primary key,
  firm_id uuid not null references public.firms(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_firm on public.ai_conversations (firm_id);

alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_all_own_firm" on public.ai_conversations;
create policy "ai_conversations_all_own_firm" on public.ai_conversations
  for all using (firm_id = public.cb_firm_id()) with check (firm_id = public.cb_firm_id());
