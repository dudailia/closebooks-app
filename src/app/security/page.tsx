import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function SecurityPage() {
  return (
    <LegalPageLayout
      eyebrow="Security overview"
      title="How CloseBooks handles firm and client data."
      description="CloseBooks is designed for CPA-firm workflows where financial data, client access, and review controls matter. This page summarizes the controls currently built into the product."
    >
      <p style={{ marginTop: 0 }}>
        CloseBooks protects dashboard access with authenticated firm workspaces, subscription/trial gates,
        session controls, and review-first accounting workflows. We are intentionally transparent about
        what exists today and what is still part of the compliance roadmap.
      </p>

      <LegalSection title="Authentication and access">
        <p>
          Dashboard routes require a signed-in user when Supabase authentication is configured.
          Email/password and Google sign-in are supported. Firm data is scoped to authenticated
          workspaces, and sensitive dashboard areas include role-aware controls.
        </p>
      </LegalSection>

      <LegalSection title="Session controls">
        <p>
          CloseBooks requires re-authentication after inactivity and exposes session visibility in firm
          settings. Middleware also applies security headers and rate limits selected public portal routes.
        </p>
      </LegalSection>

      <LegalSection title="AI processing">
        <p>
          AI categorization requests can include transaction descriptions, amounts, and the client chart
          of accounts so Claude can suggest categories. CloseBooks keeps a human review layer in the
          workflow: low-confidence or invalid account mappings remain in review before export.
        </p>
      </LegalSection>

      <LegalSection title="Billing">
        <p>
          Payment collection, invoices, and customer portal billing actions are handled by Stripe.
          CloseBooks does not store card numbers.
        </p>
      </LegalSection>

      <LegalSection title="Compliance status">
        <p>
          CloseBooks is not currently claiming SOC 2, ISO 27001, HIPAA, or similar third-party
          certification. Formal compliance programs are part of the roadmap as production firm usage grows.
        </p>
      </LegalSection>

      <LegalSection title="Security contact">
        <p>
          For security questions or responsible disclosure, contact{' '}
          <a href="mailto:security@closebooks.io" style={{ color: '#00C853' }}>
            security@closebooks.io
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
