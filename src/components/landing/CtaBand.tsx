'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MagneticButton } from '@/components/ui/MagneticButton'

export default function CtaBand() {
  return (
    <section style={{ padding: '60px 0 120px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            padding: '80px 40px',
            borderRadius: 24,
            background: '#0f0f0f',
            border: '1px solid rgba(0,200,83,0.25)',
            overflow: 'hidden',
            textAlign: 'center',
            animation: 'glow-pulse 4s ease-in-out infinite',
          }}
        >
          {/* Top glow streak */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -1,
              left: '20%',
              right: '20%',
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,200,83,0.8), transparent)',
              pointerEvents: 'none',
            }}
          />
          {/* Radial ambient */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 400,
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(0,200,83,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Grid pattern */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(70% 70% at 50% 40%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(70% 70% at 50% 40%, black, transparent)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative' }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#00C853',
                margin: 0,
                marginBottom: 20,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Get started today
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(44px, 7vw, 80px)',
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
                color: '#FAFAFA',
                margin: 0,
                marginBottom: 20,
                fontWeight: 400,
              }}
            >
              Close faster.{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #00C853, #69FF8C)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Close better.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              style={{
                fontSize: 17,
                color: '#888888',
                margin: '0 auto 40px',
                maxWidth: 520,
                lineHeight: 1.55,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Join the CPA firms ditching ledgers and spreadsheets for an AI close that thinks with them.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <MagneticButton>
                <Link
                  href="/signup"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '16px 28px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#000',
                    background: '#00C853',
                    borderRadius: 12,
                    textDecoration: 'none',
                    boxShadow: '0 8px 40px rgba(0,200,83,0.5)',
                    transition: 'box-shadow 250ms, background 200ms',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 12px 60px rgba(0,200,83,0.7)'
                    e.currentTarget.style.background = '#00d95a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,200,83,0.5)'
                    e.currentTarget.style.background = '#00C853'
                  }}
                >
                  Start your 14-day trial
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </MagneticButton>

              <Link
                href="/demo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '15px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#FAFAFA',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid #1f1f1f',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'background-color 200ms, border-color 200ms',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = '#1f1f1f'
                }}
              >
                Book a 20-min demo
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
