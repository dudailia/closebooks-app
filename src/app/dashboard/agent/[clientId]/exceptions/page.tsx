'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Exception {
  id: string
  description: string
  date: string
  amount: number
  agentSuggestion: string
  suggestedAccount: string
  confidence: number
  reasoning: string
  category: 'categorization' | 'reconciliation'
  priority: 'high' | 'medium' | 'low'
}

const SMITH_EXCEPTIONS: Exception[] = [
  {
    id: 'exc-1',
    description: 'AMZN*RT9K2',
    date: '2024-11-14',
    amount: 247.00,
    agentSuggestion: 'Office Supplies',
    suggestedAccount: 'Office Expenses',
    confidence: 0.68,
    reasoning: 'Amazon transaction pattern suggests office or supply purchase. Amount is within normal range for supplies. Similar transactions in prior months were categorized as Office Supplies at 94% frequency.',
    category: 'categorization',
    priority: 'medium',
  },
  {
    id: 'exc-2',
    description: 'Wire Transfer OUT',
    date: '2024-11-22',
    amount: 47200.00,
    agentSuggestion: 'Capital Expenditure',
    suggestedAccount: 'Fixed Assets',
    confidence: 0.12,
    reasoning: 'Large unusual wire transfer. No matching vendor in history. Amount exceeds typical payroll by 3.8x. This transaction has no precedent in 14 months of history and requires human confirmation before processing.',
    category: 'categorization',
    priority: 'high',
  },
  {
    id: 'exc-3',
    description: 'STRIPE REFUND',
    date: '2024-11-28',
    amount: -850.00,
    agentSuggestion: 'Revenue Reversal',
    suggestedAccount: 'Revenue',
    confidence: 0.81,
    reasoning: 'Stripe refund pattern matches revenue reversal. Negative amount confirms refund. No matching original charge found in November — may be a refund for an October transaction.',
    category: 'reconciliation',
    priority: 'low',
  },
]

const CATEGORIES = [
  'Office Supplies', 'Office Expenses', 'Cost of Goods Sold', 'Fixed Assets',
  'Revenue', 'Payroll Expense', 'Software Subscriptions', 'Capital Expenditure',
  'Other Expense', 'Accounts Receivable',
]

const CLIENT_NAMES: Record<string, string> = {
  'smith-2024': 'Smith Construction LLC',
  'bella-2024': 'Bella Vista Restaurant',
  'chen-2024': 'Chen Medical Practice',
}

