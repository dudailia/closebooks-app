'use client'
import { useState } from 'react'
import type { HealthBreakdown } from '@/lib/health/scoreClient'

const BUCKET_COLORS: Record<
  HealthBreakdown['bucket'],
  { bg: string; text: string; dot: string; label: string }
> = {
  excellent: { bg: '#e8f0e6', text: '#166534', dot: '#059669', label: 'Excellent' },
  good:      { bg: '#fffbeb', text: '#92400e', dot: '#d97706', label: 'Good' },
  attention: { bg: '#fed7aa', text: '#9a3412', dot: '#ea580c', label: 'Attention' },
  critical:  { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626', label: 'Critical' },
}

export default function HealthPill({ breakdown }: { breakdown: HealthBreakdown }) {
  const [open, setOpen] = useState(false)
  const c = BUCKET_COLORS[breakdown.bucket]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          backgroundColor: c.bg,
          color: c.text,
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-label={`Health score ${breakdown.score} out of 100, ${c.label}`}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: c.dot,
            flexShrink: 0,
          }}
        />
        {breakdown.score}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 50,
              width: 280,
              padding: 14,
              backgroundColor: '#fff',
              border: '1px solid #e0dbd4',
              borderRadius: 10,
              boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1a1714' }}>
                {c.label} · {breakdown.score}/100
              </p>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(
                [
                  ['onTime', 'On-time close'],
                  ['anomalies', 'Anomalies'],
                  ['docs', 'Documents'],
                  ['recon', 'Reconciliation'],
                ] as const
              ).map(([k, label]) => {
                const s = breakdown.signals[k]
                const pct = Math.round((s.points / s.max) * 100)
                return (
                  <div key={k}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: '#6b6560',
                        marginBottom: 2,
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {s.points}/{s.max}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        backgroundColor: '#f0ebe3',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: c.dot,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: '#6b6560', margin: '3px 0 0' }}>{s.note}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
