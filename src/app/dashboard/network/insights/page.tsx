'use client'

import { useState, useEffect } from 'react'
import NetworkInsightCardEnhanced from '@/components/NetworkInsightCardEnhanced'

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightType = 'opportunity' | 'warning' | 'trend' | 'alert'
type FilterType = 'all' | InsightType

interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  impactValue?: string
  affectedClients?: number
  source: string
  actionLabel?: string
}

// ─── Demo insights ────────────────────────────────────────────────────────────

const ALL_INSIGHTS: Insight[] = [
  {
    id: 'i1',
    type: 'opportunity',
    title: 'WOTC credit under-claimed by retail clients',
    description:
      'Only 12% of retail clients on the CloseBooks network claim the Work Opportunity Tax Credit (WOTC). Based on your client roster, 3 of your retail clients appear to hire from WOTC-eligible populations (ex-felons, veterans, long-term SNAP recipients) based on their payroll patterns.',
    impactValue: '$9,600 per eligible hire',
    affectedClients: 3,
    source: 'Based on 634 retail firms',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i2',
    type: 'warning',
    title: 'Vehicle expense audit pattern detected',
    description:
      'Firms with vehicle expenses exceeding $50,000 and parking/tolls under $500 are facing IRS audit inquiries at 3x the baseline rate. This pattern suggests the IRS is flagging returns where high vehicle deductions aren\'t supported by corroborating expenses. Review documentation for affected clients now.',
    impactValue: '3x audit inquiry rate',
    affectedClients: 2,
    source: 'Based on 1,247 firms with vehicle expenses',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i3',
    type: 'trend',
    title: 'AI Software Subscriptions emerging as new category',
    description:
      "A new expense category is solidifying across the network: 'AI Software Subscriptions' (ChatGPT, Midjourney, Copilot, etc.). Currently 67% of tech firms and 43% of professional services firms have these expenses scattered across SaaS, Office, or Miscellaneous. Creating a dedicated category now improves deduction tracking and positions clients for potential new deduction guidance.",
    affectedClients: 0,
    source: 'Based on 2,100+ firms this quarter',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i4',
    type: 'opportunity',
    title: 'Section 179 bonus depreciation under-utilized in construction',
    description:
      'Construction firms on the network are claiming an average of $47,000 in Section 179 deductions — but the average qualifying asset base is $312,000, suggesting significant under-claiming. With 2025 bonus depreciation at 40%, a properly structured election could generate $96K+ in additional deductions for mid-size contractors.',
    impactValue: '$96K+ additional deductions',
    affectedClients: 4,
    source: 'Based on 567 construction firms',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i5',
    type: 'alert',
    title: 'Restaurant delivery commission categorization errors rising',
    description:
      "34% of restaurant clients on the network are booking DoorDash and Uber Eats commissions as 'Marketing' expenses — potentially overstating marketing as a deductible category while understating COGS. This creates distorted gross margin reporting and may misclassify deduction types. The IRS has shown increased interest in delivery platform fee treatment.",
    impactValue: 'Reporting distortion risk',
    affectedClients: 1,
    source: 'Based on 847 restaurant firms',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i6',
    type: 'trend',
    title: 'Remote work stipends becoming standard in tech sector',
    description:
      "Monthly home-office stipends ($50–$150/month) are now offered by 58% of tech firms with remote employees — up from 22% two years ago. These are fully deductible as employee compensation but must be properly documented. 71% of firms paying stipends are currently treating them as reimbursements (non-taxable to employee) when they should be W-2 income unless substantiated under an accountable plan.",
    affectedClients: 0,
    source: 'Based on 1,247 tech firms',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i7',
    type: 'opportunity',
    title: 'Health insurance deduction missed by S-Corp owners',
    description:
      "28% of S-Corp owner-operators in the network are NOT deducting health insurance premiums as an above-the-line deduction on Form 1040. This requires the premium to be included in W-2 Box 1 wages first — a step many payroll providers miss. Average missed deduction: $14,200 per owner. This is one of the most consistently missed deductions in small business accounting.",
    impactValue: '$14,200 avg missed deduction',
    affectedClients: 5,
    source: 'Based on 1,890 S-Corp clients',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i8',
    type: 'warning',
    title: 'Cryptocurrency holdings going unreported in balance sheets',
    description:
      "Network analysis shows 19% of tech and professional services firms held crypto assets in 2025, but only 41% of those are showing crypto on their balance sheets. With the IRS now receiving 1099-DAs from exchanges, unreported crypto positions are a significant audit exposure. ASC 350-60 now requires crypto to be measured at fair value.",
    impactValue: 'Significant audit exposure',
    affectedClients: 2,
    source: 'Based on 2,100 tech/prof services firms',
    actionLabel: 'Apply to My Clients',
  },
  {
    id: 'i9',
    type: 'trend',
    title: 'Meals deductibility confusion persists post-TCJA',
    description:
      "Five years after TCJA eliminated the entertainment deduction, 22% of firms on the network are still deducting 100% of meals that include an entertainment component. The correct treatment is 50% for business meals — but 0% when a meal is incidental to entertainment. Network data shows an average of $8,400 in questionable meal deductions per affected firm.",
    affectedClients: 0,
    source: 'Based on 4,200+ firms with M&E expenses',
    actionLabel: 'Apply to My Clients',
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    setLastUpdated(formatTimestamp(new Date()))
  }, [])

  function formatTimestamp(d: Date): string {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  async function handleRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 1400))
    setLastUpdated(formatTimestamp(new Date()))
    setRefreshing(false)
  }

  function handleAction(insight: Insight) {
    setToastMessage(`"${insight.title.slice(0, 40)}…" added to your review queue.`)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const filtered = filter === 'all'
    ? ALL_INSIGHTS
    : ALL_INSIGHTS.filter((i) => i.type === filter)

  const counts: Record<FilterType, number> = {
    all: ALL_INSIGHTS.length,
    opportunity: ALL_INSIGHTS.filter((i) => i.type === 'opportunity').length,
    warning: ALL_INSIGHTS.filter((i) => i.type === 'warning').length,
    trend: ALL_INSIGHTS.filter((i) => i.type === 'trend').length,
    alert: ALL_INSIGHTS.filter((i) => i.type === 'alert').length,
  }

  const filters: Array<{ key: FilterType; label: string; color: string }> = [
    { key: 'all',         label: 'All',          color: '#1a1714' },
    { key: 'opportunity', label: 'Opportunities', color: '#92400e' },
    { key: 'warning',     label: 'Warnings',      color: '#991b1b' },
    { key: 'trend',       label: 'Trends',        color: '#1e40af' },
    { key: 'alert',       label: 'Alerts',        color: '#9a3412' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>

      {/* Global toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1714',
            color: '#ffffff',
            borderRadius: 10,
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          {toastMessage}
        </div>
      )}

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#e8f0e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" stroke="#2d5a27" strokeWidth="1.5" />
                  <path d="M9 5v4.5l3 1.5" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1714', margin: 0 }}>
                Network Insights
              </h1>
            </div>
            {lastUpdated && (
              <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 16px',
              backgroundColor: '#2d5a27',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: refreshing ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 0.15s',
              opacity: refreshing ? 0.75 : 1,
            }}
            onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <path
                d="M13 7A6 6 0 111 7"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M13 3v4h-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Insights'}
          </button>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 20,
            flexWrap: 'wrap',
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 12,
            padding: 6,
          }}
        >
          {filters.map(({ key, label }) => {
            const active = filter === key
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#ffffff' : '#6b6560',
                  backgroundColor: active ? '#2d5a27' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f0ece4' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 10,
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#f0ece4',
                    color: active ? '#ffffff' : '#6b6560',
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Insights feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((insight) => (
            <NetworkInsightCardEnhanced
              key={insight.id}
              type={insight.type}
              title={insight.title}
              description={insight.description}
              impactValue={insight.impactValue}
              affectedClients={insight.affectedClients}
              source={insight.source}
              actionLabel={insight.actionLabel}
              onAction={() => handleAction(insight)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6b6560',
              fontSize: 14,
            }}
          >
            No {filter} insights available right now.
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}
