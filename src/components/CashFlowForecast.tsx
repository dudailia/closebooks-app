'use client'

import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CashFlowForecast — pure SVG 90-day cash flow chart
// ─────────────────────────────────────────────────────────────────────────────

interface HistoricalPoint {
  date: string
  balance: number
}

interface ForecastPoint {
  date: string
  balance: number
  low: number
  high: number
}

interface Props {
  historicalData: HistoricalPoint[]
  forecastData: ForecastPoint[]
  dangerThreshold?: number
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function toPoints(
  data: { x: number; y: number }[],
  padL: number,
  padT: number,
  w: number,
  h: number,
  minV: number,
  maxV: number,
  totalLen: number,
  startIdx: number
): string {
  return data
    .map((d, i) => {
      const cx = padL + ((startIdx + i) / (totalLen - 1)) * w
      const cy = padT + h - ((d.y - minV) / (maxV - minV || 1)) * h
      return `${cx},${cy}`
    })
    .join(' ')
}

function toPolyPoints(
  data: { x: number; yLow: number; yHigh: number }[],
  padL: number,
  padT: number,
  w: number,
  h: number,
  minV: number,
  maxV: number,
  totalLen: number,
  startIdx: number
): string {
  const top = data.map((d, i) => {
    const cx = padL + ((startIdx + i) / (totalLen - 1)) * w
    const cy = padT + h - ((d.yHigh - minV) / (maxV - minV || 1)) * h
    return `${cx},${cy}`
  })
  const bottom = [...data].reverse().map((d, i) => {
    const ri = data.length - 1 - i
    const cx = padL + ((startIdx + ri) / (totalLen - 1)) * w
    const cy = padT + h - ((d.yLow - minV) / (maxV - minV || 1)) * h
    return `${cx},${cy}`
  })
  return [...top, ...bottom].join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CashFlowForecast({
  historicalData,
  forecastData,
  dangerThreshold = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgWidth, setSvgWidth] = useState(600)
  const [animated, setAnimated] = useState(false)

  const PAD_L = 64
  const PAD_R = 24
  const PAD_T = 20
  const PAD_B = 40
  const HEIGHT = 200

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setSvgWidth(Math.max(320, w))
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Trigger draw animation on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [])

  const chartW = svgWidth - PAD_L - PAD_R
  const chartH = HEIGHT - PAD_T - PAD_B

  // Combine for scale calculation
  const allBalances = [
    ...historicalData.map((d) => d.balance),
    ...forecastData.map((d) => d.balance),
    ...forecastData.map((d) => d.high),
    ...forecastData.map((d) => d.low),
  ]

  const minVal = Math.max(0, Math.min(...allBalances) * 0.9)
  const maxVal = Math.max(...allBalances) * 1.1
  const totalLen = historicalData.length + forecastData.length

  // Today line X position
  const todayX = historicalData.length > 0
    ? PAD_L + ((historicalData.length - 1) / (totalLen - 1 || 1)) * chartW
    : PAD_L

  // Danger threshold Y
  const dangerY =
    dangerThreshold > 0
      ? PAD_T + chartH - ((dangerThreshold - minVal) / (maxVal - minVal || 1)) * chartH
      : null

  // Build path strings
  const histPoints = historicalData.map((d) => ({ x: 0, y: d.balance }))
  const fcPoints = forecastData.map((d) => ({ x: 0, y: d.balance }))
  const bandPoints = forecastData.map((d) => ({ x: 0, yLow: d.low, yHigh: d.high }))

  function ptToSVG(idx: number, value: number) {
    const cx = PAD_L + (idx / (totalLen - 1 || 1)) * chartW
    const cy = PAD_T + chartH - ((value - minVal) / (maxVal - minVal || 1)) * chartH
    return { cx, cy }
  }

  function buildPath(points: { x: number; y: number }[], startIdx: number): string {
    if (points.length === 0) return ''
    return points
      .map((p, i) => {
        const { cx, cy } = ptToSVG(startIdx + i, p.y)
        return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`
      })
      .join(' ')
  }

  function buildBandPath(
    points: { x: number; yLow: number; yHigh: number }[],
    startIdx: number
  ): string {
    if (points.length === 0) return ''
    const top = points.map((p, i) => {
      const { cx, cy } = ptToSVG(startIdx + i, p.yHigh)
      return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`
    })
    const bottom = [...points].reverse().map((p, i) => {
      const { cx, cy } = ptToSVG(startIdx + (points.length - 1 - i), p.yLow)
      return `L ${cx} ${cy}`
    })
    return [...top, ...bottom, 'Z'].join(' ')
  }

  const histPath = buildPath(histPoints, 0)
  const fcPath = buildPath(fcPoints, historicalData.length)
  const bandPath = buildBandPath(bandPoints, historicalData.length)

  // Total path length estimate for animation
  const histPathLen = histPoints.length * 8
  const fcPathLen = fcPoints.length * 8

  // Y-axis labels
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minVal + ((maxVal - minVal) * i) / yTicks
    return {
      y: PAD_T + chartH - (i / yTicks) * chartH,
      label:
        v >= 1000
          ? `$${(v / 1000).toFixed(0)}k`
          : `$${v.toFixed(0)}`,
    }
  })

  // X-axis labels — show first historical, today, forecast end
  const xLabels: { x: number; label: string }[] = []
  if (historicalData.length > 0) {
    xLabels.push({ x: PAD_L, label: historicalData[0].date.slice(5) })
    xLabels.push({ x: todayX, label: 'Today' })
  }
  if (forecastData.length > 0) {
    const lastFcX =
      PAD_L + ((totalLen - 1) / (totalLen - 1 || 1)) * chartW
    xLabels.push({
      x: lastFcX,
      label: forecastData[forecastData.length - 1].date.slice(5),
    })
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        <LegendItem color="#b8734a" dashed={false} label="Historical" />
        <LegendItem color="#2d5a27" dashed label="90-day Forecast" />
        <LegendItem color="rgba(45,90,39,0.15)" dashed={false} label="Confidence Band" isArea />
        {dangerThreshold > 0 && (
          <LegendItem color="#dc2626" dashed label={`Danger ($${dangerThreshold.toLocaleString()})`} />
        )}
      </div>

      <svg
        width={svgWidth}
        height={HEIGHT}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={l.y}
              x2={svgWidth - PAD_R}
              y2={l.y}
              stroke="#e8e0d4"
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : '3,4'}
            />
            <text
              x={PAD_L - 6}
              y={l.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b6560"
            >
              {l.label}
            </text>
          </g>
        ))}

        {/* Danger threshold line */}
        {dangerY !== null && (
          <>
            <line
              x1={PAD_L}
              y1={dangerY}
              x2={svgWidth - PAD_R}
              y2={dangerY}
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeDasharray="6,4"
              opacity="0.7"
            />
            <text
              x={svgWidth - PAD_R - 4}
              y={dangerY - 4}
              textAnchor="end"
              fontSize="9"
              fill="#dc2626"
              fontWeight="600"
            >
              DANGER
            </text>
          </>
        )}

        {/* Confidence band */}
        {bandPath && (
          <path d={bandPath} fill="rgba(45,90,39,0.12)" />
        )}

        {/* Historical line */}
        {histPath && (
          <path
            d={histPath}
            fill="none"
            stroke="#b8734a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated
                ? {
                    strokeDasharray: histPathLen,
                    strokeDashoffset: 0,
                    transition: `stroke-dashoffset 0.8s ease-in-out`,
                  }
                : {
                    strokeDasharray: histPathLen,
                    strokeDashoffset: histPathLen,
                  }
            }
          />
        )}

        {/* Forecast line */}
        {fcPath && (
          <path
            d={fcPath}
            fill="none"
            stroke="#2d5a27"
            strokeWidth="2"
            strokeDasharray="7,4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated
                ? {
                    opacity: 1,
                    transition: `opacity 0.4s ease 0.7s`,
                  }
                : {
                    opacity: 0,
                  }
            }
          />
        )}

        {/* Today vertical line */}
        <line
          x1={todayX}
          y1={PAD_T}
          x2={todayX}
          y2={PAD_T + chartH}
          stroke="#6b6560"
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.6"
        />
        <text
          x={todayX + 4}
          y={PAD_T + 10}
          fontSize="9"
          fill="#6b6560"
          fontWeight="700"
          letterSpacing="0.04em"
        >
          TODAY
        </text>

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={HEIGHT - 6}
            textAnchor={i === xLabels.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
            fontSize="10"
            fill="#6b6560"
          >
            {l.label}
          </text>
        ))}

        {/* Zero line */}
        {minVal === 0 && (
          <line
            x1={PAD_L}
            y1={PAD_T + chartH}
            x2={svgWidth - PAD_R}
            y2={PAD_T + chartH}
            stroke="#1a1714"
            strokeWidth="1"
            opacity="0.2"
          />
        )}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Legend item helper
// ─────────────────────────────────────────────────────────────────────────────

function LegendItem({
  color,
  dashed,
  label,
  isArea = false,
}: {
  color: string
  dashed: boolean
  label: string
  isArea?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {isArea ? (
        <div
          style={{
            width: '16px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: color,
          }}
        />
      ) : (
        <svg width="20" height="8">
          <line
            x1="0"
            y1="4"
            x2="20"
            y2="4"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={dashed ? '4,2' : undefined}
            strokeLinecap="round"
          />
        </svg>
      )}
      <span style={{ fontSize: '11px', color: '#6b6560' }}>{label}</span>
    </div>
  )
}
