'use client'

import { useEffect, useRef, useState } from 'react'

interface ChartPoint {
  year: number
  current: number
  basic: number
  optimized: number
}

interface TaxProjectionChartProps {
  data: ChartPoint[]
  totalSavings: number
}

const DEFAULT_DATA: ChartPoint[] = [
  { year: 2024, current: 380000, basic: 340000, optimized: 295000 },
  { year: 2025, current: 760000, basic: 655000, optimized: 550000 },
  { year: 2026, current: 1140000, basic: 945000, optimized: 775000 },
  { year: 2027, current: 1520000, basic: 1220000, optimized: 978000 },
  { year: 2028, current: 1900000, basic: 1480000, optimized: 1190000 },
]

export default function TaxProjectionChart({ data = DEFAULT_DATA, totalSavings = 284000 }: Partial<TaxProjectionChartProps>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [animProgress, setAnimProgress] = useState(0)
  const [hoveredX, setHoveredX] = useState<number | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const animRef = useRef<number>(0)

  const W = 680
  const H = 320
  const PAD = { top: 30, right: 40, bottom: 50, left: 70 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map(d => d.current))
  const minVal = 0

  function xPos(i: number) { return PAD.left + (i / (data.length - 1)) * chartW }
  function yPos(val: number) { return PAD.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH }

  function makePath(key: 'current' | 'basic' | 'optimized', progress: number) {
    const pts = data.map((d, i) => ({
      x: xPos(i),
      y: yPos(d[key]),
    }))
    const clipX = PAD.left + progress * chartW
    // Build smooth cubic bezier path
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3
      d += ` C ${cp1x} ${pts[i - 1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
    }
    return { path: d, clipX }
  }

  useEffect(() => {
    const startTime = performance.now()
    const duration = 1400
    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimProgress(eased)
      if (t < 1) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const clipId = 'chart-clip'
  const clipX = PAD.left + animProgress * chartW

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const relX = mx - PAD.left
    const ratio = relX / chartW
    const idx = Math.round(ratio * (data.length - 1))
    if (idx >= 0 && idx < data.length) {
      setHoveredPoint(data[idx])
      setTooltipPos({ x: xPos(idx), y: PAD.top })
    }
    setHoveredX(mx)
  }

  const yTicks = [0, 500000, 1000000, 1500000, 2000000].filter(v => v <= maxVal * 1.05)

  function fmt(v: number) {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
    return `$${v}`
  }

  const currentPath = makePath('current', animProgress)
  const basicPath = makePath('basic', animProgress)
  const optimizedPath = makePath('optimized', animProgress)

  // Year 5 positions for callout
  const y5current = yPos(data[data.length - 1].current)
  const y5optimized = yPos(data[data.length - 1].optimized)
  const y5x = xPos(data.length - 1)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredX(null); setHoveredPoint(null) }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={0} width={clipX - PAD.left} height={H} />
          </clipPath>
          <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d5a27" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2d5a27" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD.left} y1={yPos(tick)} x2={W - PAD.right} y2={yPos(tick)}
              stroke="#e8e0d4" strokeWidth="1" strokeDasharray={tick === 0 ? 'none' : '4 4'}
            />
            <text x={PAD.left - 8} y={yPos(tick) + 4} textAnchor="end" fontSize="11" fill="#a09a94">
              {fmt(tick)}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {data.map((d, i) => (
          <text key={d.year} x={xPos(i)} y={H - 12} textAnchor="middle" fontSize="12" fill="#6b6560" fontWeight="500">
            {d.year}
          </text>
        ))}

        {/* Area fills (clipped) */}
        <path
          d={`${currentPath.path} L ${y5x} ${H - PAD.bottom} L ${xPos(0)} ${H - PAD.bottom} Z`}
          fill="url(#currentGrad)" clipPath={`url(#${clipId})`}
        />
        <path
          d={`${optimizedPath.path} L ${y5x} ${H - PAD.bottom} L ${xPos(0)} ${H - PAD.bottom} Z`}
          fill="url(#optimizedGrad)" clipPath={`url(#${clipId})`}
        />

        {/* Lines (clipped for animation) */}
        {/* Basic strategies (amber) */}
        <path d={basicPath.path} fill="none" stroke="#f59e0b" strokeWidth="2.5" clipPath={`url(#${clipId})`} />
        {/* Current path (red dashed) */}
        <path d={currentPath.path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="8 5" clipPath={`url(#${clipId})`} />
        {/* Optimized (green) */}
        <path d={optimizedPath.path} fill="none" stroke="#2d5a27" strokeWidth="3" clipPath={`url(#${clipId})`} />

        {/* Data points */}
        {animProgress > 0.98 && data.map((d, i) => (
          <g key={d.year}>
            <circle cx={xPos(i)} cy={yPos(d.current)} r="4" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            <circle cx={xPos(i)} cy={yPos(d.basic)} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
            <circle cx={xPos(i)} cy={yPos(d.optimized)} r="4" fill="#2d5a27" stroke="#fff" strokeWidth="2" />
          </g>
        ))}

        {/* Savings callout between red and green at year 5 */}
        {animProgress > 0.95 && (
          <g>
            <line x1={y5x + 12} y1={y5current} x2={y5x + 12} y2={y5optimized} stroke="#e8e0d4" strokeWidth="1.5" />
            <line x1={y5x + 9} y1={y5current} x2={y5x + 15} y2={y5current} stroke="#e8e0d4" strokeWidth="1.5" />
            <line x1={y5x + 9} y1={y5optimized} x2={y5x + 15} y2={y5optimized} stroke="#e8e0d4" strokeWidth="1.5" />
            <rect
              x={y5x - 60} y={(y5current + y5optimized) / 2 - 22}
              width={120} height={44} rx="8" fill="#2d5a27" opacity="0.95"
            />
            <text
              x={y5x} y={(y5current + y5optimized) / 2 - 4}
              textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600"
            >Save ${(totalSavings / 1000).toFixed(0)}K</text>
            <text
              x={y5x} y={(y5current + y5optimized) / 2 + 12}
              textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.8)"
            >over 5 years</text>
          </g>
        )}

        {/* Hover line */}
        {hoveredX !== null && hoveredPoint && (
          <g>
            <line x1={hoveredX} y1={PAD.top} x2={hoveredX} y2={H - PAD.bottom} stroke="#e8e0d4" strokeWidth="1" />
            {/* Tooltip box */}
            <rect
              x={Math.min(hoveredX + 8, W - 140)} y={tooltipPos.y}
              width={130} height={86} rx="8"
              fill="#1a1714" opacity="0.9"
            />
            <text x={Math.min(hoveredX + 16, W - 132)} y={tooltipPos.y + 16} fontSize="11" fill="#fff" fontWeight="700">
              {hoveredPoint.year}
            </text>
            {[
              { label: 'Current', val: hoveredPoint.current, color: '#ef4444' },
              { label: 'Basic', val: hoveredPoint.basic, color: '#f59e0b' },
              { label: 'Optimized', val: hoveredPoint.optimized, color: '#4ade80' },
            ].map((row, i) => (
              <g key={row.label}>
                <circle cx={Math.min(hoveredX + 16, W - 132)} cy={tooltipPos.y + 32 + i * 18} r="4" fill={row.color} />
                <text x={Math.min(hoveredX + 24, W - 124)} y={tooltipPos.y + 36 + i * 18} fontSize="10" fill="#e8e0d4">
                  {row.label}: {fmt(row.val)}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {[
          { color: '#ef4444', label: 'Current path (no changes)', dashed: true },
          { color: '#f59e0b', label: 'Basic strategies (QBI + standard)' },
          { color: '#2d5a27', label: 'All strategies (optimized)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="12">
              <line
                x1="0" y1="6" x2="28" y2="6"
                stroke={item.color} strokeWidth="2.5"
                strokeDasharray={item.dashed ? '6 4' : 'none'}
              />
            </svg>
            <span style={{ fontSize: 12, color: '#6b6560' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
