import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Terms"
      title="Terms of service."
      description="These terms summarize the commercial and acceptable-use expectations for using CloseBooks while a formal customer agreement is finalized."
    >
      <p style={{ marginTop: 0 }}>Last updated: October 2, 2026.</p>

      <LegalSection title="Use of CloseBooks">
        <p>
          CloseBooks provides software for CPA firms and finance teams to assist with transaction
          categorization, review and export. It is an early demo with no customers yet. Users are
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
          Billing is currently in Stripe test mode, and no real charges are made.
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
          <a href="mailto:mistersun4@gmail.com" style={{ color: '#00C853' }}>
            mistersun4@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
