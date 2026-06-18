'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ADD_ON_MODULES, COMPARISON_ROWS, PLATFORM_PILLARS } from '@/lib/landing/differentiators'

function PillarCard({ pillar, index }: { pillar: typeof PLATFORM_PILLARS[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ delay: index * 0.07, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: 18,
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C853',
            backgroundColor: 'rgba(0,200,83,0.09)',
            border: '1px solid rgba(0,200,83,0.22)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {index + 1}
        </span>
        <h3 style={{ margin: 0, color: '#FAFAFA', fontSize: 16, letterSpacing: '-0.02em' }}>{pillar.title}</h3>
      </div>
      <p style={{ margin: 0, color: '#8D8D8D', fontSize: 13, lineHeight: 1.62 }}>{pillar.copy}</p>
    </motion.div>
  )
}

function ComparisonMatrix() {
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 26,
        background: 'linear-gradient(180deg, rgba(18,18,18,0.94), rgba(8,8,8,0.96))',
        overflow: 'hidden',
        boxShadow: '0 34px 110px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.75fr 1fr 1.15fr',
          gap: 0,
          borderBottom: '1px solid #1a1a1a',
          backgroundColor: 'rgba(255,255,255,0.025)',
        }}
      >
        {['Category', 'Typical tool', 'CloseBooks'].map((header) => (
          <div key={header} style={{ padding: '14px 16px', color: header === 'CloseBooks' ? '#00C853' : '#777', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 800 }}>
            {header}
          </div>
        ))}
      </div>

      {COMPARISON_ROWS.map((row, index) => (
        <motion.div
          key={row.category}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ delay: index * 0.06, duration: 0.42 }}
          className="why-comparison-row"
          style={{
            display: 'grid',
            gridTemplateColumns: '0.75fr 1fr 1.15fr',
            borderBottom: index < COMPARISON_ROWS.length - 1 ? '1px solid #141414' : 'none',
          }}
        >
          <div style={{ padding: 16, color: '#FAFAFA', fontSize: 13, fontWeight: 700 }}>{row.category}</div>
          <div style={{ padding: 16, color: '#777', fontSize: 13, lineHeight: 1.55, borderLeft: '1px solid #141414' }}>{row.typical}</div>
          <div style={{ padding: 16, color: '#CFEFDC', fontSize: 13, lineHeight: 1.55, borderLeft: '1px solid rgba(0,200,83,0.16)', background: 'rgba(0,200,83,0.025)' }}>{row.closebooks}</div>
        </motion.div>
      ))}
    </div>
  )
}

function ModuleTile({ module, index }: { module: typeof ADD_ON_MODULES[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay: index * 0.05, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, borderColor: `${module.accent}66` }}
      style={{
        minHeight: 166,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        padding: 18,
        background: `linear-gradient(180deg, ${module.accent}10, rgba(255,255,255,0.02))`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: [0.16, 0.35, 0.16], scale: [0.9, 1.18, 0.9] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: index * 0.18 }}
        style={{
          position: 'absolute',
          right: -38,
          top: -42,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${module.accent}55, transparent 66%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ color: module.accent, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
          {module.tier}
        </span>
        <h3 style={{ margin: '12px 0 8px', color: '#FAFAFA', fontSize: 19, letterSpacing: '-0.025em' }}>{module.name}</h3>
        <p style={{ margin: 0, color: '#8D8D8D', fontSize: 13, lineHeight: 1.58 }}>{module.copy}</p>
      </div>
    </motion.div>
  )
}

export default function WhyCloseBooks() {
  return (
    <section
      id="why-closebooks"
      style={{
        position: 'relative',
        padding: '112px 28px 118px',
        background: '#080808',
        borderTop: '1px solid #111',
        overflow: 'hidden',
      }}
    >
      <style jsx global>{`
        @media (max-width: 920px) {
          .why-closebooks-grid {
            grid-template-columns: 1fr !important;
          }
          .why-comparison-row,
          .why-comparison-row + div {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .why-comparison-row,
          .why-comparison-row:first-child {
            display: block !important;
          }
        }
      `}</style>

      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 20%, rgba(0,200,83,0.12), transparent 32%), radial-gradient(circle at 82% 75%, rgba(56,189,248,0.1), transparent 34%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)', backgroundSize: '68px 68px', maskImage: 'linear-gradient(to bottom, transparent, black 16%, black 84%, transparent)' }} />

      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="why-closebooks-grid" style={{ display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 44, alignItems: 'start', marginBottom: 42 }}>
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
              style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}
            >
              The moat competitors miss
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 6vw, 74px)', lineHeight: 0.96, letterSpacing: '-0.055em', fontWeight: 400 }}
            >
              Other tools automate a slice. CloseBooks owns the close.
            </motion.h2>
            <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 16, lineHeight: 1.72 }}>
              The market is split between enterprise close systems, AP automation, document capture,
              and outsourced bookkeeping. CloseBooks is built for CPA firms that want AI speed,
              validation, client collaboration, and margin expansion in one workflow.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href="/signup?plan=professional&billing=annual" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#020202', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: '0 12px 36px rgba(0,200,83,0.28)' }}>
                Build the AI firm
              </Link>
              <Link href="/demo" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                See the demo
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {PLATFORM_PILLARS.map((pillar, index) => (
              <PillarCard key={pillar.title} pillar={pillar} index={index} />
            ))}
          </div>
        </div>

        <ComparisonMatrix />

        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
                Add-ons that compound
              </p>
              <h3 style={{ margin: '10px 0 0', color: '#FAFAFA', fontSize: 'clamp(28px, 4vw, 44px)', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.04em' }}>
                Build the operating system for an AI-first CPA firm.
              </h3>
            </div>
            <p style={{ margin: 0, color: '#888', fontSize: 14, lineHeight: 1.6, maxWidth: 410 }}>
              Each module supports the same goal: fewer manual rows, fewer risky exports,
              and more clients served by the same team.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            {ADD_ON_MODULES.map((module, index) => (
              <ModuleTile key={module.name} module={module} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
