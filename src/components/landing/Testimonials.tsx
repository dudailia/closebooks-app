'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/GlowCard'

const PROOF_CARDS = [
  {
    title: 'Interactive demo',
    copy: 'Walk through upload, AI categorization, review, and export with sample data. No account required.',
    href: '/demo',
    cta: 'Try the demo',
    initials: '01',
    color: '#00C853',
  },
  {
    title: 'Guided first close',
    copy: 'Create a firm account, upload a bank CSV, review exceptions, and export your first close package.',
    href: '/signup',
    cta: 'Start trial',
    initials: '02',
    color: '#6B8EFF',
  },
  {
    title: 'ROI calculator',
    copy: 'Estimate what exception-first review could save for your client count, close volume, and team size.',
    href: '/tools/roi-calculator',
    cta: 'Calculate ROI',
    initials: '03',
    color: '#F59E0B',
  },
  {
    title: 'Sample close package',
    copy: 'Preview validated rows, exception list, export checks, and the client-ready narrative before uploading your own files.',
    href: '/sample-close-package',
    cta: 'View sample',
    initials: '04',
    color: '#38BDF8',
  },
] as const

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}33`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {initials}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="product-proof" style={{ padding: '60px 0 120px', position: 'relative' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 400,
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(0,200,83,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 72 }}
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
            Product proof
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
            }}
          >
            See the workflow before you commit.{' '}
            <span style={{ color: '#444444', fontStyle: 'italic' }}>Then run it on one client.</span>
          </h2>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {PROOF_CARDS.map((card, i) => (
            <motion.figure
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              style={{ margin: 0 }}
            >
              <GlowCard
                as="figure"
                style={{
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Avatar initials={card.initials} color={card.color} />
                <h3
                  style={{
                    margin: '22px 0 10px',
                    color: '#FAFAFA',
                    fontSize: 24,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ flex: 1, margin: 0, color: '#A1A1A1', fontSize: 14, lineHeight: 1.7 }}>
                  {card.copy}
                </p>

                <figcaption
                  style={{
                    display: 'block',
                    paddingTop: 20,
                    marginTop: 24,
                    borderTop: '1px solid #1f1f1f',
                  }}
                >
                  <Link href={card.href} style={{ color: card.color, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                    {card.cta} →
                  </Link>
                </figcaption>
              </GlowCard>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
