'use client'

import { useState } from 'react'
import type { TaxOpportunity } from '@/lib/tax-draft/demoReturnData'

interface Props {
  opportunities: TaxOpportunity[]
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Section 179': { bg: '#e0f2fe', color: '#0369a1' },
  QBI:           { bg: '#dcfce7', color: '#166534' },
  'R&D':         { bg: '#f3e8ff', color: '#6b21a8' },
  'Cost Seg':    { bg: '#fef3c7', color: '#92400e' },
  Retirement:    { bg: '#ffe4e6', color: '#9f1239' },
  Other:         { bg: '#f3f4f6', color: '#374151' },
}

const CONFIDENCE_STYLES = {
  high:   { bg: '#f0fdf4', color: '#2d5a27', dot: '#22c55e' },
  medium: { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
  low:    { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
}

export default function OpportunitySummary({ opportunities, onAccept, onDismiss }: Props) {
  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'accepted' | 'dismissed'>>(
    Object.fromEntries(opportunities.map((o) => [o.id, o.status ?? 'pending']))
  )
  const [flash, setFlash] = useState<string | null>(null)

  function accept(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: 'accepted' }))
    setFlash(id)
    setTimeout(() => setFlash(null), 600)
    onAccept(id)
  }

  function dismiss(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: 'dismissed' }))
    onDismiss(id)
  }

  const active = opportunities.filter((o) => statuses[o.id] !== 'dismissed')
  const accepted = opportunities.filter((o) => statuses[o.id] === 'accepted')
  const totalSavings = active
    .filter((o) => o.estimatedSavings > 0)
    .reduce((s, o) => s + o.estimatedSavings, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            {active.length} Opportunit{active.length !== 1 ? 'ies' : 'y'} Found
          </p>
          {accepted.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#dcfce7', color: '#166534' }}
            >
              {accepted.length} accepted
            </span>
          )}
        </div>

        {/* Total savings */}
        <div className="mt-2 rounded-xl p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p className="text-xs uppercase tracking-wide font-medium" style={{ color: '#4ade80' }}>
            Potential Tax Savings
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: '#2d5a27' }}>
            ${totalSavings.toLocaleString()}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#4b7a42' }}>
            Estimated across {active.filter((o) => o.estimatedSavings > 0).length} quantified opportunities
          </p>
        </div>
      </div>

      {/* Opportunity cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opportunities.map((opp) => {
          const status = statuses[opp.id]
          if (status === 'dismissed') return null

          const typeStyle = TYPE_COLORS[opp.type] ?? TYPE_COLORS.Other
          const confStyle = CONFIDENCE_STYLES[opp.confidence]
          const isAccepted = status === 'accepted'
          const isFlashing = flash === opp.id

          return (
            <div
              key={opp.id}
              className="rounded-xl p-3 transition-all duration-300"
              style={{
                border: `1px solid ${isAccepted ? '#bbf7d0' : '#e8e0d4'}`,
                backgroundColor: isFlashing ? '#f0fdf4' : isAccepted ? '#f9fffe' : '#ffffff',
                transform: isFlashing ? 'scale(1.01)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {/* Type badge */}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
                  >
                    {opp.type}
                  </span>
                  {/* Confidence */}
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: confStyle.bg, color: confStyle.color }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: confStyle.dot,
                        display: 'inline-block',
                      }}
                    />
                    {opp.confidence}
                  </span>
                </div>
                {/* Savings */}
                {opp.estimatedSavings > 0 && (
                  <span className="text-sm font-bold" style={{ color: '#2d5a27', flexShrink: 0 }}>
                    ~${opp.estimatedSavings.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold mb-1" style={{ color: '#1a1714' }}>
                {opp.title}
              </p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#6b6560' }}>
                {opp.description.length > 120 ? opp.description.slice(0, 120) + '…' : opp.description}
              </p>

              {/* Law reference */}
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white mb-3"
                style={{ backgroundColor: '#b8734a' }}
              >
                {opp.lawReference}
              </span>

              {/* Action text */}
              <p className="text-xs italic mb-3" style={{ color: '#6b6560' }}>
                {opp.actionRequired.length > 80
                  ? opp.actionRequired.slice(0, 80) + '…'
                  : opp.actionRequired}
              </p>

              {/* Buttons */}
              {!isAccepted ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => accept(opp.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#b8734a' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#a06040' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                  >
                    Accept & Model
                  </button>
                  <button
                    onClick={() => dismiss(opp.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs"
                    style={{ color: '#6b6560', border: '1px solid #e8e0d4', backgroundColor: 'transparent' }}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div
                  className="py-1.5 rounded-lg text-xs font-medium text-center"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                >
                  ✓ Accepted — modeling in return
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <div className="text-center py-8" style={{ color: '#6b6560' }}>
          <p className="text-sm">All opportunities reviewed</p>
        </div>
      )}
    </div>
  )
}
