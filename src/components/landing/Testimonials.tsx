'use client'
import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/GlowCard'

const QUOTES = [
  {
    quote: "We closed 40 books last month in the time it used to take for 8. The narrative insights alone made every client renew.",
    name: 'Sarah Hansen',
    title: 'Managing Partner',
    firm: 'Hansen & Co CPA',
    initials: 'SH',
    color: '#00C853',
  },
  {
    quote: "It's the first tool that actually learns our rules. After two months the AI agrees with me 98% of the time.",
    name: 'Marcus Reid',
    title: 'Senior Accountant',
    firm: 'Meridian Books',
    initials: 'MR',
    color: '#6B8EFF',
  },
  {
    quote: "Keyboard-first review is the only reason my juniors don't quit. They flow through 500 transactions without looking up.",
    name: 'Jordan Okafor',
    title: 'Founder',
    firm: 'Ascend Accounting',
    initials: 'JO',
    color: '#F59E0B',
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
    <section id="testimonials" style={{ padding: '60px 0 120px', position: 'relative' }}>
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
            Firms running on CloseBooks
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
            The CPAs who tried it once.{' '}
            <span style={{ color: '#444444', fontStyle: 'italic' }}>Then onboarded every client.</span>
          </h2>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {QUOTES.map((q, i) => (
            <motion.figure
              key={q.name}
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
                {/* Quote mark */}
                <div style={{ marginBottom: 18 }}>
                  <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                    <path
                      d="M0 20V13.5C0 9.5 1.833 6.167 5.5 3.5L7 5C5.167 6.333 4.167 8 4 10H8V20H0ZM16 20V13.5C16 9.5 17.833 6.167 21.5 3.5L23 5C21.167 6.333 20.167 8 20 10H24V20H16Z"
                      fill="rgba(0,200,83,0.35)"
                    />
                  </svg>
                </div>

                <blockquote
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 19,
                    lineHeight: 1.5,
                    letterSpacing: '-0.015em',
                    color: '#FAFAFA',
                    margin: 0,
                    marginBottom: 28,
                  }}
                >
                  &ldquo;{q.quote}&rdquo;
                </blockquote>

                <figcaption
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 20,
                    borderTop: '1px solid #1f1f1f',
                  }}
                >
                  <Avatar initials={q.initials} color={q.color} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA', margin: 0, fontFamily: 'var(--font-sans)' }}>
                      {q.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#444444', margin: '2px 0 0', fontFamily: 'var(--font-sans)' }}>
                      {q.title} · {q.firm}
                    </p>
                  </div>
                </figcaption>
              </GlowCard>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
