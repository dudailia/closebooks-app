'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

// ─── Data ─────────────────────────────────────────────────────────────────────

const RAW_TXS = [
  { raw: 'AMZN*MKT*7H3K9',     amt: '$412.09', cat: 'Cloud Infrastructure', conf: 99, flag: false },
  { raw: 'DOORDASH*ORDER_8823', amt: '$38.12',  cat: 'Meals',                conf: 94, flag: false },
  { raw: 'UBER* TRIP 4XKQ',    amt: '$22.80',  cat: 'Travel',               conf: 91, flag: false },
  { raw: 'SLACK TECHNOLOGIES',  amt: '$87.50',  cat: 'Communications',       conf: 97, flag: false },
  { raw: 'GOOG*ADS-9284',       amt: '$280.00', cat: 'Marketing',            conf: 71, flag: true  },
]

const EXCEPTIONS = [
  { vendor: 'GOOG*ADS-9284',     amt: '$280.00', note: 'Low confidence (71%) — verify category' },
  { vendor: 'AMZN*FRESH-4421',   amt: '$54.20',  note: 'Maps to multiple categories'            },
  { vendor: 'INTUIT*QBO-MAR',    amt: '$130.00', note: 'Possible duplicate — check April'       },
]

// Deterministic confetti (no Math.random to avoid hydration mismatch)
const CONFETTI = [
  { sx: 42, ex: 12, ey: -52, c: '#00C853', r: false, d: 0,    t: 0.9  },
  { sx: 55, ex: 72, ey: -64, c: '#69FF8C', r: true,  d: 0.05, t: 0.8  },
  { sx: 30, ex: 6,  ey: -48, c: '#FAFAFA', r: false, d: 0.1,  t: 1.0  },
  { sx: 65, ex: 86, ey: -70, c: '#00C853', r: true,  d: 0.02, t: 0.85 },
  { sx: 48, ex: 60, ey: -58, c: '#69FF8C', r: false, d: 0.12, t: 0.95 },
  { sx: 35, ex: 18, ey: -44, c: '#FAFAFA', r: true,  d: 0.07, t: 0.75 },
  { sx: 58, ex: 78, ey: -74, c: '#00C853', r: false, d: 0.03, t: 1.1  },
  { sx: 25, ex: 5,  ey: -54, c: '#00E564', r: true,  d: 0.15, t: 0.8  },
  { sx: 72, ex: 91, ey: -50, c: '#FAFAFA', r: false, d: 0.06, t: 0.9  },
  { sx: 40, ex: 50, ey: -62, c: '#00C853', r: true,  d: 0.09, t: 1.0  },
  { sx: 52, ex: 34, ey: -66, c: '#69FF8C', r: false, d: 0.04, t: 0.85 },
  { sx: 63, ex: 82, ey: -72, c: '#00E564', r: true,  d: 0.11, t: 0.9  },
]

const STEPS = [
  {
    num: '01',
    title: 'Drop in the statement',
    body: 'CSV or PDF — CloseBooks parses every line item, normalizes vendor names, and prepares transactions for categorization. No formatting required.',
  },
  {
    num: '02',
    title: 'Watch AI do the work',
    body: "Claude reads each transaction, applies your firm's learned rules, and returns a confidence-scored category. Lower-confidence items are flagged for your 60-second review.",
  },
  {
    num: '03',
    title: 'Review. Approve. Done.',
    body: 'You only see what needs human judgment — usually 3–5 transactions out of hundreds. One click approves the close and generates your client narrative.',
  },
]

// ─── Visual 1: File Upload ────────────────────────────────────────────────────

