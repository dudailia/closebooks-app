'use client'
import PricingTiers from './PricingTiers'

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '40px 0 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00D97E',
              margin: 0,
              marginBottom: 14,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 5vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#F0F0F5',
              margin: 0,
              fontWeight: 400,
              marginBottom: 18,
            }}
          >
            Pick the plan that matches your firm.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: '#A8A8BC',
              margin: '0 auto',
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Priced like software, not a salary. No per-transaction fees. Upgrade anytime.
          </p>
        </div>

        <PricingTiers variant="landing" />
      </div>
    </section>
  )
}
