'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useMotionValueEvent, animate } from 'framer-motion'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { ease, duration as dur, distance } from '@/lib/landing/motion'
import { usePrefersReducedMotion } from '@/lib/landing/usePrefersReducedMotion'

// ─── Transaction data ────────────────────────────────────────────────────────

const TRANSACTIONS = [
  { id: 1, monogram: 'AW', color: '#1E4ED8', name: 'Amazon AWS',    amount: '-$412.09',   category: 'Cloud Infrastructure' },
  { id: 2, monogram: 'SF', color: '#EA580C', name: 'Salesforce',    amount: '-$1,200.00', category: 'CRM Software'          },
  { id: 3, monogram: 'SL', color: '#7C3AED', name: 'Slack',         amount: '-$87.50',    category: 'Communications'        },
  { id: 4, monogram: 'GS', color: '#4B5563', name: 'Google Suite',  amount: '-$340.00',   category: 'Productivity'          },
  { id: 5, monogram: 'QK', color: '#0D9488', name: 'QuickBooks',    amount: '-$299.00',   category: 'Accounting Software'   },
] as const

// ─── ONE conducted timeline — the single source of truth ──────────────────────
//
// Every Hero beat derives from this map, in seconds from a single t=0 (mount),
// played entirely on framer-motion's rAF clock. There are NO wall-clock timers
// (setInterval/setTimeout) anywhere in this file, so independent beats cannot
// drift apart. The climax `LOCK` is computed once; the headline underline and
// the final transaction row's checkmark BOTH read that exact value — they are
// the same instant by construction, not two numbers tuned to coincide.
const HERO = {
  // left column intro ladder
  badge: 0.0,
  h1:    0.08,
  sub:   0.20,
  cta:   0.32,
  trust: 0.42,
  // right column mockup card entrance
  card:  0.30,
  // transaction feed
  feedStart: 0.85, // first row begins once the card has settled
  rowGap:    0.28, // start-to-start gap between rows
  typeDur:   0.34, // category badge "types" over this window
  lockGap:   0.40, // a row appearing → its checkmark locking in
} as const

const ROW_COUNT = TRANSACTIONS.length
const rowStart = (i: number) => HERO.feedStart + i * HERO.rowGap
const rowLock  = (i: number) => rowStart(i) + HERO.lockGap

// The climax: the last row locks. The underline draws on this exact beat.
const LOCK = rowLock(ROW_COUNT - 1)
// The settle: status flips to "ready", success banner + final stat land, card breathes.
const REST = LOCK + 0.18

// Shared entrance for the left column + card. Reduced-motion → mount in final
// state with no animation. Otherwise a single expo-out fade-up off the tokens.
function entrance(delay: number, reduced: boolean, dist: number = distance.md) {
  return {
    initial: reduced ? (false as const) : { opacity: 0, y: dist },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { duration: dur.slow, ease: ease.out, delay },
  }
}

// ─── Typewriter badge (framer-driven, single rAF clock) ───────────────────────

function TypewriterText({ text, startAt, reduced }: { text: string; startAt: number; reduced: boolean }) {
  const count = useMotionValue(0)
  const [chars, setChars] = useState(reduced ? text.length : 0)

  useMotionValueEvent(count, 'change', (v) => {
    const n = Math.round(v)
    setChars((prev) => (prev === n ? prev : n))
  })

  useEffect(() => {
    if (reduced) { setChars(text.length); return }
    count.set(0)
    setChars(0)
    // Plays on framer's rAF clock with the same t=0 as every other beat — the
    // category resolves precisely as this row's checkmark locks (rowLock).
    const controls = animate(count, text.length, {
      duration: HERO.typeDur,
      ease: 'linear',
      delay: startAt,
    })
    return () => controls.stop()
  }, [text, startAt, reduced, count])

  return <>{text.slice(0, chars)}</>
}

// ─── Single transaction row ──────────────────────────────────────────────────

