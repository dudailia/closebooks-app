-- ═══════════════════════════════════════════════════════════════════════════
-- RUN THIS FIRST (alone) if you get "relation firms does not exist"
-- Success → then run CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql from GitHub raw (full file)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Firm',
  created_at timestamptz not null default now(),
  unique (owner_id)
);
