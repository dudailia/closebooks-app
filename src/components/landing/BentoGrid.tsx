'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from '@/components/ui/GlowCard'

// ─── Card 1: Before/After toggle ─────────────────────────────────────────────

const TXS = [
  { name: 'Notion Labs',  wrong: 'Personal',     right: 'Software'             },
  { name: 'Amazon AWS',   wrong: 'Office Misc',  right: 'Cloud Infrastructure' },
  { name: 'Stripe',       wrong: 'Unknown',      right: 'Transaction Fees'     },
  { name: 'DoorDash',     wrong: 'Entertainment',right: 'Meals'                },
  { name: 'Uber',         wrong: 'Other',        right: 'Travel'               },
]

function BeforeAfterVisual() {
  const [after, setAfter] = useState(false)

  return (
    <div style={{ marginTop: 20 }}>
      {/* Toggle row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setAfter(v => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px 5px 5px',
            borderRadius: 999,
            border: `1px solid ${after ? 'rgba(0,200,83,0.3)' : '#222'}`,
            background: after ? 'rgba(0,200,83,0.07)' : '#101010',
            cursor: 'pointer',
            transition: 'border-color 250ms, background 250ms',
            minHeight: 'auto',
          }}
        >
          {/* Track */}
          <div
            style={{
              position: 'relative',
              width: 30, height: 16, borderRadius: 999,
              background: after ? '#00C853' : '#222',
              border: after ? 'none' : '1px solid #333',
              flexShrink: 0,
              transition: 'background 250ms',
            }}
          >
            <motion.div
              animate={{ x: after ? 14 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              style={{
                position: 'absolute',
                top: 1, left: 0,
                width: 14, height: 14, borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)',
              color: after ? '#00C853' : '#555',
              transition: 'color 250ms',
            }}
          >
            {after ? 'After CloseBooks' : 'Before CloseBooks'}
          </span>
        </button>
      </div>

      {/* Transaction rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {TXS.map((tx, i) => (
          <div
            key={tx.name}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
              padding: '7px 10px',
              background: '#080808', border: '1px solid #141414', borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 12, color: '#FAFAFA', fontFamily: 'var(--font-sans)', flex: 1 }}>
              {tx.name}
            </span>
            {/* Badge — key change causes remount → entrance animation */}
            <motion.span
              key={`${after ? 'after' : 'before'}-${i}`}
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 10, fontWeight: 500,
                padding: '2px 8px', borderRadius: 999,
                backgroundColor: after ? 'rgba(0,200,83,0.08)' : 'rgba(255,68,68,0.07)',
                border: `1px solid ${after ? 'rgba(0,200,83,0.2)' : 'rgba(255,68,68,0.2)'}`,
                color: after ? '#00C853' : '#FF6B6B',
                fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                textDecoration: after ? 'none' : 'line-through',
              }}
            >
              {after ? tx.right : tx.wrong}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card 2: Progress tracker ─────────────────────────────────────────────────

const STEPS = [
  { emoji: '📄', label: 'Statement uploaded'   },
  { emoji: '🔍', label: 'Parsing transactions'  },
  { emoji: '🧠', label: 'AI categorization'     },
  { emoji: '⚠️',  label: 'Exceptions flagged'   },
  { emoji: '📋', label: 'Narrative generated'   },
]

function ProgressTracker() {
  const [active, setActive] = useState(2)
  useEffect(() => {
    const iv = setInterval(() => setActive(s => (s + 1) % STEPS.length), 3800)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 20 }}>
      {STEPS.map((step, i) => {
        const done    = i < active
        const current = i === active
        const pending = i > active

        return (
          <div key={step.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Dot + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
              <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {done && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(0,200,83,0.12)',
                    border: '1px solid rgba(0,200,83,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5l2 2 5-4" stroke="#00C853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                {current && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.6, 0.1, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', width: 18, height: 18,
                        borderRadius: '50%', background: 'rgba(0,200,83,0.25)',
                      }}
                    />
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#00C853',
                      boxShadow: '0 0 10px rgba(0,200,83,0.7)',
                      position: 'relative', zIndex: 1,
                    }} />
                  </>
                )}
                {pending && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#1a1a1a', border: '1px solid #252525',
                  }} />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 1, height: 28,
                  background: done ? 'rgba(0,200,83,0.25)' : '#1a1a1a',
                  transition: 'background 500ms',
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: 3, paddingBottom: i < STEPS.length - 1 ? 28 : 0 }}>
              <span style={{
                fontSize: 13,
                fontWeight: current ? 600 : 400,
                color: done ? '#555' : current ? '#FAFAFA' : '#333',
                fontFamily: 'var(--font-sans)',
                transition: 'color 300ms',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{step.emoji}</span>
                {step.label}
                {current && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ fontSize: 10, color: '#00C853', fontWeight: 500 }}
                  >
                    running
                  </motion.span>
                )}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Card 3: Rules engine visual ──────────────────────────────────────────────

