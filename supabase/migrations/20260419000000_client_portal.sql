-- Client Collaboration Portal Migration

-- Storage bucket for portal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portal-docs', 'portal-docs', false, 52428800,
  ARRAY['image/jpeg','image/png','image/heic','image/webp','application/pdf','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Portal tokens: one per client per firm, maps to permissions
CREATE TABLE IF NOT EXISTS portal_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  firm_id         TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  client_name     TEXT NOT NULL DEFAULT '',
  client_email    TEXT,
  permissions     TEXT[] NOT NULL DEFAULT ARRAY['view_reports','upload_documents','send_messages','view_transactions','approve_items'],
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT now() + interval '90 days',
  created_by      TEXT NOT NULL DEFAULT '',
  last_accessed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_firm_client ON portal_tokens(firm_id, client_id);

-- Portal documents: firm requests docs, client uploads
CREATE TABLE IF NOT EXISTS portal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT CHECK (category IN ('receipt','invoice','statement','tax','other')) DEFAULT 'other',
  status          TEXT CHECK (status IN ('requested','uploaded','reviewed')) DEFAULT 'requested',
  storage_path    TEXT,
  file_size       BIGINT,
  mime_type       TEXT,
  requested_note  TEXT,
  uploaded_at     TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_docs_firm_client ON portal_documents(firm_id, client_id);
CREATE INDEX IF NOT EXISTS idx_portal_docs_status ON portal_documents(status);

-- Portal messages: bidirectional, separate from firm_messages
CREATE TABLE IF NOT EXISTS portal_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  sender          TEXT CHECK (sender IN ('firm','client')) NOT NULL,
  content         TEXT NOT NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_msgs_firm_client ON portal_messages(firm_id, client_id);
CREATE INDEX IF NOT EXISTS idx_portal_msgs_created ON portal_messages(created_at);

-- Portal action items: firm creates, client completes
CREATE TABLE IF NOT EXISTS portal_action_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id         TEXT NOT NULL,
  client_id       TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  attachment_path TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_actions_firm_client ON portal_action_items(firm_id, client_id);

-- Portal access log: security audit trail
CREATE TABLE IF NOT EXISTS portal_access_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id     UUID REFERENCES portal_tokens(id) ON DELETE CASCADE,
  ip_address   TEXT,
  user_agent   TEXT,
  accessed_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_log_token ON portal_access_log(token_id);
CREATE INDEX IF NOT EXISTS idx_portal_log_accessed ON portal_access_log(accessed_at);

-- RLS: all portal tables locked down, accessed only via service role
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_access_log ENABLE ROW LEVEL SECURITY;

-- Firm users can manage their own portal data (dashboard routes)
CREATE POLICY "firm_portal_tokens" ON portal_tokens
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "firm_portal_documents" ON portal_documents
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "firm_portal_messages" ON portal_messages
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "firm_portal_action_items" ON portal_action_items
  FOR ALL USING (firm_id = auth.uid()::text);

CREATE POLICY "firm_portal_access_log" ON portal_access_log
  FOR ALL USING (
    token_id IN (SELECT id FROM portal_tokens WHERE firm_id = auth.uid()::text)
  );

-- Storage RLS for portal-docs bucket
CREATE POLICY "portal_docs_service_role" ON storage.objects
  FOR ALL USING (bucket_id = 'portal-docs');
