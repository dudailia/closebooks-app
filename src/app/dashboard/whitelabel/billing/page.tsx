'use client'

import { useEffect, useState, useRef } from 'react'

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])

  return value
}

const MONTHLY = [1200, 1500, 1800, 2000, 2100, 2200, 2400, 2600, 2800, 3000, 3100, 3200]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MAX_VAL = Math.max(...MONTHLY)

const CLIENTS = [
  { name: 'Smith Construction LLC', plan: 'Professional', monthly: 150, cut: 105, since: 'Mar 2024', status: 'Active' },
  { name: 'Bella Vista Restaurant', plan: 'Starter', monthly: 75, cut: 52.50, since: 'Jun 2024', status: 'Active' },
  { name: 'Chen Medical Practice', plan: 'Professional', monthly: 150, cut: 105, since: 'Jul 2024', status: 'Active' },
  { name: 'TechFlow Inc', plan: 'Starter', monthly: 75, cut: 52.50, since: 'Sep 2024', status: 'Active' },
  { name: 'Green Valley Farms', plan: 'Starter', monthly: 75, cut: 52.50, since: 'Oct 2024', status: 'Active' },
]

export default function WhitelabelBillingPage() {
  const allTimeEarnings = useCountUp(26880, 1400)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const totalGross = MONTHLY.reduce((s, v) => s + v, 0)

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 28,
          color: '#1a1714',
          margin: '0 0 24px 0',
        }}
      >
        Platform Billing
      </h1>

      {/* Revenue summary hero card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1714, #2d2520)',
          borderRadius: 16,
          padding: '28px 36px',
          minHeight: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-dm-serif)',
              fontSize: 42,
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            ${allTimeEarnings.toLocaleString()}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            All-time earnings · Across 24 months · 24 active portals
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            Since March 2024
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total Gross Revenue', value: `$${totalGross.toLocaleString()}` },
          { label: 'Your Earnings (70%)', value: `$${Math.round(totalGross * 0.7).toLocaleString()}`, highlight: true },
          { label: 'Platform Fee (30%)', value: `$${Math.round(totalGross * 0.3).toLocaleString()}` },
          { label: 'Avg per Client', value: '$177/mo' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 12, color: '#78716c', marginBottom: 6 }}>{stat.label}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: stat.highlight ? '#2d5a27' : '#1a1714',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 12-month SVG bar chart */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif)',
            fontSize: 18,
            color: '#1a1714',
            margin: '0 0 20px 0',
          }}
        >
          12-Month Platform Revenue
        </h2>
        <div style={{ position: 'relative' }}>
          <svg
            viewBox="0 0 700 180"
            style={{ width: '100%', overflow: 'visible' }}
          >
            {MONTHLY.map((val, i) => {
              const barH = (val / MAX_VAL) * 120
              const barW = 38
              const gap = 58
              const x = i * gap + 10
              const y = 135 - barH

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={hoveredBar === i ? '#234a1e' : '#2d5a27'}
                    style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  {hoveredBar === i && (
                    <g>
                      <rect
                        x={x - 10}
                        y={y - 40}
                        width={60}
                        height={32}
                        rx={6}
                        fill="#1a1714"
                      />
                      <text
                        x={x + barW / 2}
                        y={y - 27}
                        textAnchor="middle"
                        fontSize={9}
                        fill="rgba(255,255,255,0.7)"
                      >
                        {MONTHS[i]}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={y - 14}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#ffffff"
                        fontWeight={600}
                      >
                        ${val.toLocaleString()}
                      </text>
                    </g>
                  )}
                  <text
                    x={x + barW / 2}
                    y={155}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#a09080"
                  >
                    {MONTHS[i]}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Revenue by Client table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e8e0d4' }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714', margin: 0 }}>
            Revenue by Client
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf8f4' }}>
              {['Client', 'Plan', 'Monthly', 'Your Cut (70%)', 'Since', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 18px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#78716c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((client) => (
              <tr
                key={client.name}
                onMouseEnter={() => setHoveredRow(client.name)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderTop: '1px solid #f0ece6',
                  backgroundColor: hoveredRow === client.name ? '#faf8f4' : '#ffffff',
                  transition: 'background-color 0.1s',
                }}
              >
                <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 500, color: '#1a1714' }}>
                  {client.name}
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: '#57534e' }}>{client.plan}</td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: '#1a1714', fontWeight: 600 }}>
                  ${client.monthly}/mo
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>
                  ${client.cut}/mo
                </td>
                <td style={{ padding: '13px 18px', fontSize: 13, color: '#78716c' }}>{client.since}</td>
                <td style={{ padding: '13px 18px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 20,
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderLeft: '4px solid #2d5a27',
          borderRadius: 14,
          padding: 28,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif)',
            fontSize: 18,
            color: '#1a1714',
            margin: '0 0 12px 0',
          }}
        >
          Next Payout
        </h2>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#2d5a27',
            marginBottom: 4,
          }}
        >
          $2,240
        </div>
        <div style={{ fontSize: 14, color: '#57534e', marginBottom: 16 }}>
          Scheduled for December 1st, 2025
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: '#57534e',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Chase Business Checking ••••4821
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            style={{
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#b8734a',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Change payment method
          </button>
          <button
            style={{
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: '#b8734a',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Download revenue report
          </button>
        </div>
      </div>
    </div>
  )
}
