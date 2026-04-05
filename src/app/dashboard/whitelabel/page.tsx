'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

function useCountUp(target: number, duration: number = 1400) {
  const [value, setValue] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // cubic ease out
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

const CLIENT_PORTALS = [
  { name: 'Smith Construction LLC', status: 'active', lastLogin: '2 hours ago' },
  { name: 'Bella Vista Restaurant', status: 'active', lastLogin: 'Yesterday' },
  { name: 'Chen Medical Practice', status: 'active', lastLogin: '3 days ago' },
  { name: 'TechFlow Inc', status: 'inactive', lastLogin: 'Never' },
  { name: 'Green Valley Farms', status: 'inactive', lastLogin: 'Never' },
]

const BAR_DATA = [1200, 1800, 2100, 2400, 2800, 3200]
const BAR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const MAX_BAR = Math.max(...BAR_DATA)

export default function WhitelabelPage() {
  const earnings = useCountUp(2240, 1400)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('closebooks.app/portal/millercpa').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Revenue Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1714, #2d2520)',
          borderRadius: 16,
          padding: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-dm-serif)',
              fontSize: 36,
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            ${earnings.toLocaleString()}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
            Your earnings this month from the CloseBooks Platform
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#b8734a', fontWeight: 500 }}>
              Gross platform revenue: $3,200
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              CloseBooks fee (30%): $960
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            24 active client portals
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            67 logins this week
          </div>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginTop: 24,
        }}
      >
        {/* Card 1 — Branding */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Your Brand
          </div>

          {/* Branded header preview */}
          <div
            style={{
              backgroundColor: '#faf8f4',
              border: '1px solid #e8e0d4',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#b8734a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 16, color: '#1a1714' }}>
                Miller CPA Financial Suite
              </div>
              <div style={{ fontSize: 11, color: '#78716c' }}>Financial clarity for growing businesses</div>
            </div>
          </div>

          <Link
            href="/dashboard/whitelabel/setup"
            onMouseEnter={() => setHoveredBtn('edit-brand')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e8e0d4',
              backgroundColor: hoveredBtn === 'edit-brand' ? '#f8f5f0' : '#ffffff',
              color: '#1a1714',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background-color 0.15s',
              marginBottom: 10,
            }}
          >
            Edit Branding →
          </Link>
          <p style={{ fontSize: 11, color: '#a09080', margin: 0 }}>
            Clients see your brand, not CloseBooks
          </p>
        </div>

        {/* Card 2 — Platform URL */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Platform URL
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              backgroundColor: '#f8f5f0',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#1a1714',
              marginBottom: 14,
              wordBreak: 'break-all',
            }}
          >
            closebooks.app/portal/millercpa
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, color: '#57534e' }}>Custom domain: books.millercpa.com</span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: '#dcfce7',
                color: '#166534',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Active
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopy}
              onMouseEnter={() => setHoveredBtn('copy')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #e8e0d4',
                backgroundColor: copied ? '#dcfce7' : hoveredBtn === 'copy' ? '#f8f5f0' : '#ffffff',
                color: copied ? '#166534' : '#1a1714',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: 500,
              }}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button
              onMouseEnter={() => setHoveredBtn('share')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #e8e0d4',
                backgroundColor: hoveredBtn === 'share' ? '#f8f5f0' : '#ffffff',
                color: '#1a1714',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                fontWeight: 500,
              }}
            >
              Share
            </button>
          </div>
        </div>

        {/* Card 3 — Client Access */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Client Portals
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {CLIENT_PORTALS.map((client) => (
              <div
                key={client.name}
                onMouseEnter={() => setHoveredRow(client.name)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  backgroundColor: hoveredRow === client.name ? '#faf8f4' : '#ffffff',
                  transition: 'background-color 0.1s',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: '#a09080' }}>{client.lastLogin}</div>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: client.status === 'active' ? '#dcfce7' : '#f5f5f4',
                    color: client.status === 'active' ? '#166534' : '#78716c',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {client.status}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/whitelabel/clients"
            style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
          >
            Manage all →
          </Link>
        </div>

        {/* Card 4 — Revenue Chart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Platform Revenue
          </div>

          {/* SVG bar chart */}
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 300 120" style={{ width: '100%', overflow: 'visible' }}>
              {BAR_DATA.map((val, i) => {
                const barH = (val / MAX_BAR) * 80
                const x = i * 50 + 10
                const y = 90 - barH
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={30}
                      height={barH}
                      rx={4}
                      fill={hoveredBar === i ? '#234a1e' : '#2d5a27'}
                      style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {hoveredBar === i && (
                      <text
                        x={x + 15}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#1a1714"
                        fontWeight={600}
                      >
                        ${(val / 1000).toFixed(1)}k
                      </text>
                    )}
                    <text x={x + 15} y={108} textAnchor="middle" fontSize={9} fill="#a09080">
                      {BAR_MONTHS[i]}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          padding: 28,
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>
            Not using the platform yet? Turn CloseBooks into YOUR software product.
          </div>
          <div style={{ fontSize: 13, color: '#78716c' }}>
            White-label our platform under your firm's brand and charge clients a monthly fee.
          </div>
        </div>
        <Link
          href="/dashboard/whitelabel/setup"
          onMouseEnter={() => setHoveredBtn('get-started')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            backgroundColor: hoveredBtn === 'get-started' ? '#a36640' : '#b8734a',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s',
          }}
        >
          Get Started →
        </Link>
      </div>
    </div>
  )
}
