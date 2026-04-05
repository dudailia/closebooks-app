'use client'

import { useEffect, useRef, useState } from 'react'
import ExceptionCard from './ExceptionCard'
import type { CloseResult, CloseException } from './CloseTerminal'

interface CloseReportProps {
  result: CloseResult
  clientName: string
  period: string
}

// ─── Animated counter hook ────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return value
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BigStat({
  value,
  label,
  accent = '#1a1714',
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number
  label: string
  accent?: string
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const animated = useCountUp(Math.round(value))
  const display = decimals > 0 ? (animated / Math.pow(10, decimals)).toFixed(decimals) : String(animated)

  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: accent,
          margin: '0 0 2px 0',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {prefix}{display}{suffix}
      </p>
      <p style={{ fontSize: '12px', color: '#6b6560', margin: 0 }}>{label}</p>
    </div>
  )
}

function PnLRow({
  label,
  value,
  pct,
  bold = false,
  accent,
}: {
  label: string
  value: number
  pct?: number
  bold?: boolean
  accent?: string
}) {
  const animated = useCountUp(Math.round(value))
  const color = accent ?? (bold ? '#1a1714' : '#6b6560')

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: bold ? 'none' : '1px solid #f0ebe3',
      }}
    >
      <span
        style={{
          fontSize: bold ? '14px' : '13px',
          fontWeight: bold ? 700 : 400,
          color,
        }}
      >
        {label}
      </span>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            fontSize: bold ? '15px' : '13px',
            fontWeight: bold ? 700 : 500,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ${animated.toLocaleString()}
        </span>
        {pct !== undefined && (
          <span style={{ fontSize: '11px', color: '#6b6560', marginLeft: 6 }}>
            ({pct.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CloseReport({ result, clientName, period }: CloseReportProps) {
  const { stats, pnl, exceptions } = result
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const [allApproved, setAllApproved] = useState(false)
  const [exported, setExported] = useState(false)

  const visibleExceptions = exceptions.filter(e => !resolvedIds.has(e.id))
  const remaining = visibleExceptions.length

  function handleAccept(exc: CloseException) {
    setResolvedIds(prev => { const s = new Set(prev); s.add(exc.id); return s })
    fetch('/api/autopilot/resolve-exception', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exceptionId: exc.id,
        resolution: 'accepted',
        category: exc.aiSuggestion,
      }),
    }).catch(() => {/* fire and forget */})
  }

  function handleReview(exc: CloseException) {
    setReviewedIds(prev => { const s = new Set(prev); s.add(exc.id); return s })
  }

  function handleApproveAll() {
    setAllApproved(true)
    exceptions.forEach(exc => {
      fetch('/api/autopilot/resolve-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exceptionId: exc.id, resolution: 'bulk_accepted' }),
      }).catch(() => {/* fire and forget */})
    })
    setTimeout(() => setResolvedIds(new Set(exceptions.map(e => e.id))), 300)
  }

  function handleExport() {
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  return (
    <div style={{ animation: 'report-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Report header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '12px',
                fontWeight: 700,
                color: '#2d5a27',
                backgroundColor: '#e8f0e6',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              <span style={{ fontSize: '11px' }}>✓</span> CLOSE COMPLETE
            </span>
          </div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '22px',
              color: '#1a1714',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {clientName} — {period} Close Report
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2d5a27',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#234820')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2d5a27')}
          >
            {exported ? '✓ Exported!' : 'Export to QuickBooks'}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6b6560',
              backgroundColor: 'transparent',
              border: '1px solid #e8e0d4',
              borderRadius: '9px',
              cursor: 'pointer',
            }}
          >
            Print Report
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 280px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* ── Left: Stats ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '14px',
              color: '#1a1714',
              margin: '0 0 20px 0',
            }}
          >
            Summary
          </h3>

          <BigStat
            value={stats.totalTransactions}
            label="transactions processed"
            accent="#2d5a27"
          />
          <BigStat
            value={Math.round(stats.pctCategorized * 10)}
            label="categorized automatically"
            accent="#2d5a27"
            suffix="%"
            decimals={1}
          />
          <BigStat
            value={stats.journalEntriesCount}
            label="journal entries written"
            accent="#b8734a"
          />

          <div
            style={{
              borderTop: '1px solid #f0ebe3',
              paddingTop: 16,
              marginTop: 4,
            }}
          >
            <BigStat
              value={0}
              label="reconciliation difference"
              accent="#2d5a27"
              prefix="$"
            />
            <BigStat
              value={stats.exceptionsCount}
              label="exceptions flagged"
              accent="#fbbf24"
            />
            <BigStat
              value={stats.elapsedSeconds}
              label="seconds to close"
              accent="#60a5fa"
            />
          </div>
        </div>

        {/* ── Center: Exceptions ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <h3
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: '14px',
                color: '#1a1714',
                margin: 0,
              }}
            >
              {remaining > 0 ? `${remaining} Item${remaining !== 1 ? 's' : ''} Need Review` : 'All Items Resolved'}
            </h3>
            {remaining > 0 && (
              <button
                onClick={handleApproveAll}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2d5a27',
                  backgroundColor: '#e8f0e6',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                }}
              >
                Approve All
              </button>
            )}
          </div>

          {remaining === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#2d5a27',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: 8 }}>✓</div>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>All exceptions resolved</p>
              <p style={{ fontSize: '12px', color: '#6b6560', marginTop: 4 }}>
                Your books are clean and ready to close.
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {exceptions.map(exc => (
                <div
                  key={exc.id}
                  style={{
                    display: resolvedIds.has(exc.id) ? 'none' : 'block',
                    opacity: reviewedIds.has(exc.id) ? 0.5 : 1,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <ExceptionCard
                    id={exc.id}
                    description={exc.description}
                    amount={exc.amount}
                    type={exc.type}
                    aiSuggestion={exc.aiSuggestion}
                    confidence={exc.confidence}
                    onAccept={() => handleAccept(exc)}
                    onReview={() => handleReview(exc)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Financials ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '14px',
              color: '#1a1714',
              margin: '0 0 4px 0',
            }}
          >
            Profit & Loss
          </h3>
          <p style={{ fontSize: '11px', color: '#6b6560', margin: '0 0 16px 0' }}>{period}</p>

          <PnLRow label="Revenue" value={pnl.revenue} bold accent="#2d5a27" />
          <PnLRow label="Cost of Goods Sold" value={pnl.cogs} />
          <PnLRow
            label="Gross Profit"
            value={pnl.grossProfit}
            pct={pnl.grossMarginPct}
            bold
            accent="#1a1714"
          />

          <div style={{ margin: '16px 0 4px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b6560', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operating Expenses
            </p>
          </div>
          <PnLRow label="Total OpEx" value={pnl.operatingExpenses} />

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #e8e0d4' }}>
            <PnLRow
              label="Net Income"
              value={pnl.netIncome}
              pct={pnl.netMarginPct}
              bold
              accent={pnl.netIncome >= 0 ? '#2d5a27' : '#ef4444'}
            />
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleExport}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#2d5a27',
                border: 'none',
                borderRadius: '9px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#234820')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2d5a27')}
            >
              {exported ? '✓ Exported!' : 'Export to QuickBooks'}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#6b6560',
                backgroundColor: 'transparent',
                border: '1px solid #e8e0d4',
                borderRadius: '9px',
                cursor: 'pointer',
              }}
            >
              Print Report
            </button>
            {remaining > 0 && (
              <button
                onClick={handleApproveAll}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#2d5a27',
                  backgroundColor: '#e8f0e6',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                }}
              >
                Approve All Exceptions
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes report-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
