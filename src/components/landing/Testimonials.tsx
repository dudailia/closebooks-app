'use client'

const QUOTES = [
  {
    quote:
      "We closed 40 books last month in the time it used to take for 8. The narrative insights alone made every client renew.",
    name: 'Sarah Hansen',
    title: 'Managing Partner',
    firm: 'Hansen & Co CPA',
    initials: 'SH',
    gradient: 'from 120deg, #00D97E, #4C7EFF',
  },
  {
    quote:
      "It's the first tool that actually learns our rules. After two months the AI agrees with me 98% of the time.",
    name: 'Marcus Reid',
    title: 'Senior Accountant',
    firm: 'Meridian Books',
    initials: 'MR',
    gradient: 'from 40deg, #FFB454, #00D97E',
  },
  {
    quote:
      "Keyboard-first review is the only reason my juniors don't quit. They flow through 500 transactions without looking up.",
    name: 'Jordan Okafor',
    title: 'Founder',
    firm: 'Ascend Accounting',
    initials: 'JO',
    gradient: 'from 200deg, #4C7EFF, #FF5D73',
  },
] as const

function Avatar({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        background: `conic-gradient(${gradient})`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0A0A0F',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '-0.02em',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      }}
    >
      {initials}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: '40px 0 120px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00D97E',
              margin: 0,
              marginBottom: 14,
            }}
          >
            Firms running on CloseBooks
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 5vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#F0F0F5',
              margin: 0,
              fontWeight: 400,
            }}
          >
            The CPAs who tried it once.
            <br />
            <span style={{ color: '#6E6E85' }}>Then onboarded every client.</span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {QUOTES.map((q) => (
            <figure
              key={q.name}
              style={{
                margin: 0,
                padding: 28,
                backgroundColor: '#111118',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ marginBottom: 16 }}>
                <path
                  d="M9 7c-2 0-4 2-4 5v4h4v-4H7c0-2 1-4 2-5V7zM17 7c-2 0-4 2-4 5v4h4v-4h-2c0-2 1-4 2-5V7z"
                  fill="rgba(0,217,126,0.5)"
                />
              </svg>
              <blockquote
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 19,
                  lineHeight: 1.45,
                  letterSpacing: '-0.015em',
                  color: '#F0F0F5',
                  margin: 0,
                  marginBottom: 24,
                }}
              >
                “{q.quote}”
              </blockquote>
              <figcaption
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 18,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Avatar initials={q.initials} gradient={q.gradient} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F5', margin: 0 }}>{q.name}</p>
                  <p style={{ fontSize: 12, color: '#6E6E85', margin: '1px 0 0' }}>
                    {q.title} · {q.firm}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
