'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const TAX_AMOUNT = 23400

function useCountUp(target: number, duration = 1200, active = true) {
  const [value, setValue] = useState(0)
  const raf   = useRef<number | null>(null)
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    function step(ts: number) {
      if (!start.current) start.current = ts
      const elapsed  = ts - start.current
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf.current = requestAnimationFrame(step)
      }
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration, active])

  return value
}

const TAX_CALENDAR = [
  { date: 'Jan 15', desc: 'Q4 2024 Estimated Tax',   amount: '$23,400', status: 'PAID' },
  { date: 'Mar 15', desc: 'S-Corp/Partnership Return', amount: '—',      status: 'DUE' },
  { date: 'Apr 15', desc: 'Q1 2025 Estimated Tax',    amount: '$6,200',  status: 'UPCOMING' },
  { date: 'Jun 15', desc: 'Q2 2025 Estimated Tax',    amount: '$6,200',  status: 'UPCOMING' },
  { date: 'Sep 15', desc: 'Q3 2025 Estimated Tax',    amount: '$6,200',  status: 'UPCOMING' },
  { date: 'Jan 15', desc: 'Q4 2025 Estimated Tax',    amount: '$6,200',  status: 'UPCOMING' },
  { date: 'Apr 15', desc: 'Business Return',           amount: '—',      status: 'UPCOMING' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAID') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        backgroundColor: '#dcfce7', color: '#166534',
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
      }}>
        ✓ PAID
      </span>
    )
  }
  if (status === 'DUE') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        backgroundColor: '#fef3c7', color: '#92400e',
        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
      }}>
        ⚠ DUE IN 64 DAYS
      </span>
    )
  }
  return (
    <span style={{
      backgroundColor: '#f3f4f6', color: '#6b7280',
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
    }}>
      UPCOMING
    </span>
  )
}

export default function TaxPage() {
  const displayed    = useCountUp(TAX_AMOUNT, 1200)
  const RESERVED     = 18400
  const RECOMMENDED  = 23400
  const reservedPct  = Math.round((RESERVED / RECOMMENDED) * 100)
  const daysLeft     = 64
  const daysTotal    = 90
  const daysPct      = Math.round((daysLeft / daysTotal) * 100)

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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 24,
            fontWeight: 400,
            color: '#1a1714',
            margin: 0,
          }}>Tax Obligations</h1>
        </div>

        {/* SECTION 1 — Hero card */}
        <div style={{
          backgroundColor: '#1a1714',
          borderRadius: 16,
          padding: '32px 40px',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#b8734a',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Q1 2025 Estimated Tax
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: 8,
            fontVariantNumeric: 'tabular-nums',
          }}>
            ${displayed.toLocaleString()}
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
            Due April 15, 2025
          </div>

          {/* Progress bar — days remaining */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Days remaining</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{daysLeft} of {daysTotal} days</span>
            </div>
            <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${daysPct}%`,
                backgroundColor: '#b8734a',
                borderRadius: 3,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="https://www.irs.gov/payments/direct-pay"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#b8734a',
                color: '#fff',
                borderRadius: 8,
                padding: '11px 22px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Pay via IRS Direct Pay →
            </a>
            <button style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 8,
              padding: '11px 22px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Set aside funds
            </button>
          </div>
        </div>

        {/* SECTION 2 — Tax calendar */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e8e0d4',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 18,
            fontWeight: 400,
            color: '#1a1714',
            margin: '0 0 20px 0',
          }}>2025 Tax Calendar</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TAX_CALENDAR.map((item, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 100px 160px',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: item.status === 'DUE' ? '#fffbf0' : 'transparent',
                border: item.status === 'DUE' ? '1px solid #fef3c7' : '1px solid transparent',
              }}>
                <span style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: item.status === 'PAID' ? '#a09a94' : '#1a1714',
                }}>
                  {item.date}
                </span>
                <span style={{
                  fontSize: 13,
                  color: item.status === 'PAID' ? '#a09a94' : '#1a1714',
                }}>
                  {item.desc}
                </span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: item.status === 'PAID' ? '#a09a94' : '#1a1714',
                  textAlign: 'right',
                }}>
                  {item.amount}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3 — Tax reserve tracker */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e8e0d4',
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 18,
            fontWeight: 400,
            color: '#1a1714',
            margin: '0 0 20px 0',
          }}>Tax Reserve Tracking</h2>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1714' }}>
                  Reserved: ${RESERVED.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#6b6560', marginLeft: 8 }}>
                  / Recommended: ${RECOMMENDED.toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{reservedPct}%</span>
            </div>
            <div style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${reservedPct}%`,
                backgroundColor: '#f59e0b',
                borderRadius: 5,
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 6 }}>
              ${(RECOMMENDED - RESERVED).toLocaleString()} gap to close before April 15
            </div>
          </div>

          <Link
            href="../"
            style={{
              fontSize: 14,
              color: '#b8734a',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Talk to your CPA about closing the gap →
          </Link>
        </div>
      </div>
    </div>
  )
}
