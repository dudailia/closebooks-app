'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface BentoCardProps {
  title: string
  body: string
  icon: ReactNode
  span?: 'small' | 'large'
  children?: ReactNode
}

function BentoCard({ title, body, icon, span = 'small', children }: BentoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        position: 'relative',
        gridColumn: span === 'large' ? 'span 4' : 'span 2',
        backgroundColor: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: 28,
        overflow: 'hidden',
        minHeight: span === 'large' ? 320 : 260,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="bento-card"
    >
      <style jsx>{`
        :global(.bento-card)::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0,217,126,0) 0%, rgba(0,217,126,0.35) 50%, rgba(0,217,126,0) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 280ms ease;
          pointer-events: none;
        }
        :global(.bento-card:hover)::before {
          opacity: 1;
        }
      `}</style>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: 'rgba(0,217,126,0.1)',
          border: '1px solid rgba(0,217,126,0.24)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00D97E',
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#F0F0F5',
          margin: 0,
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: '#A8A8BC',
          margin: 0,
          flex: 1,
        }}
      >
        {body}
      </p>
      {children && <div style={{ marginTop: 24 }}>{children}</div>}
    </motion.div>
  )
}

function CategorizationDemo() {
  const rows = [
    { vendor: 'Notion Labs', cat: 'Software', conf: 97 },
    { vendor: 'Amazon AWS', cat: 'Cloud Infrastructure', conf: 99 },
    { vendor: 'DoorDash', cat: 'Meals', conf: 94 },
  ]
  return (
    <div
      style={{
        backgroundColor: '#0A0A0F',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {rows.map((r, i) => (
        <div
          key={r.vendor}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 10,
            padding: '10px 14px',
            alignItems: 'center',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          <span style={{ fontSize: 12, color: '#F0F0F5', fontWeight: 500 }}>{r.vendor}</span>
          <span
            style={{
              fontSize: 11,
              color: '#00D97E',
              padding: '2px 8px',
              borderRadius: 999,
              backgroundColor: 'rgba(0,217,126,0.1)',
            }}
          >
            {r.cat}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${r.conf}%`, height: '100%', backgroundColor: '#00D97E' }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6E6E85' }}>{r.conf}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function NarrativeDemo() {
  return (
    <div
      style={{
        backgroundColor: '#0A0A0F',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: '#D5D5E0',
          margin: 0,
          marginBottom: 10,
        }}
      >
        Revenue of <span style={{ color: '#00D97E', fontWeight: 600 }}>$48,200</span> was up{' '}
        <span style={{ color: '#00D97E', fontWeight: 600 }}>+12%</span> from March, led by three new recurring clients…
      </p>
      <p
        style={{
          fontSize: 11,
          color: '#00D97E',
          fontStyle: 'italic',
          margin: 0,
          padding: '8px 0 0',
          borderTop: '1px solid rgba(0,217,126,0.14)',
        }}
      >
        ➜ Projected cash runway: 14 months at current burn.
      </p>
    </div>
  )
}

export default function BentoGrid() {
  return (
    <section id="features" style={{ padding: '80px 0 120px', position: 'relative' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 72, maxWidth: 720, margin: '0 auto 72px' }}>
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
            Features
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
            Everything a month-end close needs.
            <br />
            <span style={{ color: '#6E6E85' }}>Nothing it doesn&apos;t.</span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 16,
          }}
          className="bento-grid"
        >
          <style jsx>{`
            @media (max-width: 900px) {
              .bento-grid {
                grid-template-columns: 1fr !important;
              }
              .bento-grid :global(.bento-card) {
                grid-column: auto !important;
              }
            }
          `}</style>

          <BentoCard
            span="large"
            title="AI categorization that actually learns"
            body="Claude-powered categorization with 94% accuracy out of the box. Corrections train a rules engine that drives accuracy to 99% within two months."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2v16M2 10h16M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          >
            <CategorizationDemo />
          </BentoCard>

          <BentoCard
            title="Smart rules engine"
            body="Teach it once. CloseBooks applies your firm's rules to every future transaction, automatically."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 6h12M4 10h8M4 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          />

          <BentoCard
            title="Bank reconciliation"
            body="Match statements to books in seconds. Fuzzy matching plus drag-to-pair for edge cases."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 6h12M4 14h12M8 3l-4 3 4 3M12 11l4 3-4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          <BentoCard
            title="Auto-close agent"
            body="One click runs categorize → reconcile → anomaly scan → JEs → report. Live reasoning, full audit trail."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          />

          <BentoCard
            title="Keyboard-first review"
            body="J/K to navigate. A to approve. ⌘K for anything. 500 transactions an hour without touching a mouse."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M6 9h.01M9 9h.01M12 9h.01M6 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          />

          <BentoCard
            span="large"
            title="Narrative insights your clients actually read"
            body="Every close finishes with a three-paragraph summary in the tone you pick — boardroom formal, CPA brief, or warm to the owner. Forward-looking advisory line included."
            icon={
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 4h12v12H4zM4 8h12M8 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <NarrativeDemo />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
