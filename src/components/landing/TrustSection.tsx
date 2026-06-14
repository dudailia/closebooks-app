'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TRUST_PILLARS } from '@/lib/landing/trustClaims'

export default function TrustSection() {
  return (
    <section
      id="trust"
      style={{
        position: 'relative',
        padding: '92px 28px',
        background: '#080808',
        borderTop: '1px solid #111',
        overflow: 'hidden',
      }}
    >
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 10%, rgba(0,200,83,0.10), transparent 34%)' }} />

      <div style={{ maxWidth: 1220, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 42, alignItems: 'start' }} className="trust-grid">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          >
            <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
              Client-data ready
            </p>
            <h2 style={{ margin: '14px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 5.4vw, 66px)', lineHeight: 0.98, letterSpacing: '-0.055em', fontWeight: 400 }}>
              Security and control CPAs expect.
            </h2>
            <p style={{ margin: '20px 0 0', color: '#A1A1A1', fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}>
              CloseBooks is built around review-first accounting workflows, firm-scoped access,
              transparent AI processing, and billing infrastructure that firms already trust.
            </p>
            <Link href="/security" style={{ display: 'inline-flex', marginTop: 24, color: '#00C853', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>
              Read the security overview →
            </Link>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }} className="trust-card-grid">
            {TRUST_PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.07, duration: 0.44 }}
                style={{
                  minHeight: 166,
                  padding: 20,
                  borderRadius: 22,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
                }}
              >
                <span style={{ color: '#00C853', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  0{index + 1}
                </span>
                <h3 style={{ margin: '14px 0 8px', color: '#FAFAFA', fontSize: 18, letterSpacing: '-0.025em' }}>
                  {pillar.title}
                </h3>
                <p style={{ margin: 0, color: '#8D8D8D', fontSize: 13, lineHeight: 1.6 }}>
                  {pillar.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .trust-grid,
          .trust-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
