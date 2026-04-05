'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CloseEvent {
  type: 'categorize' | 'journal' | 'exception' | 'reconcile' | 'complete'
  message: string
  timestamp: number
}

export interface JournalEntry {
  id: string
  date: string
  description: string
  debitAccount: string
  creditAccount: string
  amount: number
  sourceTransactionId: string
  aiReasoning: string
}

export interface CloseException {
  id: string
  transactionId: string
  type: 'uncategorized' | 'duplicate' | 'anomaly' | 'missing_receipt'
  description: string
  amount: number
  aiSuggestion: string
  confidence: number
}

export interface PnL {
  revenue: number
  cogs: number
  grossProfit: number
  grossMarginPct: number
  operatingExpenses: number
  netIncome: number
  netMarginPct: number
  period: string
}

export interface CloseStats {
  totalTransactions: number
  autoCategorized: number
  pctCategorized: number
  journalEntriesCount: number
  exceptionsCount: number
  elapsedSeconds: number
}

export interface CloseResult {
  exceptions: CloseException[]
  journalEntries: JournalEntry[]
  pnl: PnL
  stats: CloseStats
}

interface CloseTerminalProps {
  clientName: string
  period: string
  onComplete: (result: CloseResult) => void
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const VENDORS = [
  'Starbucks', 'Amazon Web Services', 'Google Ads', 'Stripe Payment', 'Slack Technologies',
  'WeWork Monthly', 'Gusto Payroll', 'Delta Airlines', 'Office Depot', 'FedEx Shipping',
  'Zoom Video', 'Dropbox Business', 'Salesforce CRM', 'Adobe Creative', 'Shopify',
  'QuickBooks Online', 'Chase Merchant', 'Square POS', 'Uber for Business', 'DoorDash',
  'LinkedIn Ads', 'Meta Ads', 'Notion', 'Figma', 'GitHub', 'Heroku', 'Cloudflare',
  'Ramp Corporate', 'Brex Card', 'Mercury Bank', 'Stripe Connect', 'PayPal Business',
  'USPS Priority', 'UPS Ground', 'Comcast Business', 'AT&T Business', 'WeWork',
  'Regus Office', 'Blue Cross Insurance', 'Aetna Health', 'Fidelity 401k',
]

const CATEGORIES = [
  'Software & Subscriptions', 'Meals & Entertainment', 'Office Supplies', 'Marketing & Advertising',
  'Payroll', 'Rent & Occupancy', 'Insurance', 'Travel', 'Professional Services',
  'Utilities', 'Bank Fees', 'Cost of Goods Sold', 'Revenue', 'Equipment',
]

const ACCOUNTS = [
  'Meals & Entertainment', 'Software & Subscriptions', 'Marketing & Advertising', 'Payroll Expense',
  'Rent Expense', 'Insurance Expense', 'Travel Expense', 'Office Supplies', 'Utilities Expense',
  'Professional Services', 'Cost of Goods Sold', 'Revenue', 'General Expense',
]

const EXCEPTION_DESCRIPTIONS = [
  { desc: 'ZELLE PAYMENT 8472', amount: 500.00, suggestion: 'Needs Review — unidentified payee' },
  { desc: 'WIRE TRANSFER OUT', amount: 12500.00, suggestion: 'Possible loan repayment — verify' },
  { desc: 'AMAZON MARKETPLACE', amount: 847.33, suggestion: 'Possible duplicate — check order #' },
  { desc: 'CASH WITHDRAWAL ATM', amount: 300.00, suggestion: 'Missing receipt — attach documentation' },
  { desc: 'REFUND CREDIT', amount: 215.50, suggestion: 'Credit refund — verify against original charge' },
  { desc: 'UNKNOWN VENDOR 2291', amount: 98.00, suggestion: 'Uncategorized — assign to Miscellaneous' },
  { desc: 'STRIPE PAYOUT', amount: 4200.00, suggestion: 'Revenue payout — categorize as Income' },
  { desc: 'GOOGLE WORKSPACE', amount: 1140.00, suggestion: 'Unusually high — verify against invoice' },
  { desc: 'BILL.COM PAYMENT', amount: 3750.00, suggestion: 'Needs Receipt for amount over $500' },
  { desc: 'SQUARE TERMINAL', amount: 299.00, suggestion: 'Equipment purchase — may capitalize' },
  { desc: 'DEEL CONTRACTOR', amount: 2200.00, suggestion: 'Contractor payment — verify 1099 status' },
  { desc: 'RIPPLING PAYROLL', amount: 18500.00, suggestion: 'Duplicate payroll run detected' },
  { desc: 'INTERCOM SUPPORT', amount: 189.00, suggestion: 'New vendor — categorize as Software' },
  { desc: 'MAILCHIMP EMAIL', amount: 450.00, suggestion: 'Higher than historical avg of $150' },
]

function buildEventSequence(): CloseEvent[] {
  const events: CloseEvent[] = []
  let t = 0

  // Opening
  events.push({ type: 'categorize', message: '[◉] Initializing month-end close engine…', timestamp: t++ })
  events.push({ type: 'categorize', message: '[◉] Loading transaction ledger…', timestamp: t++ })
  events.push({ type: 'categorize', message: `[✓] 847 transactions loaded · Ready to process`, timestamp: t++ })
  events.push({ type: 'categorize', message: '[◉] Running AI categorization engine…', timestamp: t++ })

  // 200 categorize events
  for (let i = 1; i <= 200; i++) {
    const vendor = VENDORS[i % VENDORS.length]
    const amount = (Math.random() * 2000 + 5).toFixed(2)
    const cat = CATEGORIES[i % CATEGORIES.length]
    const conf = (Math.random() * 0.15 + 0.84).toFixed(0)
    events.push({
      type: 'categorize',
      message: `[✓] ${vendor} #${400 + i} · $${amount} → ${cat} (${conf}%)`,
      timestamp: t++,
    })
  }

  // Separator
  events.push({ type: 'categorize', message: '[◉] Categorization complete · Starting journal entries…', timestamp: t++ })

  // 50 journal entry events
  for (let i = 1; i <= 50; i++) {
    const acct = ACCOUNTS[i % ACCOUNTS.length]
    const amount = (Math.random() * 1500 + 10).toFixed(2)
    events.push({
      type: 'journal',
      message: `[≡] DR: ${acct} $${amount} | CR: Chase Checking $${amount}`,
      timestamp: t++,
    })
  }

  events.push({ type: 'journal', message: '[≡] 241 journal entries written · Balanced ✓', timestamp: t++ })

  // 14 exception events
  events.push({ type: 'exception', message: '[◉] Scanning for exceptions and anomalies…', timestamp: t++ })
  for (let i = 0; i < 14; i++) {
    const exc = EXCEPTION_DESCRIPTIONS[i % EXCEPTION_DESCRIPTIONS.length]
    events.push({
      type: 'exception',
      message: `[⚠] ${exc.desc} · $${exc.amount.toFixed(2)} → Needs Review`,
      timestamp: t++,
    })
  }

  // Reconcile
  events.push({ type: 'reconcile', message: '[◉] Running bank reconciliation…', timestamp: t++ })
  events.push({ type: 'reconcile', message: '[◉] Comparing ledger to Chase statement…', timestamp: t++ })
  events.push({ type: 'reconcile', message: '[◉] Checking credit card transactions…', timestamp: t++ })
  events.push({ type: 'reconcile', message: '[◉] Reconciliation complete · $0.00 difference', timestamp: t++ })

  // Complete
  events.push({
    type: 'complete',
    message: '[✓] CLOSE COMPLETE · 847 transactions · 14 exceptions · 47 seconds',
    timestamp: t++,
  })

  return events
}

const EVENT_SEQUENCE = buildEventSequence()

function buildDemoResult(): CloseResult {
  return {
    exceptions: EXCEPTION_DESCRIPTIONS.map((exc, i) => ({
      id: `exc_demo_${i}`,
      transactionId: `tx_demo_${i}`,
      type: (['uncategorized', 'duplicate', 'anomaly', 'missing_receipt'] as const)[i % 4],
      description: exc.desc,
      amount: exc.amount,
      aiSuggestion: exc.suggestion,
      confidence: 0.65 + (i % 4) * 0.08,
    })),
    journalEntries: Array.from({ length: 241 }, (_, i) => ({
      id: `je_demo_${i}`,
      date: '2026-03-31',
      description: `${VENDORS[i % VENDORS.length]} payment`,
      debitAccount: ACCOUNTS[i % ACCOUNTS.length],
      creditAccount: 'Chase Checking',
      amount: parseFloat((Math.random() * 1500 + 10).toFixed(2)),
      sourceTransactionId: `tx_demo_${i}`,
      aiReasoning: 'Auto-generated via AI close engine.',
    })),
    pnl: {
      revenue: 127450,
      cogs: 41230,
      grossProfit: 86220,
      grossMarginPct: 67.65,
      operatingExpenses: 48980,
      netIncome: 37240,
      netMarginPct: 29.22,
      period: 'March 2026',
    },
    stats: {
      totalTransactions: 847,
      autoCategorized: 833,
      pctCategorized: 98.3,
      journalEntriesCount: 241,
      exceptionsCount: 14,
      elapsedSeconds: 47,
    },
  }
}

// ─── Line color helper ────────────────────────────────────────────────────────

function lineColor(type: CloseEvent['type']): string {
  switch (type) {
    case 'categorize': return '#4ade80'
    case 'journal':    return '#b8734a'
    case 'exception':  return '#fbbf24'
    case 'reconcile':  return '#60a5fa'
    case 'complete':   return '#4ade80'
    default:           return '#a0a0a0'
  }
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useElapsedTimer(running: boolean): string {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 500)
    return () => clearInterval(id)
  }, [running])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CloseTerminal({ clientName, period, onComplete }: CloseTerminalProps) {
  const [events, setEvents] = useState<CloseEvent[]>([])
  const [running, setRunning] = useState(true)
  const [stats, setStats] = useState({
    transactions: 0,
    total: 847,
    journalEntries: 0,
    exceptions: 0,
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const elapsed = useElapsedTimer(running)
  const indexRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const tick = useCallback(() => {
    const idx = indexRef.current
    if (idx >= EVENT_SEQUENCE.length) return

    const event = EVENT_SEQUENCE[idx]
    indexRef.current = idx + 1

    setEvents(prev => [...prev, event])

    // Update live stats
    if (event.type === 'categorize') {
      setStats(prev => ({
        ...prev,
        transactions: Math.min(prev.total, prev.transactions + 1),
      }))
    } else if (event.type === 'journal') {
      setStats(prev => ({ ...prev, journalEntries: prev.journalEntries + 1 }))
    } else if (event.type === 'exception') {
      setStats(prev => ({ ...prev, exceptions: Math.min(14, prev.exceptions + 1) }))
    }

    if (event.type === 'complete') {
      setRunning(false)
      setTimeout(() => {
        onCompleteRef.current(buildDemoResult())
      }, 900)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(tick, 55)
    return () => clearInterval(id)
  }, [tick])

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [events])

  return (
    <div
      style={{
        backgroundColor: '#0f0e0d',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '480px',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0a0908',
          flexShrink: 0,
        }}
      >
        {/* Status dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
            {running && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  opacity: 0.4,
                  animation: 'terminal-pulse 1.4s ease-out infinite',
                }}
              />
            )}
            <span
              style={{
                position: 'relative',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: running ? '#4ade80' : '#60a5fa',
                display: 'inline-block',
              }}
            />
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: running ? '#4ade80' : '#60a5fa',
            }}
          >
            {running ? '● RUNNING' : '● COMPLETE'}
          </span>
        </div>

        {/* Client + period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '11px', color: '#6b6560' }}>
            {clientName}
          </span>
          <span style={{ fontSize: '11px', color: '#6b6560' }}>
            {period}
          </span>
          {/* Elapsed timer */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#e8e0d4',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em',
            }}
          >
            {elapsed}
          </span>
        </div>
      </div>

      {/* Main content: log + stats */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Log stream */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#2a2825 transparent',
          }}
        >
          {events.map((ev, i) => (
            <div
              key={i}
              style={{
                fontSize: '11.5px',
                lineHeight: '1.7',
                color: lineColor(ev.type),
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                animation: 'fadein-line 0.12s ease both',
                fontWeight: ev.type === 'complete' ? 700 : 400,
              }}
            >
              {ev.message}
            </div>
          ))}
          {running && (
            <div
              style={{
                display: 'inline-block',
                width: 8,
                height: 14,
                backgroundColor: '#4ade80',
                marginTop: 2,
                animation: 'cursor-blink 1s step-end infinite',
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </div>

        {/* Stats panel */}
        <div
          style={{
            width: '200px',
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            backgroundColor: '#0a0908',
          }}
        >
          <p
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: '#4a4540',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Live Stats
          </p>

          <StatBlock
            label="Transactions"
            value={`${stats.transactions}/${stats.total}`}
            color="#4ade80"
          />
          <StatBlock
            label="Journal Entries"
            value={String(Math.min(241, stats.journalEntries))}
            color="#b8734a"
          />
          <StatBlock
            label="Exceptions"
            value={String(stats.exceptions)}
            color="#fbbf24"
          />
          <StatBlock
            label="Time"
            value={elapsed}
            color="#60a5fa"
          />
        </div>
      </div>

      <style>{`
        @keyframes terminal-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.8); opacity: 0; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes fadein-line {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: '9px', color: '#4a4540', letterSpacing: '0.1em', margin: '0 0 3px 0', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color,
          margin: 0,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </p>
    </div>
  )
}
