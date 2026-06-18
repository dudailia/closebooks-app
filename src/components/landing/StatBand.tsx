'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROW1 = [
  'CSV import', 'COA validation', 'Exception review', 'QuickBooks-ready CSV',
  'Firm rules', 'Client portal', 'Audit trail', 'Stripe billing',
]
const ROW2 = [
  'Confidence scores', 'Human approval', 'AI reasoning', 'Review queue',
  'Trial access', 'Secure sessions', 'Export preflight', 'Firm workspace',
]

const TRUST = [
  { icon: '🔒', label: 'Security-first controls' },
  { icon: '🤖', label: 'Powered by Claude AI' },
  { icon: '⚡', label: 'Human review built in' },
  { icon: '🔁', label: 'QuickBooks-ready exports' },
]

// ─── Eased count-up ───────────────────────────────────────────────────────────

function useCountUp(from: number, to: number, durationSecs: number, active: boolean) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    if (!active) return
    const t0 = performance.now()
    let rafId: number
    function tick(now: number) {
      const progress = Math.min((now - t0) / (durationSecs * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4) // ease-out quart
      setValue(Math.round(from + (to - from) * eased))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, from, to, durationSecs])
  return value
}

// ─── Marquee row ──────────────────────────────────────────────────────────────

function MarqueeRow({ firms, reverse, duration }: { firms: string[]; reverse?: boolean; duration: number }) {
  // Duplicate so the seamless -50% loop works
  const doubled = [...firms, ...firms]
  return (
    <div
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        padding: '4px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: `${reverse ? 'marquee-right' : 'marquee-left'} ${duration}s linear infinite`,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {doubled.map((firm, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              marginRight: 10,
              alignItems: 'center',
              padding: '5px 14px',
              borderRadius: 999,
              backgroundColor: '#0f0f0f',
              border: '1px solid #1a1a1a',
              whiteSpace: 'nowrap',
              fontSize: 13,
              color: '#555555',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.01em',
              userSelect: 'none',
            }}
          >
            {firm}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Single metric ────────────────────────────────────────────────────────────

interface StatProps {
  from: number
  to: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
  showDownArrow?: boolean
  active: boolean
  format?: (n: number) => string
}

function StatItem({ from, to, prefix, suffix, label, sublabel, showDownArrow, active, format }: StatProps) {
  const value = useCountUp(from, to, 1.5, active)
  const display = format ? format(value) : String(value)

  return (
    <div style={{ textAlign: 'center', padding: '0 32px' }}>
      {/* Big number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 14,
          lineHeight: 1,
        }}
      >
        {prefix && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              color: '#444444',
              letterSpacing: '-0.02em',
              marginRight: 4,
            }}
          >
            {prefix}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 7vw, 80px)',
            fontWeight: 400,
            color: '#FAFAFA',
            letterSpacing: '-0.045em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {display}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(18px, 2vw, 24px)',
              fontWeight: 600,
              color: '#00C853',
              marginLeft: 6,
              letterSpacing: '-0.01em',
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        style={{
          margin: 0,
          marginBottom: 6,
          fontSize: 15,
          fontWeight: 500,
          color: '#FAFAFA',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </p>

      {/* Sublabel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        {showDownArrow && (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <path
              d="M6.5 2v9M3 8l3.5 3.5L10 8"
              stroke="#00C853"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span style={{ fontSize: 13, color: '#444444', fontFamily: 'var(--font-sans)' }}>
          {sublabel}
        </span>
      </div>
    </div>
  )
}

// ─── Vertical divider ─────────────────────────────────────────────────────────

function VDivider() {
  return (
    <div
      className="stat-vdivider"
      style={{ width: 1, height: 90, background: '#1a1a1a', flexShrink: 0, alignSelf: 'center' }}
    />
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatBand() {
  const metricsRef = useRef<HTMLDivElement>(null)
  const isInView   = useInView(metricsRef, { once: true, margin: '-80px' })

  return (
    <section
      style={{
        position: 'relative',
        padding: '80px 0',
        background: '#0a0a0a',
        borderTop: '1px solid #1f1f1f',
      }}
    >
      {/* ── Keyframes (global) ── */}
      <style jsx global>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 640px) {
          .stats-row {
            flex-direction: column !important;
            gap: 44px !important;
          }
          .stat-vdivider {
            display: none !important;
          }
        }
      `}</style>

      {/* ════ PART 1 — Logo marquee ════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 72 }}>
        <MarqueeRow firms={ROW1} duration={30} />
        <MarqueeRow firms={ROW2} reverse duration={24} />
      </div>

      {/* ════ PART 2 — Three hero metrics ════ */}
      <div ref={metricsRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="stats-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StatItem
            from={0} to={85}
            suffix="%"
            label="Auto-approval threshold"
            sublabel="Lower confidence stays in review"
            active={isInView}
          />

          <VDivider />

          <StatItem
            from={0} to={3}
            suffix=" steps"
            label="Upload, review, export"
            sublabel="One guided workflow"
            active={isInView}
          />

          <VDivider />

          <StatItem
            from={0} to={14}
            suffix=" days"
            label="Trial access"
            sublabel="No card required at signup"
            active={isInView}
          />
        </motion.div>
      </div>

      {/* ════ PART 3 — Trust badges ════ */}
      <div style={{ maxWidth: 1200, margin: '56px auto 0', padding: '0 28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px 40px',
            paddingTop: 24,
            borderTop: '1px solid #141414',
          }}
        >
          {TRUST.map((item) => (
            <div
              key={item.label}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span
                style={{
                  fontSize: 14,
                  filter: 'grayscale(0.4) brightness(0.65)',
                  lineHeight: 1,
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: '#444444',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
