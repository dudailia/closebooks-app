'use client'
import { motion } from 'framer-motion'
import PricingTiers from './PricingTiers'

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '60px 0 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#00C853',
              margin: 0,
              marginBottom: 16,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5vw, 58px)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              color: '#FAFAFA',
              margin: 0,
              fontWeight: 400,
              marginBottom: 18,
            }}
          >
            Pick the plan that matches your firm.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: '#888888',
              margin: '0 auto',
              maxWidth: 520,
              lineHeight: 1.55,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Priced like software, not a salary. No per-transaction fees. Upgrade anytime.
          </p>
        </motion.div>

        <PricingTiers variant="landing" />
      </div>
    </section>
  )
}
