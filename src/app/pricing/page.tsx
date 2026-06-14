import PublicShell from '@/components/landing/PublicShell'
import PricingTiers from '@/components/landing/PricingTiers'
import PricingFAQ from '@/components/landing/PricingFAQ'
import { TIERS, type TierId } from '@/lib/landing/tiers'

interface PricingPageProps {
  searchParams?: {
    required?: string
    plan?: string
    billing?: string
  }
}

export default function PricingPage({ searchParams }: PricingPageProps) {
  const required = searchParams?.required === '1'
  const selectedPlan = TIERS.some((tier) => tier.id === searchParams?.plan)
    ? (searchParams?.plan as TierId)
    : undefined
  const annualDefault = searchParams?.billing === 'annual'

  return (
    <PublicShell>
      <main style={{ padding: '120px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
        {required && (
          <div
            role="status"
            style={{
              margin: '0 auto 32px',
              maxWidth: 760,
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid rgba(0,200,83,0.28)',
              backgroundColor: 'rgba(0,200,83,0.08)',
              color: '#FAFAFA',
              fontSize: 14,
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            Your trial or subscription is required to keep using CloseBooks. Choose a plan to
            continue closing clients with AI.
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00C853',
              margin: 0,
              marginBottom: 16,
            }}
          >
            Pricing
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(44px, 6vw, 68px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#FAFAFA',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Simple, scalable pricing.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: '#888888',
              margin: '18px auto 0',
              maxWidth: 620,
              lineHeight: 1.55,
            }}
          >
            Starter for solo CPAs, Professional for growing firms, Enterprise when you need the
            full suite. 14-day trial on every plan. No per-transaction fees.
          </p>
        </div>
        <PricingTiers variant="pricing" annualDefault={annualDefault} selectedTierId={selectedPlan} />
        <div
          style={{
            margin: '34px auto 0',
            maxWidth: 820,
            padding: '16px 18px',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.025)',
            color: '#A1A1A1',
            fontSize: 13,
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Billing is handled by Stripe. Questions about client data and AI processing?{' '}
          <a href="/security" style={{ color: '#00C853', fontWeight: 700 }}>
            Read the security overview.
          </a>
        </div>
        <PricingFAQ />
      </main>
    </PublicShell>
  )
}