function RuleBlock() {
  const rules = [
    { vendor: '"Amazon AWS"', cat: '"Cloud Infrastructure"', hits: 47 },
    { vendor: '"Notion Labs"',  cat: '"Software"',           hits: 31 },
    { vendor: '"DoorDash*"',    cat: '"Meals"',              hits: 22 },
  ]
  return (
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rules.map((r, i) => (
        <motion.div
          key={r.vendor}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ delay: i * 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            padding: '8px 11px',
            background: '#080808',
            border: '1px solid #1a1a1a',
            borderRadius: 8,
            borderLeft: '2px solid rgba(0,200,83,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#555' }}>IF</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#F97316' }}>{r.vendor}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00C853' }}>→</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#69B6FF' }}>{r.cat}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#333' }}>{r.hits}× applied</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Card 4: Narrative preview ────────────────────────────────────────────────

function NarrativePreview() {
  const lines = [
    { w: 92, bright: true },
    { w: 78, bright: false },
    { w: 85, bright: false },
    { w: 60, bright: false },
    { w: 70, bright: false },
  ]
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          padding: '14px',
          background: '#080808',
          border: '1px solid #1a1a1a',
          borderTop: '1px solid rgba(0,200,83,0.15)',
          borderRadius: 8,
          position: 'relative',
        }}
      >
        {/* Cursor blink on first line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          <div style={{ flex: `0 0 ${lines[0].w}%`, height: 8, borderRadius: 4, background: '#2a2a2a' }} />
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'steps(1)' }}
            style={{ width: 2, height: 11, background: '#00C853', borderRadius: 1, flexShrink: 0 }}
          />
        </div>
        {lines.slice(1).map((l, i) => (
          <div key={i} style={{ height: 8, width: `${l.w}%`, borderRadius: 4, background: '#1a1a1a', marginBottom: i < lines.length - 2 ? 7 : 0 }} />
        ))}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#444', fontFamily: 'var(--font-sans)' }}>April 2025 report</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)', color: '#00C853', fontFamily: 'var(--font-sans)' }}>
            AI ✦
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Card 5: Multi-client avatars ────────────────────────────────────────────

const CLIENTS = [
  { init: 'AK', color: '#1E4ED8' }, { init: 'BR', color: '#EA580C' },
  { init: 'CP', color: '#7C3AED' }, { init: 'DL', color: '#0D9488' },
  { init: 'EF', color: '#DC2626' }, { init: 'FG', color: '#059669' },
  { init: 'GH', color: '#D97706' }, { init: 'HI', color: '#4B5563' },
  { init: 'IJ', color: '#BE185D' },
]

function ClientGrid() {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 12 }}>
        {CLIENTS.map((c, i) => (
          <motion.div
            key={c.init}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 360, damping: 18 }}
          >
            <div
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: `${c.color}18`,
                border: `1px solid ${c.color}38`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: c.color, fontFamily: 'var(--font-sans)' }}>
                {c.init}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#444', fontFamily: 'var(--font-sans)' }}>
          +491 more firms
        </p>
        <div style={{ display: 'flex', gap: -4 }}>
          {CLIENTS.slice(0, 4).map((c, i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: `${c.color}30`, border: `1.5px solid #080808`, marginLeft: i > 0 ? -6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, fontWeight: 700, color: c.color, fontFamily: 'var(--font-sans)' }}>{c.init}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Green icon wrapper ───────────────────────────────────────────────────────

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(0,200,83,0.08)',
        border: '1px solid rgba(0,200,83,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#00C853', marginBottom: 14, flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
}

// ─── Staggered headline ───────────────────────────────────────────────────────

// Uses whileInView per-word — more reliable than useInView + animate pattern
function StaggerWords({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline' }}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={word + i}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ delay: i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block', marginRight: '0.26em', ...style }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BentoGrid() {
  const gridRef = useRef<HTMLDivElement | null>(null)

  return (
    <section id="features" style={{ padding: '120px 0 100px', position: 'relative' }}>
      <style jsx>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: auto auto;
          gap: 12px;
        }
        .bento-card-large { grid-column: span 7; }
        .bento-card-tall  { grid-column: span 5; }
        .bento-card-small { grid-column: span 4; }

        @media (max-width: 960px) {
          .bento-grid {
            grid-template-columns: 1fr 1fr;
          }
          .bento-card-large,
          .bento-card-tall { grid-column: span 2; }
          .bento-card-small { grid-column: span 1; }
        }
        @media (max-width: 600px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-card-large,
          .bento-card-tall,
          .bento-card-small { grid-column: span 1; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>

        {/* ── Section header ── */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            style={{
              margin: 0, marginBottom: 18,
              fontSize: 12, fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#00C853', fontFamily: 'var(--font-sans)',
            }}
          >
            Features
          </motion.p>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 56px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              margin: 0, marginBottom: 4,
              fontWeight: 400,
            }}
          >
            <StaggerWords
              text="Everything a month-end close needs."
              style={{ color: '#FAFAFA' }}
            />
          </h2>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 56px)',
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              margin: 0,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#333333',
            }}
          >
            <StaggerWords text="Nothing it doesn't." />
          </h2>
        </div>

        {/* ── Bento grid ── */}
        <div ref={gridRef} className="bento-grid">

          {/* ─ CARD 1: Large — AI categorization ─ */}
          <motion.div
            className="bento-card-large"
            initial={{ scale: 0.96, opacity: 0, y: 14 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard style={{ padding: 28, height: '100%', minHeight: 360 }}>
              <FeatureIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </FeatureIcon>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)', letterSpacing: '-0.025em' }}>
                AI that learns your firm
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#888', fontFamily: 'var(--font-sans)', maxWidth: 480 }}>
                Claude reads your correction patterns and firm rules so repeat vendors get more consistent every close.
              </p>
              <BeforeAfterVisual />
            </GlowCard>
          </motion.div>

          {/* ─ CARD 2: Tall — Close agent ─ */}
          <motion.div
            className="bento-card-tall"
            initial={{ scale: 0.96, opacity: 0, y: 14 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard style={{ padding: 28, height: '100%', minHeight: 360 }}>
              <FeatureIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 5v3l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </FeatureIcon>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)', letterSpacing: '-0.025em' }}>
                Guided close workflow
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#888', fontFamily: 'var(--font-sans)' }}>
                Upload the bank statement. AI suggests categories; your team approves exceptions.
              </p>
              <ProgressTracker />
            </GlowCard>
          </motion.div>

          {/* ─ CARD 3: Small — Rules engine ─ */}
          <motion.div
            className="bento-card-small"
            initial={{ scale: 0.96, opacity: 0, y: 14 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.16, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard style={{ padding: 24, height: '100%', minHeight: 260 }}>
              <FeatureIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </FeatureIcon>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 17, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
                Rules engine
              </h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#888', fontFamily: 'var(--font-sans)' }}>
                Teach it once. CloseBooks applies your firm's rules to every future transaction, automatically.
              </p>
              <RuleBlock />
            </GlowCard>
          </motion.div>

          {/* ─ CARD 4: Small — Narratives ─ */}
          <motion.div
            className="bento-card-small"
            initial={{ scale: 0.96, opacity: 0, y: 14 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.22, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard style={{ padding: 24, height: '100%', minHeight: 260 }}>
              <FeatureIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </FeatureIcon>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 17, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
                Auto-generated narratives
              </h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#888', fontFamily: 'var(--font-sans)' }}>
                Ship client-ready month-end summaries without writing a single word.
              </p>
              <NarrativePreview />
            </GlowCard>
          </motion.div>

          {/* ─ CARD 5: Small — Multi-client ─ */}
          <motion.div
            className="bento-card-small"
            initial={{ scale: 0.96, opacity: 0, y: 14 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ delay: 0.30, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard style={{ padding: 24, height: '100%', minHeight: 260 }}>
              <FeatureIcon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </FeatureIcon>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 17, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
                500 clients, one dashboard
              </h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#888', fontFamily: 'var(--font-sans)' }}>
                Manage your entire book of business from a single workspace.
              </p>
              <ClientGrid />
            </GlowCard>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