type FilterTab = 'all' | 'high' | 'categorization' | 'reconciliation'

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.75 ? '#2d5a27' : confidence >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6560', marginBottom: 4 }}>
        <span>Confidence</span>
        <span style={{ fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: '#e8e0d4', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function ExceptionsPage() {
  const params = useParams()
  const clientId = typeof params.clientId === 'string' ? params.clientId : 'smith-2024'
  const clientName = CLIENT_NAMES[clientId] ?? 'Unknown Client'
  const exceptions = clientId === 'smith-2024' ? SMITH_EXCEPTIONS : []

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acceptHover, setAcceptHover] = useState<string | null>(null)
  const [overrideHover, setOverrideHover] = useState<string | null>(null)

  const allResolved = exceptions.length > 0 && exceptions.every(e => resolved[e.id])

  const filteredExceptions = exceptions.filter(e => {
    if (resolved[e.id]) return false
    if (activeTab === 'all') return true
    if (activeTab === 'high') return e.priority === 'high'
    if (activeTab === 'categorization') return e.category === 'categorization'
    if (activeTab === 'reconciliation') return e.category === 'reconciliation'
    return true
  })

  const handleAccept = useCallback((id: string) => {
    setResolved(r => ({ ...r, [id]: true }))
  }, [])

  const pendingCount = exceptions.filter(e => !resolved[e.id]).length

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Exceptions' },
    { key: 'high', label: 'High Priority' },
    { key: 'categorization', label: 'Categorization' },
    { key: 'reconciliation', label: 'Reconciliation' },
  ]

  if (allResolved) {
    return (
      <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'successScale 0.4s ease',
          }}>
            <span style={{ fontSize: 36, color: '#2d5a27' }}>✓</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 28,
            fontWeight: 400,
            color: '#1a1714',
            marginBottom: 12,
          }}>
            All exceptions resolved!
          </h2>
          <p style={{ color: '#6b6560', fontSize: 16, marginBottom: 28 }}>
            The November close is complete.
          </p>
          <Link href="/dashboard/agent" style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: 10,
            backgroundColor: '#2d5a27',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Back to Agent Dashboard
          </Link>
        </div>
        <style>{`
          @keyframes successScale {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e0d4', padding: '20px 32px' }}>
        <Link href={`/dashboard/agent/${clientId}`} style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Back to Agent
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 26,
              fontWeight: 400,
              color: '#1a1714',
              marginBottom: 4,
            }}>Exception Review</h1>
            <p style={{ color: '#6b6560', fontSize: 14, margin: 0 }}>
              {clientName} — <strong style={{ color: '#f59e0b' }}>{pendingCount} of {exceptions.length} transactions</strong> need your decision
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: activeTab === tab.key ? '1px solid #2d5a27' : '1px solid #e8e0d4',
                backgroundColor: activeTab === tab.key ? '#f0fdf4' : '#fff',
                color: activeTab === tab.key ? '#2d5a27' : '#6b6560',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
        {filteredExceptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
            No exceptions in this category
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredExceptions.map(exc => {
              const amountStr = exc.amount < 0
                ? `-$${Math.abs(exc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : `$${exc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

              const priorityColor = exc.priority === 'high' ? '#ef4444' : exc.priority === 'medium' ? '#f59e0b' : '#2d5a27'

              return (
                <div key={exc.id} style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e8e0d4',
                  borderRadius: 14,
                  padding: 24,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}>REVIEW NEEDED</span>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        backgroundColor: priorityColor + '20',
                        color: priorityColor,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>{exc.priority} priority</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{exc.date}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: exc.amount < 0 ? '#ef4444' : '#1a1714' }}>
                      {amountStr}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 16 }}>
                    {exc.description}
                  </div>

                  {/* Agent Analysis */}
                  <div style={{ backgroundColor: '#faf8f4', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Agent Analysis</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>
                      Best guess: {overrides[exc.id] ?? exc.agentSuggestion}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.6, marginBottom: 12 }}>
                      {exc.reasoning}
                    </div>
                    <ConfidenceBar confidence={exc.confidence} />
                  </div>

                  {/* Action section */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Category</label>
                      <select
                        value={overrides[exc.id] ?? exc.agentSuggestion}
                        onChange={e => setOverrides(o => ({ ...o, [exc.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #e8e0d4',
                          fontSize: 13,
                          color: '#1a1714',
                          backgroundColor: '#fff',
                          appearance: 'none',
                        }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                      <input
                        value={notes[exc.id] ?? ''}
                        onChange={e => setNotes(n => ({ ...n, [exc.id]: e.target.value }))}
                        placeholder="Add a note..."
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: '1px solid #e8e0d4',
                          fontSize: 13,
                          color: '#1a1714',
                          backgroundColor: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAccept(exc.id)}
                        onMouseEnter={() => setAcceptHover(exc.id)}
                        onMouseLeave={() => setAcceptHover(null)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: acceptHover === exc.id ? '#1e3d1a' : '#2d5a27',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setOverrides(o => ({ ...o, [exc.id]: exc.agentSuggestion }))}
                        onMouseEnter={() => setOverrideHover(exc.id)}
                        onMouseLeave={() => setOverrideHover(null)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 8,
                          border: '1px solid #e8e0d4',
                          backgroundColor: overrideHover === exc.id ? '#faf8f4' : '#fff',
                          color: '#6b6560',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Override
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
