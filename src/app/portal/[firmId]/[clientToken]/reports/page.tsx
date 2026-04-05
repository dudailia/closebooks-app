'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const REPORTS = [
  { month: 'November 2024', revenue: 127, net: 40 },
  { month: 'October 2024', revenue: 122, net: 38 },
  { month: 'September 2024', revenue: 147, net: 49 },
  { month: 'August 2024', revenue: 143, net: 47 },
  { month: 'July 2024', revenue: 134, net: 44 },
  { month: 'June 2024', revenue: 143, net: 45 },
  { month: 'May 2024', revenue: 127, net: 37 },
  { month: 'April 2024', revenue: 119, net: 33 },
  { month: 'March 2024', revenue: 89, net: 20 },
  { month: 'February 2024', revenue: 112, net: 29 },
  { month: 'January 2024', revenue: 104, net: 28 },
  { month: 'December 2023', revenue: 98, net: 24 },
]

export default function ReportsPage() {
  const params = useParams()
  const firmId = (params?.firmId as string) || 'miller-cpa'
  const [dateRange, setDateRange] = useState('last-12')

  const firmName = firmId
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)' }}>
      {/* Top Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        background: 'white',
        borderBottom: '1px solid #e8e0d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={`/portal/${firmId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714' }}>{firmName}</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#b8734a', display: 'inline-block', marginLeft: 2 }} />
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#6b6560' }}>Smith Construction LLC</span>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: 0, marginBottom: 4 }}>
              Financial Reports
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Download or view your monthly financial statements</p>
          </div>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              color: '#1a1714',
              background: 'white',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="last-12">Last 12 months</option>
            <option value="last-6">Last 6 months</option>
            <option value="this-year">This year</option>
          </select>
        </div>

        {/* Report cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {REPORTS.map((report, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                border: '1px solid #e8e0d4',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-dm-serif)',
                fontSize: 18,
                color: '#1a1714',
                marginBottom: 12,
              }}>
                {report.month}
              </div>

              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Revenue</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2d5a27' }}>${report.revenue}K</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Net Income</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2d5a27' }}>${report.net}K</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => alert('PDF download coming soon')}
                  style={{
                    flex: 1,
                    background: '#2d5a27',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Download PDF
                </button>
                <button
                  onClick={() => alert('Online view coming soon')}
                  style={{
                    flex: 1,
                    background: 'none',
                    color: '#2d5a27',
                    border: '1px solid #2d5a27',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View Online
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