function TxRow({ tx, index, reduced }: { tx: typeof TRANSACTIONS[number]; index: number; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { delay: rowStart(index), duration: 0.38, ease: ease.out }}
      style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr auto auto auto',
        gap: 8,
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: index < TRANSACTIONS.length - 1 ? '1px solid #141414' : 'none',
      }}
    >
      {/* Monogram circle */}
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `${tx.color}22`,
          border: `1px solid ${tx.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: tx.color,
          fontFamily: 'var(--font-sans)', flexShrink: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {tx.monogram}
      </div>

      {/* Name */}
      <span
        style={{
          fontSize: 12, fontWeight: 500, color: '#FAFAFA',
          fontFamily: 'var(--font-sans)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {tx.name}
      </span>

      {/* Amount */}
      <span
        style={{
          fontSize: 11, color: '#FF4444',
          fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {tx.amount}
      </span>

      {/* Category badge — typewriter */}
      <span
        style={{
          fontSize: 10, fontWeight: 500,
          padding: '2px 7px', borderRadius: 999,
          backgroundColor: 'rgba(0,200,83,0.08)',
          border: '1px solid rgba(0,200,83,0.15)',
          color: '#00C853',
          fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap', flexShrink: 0,
          display: 'inline-block', minWidth: 70,
        }}
      >
        <TypewriterText text={tx.category} startAt={rowStart(index) + 0.05} reduced={reduced} />
      </span>

      {/* Checkmark — locks in on this row's `rowLock` beat. The final row's
          checkmark and the headline underline share the same `LOCK` value. */}
      <motion.div
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { delay: rowLock(index), type: 'spring', stiffness: 480, damping: 16 }}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: 'rgba(0,200,83,0.12)',
          border: '1px solid rgba(0,200,83,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l2.5 2.5L9 1" stroke="#00C853" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

// ─── Transaction feed — resolve & rest (no loop) ──────────────────────────────
//
// Pure presentation. Rows reveal once on the conducted timeline; the success
// banner appears when `resolved` flips (at REST, owned by DashboardMockup) and
// stays. Fixed minHeight keeps the card from ever collapsing → no layout shift.
function TransactionFeedDemo({ resolved, reduced }: { resolved: boolean; reduced: boolean }) {
  return (
    <div style={{ minHeight: TRANSACTIONS.length * 46 + 56, position: 'relative' }}>
      {TRANSACTIONS.map((tx, i) => (
        <TxRow key={tx.id} tx={tx} index={i} reduced={reduced} />
      ))}

      {resolved && (
        <motion.div
          initial={reduced ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: ease.out }}
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: 'rgba(0,200,83,0.07)',
            border: '1px solid rgba(0,200,83,0.18)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <motion.div
            animate={reduced ? undefined : { opacity: [0.4, 1, 0.4] }}
            transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: '#00C853', flexShrink: 0,
              opacity: reduced ? 1 : undefined,
              boxShadow: '0 0 0 3px rgba(0,200,83,0.2)',
            }}
          />
          <span style={{ fontSize: 12, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
            COA validated · ready for review
          </span>
        </motion.div>
      )}
    </div>
  )
}

// ─── Browser chrome mockup card ───────────────────────────────────────────────

function DashboardMockup({ reduced }: { reduced: boolean }) {
  // The single derived "settle" beat. Scheduled on framer's rAF clock at REST
  // (= LOCK + a beat), so it stays in lockstep with the conducted entrance —
  // not a wall-clock setTimeout that could drift from the framer animations.
  const [resolved, setResolved] = useState(reduced)

  useEffect(() => {
    if (reduced) { setResolved(true); return }
    setResolved(false)
    const controls = animate(0, 1, {
      duration: 0.001,
      delay: REST,
      onComplete: () => setResolved(true),
    })
    return () => controls.stop()
  }, [reduced])

  return (
    /* Outer: entrance animation */
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.9, ease: ease.out, delay: HERO.card }}
      style={{ position: 'relative' }}
    >
      {/* Inner: continuous float — begins only after the sequence settles (REST) */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -12, 0] }}
        transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: REST }}
        style={{ position: 'relative' }}
      >
      {/* Wide soft glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 640, height: 480,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,200,83,0.16) 0%, rgba(0,200,83,0.04) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      {/* Tight inner bloom */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '20%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 220, height: 180,
          background: 'rgba(0,200,83,0.18)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Card */}
      <div
        style={{
          background: 'linear-gradient(160deg, #141414 0%, #0f0f0f 40%, #0a0a0a 100%)',
          border: '1px solid #252525',
          borderTop: '1px solid rgba(0,200,83,0.22)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.03) inset',
            '0 24px 80px rgba(0,0,0,0.85)',
            '0 8px 32px rgba(0,0,0,0.6)',
            '0 0 80px rgba(0,200,83,0.08)',
          ].join(', '),
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid #141414',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#080808',
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, opacity: 0.8 }} />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              height: 24,
              borderRadius: 6,
              background: '#141414',
              border: '1px solid #1f1f1f',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
            }}
          >
            <span style={{ fontSize: 10, color: '#444444', fontFamily: 'var(--font-mono)' }}>
              app.closebooks.io/review
            </span>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)' }}>
                Live categorization
              </span>

              {/* Status pill — flips from "Processing…" to a calm "Ready for
                  review" on the settle beat (REST). The pulse stops; it rests. */}
              {resolved ? (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 999,
                    background: 'rgba(0,200,83,0.12)',
                    border: '1px solid rgba(0,200,83,0.3)',
                  }}
                >
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 10, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    Ready for review
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 999,
                    background: 'rgba(0,200,83,0.08)',
                    border: '1px solid rgba(0,200,83,0.15)',
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#00C853' }}
                  />
                  <span style={{ fontSize: 10, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                    Processing…
                  </span>
                </div>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#444444', fontFamily: 'var(--font-sans)' }}>
              32 transactions · April 2025
            </p>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '30px 1fr auto auto auto',
              gap: 8,
              padding: '0 0 6px',
              borderBottom: '1px solid #1f1f1f',
              marginBottom: 2,
            }}
          >
            {['', 'Vendor', 'Amount', 'Category', ''].map((h, i) => (
              <span
                key={i}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#444444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Animated transaction rows */}
          <TransactionFeedDemo resolved={resolved} reduced={reduced} />
        </div>
      </div>

      {/* Floating stat pills — land on the conducted beats: "Confidence scored"
          as the rows lock (LOCK), "3 hrs to close" on the final settle (REST). */}
      <motion.div
        initial={reduced ? false : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reduced ? { duration: 0 } : { delay: LOCK, duration: 0.5, ease: ease.out }}
        style={{
          position: 'absolute',
          bottom: -18,
          left: -18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 16px',
          borderRadius: 999,
          background: 'rgba(6,6,6,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,200,83,0.28)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,83,0.08) inset',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 8px rgba(0,200,83,0.8)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#00C853', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
          Confidence scored
        </span>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reduced ? { duration: 0 } : { delay: REST, duration: 0.5, ease: ease.out }}
        style={{
          position: 'absolute',
          bottom: -26,
          right: -18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 16px',
          borderRadius: 999,
          background: 'rgba(6,6,6,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,200,83,0.28)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,83,0.08) inset',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 8px rgba(0,200,83,0.8)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#00C853', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
          3 hrs to close
        </span>
      </motion.div>

      </motion.div>
    </motion.div>
  )
}

// ─── Animated underline on "autopilot" ───────────────────────────────────────
//
// Mount-driven (the Hero is above the fold on load), drawing on the shared
// `LOCK` beat — the exact instant the final transaction row's checkmark locks.
// One constant, one rAF clock: the word and the proof land on the same downbeat.
function AnimatedUnderlineWord({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -6,
          left: 0,
          width: '100%',
          height: 10,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0 6 C20 2 50 9 80 4 C90 2 96 5 100 5"
          stroke="#00C853"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: ease.out, delay: LOCK }}
        />
      </svg>
    </span>
  )
}

// ─── Green dot separator ──────────────────────────────────────────────────────

function GreenDot() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: '#00C853',
        margin: '0 10px',
        verticalAlign: 'middle',
        opacity: 0.6,
      }}
    />
  )
}

// ─── Main Hero ────────────────────────────────────────────────────────────────

export default function Hero() {
  const reduced = usePrefersReducedMotion()

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 80,
        overflow: 'hidden',
      }}
    >
      {/* ── Background ── */}
      {/* Grid handled by globals.css on [data-theme="dark"] */}

      {/* Top atmospheric glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,200,83,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: 'relative',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
          width: '100%',
        }}
      >
        <div
          className="hero-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 64,
            alignItems: 'center',
          }}
        >
          <style jsx>{`
            @media (min-width: 900px) {
              .hero-two-col {
                grid-template-columns: 55fr 45fr !important;
              }
              .hero-right-col {
                display: flex !important;
              }
            }
          `}</style>

          {/* ════════════════════ LEFT COLUMN ════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Badge */}
            <motion.div
              {...entrance(HERO.badge, reduced)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 999,
                backgroundColor: 'rgba(0,200,83,0.08)',
                border: '1px solid rgba(0,200,83,0.2)',
                marginBottom: 28,
                width: 'fit-content',
              }}
            >
              <motion.span
                animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
                transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: '#00C853',
                  boxShadow: '0 0 0 3px rgba(0,200,83,0.2)',
                  flexShrink: 0,
                  opacity: reduced ? 1 : undefined,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 12, fontWeight: 500, color: '#00C853',
                  letterSpacing: '0.01em', fontFamily: 'var(--font-sans)',
                }}
              >
                Powered by Claude AI · Built for CPA firm workflows
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...entrance(HERO.h1, reduced)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(48px, 7vw, 72px)',
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: '#FAFAFA',
                margin: 0,
                marginBottom: 24,
                fontWeight: 400,
              }}
            >
              Month-end close,
              <br />
              on{' '}
              <AnimatedUnderlineWord reduced={reduced}>autopilot</AnimatedUnderlineWord>
              .
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...entrance(HERO.sub, reduced)}
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: '#888888',
                maxWidth: 480,
                margin: 0,
                marginBottom: 36,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.01em',
              }}
            >
              CloseBooks learns how your firm categorizes transactions, runs an
              AI-assisted close workflow, and helps your team review exceptions,
              validate accounts, export to QuickBooks, and send client-ready narratives.
            </motion.p>

            {/* CTA row */}
            <motion.div
              {...entrance(HERO.cta, reduced)}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 24,
                alignItems: 'center',
              }}
            >
              <MagneticButton>
                <Link
                  href="/signup"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#080808',
                    backgroundColor: '#00C853',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'background-color 200ms, box-shadow 200ms',
                    boxShadow: '0 6px 28px rgba(0,200,83,0.35)',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00E564'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,200,83,0.55)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00C853'
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,200,83,0.35)'
                  }}
                >
                  Start closing smarter
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </MagneticButton>

              <a
                href="#how"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '13px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#888888',
                  backgroundColor: 'transparent',
                  border: '1px solid #1f1f1f',
                  borderRadius: 10,
                  textDecoration: 'none',
                  transition: 'border-color 200ms, color 200ms',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#333333'
                  e.currentTarget.style.color = '#FAFAFA'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1f1f1f'
                  e.currentTarget.style.color = '#888888'
                }}
              >
                See how it works
              </a>
            </motion.div>

            {/* Trust line */}
            <motion.p
              {...entrance(HERO.trust, reduced)}
              style={{
                fontSize: 13,
                color: '#444444',
                margin: 0,
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0,
                lineHeight: 2,
              }}
            >
              No credit card required
              <GreenDot />
              14-day trial
              <GreenDot />
              Set up in under 2 minutes
            </motion.p>
          </div>

          {/* ════════════════════ RIGHT COLUMN ════════════════════ */}
          <div
            className="hero-right-col"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              paddingBottom: 32,
              paddingTop: 16,
            }}
          >
            <div style={{ width: '100%', maxWidth: 520 }}>
              <DashboardMockup reduced={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
