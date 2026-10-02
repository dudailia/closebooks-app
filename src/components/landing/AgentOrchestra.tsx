'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const AGENTS = [
  { name: 'Parser', role: 'Reads CSV & PDF statements', color: '#38BDF8', x: 50, y: 7 },
  { name: 'Categorizer', role: 'Suggests accounts', color: '#00C853', x: 82, y: 28 },
  { name: 'Validator', role: 'Checks the COA', color: '#F59E0B', x: 82, y: 74 },
  { name: 'Review', role: 'Your team approves', color: '#A855F7', x: 50, y: 92 },
  { name: 'Exporter', role: 'Builds the CSV', color: '#22C55E', x: 16, y: 74 },
  { name: 'Rules', role: 'Applies saved rules', color: '#FB7185', x: 16, y: 28 },
] as const

const ACTIVITY = [
  { label: 'Bank statement parsed', detail: 'CSV or PDF rows turned into transactions', color: '#38BDF8' },
  { label: 'Accounts suggested', detail: 'Each suggestion checked against the client chart of accounts', color: '#00C853' },
  { label: 'Saved rules applied', detail: 'Vendors your firm has a rule for get that account', color: '#FB7185' },
  { label: 'Exceptions flagged', detail: 'Low-confidence and invalid rows wait for review', color: '#A855F7' },
  { label: 'Ready to export', detail: 'QuickBooks-style CSV and printable close report', color: '#22C55E' },
] as const

function AgentNode({
  agent,
  index,
  active,
}: {
  agent: typeof AGENTS[number]
  index: number
  active: boolean
}) {
  return (
    <motion.div
      animate={{
        scale: active ? 1.08 : 1,
        opacity: active ? 1 : 0.74,
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        left: `${agent.x}%`,
        top: `${agent.y}%`,
        // Centre on (x, y). A plain `transform` would be overwritten by the
        // animated `scale`; Motion composes x/y with it.
        x: '-50%',
        y: '-50%',
        width: 126,
        padding: '10px 11px',
        borderRadius: 16,
        border: `1px solid ${active ? `${agent.color}70` : 'rgba(255,255,255,0.08)'}`,
        background: active ? `linear-gradient(180deg, ${agent.color}18, rgba(10,10,10,0.92))` : 'rgba(10,10,10,0.78)',
        boxShadow: active ? `0 0 34px ${agent.color}24` : '0 18px 44px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 3,
      }}
    >
      <motion.div
        animate={{ opacity: active ? [0.45, 1, 0.45] : 0.5 }}
        transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: index * 0.05 }}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: agent.color,
          boxShadow: `0 0 16px ${agent.color}`,
          marginBottom: 8,
        }}
      />
      <p style={{ margin: 0, color: '#FAFAFA', fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>
        {agent.name}
      </p>
      <p style={{ margin: '3px 0 0', color: active ? '#CFCFCF' : '#777', fontSize: 11, lineHeight: 1.35 }}>
        {agent.role}
      </p>
    </motion.div>
  )
}

