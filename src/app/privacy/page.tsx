import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy policy for firms evaluating CloseBooks."
      description="This overview explains the data CloseBooks needs to provide AI-assisted close workflows, billing, and support."
    >
      <p style={{ marginTop: 0 }}>Last updated: June 14, 2026.</p>

      <LegalSection title="Information we process">
        <p>
          CloseBooks may process account information, firm details, client names, uploaded statements,
          transaction data, charts of accounts, corrections, review notes, portal messages, and billing metadata.
        </p>
      </LegalSection>

      <LegalSection title="How we use data">
        <p>
          We use data to authenticate users, run AI categorization and review workflows, save close jobs,
          generate exports, provide subscription billing, improve reliability, and respond to support requests.
        </p>
      </LegalSection>

      <LegalSection title="Subprocessors">
        <p>
          CloseBooks relies on infrastructure and service providers including Supabase for authentication
          and database services, Vercel for hosting, Anthropic for AI processing, Stripe for billing,
          and selected email or document-processing providers when configured.
        </p>
      </LegalSection>

      <LegalSection title="AI providers">
        <p>
          Transaction descriptions, chart of accounts data, and correction hints may be sent to AI providers
          when you request AI categorization or related AI workflows. Avoid uploading data you are not
          authorized to process.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          For privacy questions, contact{' '}
          <a href="mailto:privacy@closebooks.io" style={{ color: '#00C853' }}>
            privacy@closebooks.io
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
