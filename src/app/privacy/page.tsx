import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy policy for firms evaluating CloseBooks."
      description="This overview explains the data CloseBooks needs to provide AI-assisted close workflows, billing, and support."
    >
      <p style={{ marginTop: 0 }}>Last updated: October 2, 2026.</p>

      <LegalSection title="Information we process">
        <p>
          CloseBooks may process account information, firm details, client names, uploaded statements,
          transaction data, charts of accounts, corrections, review notes, and billing metadata.
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
          and an email provider for sign-in emails when configured.
        </p>
      </LegalSection>

      <LegalSection title="AI providers">
        <p>
          To suggest accounts, each transaction&apos;s date, description, amount and direction, the client&apos;s
          chart of accounts and up to 10 recent corrections are sent to Anthropic. For a PDF statement, up to
          60,000 characters of its text are sent, which can include the account holder&apos;s name, address and
          account number. No zero-data-retention agreement has been arranged. Avoid uploading data you are
          not authorized to process.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          For privacy questions, contact{' '}
          <a href="mailto:mistersun4@gmail.com" style={{ color: '#00C853' }}>
            mistersun4@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