function Visual1Upload({ active }: { active: boolean }) {
  const [cycleKey,    setCycleKey]    = useState(0)
  const [phase,       setPhase]       = useState<'idle' | 'dropping' | 'filling' | 'table'>('idle')
  const [progressPct, setProgressPct] = useState(0)

  useEffect(() => {
    if (!active) return
    setPhase('idle')
    setProgressPct(0)
    const t1 = setTimeout(() => setPhase('dropping'),             600)
    const t2 = setTimeout(() => { setPhase('filling'); setProgressPct(0) }, 1500)
    const t3 = setTimeout(() => setProgressPct(100),              1580)
    const t4 = setTimeout(() => setPhase('table'),                3000)
    const t5 = setTimeout(() => setCycleKey(k => k + 1),          6800)
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout) }
  }, [cycleKey, active])

  return (
    <div style={{ padding: '20px 22px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 14, height: 440, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>

      {/* Drop zone */}
      <div style={{ position: 'relative' }}>
        {/* Falling file icon */}
        <motion.div
          key={`file-${cycleKey}`}
          initial={{ y: -70, opacity: 0 }}
          animate={
            phase === 'dropping' ? { y: 0, opacity: 1 } :
            phase === 'filling'  ? { y: 12, opacity: 0.6 } :
            phase === 'table'    ? { y: 20, opacity: 0 } :
                                   { y: -70, opacity: 0 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ width: 46, height: 56, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            {[22, 18, 20].map((w, i) => <div key={i} style={{ height: 2, width: w, background: i === 0 ? '#333' : '#222', borderRadius: 1 }} />)}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#444', letterSpacing: '0.05em', marginTop: 2 }}>CSV</span>
          </div>
        </motion.div>

        <div style={{
          border: `1.5px dashed ${phase === 'dropping' || phase === 'filling' ? 'rgba(0,200,83,0.4)' : '#1f1f1f'}`,
          borderRadius: 10, padding: '18px 14px', textAlign: 'center',
          background: phase === 'dropping' || phase === 'filling' ? 'rgba(0,200,83,0.04)' : 'transparent',
          transition: 'border-color 300ms, background 300ms', minHeight: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          {phase === 'idle' && (
            <>
              <p style={{ margin: 0, fontSize: 12, color: '#444', fontFamily: 'var(--font-sans)' }}>Drop CSV or PDF here</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: '#2a2a2a', fontFamily: 'var(--font-sans)' }}>or click to browse</p>
            </>
          )}
          {phase === 'dropping' && (
            <p style={{ margin: 0, fontSize: 12, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 500, marginTop: 28 }}>
              bank_statement_apr25.csv
            </p>
          )}
          {phase === 'filling' && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-sans)' }}>Parsing…</span>
                <span style={{ fontSize: 11, color: '#00C853', fontFamily: 'var(--font-mono)' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 3, background: '#1a1a1a', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#00C853,#69FF8C)', borderRadius: 999, transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 8px rgba(0,200,83,0.5)' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw transactions table */}
      <motion.div
        key={`tbl-${cycleKey}`}
        initial={{ opacity: 0, y: 10 }}
        animate={phase === 'table' ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: '#333', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Raw import · 32 rows
          </span>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ fontSize: 10, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '2px 7px', borderRadius: 999, background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.15)' }}
          >
            Analyzing…
          </motion.span>
        </div>
        <div style={{ background: '#080808', border: '1px solid #141414', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '5px 10px', borderBottom: '1px solid #141414' }}>
            {['Description', 'Amount'].map(h => <span key={h} style={{ fontSize: 9, color: '#2a2a2a', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>{h}</span>)}
          </div>
          {RAW_TXS.map((tx, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '6px 10px', borderBottom: i < RAW_TXS.length - 1 ? '1px solid #0d0d0d' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#3a3a3a', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.raw}</span>
              <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>-{tx.amt}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Typewriter cell ──────────────────────────────────────────────────────────

function TW({ text, delayMs }: { text: string; delayMs: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const t = setTimeout(() => {
      const iv = setInterval(() => setN(c => { if (c >= text.length) { clearInterval(iv); return c } return c + 1 }), 28)
      return () => clearInterval(iv)
    }, delayMs)
    return () => clearTimeout(t)
  }, [text, delayMs])
  return <>{text.slice(0, n)}</>
}

// ─── Visual 2: AI Categorization ─────────────────────────────────────────────

function Visual2Categorize({ active }: { active: boolean }) {
  const [cycleKey, setCycleKey] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setCycleKey(k => k + 1), 6200)
    return () => clearTimeout(t)
  }, [cycleKey, active])

  return (
    <div key={cycleKey} style={{ padding: '20px 22px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 14, height: 440, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)' }}>AI Categorization</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C853' }} />
          <span style={{ fontSize: 10, color: '#00C853', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Running</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.8fr auto', gap: 8, padding: '4px 8px', borderBottom: '1px solid #1a1a1a', marginBottom: 2 }}>
        {['Vendor', 'Category', 'Conf.'].map(h => <span key={h} style={{ fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>{h}</span>)}
      </div>

      <div style={{ flex: 1 }}>
        {RAW_TXS.map((tx, i) => {
          const rowDelay = i * 680
          return (
            <motion.div
              key={`${cycleKey}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowDelay / 1000, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'grid', gridTemplateColumns: '1.6fr 1.8fr auto', gap: 8,
                padding: '9px 8px', alignItems: 'center',
                borderBottom: i < RAW_TXS.length - 1 ? '1px solid #0d0d0d' : 'none',
                borderLeft: `2px solid ${tx.flag ? 'rgba(245,158,11,0.5)' : 'rgba(0,200,83,0.2)'}`,
                background: tx.flag ? 'rgba(245,158,11,0.03)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 11, color: tx.flag ? '#F59E0B' : '#FAFAFA', fontFamily: 'var(--font-sans)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tx.raw.split('*')[0]}
              </span>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 999, background: tx.flag ? 'rgba(245,158,11,0.1)' : 'rgba(0,200,83,0.08)', border: `1px solid ${tx.flag ? 'rgba(245,158,11,0.25)' : 'rgba(0,200,83,0.18)'}`, color: tx.flag ? '#F59E0B' : '#00C853', fontFamily: 'var(--font-sans)', display: 'inline-block', minWidth: 60 }}>
                <TW text={tx.cat} delayMs={rowDelay + 280} />
              </span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (rowDelay + 620) / 1000 }}
                style={{ fontSize: 11, color: tx.conf >= 90 ? '#00C853' : '#F59E0B', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {tx.conf}%
              </motion.span>
            </motion.div>
          )
        })}
      </div>

      {/* Summary footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.8 }}
        style={{ paddingTop: 12, borderTop: '1px solid #141414', display: 'flex', justifyContent: 'space-between' }}
      >
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'var(--font-sans)' }}>4/5 auto-categorized</span>
        <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'var(--font-sans)' }}>1 exception →</span>
      </motion.div>
    </div>
  )
}

// ─── Visual 3: Review & Approve ───────────────────────────────────────────────

function Visual3Review({ active }: { active: boolean }) {
  const [cycleKey,     setCycleKey]     = useState(0)
  const [approved,     setApproved]     = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!active) return
    setApproved(false)
    setShowConfetti(false)
    const t1 = setTimeout(() => { setApproved(true); setShowConfetti(true) }, 2400)
    const t2 = setTimeout(() => setShowConfetti(false),                       3600)
    const t3 = setTimeout(() => setCycleKey(k => k + 1),                      6200)
    return () => { [t1, t2, t3].forEach(clearTimeout) }
  }, [cycleKey, active])

  return (
    <div key={cycleKey} style={{ padding: '20px 22px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 14, height: 440, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#FAFAFA', fontFamily: 'var(--font-sans)' }}>Exceptions review</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#444', fontFamily: 'var(--font-sans)' }}>3 of 32 transactions need attention</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontFamily: 'var(--font-sans)' }}>
          3 flagged
        </span>
      </div>

      {/* Exception rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {EXCEPTIONS.map((ex, i) => (
          <motion.div
            key={ex.vendor}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: approved ? 0.3 : 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            style={{ padding: '9px 11px', background: '#080808', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, borderLeft: '3px solid rgba(245,158,11,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#FAFAFA', fontFamily: 'var(--font-sans)' }}>{ex.vendor}</span>
              <span style={{ fontSize: 11, color: '#FF4444', fontFamily: 'var(--font-mono)' }}>{ex.amt}</span>
            </div>
            <span style={{ fontSize: 10, color: '#F59E0B', fontFamily: 'var(--font-sans)' }}>⚠ {ex.note}</span>
          </motion.div>
        ))}
      </div>

      {/* Approve button */}
      <div style={{ marginTop: 16, position: 'relative' }}>
        <motion.button
          type="button"
          animate={approved ? { background: '#00C853', boxShadow: '0 4px 32px rgba(0,200,83,0.5)' } : { background: 'rgba(0,200,83,0.08)', boxShadow: '0 0 0 1px rgba(0,200,83,0.2)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{ width: '100%', padding: '13px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'auto', outline: 'none', fontFamily: 'var(--font-sans)' }}
        >
          {approved ? (
            <motion.span key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>
              ✓  Close complete · Sent to client
            </motion.span>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 600, color: '#00C853' }}>Approve close →</span>
          )}
        </motion.button>

        {/* Confetti burst */}
        {showConfetti && (
          <div style={{ position: 'absolute', bottom: '50%', left: 0, right: 0, pointerEvents: 'none', overflow: 'visible' }}>
            {CONFETTI.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: `${p.sx}%`, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{ x: `${p.ex}%`, y: p.ey, opacity: 0, rotate: 360, scale: 0.3 }}
                transition={{ duration: p.t, ease: 'easeOut', delay: p.d }}
                style={{ position: 'absolute', bottom: 0, width: 7, height: 7, borderRadius: p.r ? '50%' : 2, backgroundColor: p.c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HowItWorks() {
  // One ref per step — useInView fires when each step crosses the viewport centre
  const s1Ref = useRef<HTMLDivElement>(null)
  const s2Ref = useRef<HTMLDivElement>(null)
  const s3Ref = useRef<HTMLDivElement>(null)

  const s1 = useInView(s1Ref, { margin: '-45% 0px -45% 0px', once: false })
  const s2 = useInView(s2Ref, { margin: '-45% 0px -45% 0px', once: false })
  const s3 = useInView(s3Ref, { margin: '-45% 0px -45% 0px', once: false })

  // Last in-view step wins; default to 0
  const step = s3 ? 2 : s2 ? 1 : s1 ? 0 : 0

  const stepRefs = [s1Ref, s2Ref, s3Ref]

  return (
    <section id="how" style={{ background: '#080808' }}>
      <style jsx global>{`
        @media (max-width: 860px) {
          .how-left  { display: none !important; }
          .how-cols  { display: block !important; }
          .how-step  { height: auto !important; min-height: auto !important; padding: 48px 28px !important; }
        }
      `}</style>

      {/* ── Section header ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 28px 80px', textAlign: 'center' }}>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.5 }}
          style={{ margin: 0, marginBottom: 18, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00C853', fontFamily: 'var(--font-sans)' }}
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#FAFAFA' }}
        >
          From bank import to client report{' '}
          <span style={{ fontStyle: 'italic', color: '#444' }}>in one afternoon.</span>
        </motion.h2>
      </div>

      {/* ── Two-column sticky layout ── */}
      <div
        className="how-cols"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}
      >
        {/* LEFT — sticky panel */}
        <div
          className="how-left"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            alignSelf: 'start',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 40,
            paddingTop: 24,
            paddingBottom: 24,
            overflow: 'hidden',
          }}
        >
          {/* Step indicator strip */}
          <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{
                  height: step === i ? 32 : 14,
                  opacity: step === i ? 1 : 0.25,
                  background: step === i ? '#00C853' : '#333',
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: 3, borderRadius: 999 }}
              />
            ))}
          </div>

          {/* Ambient glow */}
          <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 440, height: 440, background: 'radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Single active visual — AnimatePresence for crossfade */}
          <div style={{ width: '100%', position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`visual-${step}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && <Visual1Upload active />}
                {step === 1 && <Visual2Categorize active />}
                {step === 2 && <Visual3Review active />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — scrollable step text */}
        <div style={{ paddingLeft: 48 }}>
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              ref={stepRefs[i]}
              className="how-step"
              style={{ height: '100vh', display: 'flex', alignItems: 'center' }}
            >
              <motion.div
                animate={{ opacity: step === i ? 1 : 0.22, x: step === i ? 0 : 16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxWidth: 460 }}
              >
                <motion.p
                  animate={{ color: step === i ? '#00C853' : '#2a2a2a' }}
                  transition={{ duration: 0.4 }}
                  style={{ margin: 0, marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}
                >
                  {s.num}
                </motion.p>
                <h3 style={{ margin: 0, marginBottom: 18, fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 3.5vw, 42px)', fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1.08, color: '#FAFAFA' }}>
                  {s.title}
                </h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: '#888', fontFamily: 'var(--font-sans)' }}>
                  {s.body}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
