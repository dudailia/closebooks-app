import Link from 'next/link'
import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function DpaPage() {
  return (
    <LegalPageLayout
      eyebrow="Data processing"
      title="Data processing addendum."
      description="For firms that need a DPA before bringing client data into CloseBooks, we provide a lightweight review path."
    >
      <LegalSection title="Availability">
        <p>
          A data processing addendum is available on request for firms evaluating paid use of CloseBooks.
          The DPA should be reviewed with your firm&apos;s legal, compliance, or privacy advisor.
        </p>
      </LegalSection>

      <LegalSection title="Subprocessor review">
        <p>
          The DPA review should include the infrastructure and AI providers used by CloseBooks, including
          hosting, database/authentication, billing, and AI-processing services.
        </p>
      </LegalSection>

      <LegalSection title="Request a copy">
        <p>
          <Link href="/contact?topic=dpa" style={{ color: '#00C853' }}>
            Contact us to request the current DPA package.
          </Link>
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
