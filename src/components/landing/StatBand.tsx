'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { ease, duration as dur } from '@/lib/landing/motion'
import { usePrefersReducedMotion } from '@/lib/landing/usePrefersReducedMotion'

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

// ─── Marquee row ──────────────────────────────────────────────────────────────
//
// Ambient/looping by design (spec D6: default ambient motion left as-is, made
// reduced-motion-aware only — the scoped [data-surface="public"] reduced-motion
// CSS block freezes these keyframes). Not the section's signature moment.

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
//
// The number is rendered as a MotionValue child (derived from the shared
// `progress`), so the count-up triggers zero per-frame React re-renders. Its
// width is reserved to the final digit count so the value can't reflow as it
// grows. The suffix is the single confirming accent — it arrives on `landed`.

interface StatProps {
  from: number
  to: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
  showDownArrow?: boolean
  progress: import('framer-motion').MotionValue<number>
  landed: boolean
  reduced: boolean
}

function StatItem({ from, to, prefix, suffix, label, sublabel, showDownArrow, progress, landed, reduced }: StatProps) {
  const text = useTransform(progress, (p) => String(Math.round(from + (to - from) * p)))
  const digits = String(to).length

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
        <motion.span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 7vw, 80px)',
            fontWeight: 400,
            color: '#FAFAFA',
            letterSpacing: '-0.045em',
            fontVariantNumeric: 'tabular-nums',
            display: 'inline-block',
            minWidth: `${digits}ch`,
            textAlign: 'center',
          }}
        >
          {text}
        </motion.span>
        {suffix && (
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={(landed || reduced) ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={reduced ? { duration: 0 } : { duration: dur.fast, ease: ease.out }}
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
          </motion.span>
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

// ─── Three hero metrics — one conducted count-up ──────────────────────────────
//
// A single `progress` MotionValue is the sole source of truth for timing. All
// three figures read from it (via useTransform), so they rise as one gesture
// and land on the same beat — like the Hero's underline and final row both
// reading LOCK. On completion, `landed` flips once and every suffix arrives
// together as the single confirming accent. Then it rests — no loop.

function Metrics({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const progress = useMotionValue(reduced ? 1 : 0)
  const [landed, setLanded] = useState(reduced)

  useEffect(() => {
    if (reduced) { progress.set(1); setLanded(true); return }
    if (!isInView) return
    setLanded(false)
    progress.set(0)
    const controls = animate(progress, 1, {
      duration: 1.5,
      ease: ease.out,
      delay: 0.15,
      onComplete: () => setLanded(true),
    })
    return () => controls.stop()
  }, [isInView, reduced, progress])

  return (
    <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={(isInView || reduced) ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={reduced ? { duration: 0 } : { duration: dur.slow, ease: ease.out }}
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
          progress={progress} landed={landed} reduced={reduced}
        />

        <VDivider />

        <StatItem
          from={0} to={3}
          suffix=" steps"
          label="Upload, review, export"
          sublabel="One guided workflow"
          progress={progress} landed={landed} reduced={reduced}
        />

        <VDivider />

        <StatItem
          from={0} to={14}
          suffix=" days"
          label="Trial access"
          sublabel="No card required at signup"
          progress={progress} landed={landed} reduced={reduced}
        />
      </motion.div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatBand() {
  const reduced = usePrefersReducedMotion()

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
      <Metrics reduced={reduced} />

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
