import PublicShell from '@/components/landing/PublicShell'
import PricingTiers from '@/components/landing/PricingTiers'

export default function PricingPage() {
  return (
    <PublicShell>
      <main style={{ padding: '120px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00D97E',
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
              color: '#F0F0F5',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Simple, scalable pricing.
          </h1>
          <p
            style={{
              fontSize: 18,
              color: '#A8A8BC',
              margin: '18px auto 0',
              maxWidth: 620,
              lineHeight: 1.55,
            }}
          >
            Starter for solo CPAs, Professional for growing firms, Enterprise when you need the
            full suite. 14-day trial on every plan. No per-transaction fees.
          </p>
        </div>
        <PricingTiers variant="pricing" />
      </main>
    </PublicShell>
  )
}
