import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Terms"
      title="Terms of service."
      description="These terms summarize the commercial and acceptable-use expectations for using CloseBooks while a formal customer agreement is finalized."
    >
      <p style={{ marginTop: 0 }}>Last updated: June 14, 2026.</p>

      <LegalSection title="Use of CloseBooks">
        <p>
          CloseBooks provides software for CPA firms and finance teams to assist with transaction
          categorization, review, export, client collaboration, and related close workflows. Users are
          responsible for reviewing accounting output before relying on it.
        </p>
      </LegalSection>

      <LegalSection title="Professional judgment">
        <p>
          AI output is assistive and may be incorrect. Your firm remains responsible for final accounting
          decisions, client deliverables, filings, and professional obligations.
        </p>
      </LegalSection>

      <LegalSection title="Billing and trials">
        <p>
          CloseBooks offers trial access and paid subscription plans. Billing is processed through Stripe.
          Plan limits, cancellation options, and invoices are managed through the customer portal where available.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Do not use CloseBooks to process data you are not authorized to handle, attempt to bypass access
          controls, overload AI endpoints, reverse engineer the service, or use the platform for unlawful activity.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For contracting questions, contact{' '}
          <a href="mailto:hello@closebooks.io" style={{ color: '#00C853' }}>
            hello@closebooks.io
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
