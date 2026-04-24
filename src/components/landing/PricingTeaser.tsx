'use client'
import Link from 'next/link'

const BULLETS = [
  'Unlimited clients, unlimited transactions',
  'All AI features: categorization, rules, narratives, agent',
  'Direct QuickBooks Online push',
  'Plaid bank sync · CSV import',
  'Audit-ready exports',
]

export default function PricingTeaser() {
  return (
    <section id="pricing" style={{ padding: '40px 0 120px', position: 'relative' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div>
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
            One plan.
            <br />
            <span style={{ color: '#6E6E85' }}>Priced like software, not a salary.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#A8A8BC', lineHeight: 1.55, margin: 0 }}>
            Most bookkeeping tools scale by client count and charge agency-style margins.
            CloseBooks is a flat per-seat subscription because CPAs already know their margins.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            padding: 32,
            backgroundColor: '#111118',
            border: '1px solid rgba(0,217,126,0.2)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(60% 80% at 50% 0%, rgba(0,217,126,0.1), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#00D97E',
                margin: 0,
                marginBottom: 6,
              }}
            >
              Firm plan
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 64,
                  fontWeight: 400,
                  color: '#F0F0F5',
                  letterSpacing: '-0.035em',
                  lineHeight: 1,
                }}
              >
                $49
              </span>
              <span style={{ fontSize: 15, color: '#A8A8BC' }}>per seat / month</span>
            </div>
            <p style={{ fontSize: 14, color: '#A8A8BC', margin: 0, marginBottom: 22 }}>
              14-day free trial. No credit card required.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px' }}>
              {BULLETS.map((b) => (
                <li
                  key={b}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '6px 0',
                    fontSize: 14,
                    color: '#D5D5E0',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                    <path d="M3.5 8.5l3 3 6-6" stroke="#00D97E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '13px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#00110A',
                background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0,217,126,0.28)',
                transition: 'transform 180ms, box-shadow 180ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,217,126,0.42)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,126,0.28)'
              }}
            >
              Start 14-day trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
