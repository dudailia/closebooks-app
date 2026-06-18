import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

export default function AboutPage() {
  return (
    <LegalPageLayout
      eyebrow="About"
      title="CloseBooks is built for AI-first CPA firms."
      description="Our focus is simple: help firms close more clients with fewer manual rows, clearer review controls, and better client delivery."
    >
      <LegalSection title="What we are building">
        <p>
          CloseBooks combines AI categorization, chart-of-accounts validation, exception review,
          QuickBooks-ready exports, client workflows, and firm automation into one close workspace.
        </p>
      </LegalSection>

      <LegalSection title="Who it is for">
        <p>
          CloseBooks is designed for CPA firms, bookkeeping teams, and accounting practices that want
          software they control instead of outsourcing margin, client relationships, and quality assurance.
        </p>
      </LegalSection>

      <LegalSection title="How we think about AI">
        <p>
          AI should handle repetitive volume while CPAs keep professional judgment. That is why CloseBooks
          emphasizes confidence scores, validation, exceptions, auditability, and human review before export.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
