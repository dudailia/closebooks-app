'use client'
import StatCounter from './StatCounter'

const FIRMS = ['NORTHPEAK CPA', 'HANSEN & CO', 'MERIDIAN BOOKS', 'ASCEND ACCOUNTING', 'DUE NORTH', 'BALANCE LEDGER']

export default function StatBand() {
  return (
    <section style={{ position: 'relative', padding: '80px 0 120px' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
        }}
      >
        {/* Trust strip */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#6E6E85',
              margin: 0,
              marginBottom: 18,
            }}
          >
            Trusted by 200+ CPA firms · 12,000+ books closed monthly
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '22px 48px',
            }}
          >
            {FIRMS.map((f) => (
              <span
                key={f}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  color: 'rgba(168,168,188,0.6)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 48,
            paddingTop: 60,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <StatItem value={<StatCounter to={94} suffix="%" />} label="AI categorization accuracy" sublabel="Learns from your corrections" />
          <StatItem
            value={
              <>
                <StatCounter to={3} />
                <span style={{ color: '#6E6E85', fontSize: '0.4em', marginLeft: 6 }}>hrs</span>
              </>
            }
            label="Time to close one client"
            sublabel="Down from 3 days"
          />
          <StatItem
            value={
              <>
                <span style={{ color: '#6E6E85' }}>$</span>
                <StatCounter to={2400} />
              </>
            }
            label="Monthly savings per firm"
            sublabel="vs. traditional bookkeeping tools"
          />
        </div>
      </div>
    </section>
  )
}

function StatItem({
  value,
  label,
  sublabel,
}: {
  value: React.ReactNode
  label: string
  sublabel: string
}) {
  return (
    <div style={{ textAlign: 'left' }}>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(56px, 6.5vw, 92px)',
          fontWeight: 400,
          color: '#F0F0F5',
          letterSpacing: '-0.035em',
          lineHeight: 1,
          margin: 0,
          marginBottom: 14,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 15,
          color: '#F0F0F5',
          margin: 0,
          marginBottom: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, color: '#6E6E85', margin: 0 }}>{sublabel}</p>
    </div>
  )
}
