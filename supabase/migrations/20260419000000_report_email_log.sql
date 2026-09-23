-- Delivery log for firm-branded exports (optional analytics; email via Resend)
CREATE TABLE IF NOT EXISTS public.report_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES public.firms(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  report_type text NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  provider_message_id text,
  meta jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.report_email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_email_members_read" ON public.report_email_log;
DROP POLICY IF EXISTS "report_email_members_insert" ON public.report_email_log;

CREATE POLICY "report_email_members_read"
  ON public.report_email_log FOR SELECT
  USING (public.cb_user_has_firm_access(firm_id));

CREATE POLICY "report_email_members_insert"
  ON public.report_email_log FOR INSERT
  WITH CHECK (
    public.cb_user_has_firm_access(firm_id)
    AND public.cb_can_write_firm(firm_id)
  );
