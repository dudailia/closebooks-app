'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const REVENUE  = [98, 104, 112, 89, 127, 143, 119, 134, 128, 147, 122, 127]
const EXPENSES = [72,  78,  85, 71,  89,  94,  82,  91,  84,  98,  79,  87]

// Previous year (approx)
const PREV_REVENUE  = [91, 96, 105, 82, 118, 133, 111, 124, 120, 137, 114, 119]
const PREV_EXPENSES = [68, 73,  79, 66,  83,  88,  76,  85,  79,  91,  74,  82]

const CHART_W = 900
const CHART_H = 220
const Y_MAX   = 160
const PAD_L   = 40
const PAD_R   = 20
const PAD_T   = 12
const PAD_B   = 28

function toX(i: number) {
  return PAD_L + (i / 11) * (CHART_W - PAD_L - PAD_R)
}
function toY(val: number) {
  return PAD_T + (1 - val / Y_MAX) * (CHART_H - PAD_T - PAD_B)
}

function buildPath(data: number[]) {
  return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
}

function buildArea(data: number[]) {
  const line = buildPath(data)
  const bottom = CHART_H - PAD_B
  const x0 = toX(0).toFixed(1)
  const xN = toX(11).toFixed(1)
  return `${line} L${xN},${bottom} L${x0},${bottom} Z`
}

export default function CashflowPage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width * CHART_W
    // find nearest index
    let nearest = 0
    let minDist  = Infinity
    for (let i = 0; i < 12; i++) {
      const d = Math.abs(x - toX(i))
      if (d < minDist) { minDist = d; nearest = i }
    }
    setHoveredIdx(nearest)
  }

  const ytdNet = REVENUE.reduce((a, b) => a + b, 0) - EXPENSES.reduce((a, b) => a + b, 0)
  const avgRev = Math.round(REVENUE.reduce((a, b) => a + b, 0) / 12)
  const bestIdx = REVENUE.indexOf(Math.max(...REVENUE))

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {/* Top nav */}
      <nav style={{
        height: 56,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e8e0d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <span style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: 18,
          color: '#1a1714',
        }}>
          Miller CPA<span style={{ color: '#b8734a' }}>.</span>
        </span>
        <Link href=".." style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Dashboard
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 64px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 24,
            fontWeight: 400,
            color: '#1a1714',
            margin: '0 0 4px 0',
          }}>Cash Flow</h1>
          <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>Last 12 months</p>
        </div>

        {/* SECTION 1 — Chart */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e8e0d4',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          position: 'relative',
        }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            style={{ width: '100%', height: 220, display: 'block', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Y-axis gridlines */}
            {[0, 40, 80, 120, 160].map(v => (
              <g key={v}>
                <line
                  x1={PAD_L} y1={toY(v)}
                  x2={CHART_W - PAD_R} y2={toY(v)}
                  stroke="#e8e0d4" strokeWidth="0.5"
                />
                <text x={PAD_L - 6} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#a09a94">${v}k</text>
              </g>
            ))}

            {/* X-axis labels */}
            {MONTHS.map((m, i) => (
              <text key={m} x={toX(i)} y={CHART_H - 6} textAnchor="middle" fontSize="9" fill="#a09a94">{m}</text>
            ))}

            {/* Hover highlight */}
            {hoveredIdx !== null && (
              <line
                x1={toX(hoveredIdx)} y1={PAD_T}
                x2={toX(hoveredIdx)} y2={CHART_H - PAD_B}
                stroke="#e8e0d4" strokeWidth="1" strokeDasharray="3,3"
              />
            )}

            {/* Revenue area */}
            <path d={buildArea(REVENUE)} fill="rgba(45,90,39,0.12)" />
            <path d={buildPath(REVENUE)} fill="none" stroke="#2d5a27" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Expenses area */}
            <path d={buildArea(EXPENSES)} fill="rgba(220,38,38,0.08)" />
            <path d={buildPath(EXPENSES)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Hover dots */}
            {hoveredIdx !== null && (
              <>
                <circle cx={toX(hoveredIdx)} cy={toY(REVENUE[hoveredIdx])} r="4" fill="#2d5a27" />
                <circle cx={toX(hoveredIdx)} cy={toY(EXPENSES[hoveredIdx])} r="4" fill="#ef4444" />
              </>
            )}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 8, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b6560' }}>
              <div style={{ width: 24, height: 2, backgroundColor: '#2d5a27', borderRadius: 1 }} />
              Revenue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b6560' }}>
              <div style={{ width: 24, height: 2, backgroundColor: '#ef4444', borderRadius: 1 }} />
              Expenses
            </div>
          </div>

          {/* Tooltip */}
          {hoveredIdx !== null && (
            <div style={{
              position: 'absolute',
              top: 20,
              right: 28,
              backgroundColor: '#1a1714',
              color: '#fff',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              minWidth: 180,
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{MONTHS[hoveredIdx]} 2024</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#86efac' }}>Revenue</span>
                <span>${REVENUE[hoveredIdx]}K</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#fca5a5' }}>Expenses</span>
                <span>${EXPENSES[hoveredIdx]}K</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 6,
              }}>
                <span>Net Income</span>
                <span style={{
                  fontWeight: 700,
                  color: REVENUE[hoveredIdx] - EXPENSES[hoveredIdx] >= 0 ? '#4ade80' : '#f87171',
                }}>
                  ${REVENUE[hoveredIdx] - EXPENSES[hoveredIdx]}K
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2 — Monthly breakdown table */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e8e0d4',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          overflowX: 'auto',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 18,
            fontWeight: 400,
            color: '#1a1714',
            margin: '0 0 16px 0',
          }}>Monthly Breakdown</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e0d4' }}>
                {['Month', 'Revenue', 'Expenses', 'Net Income', 'vs Last Year'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    fontSize: 11, fontWeight: 700, color: '#a09a94',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m, i) => {
                const net = REVENUE[i] - EXPENSES[i]
                const prevNet = PREV_REVENUE[i] - PREV_EXPENSES[i]
                const vsLY = net - prevNet
                return (
                  <tr key={m} style={{ borderBottom: '1px solid #f0ece8' }}>
                    <td style={{ padding: '10px 12px', color: '#1a1714', fontWeight: 600 }}>{m} 2024</td>
                    <td style={{ padding: '10px 12px', color: '#1a1714' }}>${REVENUE[i]}K</td>
                    <td style={{ padding: '10px 12px', color: '#1a1714' }}>${EXPENSES[i]}K</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: net >= 0 ? '#2d5a27' : '#ef4444' }}>
                      {net >= 0 ? '+' : ''}${net}K
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: vsLY >= 0 ? '#2d5a27' : '#ef4444' }}>
                      {vsLY >= 0 ? '▲' : '▼'} ${Math.abs(vsLY)}K
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION 3 — Key insights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              label: 'Best Month',
              value: `${MONTHS[bestIdx]} 2024`,
              sub: `$${REVENUE[bestIdx]}K revenue`,
            },
            {
              label: 'Average Monthly Revenue',
              value: `$${avgRev}K`,
              sub: 'Jan–Dec 2024',
            },
            {
              label: 'YTD Net Income',
              value: `$${ytdNet}K`,
              sub: 'Jan–Dec 2024',
            },
          ].map(card => (
            <div key={card.label} style={{
              backgroundColor: '#fff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a09a94', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 22,
                color: '#1a1714',
                marginBottom: 4,
              }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: '#6b6560' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
