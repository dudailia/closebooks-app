'use client'

import { useParams, useRouter } from 'next/navigation'
import CloseReport from '@/components/autopilot/CloseReport'
import type { CloseResult, CloseException } from '@/components/autopilot/CloseTerminal'

// ─── Demo data generator ──────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EXCEPTION_POOL: Array<{
  desc: string
  amount: number
  type: CloseException['type']
  suggestion: string
  confidence: number
}> = [
  { desc: 'ZELLE PAYMENT 8472', amount: 500.00, type: 'uncategorized', suggestion: 'Needs Review — unidentified payee', confidence: 0.61 },
  { desc: 'WIRE TRANSFER OUT', amount: 12500.00, type: 'anomaly', suggestion: 'Possible loan repayment — verify', confidence: 0.73 },
  { desc: 'AMAZON MARKETPLACE', amount: 847.33, type: 'duplicate', suggestion: 'Possible duplicate — check order #', confidence: 0.85 },
  { desc: 'CASH WITHDRAWAL ATM', amount: 300.00, type: 'missing_receipt', suggestion: 'Missing receipt — attach documentation', confidence: 0.90 },
  { desc: 'REFUND CREDIT', amount: 215.50, type: 'uncategorized', suggestion: 'Credit refund — verify against original charge', confidence: 0.58 },
  { desc: 'UNKNOWN VENDOR 2291', amount: 98.00, type: 'uncategorized', suggestion: 'Uncategorized — assign to Miscellaneous', confidence: 0.44 },
  { desc: 'STRIPE PAYOUT', amount: 4200.00, type: 'anomaly', suggestion: 'Revenue payout — categorize as Income', confidence: 0.77 },
  { desc: 'GOOGLE WORKSPACE', amount: 1140.00, type: 'anomaly', suggestion: 'Unusually high — verify against invoice', confidence: 0.71 },
  { desc: 'BILL.COM PAYMENT', amount: 3750.00, type: 'missing_receipt', suggestion: 'Needs Receipt for amount over $500', confidence: 0.88 },
  { desc: 'SQUARE TERMINAL', amount: 299.00, type: 'uncategorized', suggestion: 'Equipment purchase — may capitalize', confidence: 0.65 },
  { desc: 'DEEL CONTRACTOR', amount: 2200.00, type: 'missing_receipt', suggestion: 'Contractor payment — verify 1099 status', confidence: 0.91 },
  { desc: 'RIPPLING PAYROLL', amount: 18500.00, type: 'duplicate', suggestion: 'Duplicate payroll run detected', confidence: 0.82 },
  { desc: 'INTERCOM SUPPORT', amount: 189.00, type: 'uncategorized', suggestion: 'New vendor — categorize as Software', confidence: 0.60 },
  { desc: 'MAILCHIMP EMAIL', amount: 450.00, type: 'anomaly', suggestion: 'Higher than historical avg of $150', confidence: 0.75 },
]

const VENDOR_POOL = [
  'Starbucks', 'Amazon Web Services', 'Google Ads', 'Stripe Payment', 'Slack Technologies',
  'WeWork Monthly', 'Gusto Payroll', 'Delta Airlines', 'Office Depot', 'FedEx Shipping',
  'Zoom Video', 'Dropbox Business', 'Salesforce CRM', 'Adobe Creative', 'Shopify',
]
const ACCOUNT_POOL = [
  'Meals & Entertainment', 'Software & Subscriptions', 'Marketing & Advertising', 'Payroll Expense',
  'Rent Expense', 'Insurance Expense', 'Travel Expense', 'Office Supplies',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

function buildDemoResult(runId: string): CloseResult {
  const seed = hashStr(runId)
  const txCount = 700 + (seed % 200)
  const excCount = 8 + (seed % 7)
  const jCount = Math.floor(txCount * 0.285)
  const elapsed = 38 + (seed % 20)
  const autoCat = txCount - excCount
  const pctCat = parseFloat(((autoCat / txCount) * 100).toFixed(1))

  const exceptions: CloseException[] = EXCEPTION_POOL.slice(0, excCount).map((e, i) => ({
    id: `exc_${runId}_${i}`,
    transactionId: `tx_${runId}_${i}`,
    type: e.type,
    description: e.desc,
    amount: e.amount,
    aiSuggestion: e.suggestion,
    confidence: e.confidence,
  }))

  const journalEntries = Array.from({ length: jCount }, (_, i) => ({
    id: `je_${runId}_${i}`,
    date: '2026-03-31',
    description: `${VENDOR_POOL[i % VENDOR_POOL.length]} payment`,
    debitAccount: ACCOUNT_POOL[i % ACCOUNT_POOL.length],
    creditAccount: 'Chase Checking',
    amount: parseFloat((50 + (((seed * (i + 1)) % 1500))).toFixed(2)),
    sourceTransactionId: `tx_${runId}_${i}`,
    aiReasoning: 'Auto-generated via AI close engine.',
  }))

  const revenue = 100000 + (seed % 50000)
  const cogs = Math.floor(revenue * 0.32)
  const grossProfit = revenue - cogs
  const grossMarginPct = parseFloat(((grossProfit / revenue) * 100).toFixed(2))
  const opex = Math.floor(grossProfit * 0.57)
  const netIncome = grossProfit - opex
  const netMarginPct = parseFloat(((netIncome / revenue) * 100).toFixed(2))

  return {
    exceptions,
    journalEntries,
    pnl: {
      revenue,
      cogs,
      grossProfit,
      grossMarginPct,
      operatingExpenses: opex,
      netIncome,
      netMarginPct,
      period: 'March 2026',
    },
    stats: {
      totalTransactions: txCount,
      autoCategorized: autoCat,
      pctCategorized: pctCat,
      journalEntriesCount: jCount,
      exceptionsCount: excCount,
      elapsedSeconds: elapsed,
    },
  }
}

function getPeriodFromRunId(runId: string): string {
  const seed = hashStr(runId)
  const now = new Date()
  const monthsBack = 1 + (seed % 6)
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function getClientNameFromRunId(runId: string): string {
  const names = [
    'Meridian Coffee Roasters', 'Bright Horizon Consulting', 'Alpine Tech Solutions',
    'Harbor View Properties', 'Redwood Marketing', 'Summit Legal Group',
  ]
  const seed = hashStr(runId)
  return names[seed % names.length]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CloseReportPage() {
  const params = useParams()
  const router = useRouter()
  const runId = Array.isArray(params.runId) ? params.runId[0] : (params.runId ?? 'demo')

  const result = buildDemoResult(runId)
  const period = getPeriodFromRunId(runId)
  const clientName = getClientNameFromRunId(runId)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 py-8">
        {/* Back nav */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              color: '#6b6560',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}
          >
            ← Back
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '26px',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              margin: '0 0 4px 0',
            }}
          >
            Close Report
          </h1>
          <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>
            {clientName} · {period} · Run ID: <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{runId}</span>
          </p>
        </div>

        <CloseReport result={result} clientName={clientName} period={period} />
      </main>

    </div>
  )
}
