import Link from 'next/link'
import LegalPageLayout, { LegalSection } from '@/components/landing/LegalPageLayout'

const CONTACT_PATHS = [
  {
    title: 'Trial or onboarding help',
    copy: 'Questions about running your first close, importing CSV files, or choosing a plan.',
    email: 'hello@closebooks.io',
  },
  {
    title: 'Enterprise and API',
    copy: 'White-label portal, API access, larger firm rollout, or custom procurement requirements.',
    email: 'sales@closebooks.io',
  },
  {
    title: 'Security and DPA',
    copy: 'Security questionnaires, DPA requests, privacy reviews, or responsible disclosure.',
    email: 'security@closebooks.io',
  },
] as const

export default function ContactPage() {
  return (
    <LegalPageLayout
      eyebrow="Contact"
      title="Talk to CloseBooks."
      description="Whether you want to run a first close, evaluate security, or discuss Enterprise rollout, use the path below and we will route it correctly."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {CONTACT_PATHS.map((path) => (
          <div
            key={path.title}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: 18,
              backgroundColor: 'rgba(255,255,255,0.025)',
            }}
          >
            <h2 style={{ margin: 0, color: '#FAFAFA', fontSize: 18, letterSpacing: '-0.025em' }}>{path.title}</h2>
            <p style={{ margin: '8px 0 16px', color: '#A1A1A1', fontSize: 14, lineHeight: 1.6 }}>{path.copy}</p>
            <a href={`mailto:${path.email}`} style={{ color: '#00C853', fontWeight: 700 }}>
              {path.email}
            </a>
          </div>
        ))}
      </div>

      <LegalSection title="Prefer to try it first?">
        <p>
          Start with the{' '}
          <Link href="/demo" style={{ color: '#00C853' }}>
            interactive demo
          </Link>{' '}
          or create a{' '}
          <Link href="/signup" style={{ color: '#00C853' }}>
            14-day trial account
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
