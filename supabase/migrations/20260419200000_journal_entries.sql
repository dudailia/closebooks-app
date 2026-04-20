create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  date date not null,
  memo text not null,
  status text not null default 'draft' check (status in ('draft', 'posted')),
  lines jsonb not null default '[]',
  created_by text not null default 'copilot',
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table journal_entries enable row level security;

create policy "firm owns journal entries" on journal_entries
  for all using (
    firm_id in (select id from public.firms where owner_id = auth.uid())
  )
  with check (
    firm_id in (select id from public.firms where owner_id = auth.uid())
  );

create index if not exists journal_entries_firm_client
  on journal_entries(firm_id, client_id);

create index if not exists journal_entries_date
  on journal_entries(firm_id, client_id, date desc);
