'use client'
import Link from 'next/link'

export default function CtaBand() {
  return (
    <section style={{ padding: '40px 0 120px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div
          style={{
            position: 'relative',
            padding: '72px 36px',
            borderRadius: 32,
            background:
              'radial-gradient(80% 120% at 50% 0%, rgba(0,217,126,0.18) 0%, rgba(0,217,126,0.02) 60%, transparent 100%), #0E0E14',
            border: '1px solid rgba(0,217,126,0.2)',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(60% 60% at 50% 40%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(60% 60% at 50% 40%, black, transparent)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(40px, 6vw, 72px)',
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: '#F0F0F5',
                margin: 0,
                marginBottom: 14,
                fontWeight: 400,
              }}
            >
              Close faster. <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #00D97E, #4CFFB3)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Close better.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#A8A8BC', margin: '0 auto 34px', maxWidth: 560, lineHeight: 1.55 }}>
              Join the CPA firms ditching ledgers and spreadsheets for an AI close that thinks with them.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#00110A',
                  background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  boxShadow: '0 12px 36px rgba(0,217,126,0.36)',
                }}
              >
                Start your 14-day trial
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/demo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '13px 22px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#F0F0F5',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Book a 20-min demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
