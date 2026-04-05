'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  value: number        // client's value
  p25: number
  p50: number
  p75: number
  unit: string         // "%" or "days" or "months"
  higherIsBetter: boolean
  min?: number
  max?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// Convert a value in [min, max] to an angle in [-180, 0] (semicircle, left to right)
function valueToAngle(v: number, min: number, max: number): number {
  const pct = clamp((v - min) / (max - min), 0, 1)
  return -180 + pct * 180
}

// Polar to Cartesian (origin at cx, cy; 0 deg = right, counterclockwise)
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

// Build SVG arc path for a zone from startAngle to endAngle
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BenchmarkGauge({
  label,
  value,
  p25,
  p50,
  p75,
  unit,
  higherIsBetter,
  min: propMin,
  max: propMax,
}: Props) {
  const [needleAngle, setNeedleAngle] = useState(-180)
  const hasAnimated = useRef(false)

  // Derive min/max with padding
  const rawMin = propMin ?? 0
  const rawMax = propMax ?? Math.ceil(p75 * 1.4)
  const min = rawMin
  const max = rawMax

  // Target angle for the needle
  const targetAngle = valueToAngle(value, min, max)

  // Percentile calculation
  const percentile = (() => {
    if (value <= p25) return Math.round(((value - min) / (p25 - min)) * 25)
    if (value <= p50) return 25 + Math.round(((value - p25) / (p50 - p25)) * 25)
    if (value <= p75) return 50 + Math.round(((value - p50) / (p75 - p50)) * 25)
    return 75 + Math.round(((value - p75) / (max - p75)) * 25)
  })()
  const pctLabel = `${clamp(percentile, 1, 99)}th percentile`

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    // Start from -180, animate to target over 800ms
    const start = performance.now()
    const duration = 800
    const startAngle = -180

    function frame(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // Cubic-bezier ease-out approximation
      const eased = 1 - Math.pow(1 - t, 3)
      setNeedleAngle(startAngle + (targetAngle - startAngle) * eased)
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [targetAngle])

  // SVG layout
  const W = 240
  const H = 128
  const cx = W / 2
  const cy = H - 12
  const outerR = 100
  const innerR = 70
  const needleR = 94
  const tickR = 106

  // Zone angles: all in [-180, 0] range mapped from min..max
  const aMin = -180
  const aP25 = valueToAngle(p25, min, max)
  const aP50 = valueToAngle(p50, min, max)
  const aP75 = valueToAngle(p75, min, max)
  const aMax = 0

  // Zone colors depend on higherIsBetter
  const zones = higherIsBetter
    ? [
        { from: aMin, to: aP25, color: '#ef4444', label: 'Low' },
        { from: aP25, to: aP50, color: '#f59e0b', label: 'Below median' },
        { from: aP50, to: aP75, color: '#22c55e', label: 'Above median' },
        { from: aP75, to: aMax, color: '#3b82f6', label: 'Top quartile' },
      ]
    : [
        { from: aMin, to: aP25, color: '#3b82f6', label: 'Top quartile' },
        { from: aP25, to: aP50, color: '#22c55e', label: 'Above median' },
        { from: aP50, to: aP75, color: '#f59e0b', label: 'Below median' },
        { from: aP75, to: aMax, color: '#ef4444', label: 'High' },
      ]

  // Needle tip position
  const needleTip = polar(cx, cy, needleR, needleAngle)
  const needleLeft = polar(cx, cy, 8, needleAngle - 90)
  const needleRight = polar(cx, cy, 8, needleAngle + 90)

  // Percentile color
  const pctColor = (() => {
    if (higherIsBetter) {
      if (percentile >= 75) return '#3b82f6'
      if (percentile >= 50) return '#22c55e'
      if (percentile >= 25) return '#f59e0b'
      return '#ef4444'
    } else {
      if (percentile <= 25) return '#3b82f6'
      if (percentile <= 50) return '#22c55e'
      if (percentile <= 75) return '#f59e0b'
      return '#ef4444'
    }
  })()

  // Tick marks at p25, p50, p75 boundaries
  const ticks = [
    { angle: aP25, value: p25 },
    { angle: aP50, value: p50 },
    { angle: aP75, value: p75 },
  ]

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '20px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        minWidth: 240,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1714', margin: 0, textAlign: 'center' }}>
        {label}
      </p>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Zone arcs */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, (outerR + innerR) / 2, z.from, z.to)}
            fill="none"
            stroke={z.color}
            strokeWidth={outerR - innerR}
            strokeLinecap="butt"
            opacity={0.85}
          />
        ))}

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const inner = polar(cx, cy, innerR - 4, t.angle)
          const outer = polar(cx, cy, outerR + 4, t.angle)
          const labelPos = polar(cx, cy, tickR + 6, t.angle)
          return (
            <g key={i}>
              <line
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor="middle"
                fontSize={9}
                fill="#6b6560"
                fontFamily="inherit"
              >
                {t.value}{unit === '%' ? '%' : ''}
              </text>
            </g>
          )
        })}

        {/* Min / max labels */}
        {(() => {
          const minPos = polar(cx, cy, outerR + 8, -180)
          const maxPos = polar(cx, cy, outerR + 8, 0)
          return (
            <>
              <text x={minPos.x - 2} y={minPos.y + 4} textAnchor="end" fontSize={9} fill="#6b6560" fontFamily="inherit">
                {min}{unit === '%' ? '%' : ''}
              </text>
              <text x={maxPos.x + 2} y={maxPos.y + 4} textAnchor="start" fontSize={9} fill="#6b6560" fontFamily="inherit">
                {max}{unit === '%' ? '%' : ''}
              </text>
            </>
          )
        })()}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleRight.x},${needleRight.y}`}
          fill="#1a1714"
          opacity={0.9}
        />

        {/* Center hub */}
        <circle cx={cx} cy={cy} r={7} fill="#1a1714" />
        <circle cx={cx} cy={cy} r={4} fill="#ffffff" />

        {/* Client value label */}
        <text
          x={cx}
          y={cy - 28}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill="#1a1714"
          fontFamily="inherit"
        >
          {value}{unit}
        </text>

        {/* Percentile badge */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={pctColor}
          fontFamily="inherit"
        >
          {pctLabel}
        </text>
      </svg>

      {/* Industry median row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b6560' }}>
        <span>Median: <strong style={{ color: '#1a1714' }}>{p50}{unit}</strong></span>
        <span style={{ color: '#e8e0d4' }}>|</span>
        <span>Your client: <strong style={{ color: '#1a1714' }}>{value}{unit}</strong></span>
      </div>
    </div>
  )
}
