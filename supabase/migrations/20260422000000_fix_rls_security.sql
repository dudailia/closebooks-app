-- Fix RLS security advisor warnings:
-- 1. Enable RLS on any public table missing it (idempotent)
-- 2. Fix plaid_connections/plaid_transactions policies (firm_id TEXT vs auth.uid() UUID mismatch)
-- 3. Fix bank_rec table policies (same firm_id TEXT mismatch)
-- 4. Ensure portal_client_tokens and developer_settings have deny-anon policies

-- ─── Step 1: Enable RLS on any table that slipped through ────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE 'Enabled RLS on %', t;
  END LOOP;
END $$;

-- ─── Step 2: Fix plaid_connections (firm_id is TEXT UUID, not user UUID) ──────
-- The old policy `firm_id = auth.uid()::text` never matched because firm IDs
-- are generated UUIDs, not user UUIDs. Replace with firm membership check.
DROP POLICY IF EXISTS "firm owns connections" ON plaid_connections;
CREATE POLICY "firm owns connections" ON plaid_connections
  FOR ALL USING (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  )
  WITH CHECK (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  );

-- ─── Step 3: Fix plaid_transactions (same firm_id TEXT mismatch) ─────────────
DROP POLICY IF EXISTS "firm owns transactions" ON plaid_transactions;
CREATE POLICY "firm owns transactions" ON plaid_transactions
  FOR ALL USING (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  )
  WITH CHECK (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  );

-- ─── Step 4: Fix bank_rec tables (firm_id TEXT → UUID cast) ──────────────────
DROP POLICY IF EXISTS "own_bank_statements" ON bank_statements;
CREATE POLICY "own_bank_statements" ON bank_statements
  FOR ALL USING (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  )
  WITH CHECK (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "own_reconciliations" ON reconciliations;
CREATE POLICY "own_reconciliations" ON reconciliations
  FOR ALL USING (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  )
  WITH CHECK (
    public.cb_is_member_of_firm(firm_id::uuid, auth.uid())
  );

-- bank_statement_lines and reconciliation_items cascade through their parents —
-- keep existing subquery policies (they are correct).

-- ─── Step 5: Explicit anon-deny on sensitive tables ──────────────────────────
-- Supabase flags sensitive columns if anon role has any path to access them.
-- These tables already have firm-member policies for authenticated users;
-- add explicit deny-all for anon to satisfy the security advisor.

-- portal_client_tokens (has `token` column)
DROP POLICY IF EXISTS "portal_client_tokens_deny_anon" ON public.portal_client_tokens;
CREATE POLICY "portal_client_tokens_deny_anon" ON public.portal_client_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- developer_settings (has `api_key` column)
DROP POLICY IF EXISTS "developer_settings_deny_anon" ON public.developer_settings;
CREATE POLICY "developer_settings_deny_anon" ON public.developer_settings
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- plaid_connections (has `access_token_encrypted` column)
DROP POLICY IF EXISTS "plaid_connections_deny_anon" ON plaid_connections;
CREATE POLICY "plaid_connections_deny_anon" ON plaid_connections
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- integration_connections (stores QBO credentials)
DROP POLICY IF EXISTS "integration_connections_deny_anon" ON public.integration_connections;
CREATE POLICY "integration_connections_deny_anon" ON public.integration_connections
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- user_sessions (has session data)
DROP POLICY IF EXISTS "user_sessions_deny_anon" ON public.user_sessions;
CREATE POLICY "user_sessions_deny_anon" ON public.user_sessions
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- audit_log (contains sensitive audit trail)
DROP POLICY IF EXISTS "audit_log_deny_anon" ON public.audit_log;
CREATE POLICY "audit_log_deny_anon" ON public.audit_log
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);
