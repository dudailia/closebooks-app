'use client'

import { useEffect, useRef, useState } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface Props {
  data: DataPoint[]
  unit: string
  title: string
}

export default function PulseResultChart({ data, unit, title }: Props) {
  const [widths, setWidths] = useState<number[]>(data.map(() => 0))
  const hasAnimated = useRef(false)

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const duration = 600
    const start = performance.now()

    function frame(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setWidths(data.map((d) => (d.value / maxValue) * eased * 100))
      if (t < 1) requestAnimationFrame(frame)
    }

    // Small delay so component is mounted before animation
    const id = setTimeout(() => requestAnimationFrame(frame), 80)
    return () => clearTimeout(id)
  }, [data, maxValue])

  // Gradient: copper (#b8734a) to green (#2d5a27), index-based
  function barColor(i: number): string {
    const t = data.length <= 1 ? 0.5 : i / (data.length - 1)
    // Interpolate copper -> green
    const r = Math.round(184 + (45 - 184) * t)
    const g = Math.round(115 + (90 - 115) * t)
    const b = Math.round(74 + (39 - 74) * t)
    return `rgb(${r},${g},${b})`
  }

  const BAR_HEIGHT = 32
  const LABEL_W = 200
  const VALUE_W = 56
  const BAR_AREA_W = 340
  const ROW_GAP = 10
  const totalH = data.length * (BAR_HEIGHT + ROW_GAP) + 8

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6b6560', marginBottom: 12 }}>
          {title}
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg
          width={LABEL_W + BAR_AREA_W + VALUE_W + 16}
          height={totalH}
          style={{ display: 'block', minWidth: 400 }}
        >
          {data.map((d, i) => {
            const y = i * (BAR_HEIGHT + ROW_GAP)
            const barW = (widths[i] / 100) * BAR_AREA_W
            return (
              <g key={i}>
                {/* Label */}
                <foreignObject x={0} y={y + 4} width={LABEL_W - 8} height={BAR_HEIGHT}>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#1a1714',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 4,
                    }}
                  >
                    {d.label}
                  </div>
                </foreignObject>

                {/* Bar track */}
                <rect
                  x={LABEL_W}
                  y={y + 8}
                  width={BAR_AREA_W}
                  height={BAR_HEIGHT - 16}
                  rx={6}
                  fill="#f0ece4"
                />

                {/* Bar fill */}
                {barW > 0 && (
                  <rect
                    x={LABEL_W}
                    y={y + 8}
                    width={Math.max(barW, 6)}
                    height={BAR_HEIGHT - 16}
                    rx={6}
                    fill={barColor(i)}
                  />
                )}

                {/* Value label */}
                <text
                  x={LABEL_W + BAR_AREA_W + 8}
                  y={y + BAR_HEIGHT / 2 + 4}
                  fontSize={12}
                  fontWeight={600}
                  fill="#1a1714"
                  fontFamily="inherit"
                >
                  {d.value}{unit}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
