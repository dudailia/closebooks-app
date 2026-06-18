'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const STAGES = [
  {
    eyebrow: 'Inbox',
    title: 'Client docs arrive',
    copy: 'Statements, receipts, and questions land in one close queue.',
    metric: '12 files captured',
    accent: '#38BDF8',
  },
  {
    eyebrow: 'AI close',
    title: 'Transactions classify themselves',
    copy: 'CloseBooks maps vendors to accounts, applies rules, and flags uncertainty.',
    metric: '428 rows analyzed',
    accent: '#00C853',
  },
  {
    eyebrow: 'Trust layer',
    title: 'COA validation catches mistakes',
    copy: 'Suggestions must resolve to the client chart before export is allowed.',
    metric: '7 exceptions isolated',
    accent: '#F59E0B',
  },
  {
    eyebrow: 'Delivery',
    title: 'Exports and narrative go out',
    copy: 'QuickBooks-ready files and client-ready close notes are prepared together.',
    metric: 'Close package ready',
    accent: '#A855F7',
  },
] as const

const LEDGER_ROWS = [
  ['AWS', 'Cloud Infrastructure', '$412.09', 'validated'],
  ['Stripe', 'Merchant Fees', '$128.44', 'validated'],
  ['Gusto', 'Payroll & Wages', '$4,820.00', 'validated'],
  ['Google Ads', 'Marketing', '$640.00', 'review'],
]

function GlowOrb({ delay, size, top, left }: { delay: number; size: number; top: string; left: string }) {
  return (
    <motion.div
      aria-hidden
      animate={{ opacity: [0.12, 0.38, 0.12], scale: [0.9, 1.18, 0.9] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,83,0.28), transparent 68%)',
        filter: 'blur(4px)',
        pointerEvents: 'none',
      }}
    />
  )
}

