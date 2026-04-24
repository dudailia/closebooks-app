'use client'
import Link from 'next/link'
import HeroTransactionFeed from './HeroTransactionFeed'

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        paddingTop: 128,
        paddingBottom: 88,
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -180,
          right: -120,
          width: 720,
          height: 720,
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(0,217,126,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 260,
          left: -120,
          width: 520,
          height: 520,
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(76,126,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(60% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 30%, black, transparent)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 48,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        <style jsx>{`
          @media (min-width: 960px) {
            .hero-grid {
              grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) !important;
            }
            .hero-canvas {
              display: block !important;
            }
          }
        `}</style>

        <div>
          {/* Eyebrow pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 999,
              backgroundColor: 'rgba(0,217,126,0.08)',
              border: '1px solid rgba(0,217,126,0.24)',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: '#00D97E',
                boxShadow: '0 0 0 3px rgba(0,217,126,0.2)',
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#00D97E',
                letterSpacing: '0.02em',
              }}
            >
              Now in private beta · Powered by Claude
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(48px, 7vw, 82px)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: '#F0F0F5',
              margin: 0,
              marginBottom: 24,
              fontWeight: 400,
            }}
          >
            The AI co-pilot
            <br />
            for month-end{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00D97E 0%, #4CFFB3 60%, #00D97E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
              }}
            >
              close
            </span>
            .
          </h1>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.5,
              color: '#A8A8BC',
              maxWidth: 560,
              margin: 0,
              marginBottom: 36,
              letterSpacing: '-0.01em',
            }}
          >
            CloseBooks learns how your firm categorizes transactions, runs an
            autonomous close agent, and ships client-ready narratives. One CPA
            reviews 500 books in the time it used to take to close five.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 22px',
                fontSize: 15,
                fontWeight: 600,
                color: '#00110A',
                background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 10px 32px rgba(0,217,126,0.26)',
                transition: 'transform 180ms, box-shadow 180ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,217,126,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,217,126,0.26)'
              }}
            >
              Start closing smarter
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 20px',
                fontSize: 15,
                fontWeight: 500,
                color: '#F0F0F5',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'background-color 180ms, border-color 180ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              }}
            >
              See how it works
            </a>
          </div>

          <p
            style={{
              fontSize: 13,
              color: '#6E6E85',
              margin: 0,
            }}
          >
            No credit card required  ·  14-day trial  ·  Set up in under 2 minutes
          </p>
        </div>

        <div className="hero-canvas" style={{ display: 'none', position: 'relative' }}>
          <HeroTransactionFeed />
        </div>
      </div>
    </section>
  )
}