function ConnectionLines({ active }: { active: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    >
      <defs>
        <radialGradient id="agent-center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00C853" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="32" fill="url(#agent-center-glow)" opacity="0.35" />
      {AGENTS.map((agent, index) => (
        <motion.line
          key={agent.name}
          x1="50"
          y1="50"
          x2={agent.x}
          y2={agent.y}
          stroke={agent.color}
          strokeWidth={active === index ? 0.45 : 0.22}
          strokeLinecap="round"
          initial={false}
          animate={{
            opacity: active === index ? [0.25, 0.9, 0.25] : 0.18,
            pathLength: active === index ? [0.18, 1, 0.18] : 1,
          }}
          transition={{ duration: 1.8, repeat: active === index ? Infinity : 0, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

function ActivityFeed({ active }: { active: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ACTIVITY.map((item, index) => {
        const isActive = index === active % ACTIVITY.length
        return (
          <motion.div
            key={item.label}
            animate={{
              opacity: isActive ? 1 : 0.52,
              x: isActive ? 6 : 0,
              borderColor: isActive ? `${item.color}58` : '#1f1f1f',
              backgroundColor: isActive ? `${item.color}10` : 'rgba(255,255,255,0.025)',
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  boxShadow: isActive ? `0 0 18px ${item.color}` : 'none',
                  flexShrink: 0,
                }}
              />
              <p style={{ margin: 0, color: '#FAFAFA', fontSize: 13, fontWeight: 700 }}>{item.label}</p>
            </div>
            <p style={{ margin: '5px 0 0 15px', color: '#888', fontSize: 12, lineHeight: 1.45 }}>{item.detail}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function AgentOrchestra() {
  const [active, setActive] = useState(0)
  const activeAgent = AGENTS[active % AGENTS.length]

  useEffect(() => {
    const timer = setInterval(() => setActive((current) => (current + 1) % AGENTS.length), 2300)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #080808 0%, #0A0A0A 50%, #080808 100%)',
        padding: '110px 28px',
        overflow: 'hidden',
        borderTop: '1px solid #111',
      }}
    >
      <style jsx global>{`
        @media (max-width: 980px) {
          .agent-orchestra-grid {
            grid-template-columns: 1fr !important;
          }
          .agent-orbit {
            min-height: 580px !important;
          }
        }
        @media (max-width: 640px) {
          .agent-orbit {
            min-height: 500px !important;
            transform: scale(0.86);
            transform-origin: center top;
            margin-bottom: -70px;
          }
        }
      `}</style>

      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 34%, rgba(0,200,83,0.13), transparent 32%), radial-gradient(circle at 20% 68%, rgba(168,85,247,0.12), transparent 34%)' }} />

      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="agent-orchestra-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 48, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p style={{ margin: 0, color: activeAgent.color, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
              Specialized workflow stages
            </p>
            <h2 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5.8vw, 70px)', lineHeight: 0.98, letterSpacing: '-0.055em', fontWeight: 400 }}>
              One workflow for parsing, categorization, review, and export.
            </h2>
            <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}>
              CloseBooks runs parsing, categorization, chart-of-accounts validation, and saved
              rules for you, then hands the exceptions to your team for review before anything
              is exported.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href="/get-started" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#FAFAFA', color: '#050505', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                Run your first close
              </Link>
              <Link href="/demo" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                Try the demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(18,18,18,0.86), rgba(8,8,8,0.94))',
              borderRadius: 30,
              padding: 18,
              boxShadow: '0 38px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset',
            }}
          >
            <div className="agent-orbit" style={{ position: 'relative', minHeight: 620, overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(circle at 50% 50%, rgba(0,200,83,0.12), transparent 36%), #070707' }}>
              <ConnectionLines active={active % AGENTS.length} />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '15%',
                  right: '15%',
                  top: '15%',
                  bottom: '15%',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '50%',
                  zIndex: 0,
                }}
              />

              {/* Static wrapper does the centring; the animated y bob would overwrite a transform on the motion element. */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 4 }}>
                <motion.div
                  animate={{ y: [0, -8, 0], boxShadow: [`0 0 55px ${activeAgent.color}26`, `0 0 95px ${activeAgent.color}36`, `0 0 55px ${activeAgent.color}26`] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 190,
                    minHeight: 154,
                    borderRadius: 28,
                    border: `1px solid ${activeAgent.color}58`,
                    background: 'linear-gradient(180deg, rgba(250,250,250,0.08), rgba(10,10,10,0.95))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 20,
                  }}
                >
                  <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
                    CloseBooks
                  </p>
                  <h3 style={{ margin: '8px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.045em' }}>
                    Close pipeline
                  </h3>
                  <p style={{ margin: '8px 0 0', color: '#888', fontSize: 12, lineHeight: 1.45 }}>
                    Current stage: <span style={{ color: activeAgent.color }}>{activeAgent.name}</span>
                  </p>
                </motion.div>
              </div>

              {AGENTS.map((agent, index) => (
                <AgentNode key={agent.name} agent={agent} index={index} active={active % AGENTS.length === index} />
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <ActivityFeed active={active} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