function StageRail({ active }: { active: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 10 }}>
      {STAGES.map((stage, index) => {
        const isActive = index === active
        const isDone = index < active
        return (
          <motion.div
            key={stage.title}
            animate={{
              borderColor: isActive ? `${stage.accent}80` : isDone ? 'rgba(0,200,83,0.3)' : '#1f1f1f',
              backgroundColor: isActive ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.025)',
              y: isActive ? -4 : 0,
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              minHeight: 142,
              border: '1px solid #1f1f1f',
              borderRadius: 18,
              padding: 16,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="automation-active-glow"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 50% 0%, ${stage.accent}24, transparent 58%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: stage.accent, fontWeight: 700 }}>
                  {stage.eyebrow}
                </span>
                <motion.span
                  animate={{ scale: isActive ? [1, 1.25, 1] : 1 }}
                  transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: isDone || isActive ? stage.accent : '#333',
                    boxShadow: isActive ? `0 0 18px ${stage.accent}` : 'none',
                  }}
                />
              </div>
              <h3 style={{ margin: 0, color: '#FAFAFA', fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {stage.title}
              </h3>
              <p style={{ margin: '8px 0 12px', color: '#888', fontSize: 13, lineHeight: 1.45 }}>
                {stage.copy}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  padding: '4px 9px',
                  borderRadius: 999,
                  color: isActive ? stage.accent : '#666',
                  backgroundColor: isActive ? `${stage.accent}12` : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${isActive ? `${stage.accent}30` : '#1f1f1f'}`,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {stage.metric}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function AutomationConsole({ active }: { active: number }) {
  const activeStage = STAGES[active]
  const progress = useMemo(() => ((active + 1) / STAGES.length) * 100, [active])

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(18,18,18,0.92), rgba(8,8,8,0.96))',
        borderRadius: 28,
        padding: 18,
        boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,200,83,0.08) inset',
        overflow: 'hidden',
      }}
    >
      <GlowOrb delay={0} size={280} top="-90px" left="-80px" />
      <GlowOrb delay={1.2} size={220} top="52%" left="72%" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
              Autonomous close live
            </p>
            <h3 style={{ margin: '6px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.035em' }}>
              {activeStage.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#FF5F57', '#FFBD2E', '#28C840'].map((color) => (
              <span key={color} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, opacity: 0.8 }} />
            ))}
          </div>
        </div>

        <div style={{ height: 3, borderRadius: 999, backgroundColor: '#161616', overflow: 'hidden', marginBottom: 18 }}>
          <motion.div
            animate={{ width: `${progress}%`, backgroundColor: activeStage.accent }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', borderRadius: 999, boxShadow: `0 0 22px ${activeStage.accent}` }}
          />
        </div>

        <div className="automation-console-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.25fr 0.9fr', gap: 14 }}>
          <div style={{ border: '1px solid #1f1f1f', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.025)', padding: 14 }}>
            <p style={{ margin: 0, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>Client intake</p>
            {['bank_statement.pdf', 'receipts.zip', 'payroll.csv'].map((file, index) => (
              <motion.div
                key={file}
                animate={{ x: active === 0 ? [0, 6, 0] : 0, borderColor: active === 0 && index === active % 3 ? 'rgba(56,189,248,0.45)' : '#1f1f1f' }}
                transition={{ duration: 1.4, repeat: active === 0 ? Infinity : 0, delay: index * 0.12 }}
                style={{ marginTop: 10, padding: '9px 10px', border: '1px solid #1f1f1f', borderRadius: 12, color: '#CFCFCF', fontSize: 12, backgroundColor: '#0B0B0B' }}
              >
                {file}
              </motion.div>
            ))}
          </div>

          <div style={{ border: '1px solid rgba(0,200,83,0.18)', borderRadius: 18, backgroundColor: 'rgba(0,200,83,0.035)', padding: 14 }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>AI ledger</p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {LEDGER_ROWS.map(([vendor, category, amount, status], index) => (
                <motion.div
                  key={vendor}
                  initial={false}
                  animate={{ opacity: active >= 1 ? 1 : 0.35, y: active === 1 ? [0, -2, 0] : 0 }}
                  transition={{ duration: 0.7, delay: index * 0.08 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 12, backgroundColor: '#090909', border: '1px solid #181818' }}
                >
                  <span style={{ color: '#FAFAFA', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor}</span>
                  <span style={{ color: status === 'review' ? '#F59E0B' : '#00C853', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category}</span>
                  <span style={{ color: '#888', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{amount}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #1f1f1f', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.025)', padding: 14 }}>
            <p style={{ margin: 0, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>Output</p>
            {['QBO export', 'Client narrative', 'Exception list'].map((item, index) => (
              <motion.div
                key={item}
                animate={{ opacity: active >= 3 ? 1 : 0.45, scale: active >= 3 ? 1 : 0.98 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                style={{ marginTop: 10, padding: '9px 10px', border: '1px solid #1f1f1f', borderRadius: 12, color: active >= 3 ? '#FAFAFA' : '#666', fontSize: 12, backgroundColor: '#0B0B0B' }}
              >
                {active >= 3 ? 'Ready: ' : 'Queued: '}{item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AutomationTheater() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActive((current) => (current + 1) % STAGES.length), 2600)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        background: '#080808',
        padding: '110px 28px 120px',
        borderTop: '1px solid #101010',
        overflow: 'hidden',
      }}
    >
      <style jsx global>{`
        @media (max-width: 980px) {
          .automation-copy-grid,
          .automation-console-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .automation-stage-wrap {
            overflow-x: auto;
            padding-bottom: 6px;
          }
          .automation-stage-wrap > div {
            min-width: 760px;
          }
        }
      `}</style>

      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 8%, rgba(0,200,83,0.12), transparent 42%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)' }} />

      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="automation-copy-grid" style={{ display: 'grid', gridTemplateColumns: '0.88fr 1.12fr', gap: 44, alignItems: 'end', marginBottom: 38 }}>
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}
            >
              Automation that feels impossible
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 6vw, 74px)', lineHeight: 0.96, letterSpacing: '-0.055em', fontWeight: 400 }}
            >
              The close runs while your firm watches.
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <p style={{ margin: 0, color: '#A1A1A1', fontSize: 17, lineHeight: 1.7, maxWidth: 620 }}>
              CloseBooks brings intake, categorization, validation, exceptions, export, and
              client delivery into one guided workflow. AI handles the volume; your firm keeps
              control over the judgment calls.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <Link href="/demo" style={{ padding: '12px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#020202', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 34px rgba(0,200,83,0.28)' }}>
                Watch the flow
              </Link>
              <Link href="/signup?plan=professional&billing=annual" style={{ padding: '12px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Start with Professional
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <AutomationConsole active={active} />
        </motion.div>

        <div className="automation-stage-wrap" style={{ marginTop: 18 }}>
          <StageRail active={active} />
        </div>
      </div>
    </section>
  )
}
