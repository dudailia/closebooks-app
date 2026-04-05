'use client'

// ─────────────────────────────────────────────────────────────────────────────
// RadarMetricTile
// Displays a single KPI with trend arrow and % change.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  label: string
  value: string
  change: number         // positive = up, negative = down
  changeLabel: string    // e.g. "vs last month"
  status: 'good' | 'bad' | 'neutral'
}

export default function RadarMetricTile({ label, value, change, changeLabel, status }: Props) {
  const arrowColor =
    status === 'good' ? '#2d5a27' : status === 'bad' ? '#dc2626' : '#6b6560'

  const bgColor =
    status === 'good'
      ? 'rgba(45,90,39,0.05)'
      : status === 'bad'
      ? 'rgba(220,38,38,0.05)'
      : 'rgba(107,101,96,0.05)'

  const arrow =
    change > 0.5 ? '↑' : change < -0.5 ? '↓' : '→'

  const changeDisplay =
    change === 0 ? 'No change' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: '16px',
        padding: '20px',
        flex: '1 1 180px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6b6560',
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#1a1714',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>

      {/* Trend */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: bgColor,
          borderRadius: '20px',
          padding: '3px 8px',
          alignSelf: 'flex-start',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: arrowColor }}>
          {arrow}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: arrowColor }}>
          {changeDisplay}
        </span>
      </div>

      {/* Change label */}
      <span style={{ fontSize: '11px', color: '#6b6560', marginTop: '2px' }}>
        {changeLabel}
      </span>
    </div>
  )
}
