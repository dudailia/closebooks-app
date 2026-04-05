'use client'

import type { BenchmarkResult } from '@/lib/benchmarkNetwork'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  results: BenchmarkResult[]
  title?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 44
const LABEL_WIDTH = 170 // px reserved for category label (inside SVG)
const RIGHT_PADDING = 52 // px for the percentage label on the right
const MAX_PCT = 65       // max % value on the x-axis (covers all categories)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function barColor(result: BenchmarkResult): string {
  if (result.clientPct <= result.networkMedian) return '#2d5a27'
  const overMedianPct = ((result.clientPct - result.networkMedian) / result.networkMedian) * 100
  if (overMedianPct <= 25) return '#d97706'
  return '#dc2626'
}

function pctToX(pct: number, chartWidth: number): number {
  return LABEL_WIDTH + (pct / MAX_PCT) * chartWidth
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpendComparisonChart({ results, title }: Props) {
  if (results.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border py-12"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#6b6560' }}
      >
        <div className="text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3 opacity-40">
            <rect x="4" y="10" width="6" height="14" rx="1" fill="#6b6560" />
            <rect x="13" y="6" width="6" height="18" rx="1" fill="#6b6560" />
            <rect x="22" y="14" width="6" height="10" rx="1" fill="#6b6560" />
          </svg>
          <p className="text-sm font-medium">No expense data to compare</p>
          <p className="text-xs mt-1" style={{ color: '#a09a94' }}>
            Complete a close with approved transactions to see benchmarks.
          </p>
        </div>
      </div>
    )
  }

  // Show max 8 rows without scroll; beyond that, the container scrolls
  const visibleResults = results.slice(0, 20) // hard cap
  const svgHeight = visibleResults.length * ROW_HEIGHT + 36 // +36 for x-axis labels
  const needsScroll = results.length > 8

  // We use a viewBox so the SVG is responsive horizontally.
  // Total viewBox width = LABEL_WIDTH + chartArea + RIGHT_PADDING
  const viewBoxWidth = 580
  const chartWidth = viewBoxWidth - LABEL_WIDTH - RIGHT_PADDING

  // X-axis tick values
  const ticks = [0, 10, 20, 30, 40, 50, 60]

  return (
    <div>
      {title && (
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: '#1a1714' }}
        >
          {title}
        </h3>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3">
        {[
          { color: '#2d5a27', label: 'At or below median' },
          { color: '#d97706', label: '10–25% above median' },
          { color: '#dc2626', label: '>25% above median' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#6b6560' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6b6560' }}>
          <span
            className="inline-block w-6 h-2.5 rounded-sm"
            style={{ backgroundColor: '#e8e0d4' }}
          />
          Network p25–p75 range
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6b6560' }}>
          <span className="inline-block w-0.5 h-3 rounded-full" style={{ backgroundColor: '#6b6560' }} />
          Median
        </span>
      </div>

      <div
        style={{
          maxHeight: needsScroll ? '400px' : undefined,
          overflowY: needsScroll ? 'auto' : undefined,
          border: '1px solid #e8e0d4',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${svgHeight}`}
          width="100%"
          style={{ display: 'block', minHeight: '120px' }}
          aria-label="Spend comparison chart"
          role="img"
        >
          {/* X-axis gridlines + tick labels */}
          {ticks.map((tick) => {
            const x = pctToX(tick, chartWidth)
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={svgHeight - 36}
                  stroke="#f0ece4"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={svgHeight - 18}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#a09a94"
                  fontFamily="system-ui, sans-serif"
                >
                  {tick}%
                </text>
              </g>
            )
          })}

          {/* X-axis bottom line */}
          <line
            x1={LABEL_WIDTH}
            y1={svgHeight - 36}
            x2={viewBoxWidth - RIGHT_PADDING}
            y2={svgHeight - 36}
            stroke="#e8e0d4"
            strokeWidth="1"
          />

          {/* Data rows */}
          {visibleResults.map((result, i) => {
            const y = i * ROW_HEIGHT
            const barY = y + 10
            const barH = 16

            const clientX = pctToX(Math.min(result.clientPct, MAX_PCT), chartWidth)
            const p25X = pctToX(Math.min(result.networkP25, MAX_PCT), chartWidth)
            const p75X = pctToX(Math.min(result.networkP75, MAX_PCT), chartWidth)
            const medianX = pctToX(Math.min(result.networkMedian, MAX_PCT), chartWidth)
            const originX = LABEL_WIDTH

            const color = barColor(result)

            // Status icon
            const statusIcon =
              result.status === 'below' ? '↓' : result.status === 'above' ? '↑' : '–'
            const statusColor =
              result.status === 'below' ? '#2d5a27' : result.status === 'above' ? '#dc2626' : '#6b6560'

            return (
              <g key={result.category}>
                {/* Alternating row bg */}
                {i % 2 === 0 && (
                  <rect x={0} y={y} width={viewBoxWidth} height={ROW_HEIGHT} fill="#faf8f4" />
                )}

                {/* Category label */}
                <text
                  x={LABEL_WIDTH - 8}
                  y={barY + barH / 2 + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#1a1714"
                  fontFamily="system-ui, sans-serif"
                >
                  {result.category}
                </text>

                {/* Network p25–p75 shaded range */}
                <rect
                  x={p25X}
                  y={barY + 3}
                  width={Math.max(0, p75X - p25X)}
                  height={barH - 6}
                  fill="#e8e0d4"
                  rx="2"
                  opacity="0.7"
                />

                {/* Client bar */}
                <rect
                  x={originX}
                  y={barY + 3}
                  width={Math.max(0, clientX - originX)}
                  height={barH - 6}
                  fill={color}
                  rx="2"
                  opacity="0.85"
                />

                {/* Median tick line */}
                <rect
                  x={medianX - 1}
                  y={barY + 1}
                  width={2}
                  height={barH - 2}
                  fill="#6b6560"
                  rx="1"
                />

                {/* Percentage label */}
                <text
                  x={Math.max(clientX, originX) + 5}
                  y={barY + barH / 2 + 4}
                  fontSize="9.5"
                  fill={color}
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {result.clientPct}%
                </text>

                {/* Status icon */}
                <text
                  x={viewBoxWidth - 12}
                  y={barY + barH / 2 + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={statusColor}
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                >
                  {statusIcon}
                </text>

                {/* Sample size tooltip hint */}
                <title>
                  {result.category}: {result.clientPct}% vs median {result.networkMedian}% (p25:{result.networkP25}% – p75:{result.networkP75}%, n={result.sampleSize} firms)
                </title>
              </g>
            )
          })}
        </svg>
      </div>

      {results.length > 8 && (
        <p className="text-xs mt-2 text-right" style={{ color: '#a09a94' }}>
          Scroll to see all {results.length} categories
        </p>
      )}
    </div>
  )
}
