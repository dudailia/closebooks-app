import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

// Every statement here must be true of the current code and setup. Check it
// against the code before adding to it.
export default function SecurityPage() {
  return (
    <LegalPageLayout
      eyebrow="Security overview"
      title="How CloseBooks handles firm and client data."
      description="What is in place today, and what is not. CloseBooks is an early demo with no customers yet."
    >
      <LegalSection title="Sign-in and sessions">
        <p>
          Dashboard pages require a signed-in user (Supabase Auth, email and password). After 30 minutes
          of inactivity you have to sign in again.
        </p>
      </LegalSection>

      <LegalSection title="Separation between firms">
        <p>
          Firm data is stored in Supabase Postgres. Row-level security policies limit each table to the
          signed-in user&apos;s firm.
        </p>
      </LegalSection>

      <LegalSection title="Keys">
        <p>
          The Anthropic API key, the Stripe secret key and the Supabase service-role key are used only on
          the server. The browser receives no secret keys: only the Supabase project URL and its public
          key (which row-level security restricts), Stripe price IDs and the app&apos;s URL.
        </p>
      </LegalSection>

      <LegalSection title="What is sent to Anthropic">
        <p>
          To suggest accounts, CloseBooks sends Claude each transaction&apos;s date, description, amount and
          direction, the client&apos;s chart of accounts, and up to 10 recent corrections from your firm. The
          client&apos;s name is not sent. For a PDF statement, up to 60,000 characters of the statement&apos;s
          text are sent, which can include the account holder&apos;s name, address and account number.
        </p>
        <p>
          No zero-data-retention agreement with Anthropic has been arranged; Anthropic&apos;s standard API
          terms apply. Suggestions are reviewed by your firm: rows below the confidence threshold or with
          an invalid account wait for review.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          Hosting: Vercel. Database and sign-in: Supabase. AI: Anthropic. Billing: Stripe, currently in
          test mode. CloseBooks does not store card numbers.
        </p>
      </LegalSection>

      <LegalSection title="Compliance">
        <p>
          CloseBooks has no SOC 2, ISO 27001, HIPAA or other third-party certification, and does not
          offer a data processing agreement.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For security questions or to report a vulnerability, email{' '}
          <a href="mailto:mistersun4@gmail.com" style={{ color: '#00C853' }}>
            mistersun4@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
