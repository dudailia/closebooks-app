'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PILOT_DELIVERABLES, PILOT_METRICS, PILOT_STEPS } from '@/lib/landing/pilot'

interface PilotOfferProps {
  compact?: boolean
}

export default function PilotOffer({ compact = false }: PilotOfferProps) {
  return (
    <section
      id="pilot"
      style={{
        position: 'relative',
        padding: compact ? '72px 0' : '100px 28px',
        background: compact ? 'transparent' : '#080808',
        overflow: 'hidden',
      }}
    >
      {!compact && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 15%, rgba(0,200,83,0.12), transparent 38%)' }} />
      )}
      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{
            border: '1px solid rgba(0,200,83,0.22)',
            borderRadius: 30,
            background: 'linear-gradient(135deg, rgba(0,200,83,0.11), rgba(18,18,18,0.94) 42%, rgba(8,8,8,0.98))',
            boxShadow: '0 40px 130px rgba(0,0,0,0.46), 0 0 0 1px rgba(255,255,255,0.03) inset',
            overflow: 'hidden',
          }}
        >
          <div className="pilot-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 0 }}>
            <div style={{ padding: compact ? 30 : 42, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
                Paid pilot
              </p>
              <h2 style={{ margin: '14px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: compact ? 'clamp(34px, 5vw, 54px)' : 'clamp(42px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.055em', fontWeight: 400 }}>
                Prove CloseBooks on real client work.
              </h2>
              <p style={{ margin: '20px 0 0', color: '#A1A1A1', fontSize: 16, lineHeight: 1.7 }}>
                A paid pilot is the fastest path for serious firms: configure real clients, run the
                review workflow, export a close package, then decide if the subscription should expand.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 26 }}>
                {PILOT_METRICS.map(([value, label]) => (
                  <div key={value} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '13px 12px', backgroundColor: 'rgba(0,0,0,0.24)' }}>
                    <p style={{ margin: 0, color: '#FAFAFA', fontSize: 21, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}>{value}</p>
                    <p style={{ margin: '5px 0 0', color: '#777', fontSize: 11, lineHeight: 1.35 }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
                <Link href="/pilot" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: '0 12px 38px rgba(0,200,83,0.28)' }}>
                  See pilot plan
                </Link>
                <Link href="/contact?topic=pilot" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                  Talk to us
                </Link>
              </div>
            </div>

            <div style={{ padding: compact ? 30 : 42 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {PILOT_STEPS.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: index * 0.07, duration: 0.42 }}
                    style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'start' }}
                  >
                    <span style={{ width: 34, height: 34, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#00C853', backgroundColor: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.24)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {index + 1}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, color: '#FAFAFA', fontSize: 16, letterSpacing: '-0.02em' }}>{step.title}</h3>
                      <p style={{ margin: '5px 0 0', color: '#8D8D8D', fontSize: 13, lineHeight: 1.55 }}>{step.copy}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 12px', color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                  Included in pilot
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                  {PILOT_DELIVERABLES.map((item) => (
                    <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#A1A1A1', fontSize: 12, lineHeight: 1.45 }}>
                      <span style={{ color: '#00C853', marginTop: 1 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <style jsx global>{`
        @media (max-width: 900px) {
          .pilot-grid {
            grid-template-columns: 1fr !important;
          }
          .pilot-grid > div:first-child {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
        }
      `}</style>
    </section>
  )
}
