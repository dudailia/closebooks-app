'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllSessions, getClientTimeSummary, type TimeSession } from '@/lib/timeTracking'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimeTrackingPage() {
  const [sessions, setSessions] = useState<TimeSession[]>([])
  const [summary, setSummary] = useState<{ clientName: string; totalMinutes: number; sessions: number }[]>([])
  const [mounted, setMounted] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(150)

  useEffect(() => {
    setSessions(getAllSessions().filter(s => s.durationMinutes != null))
    setSummary(getClientTimeSummary())
    const saved = localStorage.getItem('cb_hourly_rate')
    if (saved) setHourlyRate(Number(saved))
    setMounted(true)
  }, [])

  function handleRateChange(val: number) {
    setHourlyRate(val)
    localStorage.setItem('cb_hourly_rate', String(val))
  }

  const totalMinutes = summary.reduce((s, c) => s + c.totalMinutes, 0)
  const totalBillable = Math.round((totalMinutes / 60) * hourlyRate)

  if (!mounted) return <div style={{ padding: 32 }}><div style={{ height: 200, borderRadius: 12, backgroundColor: '#f0ebe3' }} className="cb-skeleton" /></div>

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1a1714', margin: 0, marginBottom: 4 }}>
          Time Tracking
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          Time is automatically tracked while you work on closes. Use it to verify your invoices.
        </p>
      </div>

      {/* Rate + Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) auto', gap: 16, marginBottom: 28, alignItems: 'start' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: '#6b6560', margin: '0 0 4px' }}>Total Time Logged</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#1a1714', margin: 0 }}>{fmtDuration(totalMinutes)}</p>
          <p style={{ fontSize: 11, color: '#a09a94', margin: '2px 0 0' }}>across {sessions.length} sessions</p>
        </div>
        <div style={{ backgroundColor: '#f0f5ef', border: '1px solid #c4d9c0', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: '#2d5a27', margin: '0 0 4px' }}>Estimated Billable</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#2d5a27', margin: 0 }}>${totalBillable.toLocaleString()}</p>
          <p style={{ fontSize: 11, color: '#6b6560', margin: '2px 0 0' }}>at ${hourlyRate}/hr</p>
        </div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 20px', minWidth: 180 }}>
          <p style={{ fontSize: 12, color: '#6b6560', margin: '0 0 8px' }}>Your hourly rate</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, color: '#1a1714' }}>$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={e => handleRateChange(Number(e.target.value))}
              style={{ width: 80, border: '1px solid #e8e0d4', borderRadius: 8, padding: '4px 8px', fontSize: 14, color: '#1a1714' }}
            />
            <span style={{ fontSize: 12, color: '#6b6560' }}>/hr</span>
          </div>
        </div>
      </div>

      {/* Per-client summary */}
      {summary.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 12 }}>By Client</h2>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
                  {['Client', 'Sessions', 'Total Time', 'Billable'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b6560', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr key={row.clientName} style={{ borderTop: i > 0 ? '1px solid #f3f0eb' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#1a1714' }}>{row.clientName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b6560' }}>{row.sessions}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{fmtDuration(row.totalMinutes)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#2d5a27' }}>
                      ${Math.round((row.totalMinutes / 60) * hourlyRate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session log */}
      {sessions.length > 0 ? (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 12 }}>Session Log</h2>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
                  {['Date', 'Client', 'Page', 'Duration'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 50).map((s, i) => (
                  <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #f3f0eb' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b6560' }}>{fmtDate(s.startedAt)}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#1a1714' }}>{s.clientName}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b6560', textTransform: 'capitalize' }}>{s.page}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{fmtDuration(s.durationMinutes ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏱️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No sessions tracked yet</h3>
          <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 360, margin: '0 auto 24px' }}>
            Time is automatically recorded when you work on a close. Start one to begin tracking.
          </p>
          <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Start a close
          </Link>
        </div>
      )}
    </div>
  )
}
