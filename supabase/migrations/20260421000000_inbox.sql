-- ── inbox_emails: one per received email ────────────────────────────────────
create table if not exists public.inbox_emails (
  id            uuid primary key default gen_random_uuid(),
  firm_id       uuid not null references public.firms(id) on delete cascade,
  message_id    text unique,
  from_email    text not null,
  from_name     text,
  subject       text,
  body_text     text,
  body_html     text,
  received_at   timestamptz not null default now(),
  client_id     text references public.clients(id) on delete set null,
  client_name   text,
  match_method  text,   -- 'subaddress' | 'email_exact' | 'subject_fuzzy' | 'unassigned'
  status        text not null default 'unread',  -- unread | read | archived
  attachment_count int not null default 0,
  doc_request_id   text   -- if reply to a document request
);
create index if not exists idx_inbox_emails_firm on public.inbox_emails (firm_id, received_at desc);
create index if not exists idx_inbox_emails_client on public.inbox_emails (client_id);
alter table public.inbox_emails enable row level security;
drop policy if exists "inbox_emails_firm" on public.inbox_emails;
create policy "inbox_emails_firm" on public.inbox_emails for all
  using (public.cb_user_has_firm_access(firm_id))
  with check (public.cb_user_has_firm_access(firm_id));

-- ── inbox_attachments: one per email attachment ──────────────────────────────
create table if not exists public.inbox_attachments (
  id               uuid primary key default gen_random_uuid(),
  email_id         uuid not null references public.inbox_emails(id) on delete cascade,
  firm_id          uuid not null references public.firms(id) on delete cascade,
  file_name        text not null,
  mime_type        text,
  size_bytes       int,
  storage_path     text,   -- path in Supabase Storage bucket 'inbox-attachments'
  document_type    text,   -- 'receipt' | 'invoice' | 'statement' | 'csv' | 'unknown'
  extracted_data   jsonb,  -- AI-extracted structured data
  vault_doc_id     text,   -- linked vault document id
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists idx_inbox_attachments_email on public.inbox_attachments (email_id);
create index if not exists idx_inbox_attachments_firm on public.inbox_attachments (firm_id);
alter table public.inbox_attachments enable row level security;
drop policy if exists "inbox_attachments_firm" on public.inbox_attachments;
create policy "inbox_attachments_firm" on public.inbox_attachments for all
  using (public.cb_user_has_firm_access(firm_id))
  with check (public.cb_user_has_firm_access(firm_id));

-- ── Index for firm lookup by inbox slug (for webhook routing) ────────────────
create index if not exists idx_firm_settings_inbox_slug
  on public.firm_settings ((payload->>'inboxSlug'));

-- ── NOTE: Create Supabase Storage bucket 'inbox-attachments' via dashboard ──
-- Navigate to Storage → New Bucket → name: inbox-attachments → Private
-- Then add RLS policy: authenticated users can read/write their firm's files
