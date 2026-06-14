import Link from 'next/link'
import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

const QUESTIONS = [
  ['Authentication', 'Dashboard access requires authenticated users when Supabase is configured. Email/password and Google sign-in are supported.'],
  ['Session timeout', 'CloseBooks requires re-authentication after inactivity and surfaces session visibility in firm settings.'],
  ['AI processing', 'AI requests may include transaction descriptions, amounts, correction hints, and chart-of-accounts data needed to generate suggestions.'],
  ['Human review', 'AI suggestions are reviewed through confidence scores, validation flags, and approval workflows before export.'],
  ['Billing', 'Payment methods and invoices are handled by Stripe. CloseBooks does not store card numbers.'],
  ['Compliance status', 'CloseBooks does not currently claim SOC 2 or ISO certification. Formal compliance work is part of the roadmap.'],
] as const

export default function SecurityQuestionnairePage() {
  return (
    <LegalPageLayout
      eyebrow="Security questionnaire"
      title="Answers for firm admins and procurement."
      description="Use this page as a starting point for security reviews. For formal questionnaires, contact us and we will route the request."
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {QUESTIONS.map(([topic, answer]) => (
          <div key={topic} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.025)' }}>
            <h2 style={{ margin: 0, color: '#FAFAFA', fontSize: 17, letterSpacing: '-0.02em' }}>{topic}</h2>
            <p style={{ margin: '6px 0 0', color: '#A1A1A1', fontSize: 14, lineHeight: 1.65 }}>{answer}</p>
          </div>
        ))}
      </div>

      <LegalSection title="Need a formal response?">
        <p>
          Send your security questionnaire or DPA request through{' '}
          <Link href="/contact?topic=security" style={{ color: '#00C853' }}>
            Contact
          </Link>
          . We will route it to the right owner.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
