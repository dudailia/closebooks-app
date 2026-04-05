'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// RadarClientCard
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  clientName: string
  status: 'green' | 'yellow' | 'red'
  cashBalance: number
  runwayDays: number
  monthlyBurn: number
  sparklineData: number[]   // 6 data points (monthly net cash)
  onView: () => void
  onSendAlert: () => void
}

// ─── Sparkline (pure SVG) ────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
}: {
  data: number[]
  color: string
}) {
  if (data.length < 2) return null

  const W = 120
  const H = 36
  const PAD = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2)
    return `${x},${y}`
  })

  // Area fill below line
  const areaPoints = [
    `${PAD},${H - PAD}`,
    ...pts,
    `${W - PAD},${H - PAD}`,
  ].join(' ')

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
    >
      {/* Area */}
      <polygon
        points={areaPoints}
        fill={color}
        fillOpacity="0.12"
      />
      {/* Line */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  green: {
    dotColor: '#2d5a27',
    borderColor: '#e8e0d4',
    labelColor: '#2d5a27',
    label: 'Healthy',
    sparkColor: '#2d5a27',
    pulse: false,
  },
  yellow: {
    dotColor: '#d97706',
    borderColor: '#fde68a',
    labelColor: '#d97706',
    label: 'Caution',
    sparkColor: '#d97706',
    pulse: true,
  },
  red: {
    dotColor: '#dc2626',
    borderColor: '#fecaca',
    labelColor: '#dc2626',
    label: 'At Risk',
    sparkColor: '#dc2626',
    pulse: true,
  },
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RadarClientCard({
  clientName,
  status,
  cashBalance,
  runwayDays,
  monthlyBurn,
  sparklineData,
  onView,
  onSendAlert,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS_CONFIG[status]

  const formatCurrency = (n: number) =>
    n >= 1000
      ? `$${(n / 1000).toFixed(0)}k`
      : `$${n.toFixed(0)}`

  const initials = clientName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Pulse animation style */}
      <style>{`
        @keyframes radar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        .radar-dot-pulse {
          animation: radar-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${cfg.borderColor}`,
          borderRadius: '18px',
          padding: '20px',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          boxShadow: hovered
            ? '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.04)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Top row: status + client name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* Avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(184,115,74,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: '#b8734a',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1a1714',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {clientName}
              </div>
              <div style={{ fontSize: '11px', color: '#6b6560' }}>
                Active client
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor:
                status === 'green'
                  ? 'rgba(45,90,39,0.08)'
                  : status === 'yellow'
                  ? 'rgba(217,119,6,0.08)'
                  : 'rgba(220,38,38,0.08)',
              borderRadius: '20px',
              padding: '4px 10px',
              flexShrink: 0,
            }}
          >
            <span
              className={cfg.pulse ? 'radar-dot-pulse' : ''}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: cfg.dotColor,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: cfg.labelColor,
                letterSpacing: '0.02em',
              }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#6b6560', marginBottom: '2px' }}>
              6-month trend
            </div>
            <Sparkline data={sparklineData} color={cfg.sparkColor} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1714' }}>
              {formatCurrency(cashBalance)}
            </div>
            <div style={{ fontSize: '10px', color: '#6b6560' }}>cash balance</div>
          </div>
        </div>

        {/* Metrics row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <MetricPill label="Runway" value={`${runwayDays}d`} warn={runwayDays < 90} />
          <MetricPill
            label="Monthly Burn"
            value={formatCurrency(monthlyBurn)}
            warn={monthlyBurn > cashBalance * 0.2}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            style={{
              flex: 1,
              backgroundColor: '#1a1714',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Deep Dive →
          </button>

          {status !== 'green' && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendAlert() }}
              style={{
                flex: 1,
                backgroundColor: status === 'red' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)',
                color: status === 'red' ? '#dc2626' : '#d97706',
                border: `1px solid ${status === 'red' ? '#fecaca' : '#fde68a'}`,
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              ✉ Alert
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Small metric pill ───────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn: boolean
}) {
  return (
    <div
      style={{
        backgroundColor: warn ? 'rgba(220,38,38,0.05)' : '#faf8f4',
        borderRadius: '8px',
        padding: '6px 10px',
      }}
    >
      <div style={{ fontSize: '10px', color: '#6b6560' }}>{label}</div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: warn ? '#dc2626' : '#1a1714',
        }}
      >
        {value}
      </div>
    </div>
  )
}
