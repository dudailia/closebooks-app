'use client'

const STEPS = [
  {
    num: '01',
    title: 'Connect each client',
    body: 'Plaid, CSV, or direct bank connection. CloseBooks imports the month\'s transactions in seconds and keeps them in sync.',
    mock: 'connect',
  },
  {
    num: '02',
    title: 'AI categorizes everything',
    body: 'Claude classifies every transaction with a confidence score. Your past corrections become rules that sharpen the model every week.',
    mock: 'categorize',
  },
  {
    num: '03',
    title: 'Review, narrate, export',
    body: 'Flip through in keyboard-first review. Ship a narrative summary to the client. Push journal entries to QuickBooks in one click.',
    mock: 'review',
  },
] as const

function Mock({ kind }: { kind: 'connect' | 'categorize' | 'review' }) {
  if (kind === 'connect') {
    return (
      <div style={mockBase}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(0,217,126,0.18)', border: '1px solid rgba(0,217,126,0.4)' }} />
          <span style={{ fontSize: 12, color: '#F0F0F5', fontWeight: 500 }}>Chase · 1247</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#00D97E' }}>Connected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(76,126,255,0.18)', border: '1px solid rgba(76,126,255,0.4)' }} />
          <span style={{ fontSize: 12, color: '#F0F0F5', fontWeight: 500 }}>Amex · Platinum</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#00D97E' }}>Connected</span>
        </div>
      </div>
    )
  }
  if (kind === 'categorize') {
    return (
      <div style={mockBase}>
        {[
          ['Stripe', 'Fees', 98],
          ['Notion', 'Software', 96],
          ['Uber', 'Travel', 92],
        ].map(([v, c, pct]) => (
          <div key={v as string} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#F0F0F5' }}>{v as string}</span>
            <span style={{ fontSize: 10, color: '#00D97E', padding: '1px 6px', borderRadius: 999, backgroundColor: 'rgba(0,217,126,0.1)' }}>{c as string}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6E6E85' }}>{pct}%</span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div style={mockBase}>
      <p style={{ fontSize: 11, color: '#D5D5E0', margin: 0, marginBottom: 8, lineHeight: 1.5 }}>
        Revenue up <span style={{ color: '#00D97E', fontWeight: 600 }}>12%</span>. Operating expenses tracking plan. Net position improved.
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, backgroundColor: 'rgba(0,217,126,0.14)', color: '#00D97E', fontWeight: 500 }}>Export ✓</span>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', color: '#A8A8BC' }}>QBO synced</span>
      </div>
    </div>
  )
}

const mockBase: React.CSSProperties = {
  marginTop: 20,
  padding: 14,
  backgroundColor: '#0A0A0F',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
}

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding: '40px 0 120px', position: 'relative' }}>
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
            How it works
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
            From bank import to client report in one afternoon.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {STEPS.map((s) => (
            <div
              key={s.num}
              style={{
                padding: 28,
                backgroundColor: '#111118',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#00D97E',
                  letterSpacing: '0.2em',
                  marginBottom: 20,
                }}
              >
                {s.num}
              </span>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#F0F0F5',
                  margin: 0,
                  marginBottom: 10,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: '#A8A8BC', margin: 0 }}>{s.body}</p>
              <Mock kind={s.mock} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
