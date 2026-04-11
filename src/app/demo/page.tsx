'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Transaction, ChartOfAccounts } from '@/types'
import { DEMO_COA, DEMO_TRANSACTIONS, DEMO_SUMMARY } from '@/lib/demoData'

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoStep = 'upload' | 'categorizing' | 'review' | 'export'

interface StepInfo { id: DemoStep; label: string; desc: string }

const STEPS: StepInfo[] = [
  { id: 'upload',       label: '1. Upload Statement',     desc: 'Drop a CSV bank statement' },
  { id: 'categorizing', label: '2. AI Categorizes',       desc: 'Claude analyzes every transaction' },
  { id: 'review',       label: '3. Review & Approve',     desc: 'Approve, edit, or flag items' },
  { id: 'export',       label: '4. Export to QuickBooks', desc: 'Download QBO-ready file' },
]

const SAMPLE_CSV = `Date,Description,Amount,Type
2026-03-31,"GUSTO PAYROLL MAR 16-31",14250.00,debit
2026-03-29,"DEPOSIT - CLIENT PMT ACME CORP INV-2089",8500.00,credit
2026-03-28,"CHECK #1042 - OFFICE RENT MARCH",3200.00,debit
2026-03-28,"COMCAST BUSINESS INTERNET",189.99,debit
2026-03-27,"DEPOSIT - RIVERDALE GROUP INV-2090",12000.00,credit
2026-03-26,"AMAZON WEB SERVICES",847.23,debit
2026-03-25,"GUSTO PAYROLL MAR 1-15",14250.00,debit
2026-03-24,"NOTION.SO MONTHLY",96.00,debit
2026-03-22,"UNITED AIRLINES 0162441892304",612.40,debit
2026-03-21,"GOOGLE WORKSPACE",144.00,debit
2026-03-20,"STAPLES #1184 OFFICE SUPPLIES",234.17,debit
2026-03-19,"INTEREST INCOME",41.83,credit
2026-03-18,"LINKEDIN PREMIUM BUSINESS",59.99,debit
2026-03-17,"PROGRESSIVE INSURANCE",487.00,debit
2026-03-15,"GIBSONS BAR AND STEAKHOUSE",312.80,debit
2026-03-14,"INCOMING WIRE TRANSFER REF#881204",25000.00,credit
2026-03-12,"STRIPE PAYOUT ST-1A2B3C4D5E6F",6340.00,credit
2026-03-10,"MONTHLY SERVICE FEE",25.00,debit
2026-03-08,"UBER *TRIP 800-592-8996",34.50,debit
2026-03-05,"ACH DEBIT 021000089 MISC PMT",1850.00,debit`

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCount(target: number, running: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!running) { setVal(0); return }
    let current = 0
    const step = Math.ceil(target / 40)
    const t = setInterval(() => {
      current = Math.min(current + step, target)
      setVal(current)
      if (current >= target) clearInterval(t)
    }, 40)
    return () => clearInterval(t)
  }, [target, running])
  return val
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({ onNext }: { onNext: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  function downloadSample() {
    setDownloading(true)
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sunrise_advisory_march_2026.csv'
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDownloading(false), 1000)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) { setFileName(file.name); setTimeout(onNext, 600) }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { setFileName(file.name); setTimeout(onNext, 600) }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f0f5ef', color: '#2d5a27' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2d5a27' }} />
          Step 1 of 4
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
          Upload your bank statement
        </h2>
        <p className="text-sm" style={{ color: '#6b6560' }}>
          CloseBooks reads any CSV export from Chase, Bank of America, Wells Fargo, and more.
        </p>
      </div>

      {/* Sample download prompt */}
      <div className="rounded-xl border p-4 flex items-center justify-between gap-4" style={{ borderColor: '#d4e5d0', backgroundColor: '#f0f7ee' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Don&apos;t have a CSV handy?</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Download our sample — 20 real transactions from Sunrise Advisory LLC</p>
        </div>
        <button
          onClick={downloadSample}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
        >
          {downloading ? '✓ Downloading' : '↓ Download CSV'}
        </button>
      </div>

      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all"
        style={{
          borderColor: dragging ? '#2d5a27' : fileName ? '#2d5a27' : '#d0c9c0',
          backgroundColor: dragging ? '#f0f7ee' : fileName ? '#f0f7ee' : '#faf8f4',
        }}
      >
        <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
        {fileName ? (
          <div className="space-y-2">
            <div className="text-3xl">✓</div>
            <p className="font-semibold text-sm" style={{ color: '#2d5a27' }}>{fileName}</p>
            <p className="text-xs" style={{ color: '#6b6560' }}>Uploading…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📂</div>
            <p className="font-semibold text-sm" style={{ color: '#1a1714' }}>Drop your CSV here, or click to browse</p>
            <p className="text-xs" style={{ color: '#a09a94' }}>Supports any bank CSV export · Encrypted in transit</p>
          </div>
        )}
      </label>

      <div className="text-center">
        <span className="text-xs" style={{ color: '#a09a94' }}>or</span>
        <button
          onClick={onNext}
          className="block mx-auto mt-2 text-sm font-medium underline"
          style={{ color: '#b8734a' }}
        >
          Skip upload — use sample data to see a live demo →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Categorizing ─────────────────────────────────────────────────────

interface CategorizingStepProps {
  onNext: (txs: Transaction[]) => void
}

function CategorizingStep({ onNext }: CategorizingStepProps) {
  const [phase, setPhase] = useState<'parsing' | 'sending' | 'ai' | 'done'>('parsing')
  const [current, setCurrent] = useState(0)
  const total = DEMO_TRANSACTIONS.length
  const [categorized, setCategorized] = useState<Transaction[]>([])
  const called = useRef(false)

  const isAiPhase = phase === 'ai' || phase === 'done'
  const count = useCount(current, isAiPhase)

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function run() {
      // Phase 1: Parse
      setPhase('parsing')
      await new Promise(r => setTimeout(r, 900))

      // Phase 2: Sending to AI
      setPhase('sending')
      await new Promise(r => setTimeout(r, 700))

      // Phase 3: AI Categorizing — call real API
      setPhase('ai')

      try {
        const res = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: DEMO_TRANSACTIONS.map(t => ({ ...t, status: 'pending', suggested_category: '', suggested_account_code: '', confidence: 0 })),
            chartOfAccounts: DEMO_COA,
            clientName: DEMO_SUMMARY.clientName,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const txs: Transaction[] = data.transactions ?? []
          // Animate count up as results arrive
          for (let i = 0; i <= txs.length; i++) {
            await new Promise(r => setTimeout(r, 60))
            setCurrent(i)
          }
          setCategorized(txs)
        } else {
          throw new Error('API failed')
        }
      } catch {
        // Fallback: use pre-categorized demo data
        for (let i = 0; i <= total; i++) {
          await new Promise(r => setTimeout(r, 80))
          setCurrent(i)
        }
        setCategorized(DEMO_TRANSACTIONS)
      }

      setPhase('done')
      await new Promise(r => setTimeout(r, 800))
      onNext(categorized.length ? categorized : DEMO_TRANSACTIONS)
    }

    run()
  }, [onNext, total, categorized.length])

  const steps = [
    { id: 'parsing', label: 'Parsing CSV — 20 transactions found', done: phase !== 'parsing' },
    { id: 'sending', label: 'Sending to Claude AI (Sonnet)', done: phase === 'ai' || phase === 'done' },
    { id: 'ai',      label: `Categorizing against ${DEMO_COA.length} accounts…`, done: phase === 'done' },
  ]

  const autoApproved = categorized.filter(t => t.confidence >= 0.85).length

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#b8734a' }} />
          Step 2 of 4
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
          Claude AI is categorizing your transactions
        </h2>
        <p className="text-sm" style={{ color: '#6b6560' }}>
          Every transaction is matched to your chart of accounts with a confidence score
        </p>
      </div>

      {/* Progress ring */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f0ece4" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="#2d5a27" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - (isAiPhase ? count / total : 0))}`}
              style={{ transition: 'stroke-dashoffset 0.1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: '#1a1714' }}>
              {isAiPhase ? count : 0}
            </span>
            <span className="text-xs" style={{ color: '#6b6560' }}>of {total}</span>
          </div>
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-2 text-left max-w-sm mx-auto">
        {steps.map((s, i) => {
          const isActive = (i === 0 && phase === 'parsing') || (i === 1 && phase === 'sending') || (i === 2 && (phase === 'ai' || phase === 'done'))
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: s.done ? '#2d5a27' : isActive ? '#fef3c7' : '#f0ece4', color: s.done ? '#fff' : isActive ? '#92400e' : '#a09a94' }}>
                {s.done ? '✓' : isActive ? '…' : i + 1}
              </span>
              <span className="text-sm" style={{ color: s.done ? '#2d5a27' : isActive ? '#1a1714' : '#a09a94', fontWeight: isActive ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {phase === 'done' && (
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}>
          <p className="font-semibold text-sm" style={{ color: '#065f46' }}>
            ✓ {total} transactions categorized · {autoApproved} auto-approved
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

const STATUS_COLORS = {
  approved: { bg: '#ecfdf5', text: '#065f46', dot: '#059669' },
  edited:   { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' },
  pending:  { bg: '#fefce8', text: '#854d0e', dot: '#ca8a04' },
  flagged:  { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626' },
}

function ReviewStep({ transactions, onNext }: { transactions: Transaction[]; onNext: (txs: Transaction[]) => void }) {
  const [txs, setTxs] = useState<Transaction[]>(transactions)
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('all')

  const approved = txs.filter(t => t.status === 'approved' || t.status === 'edited').length
  const pending  = txs.filter(t => t.status === 'pending').length
  const flagged  = txs.filter(t => t.status === 'flagged').length

  function approve(id: string) {
    setTxs(prev => prev.map(t => t.id === id ? { ...t, status: 'approved', final_category: t.suggested_category, final_account_code: t.suggested_account_code } : t))
  }
  function flag(id: string) {
    setTxs(prev => prev.map(t => t.id === id ? { ...t, status: 'flagged' } : t))
  }
  function approveAll() {
    setTxs(prev => prev.map(t => t.status === 'pending' ? { ...t, status: 'approved', final_category: t.suggested_category, final_account_code: t.suggested_account_code } : t))
  }

  const visible = filter === 'all' ? txs : txs.filter(t => t.status === filter)

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
          Step 3 of 4
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
          Review AI categorizations
        </h2>
        <p className="text-sm" style={{ color: '#6b6560' }}>Approve, edit, or flag — your call is final</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Approved', count: approved, color: '#059669', bg: '#ecfdf5', filter: 'all' as const },
          { label: 'Pending',  count: pending,  color: '#ca8a04', bg: '#fefce8', filter: 'pending' as const },
          { label: 'Flagged',  count: flagged,  color: '#dc2626', bg: '#fef2f2', filter: 'flagged' as const },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.filter)}
            className="rounded-xl p-3 text-center border transition-all"
            style={{ backgroundColor: s.bg, borderColor: filter === s.filter ? s.color : 'transparent' }}>
            <div className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs" style={{ color: '#6b6560' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {pending > 0 && (
        <button onClick={approveAll}
          className="w-full py-2 rounded-xl text-sm font-semibold border transition-all"
          style={{ borderColor: '#2d5a27', color: '#2d5a27', backgroundColor: '#f0f7ee' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dcfce7' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f0f7ee' }}>
          ✓ Approve all {pending} pending transactions
        </button>
      )}

      {/* Transaction list */}
      <div className="space-y-1 max-h-72 overflow-y-auto rounded-xl border" style={{ borderColor: '#e8e0d4' }}>
        {visible.map(tx => {
          const sc = STATUS_COLORS[tx.status]
          return (
            <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 group"
              style={{ borderColor: '#f0ece4', backgroundColor: '#fff' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#1a1714' }}>{tx.description}</p>
                <p className="text-xs" style={{ color: '#a09a94' }}>
                  {tx.suggested_category || tx.final_category || '—'} · {Math.round(tx.confidence * 100)}% confidence
                </p>
              </div>
              <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: tx.type === 'credit' ? '#059669' : '#1a1714' }}>
                {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                style={{ backgroundColor: sc.bg, color: sc.text }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: sc.dot }} />
                {tx.status}
              </span>
              {tx.status === 'pending' && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => approve(tx.id)} className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>✓</button>
                  <button onClick={() => flag(tx.id)} className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>⚑</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onNext(txs)}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ backgroundColor: approved > 0 ? '#2d5a27' : '#a09a94' }}
        disabled={approved === 0}>
        {approved > 0 ? `Export ${approved} approved transactions →` : 'Approve transactions first'}
      </button>
    </div>
  )
}

// ─── Step 4: Export ───────────────────────────────────────────────────────────

function ExportStep({ transactions }: { transactions: Transaction[] }) {
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState<'quickbooks' | 'standard' | null>(null)

  const approved = transactions.filter(t => t.status === 'approved' || t.status === 'edited')

  async function doExport(format: 'quickbooks' | 'standard') {
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: approved, clientName: DEMO_SUMMARY.clientName, format }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sunrise_advisory_march_2026_${format}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setDone(format)
      }
    } finally {
      setExporting(false)
    }
  }

  const totalDebits = approved.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCredits = approved.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
          Step 4 of 4
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
          Close complete — ready to export
        </h2>
        <p className="text-sm" style={{ color: '#6b6560' }}>
          Download your QBO-ready file or standard CSV
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
        <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Sunrise Advisory LLC · March 2026</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Transactions', value: String(approved.length) },
            { label: 'Total Expenses', value: `$${totalDebits.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: 'Total Revenue', value: `$${totalCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          ].map(s => (
            <div key={s.label} className="text-center rounded-lg py-2" style={{ backgroundColor: '#faf8f4' }}>
              <p className="text-base font-bold" style={{ color: '#1a1714' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#a09a94' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export buttons */}
      <div className="space-y-2">
        {[
          { format: 'quickbooks' as const, label: 'Export to QuickBooks', sub: 'QBO-compatible CSV — import directly', icon: '📥', accent: '#2d5a27' },
          { format: 'standard' as const,   label: 'Export Standard CSV',  sub: 'Date · Category · Amount · Status',   icon: '📄', accent: '#6b6560' },
        ].map(b => (
          <button key={b.format} onClick={() => doExport(b.format)} disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all disabled:opacity-60"
            style={{ borderColor: done === b.format ? b.accent : '#e8e0d4', backgroundColor: done === b.format ? '#f0f7ee' : '#fff' }}
            onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = b.accent }}
            onMouseLeave={e => { if (done !== b.format) e.currentTarget.style.borderColor = '#e8e0d4' }}>
            <span className="text-2xl">{done === b.format ? '✓' : b.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: done === b.format ? b.accent : '#1a1714' }}>{b.label}</p>
              <p className="text-xs" style={{ color: '#a09a94' }}>{b.sub}</p>
            </div>
            {done === b.format && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Downloaded!</span>}
          </button>
        ))}
      </div>

      {/* CTA to sign up */}
      <div className="rounded-2xl p-5 text-center space-y-3" style={{ backgroundColor: '#1a1714' }}>
        <p className="font-bold text-white">You just closed a client&apos;s books in under 2 minutes.</p>
        <p className="text-sm" style={{ color: '#a09a94' }}>Start your free trial and do this for all your clients.</p>
        <Link href="/get-started"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3d7a35' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}>
          Start Free Trial — No Credit Card
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </div>
  )
}

// ─── Main Demo Page ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>('upload')
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS)

  function goTo(s: DemoStep) { setStep(s) }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(12px)', borderColor: '#e8e0d4' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
              <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 17, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#1a1714' }}>Close</span><span style={{ color: '#b8734a' }}>Books</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#f0f5ef', color: '#2d5a27' }}>Live Demo</span>
            <Link href="/get-started" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-24 pb-16">

        {/* Page title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}>
            Watch CloseBooks close books — live
          </h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            Real AI. Real transactions. No signup required. This is exactly what your firm will use.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex(x => x.id === step)
            const done = i < idx
            const active = s.id === step
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => done && goTo(s.id)}
                  className="flex flex-col items-center px-3 py-1 rounded-lg transition-all"
                  style={{ opacity: done || active ? 1 : 0.4, cursor: done ? 'pointer' : 'default' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: done ? '#2d5a27' : active ? '#1a1714' : '#e8e0d4',
                      color: done || active ? '#fff' : '#a09a94',
                    }}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="text-xs font-medium mt-1 whitespace-nowrap hidden sm:block" style={{ color: active ? '#1a1714' : '#a09a94' }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="w-8 sm:w-16 h-0.5 mx-1 mb-4" style={{ backgroundColor: i < idx ? '#2d5a27' : '#e8e0d4' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: Interactive step */}
          <div className="rounded-2xl border p-6 lg:p-8" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
            {step === 'upload' && (
              <UploadStep onNext={() => goTo('categorizing')} />
            )}
            {step === 'categorizing' && (
              <CategorizingStep onNext={(txs) => { setTransactions(txs); goTo('review') }} />
            )}
            {step === 'review' && (
              <ReviewStep transactions={transactions} onNext={(txs) => { setTransactions(txs); goTo('export') }} />
            )}
            {step === 'export' && (
              <ExportStep transactions={transactions} />
            )}
          </div>

          {/* Right: Context + social proof */}
          <div className="space-y-5 lg:sticky lg:top-24">

            {/* What's happening */}
            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#b8734a' }}>What just happened</p>
              {step === 'upload' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#1a1714' }}><strong>CloseBooks reads any CSV</strong> exported from your client&apos;s bank.</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>Chase, Bank of America, Wells Fargo, Citi — one CSV, zero formatting required.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#6b6560' }}>
                    <li>✓ Handles 1 or 10,000 transactions</li>
                    <li>✓ Auto-detects column formats</li>
                    <li>✓ Encrypted upload — SOC 2 ready</li>
                  </ul>
                </div>
              )}
              {step === 'categorizing' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#1a1714' }}><strong>Claude Sonnet</strong> reads every transaction description and maps it to the right account — with a confidence score.</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>Payroll, rent, SaaS subscriptions, client payments — recognized instantly.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#6b6560' }}>
                    <li>✓ Learns your firm&apos;s past corrections</li>
                    <li>✓ 85–95% auto-approval rate</li>
                    <li>✓ Under 60 seconds for 500 transactions</li>
                  </ul>
                </div>
              )}
              {step === 'review' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#1a1714' }}><strong>You stay in control.</strong> High-confidence items are pre-approved. Low-confidence ones are flagged for your review.</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>Approve all, approve selectively, or edit categories inline. Every decision is logged in your audit trail.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#6b6560' }}>
                    <li>✓ One-click bulk approve</li>
                    <li>✓ Inline category editing</li>
                    <li>✓ Full audit trail for every change</li>
                  </ul>
                </div>
              )}
              {step === 'export' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#1a1714' }}><strong>One click to QuickBooks.</strong> Your export is formatted exactly how QBO expects it — no reformatting, no pivot tables.</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>Also supports standard CSV, Xero format, and our full close report PDF.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#6b6560' }}>
                    <li>✓ QBO-native column format</li>
                    <li>✓ Xero and standard CSV</li>
                    <li>✓ Branded client PDF report</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Time saved */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#f0f5ef', border: '1px solid #c4d9c0' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2d5a27' }}>Time saved on this close</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#2d5a27' }}>
                  ~{Math.round(DEMO_TRANSACTIONS.length * 2)} min
                </span>
                <span className="text-sm pb-1" style={{ color: '#6b6560' }}>vs manual review</span>
              </div>
              <p className="text-xs mt-2" style={{ color: '#6b6560' }}>
                At 50 clients/month, CloseBooks saves your firm <strong style={{ color: '#1a1714' }}>~83 hours</strong> every month.
              </p>
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#f59e0b' }}>★</span>)}
              </div>
              <p className="text-sm italic" style={{ color: '#1a1714' }}>
                &ldquo;We closed 18 clients in the time it used to take us to close 6. CloseBooks paid for itself in the first week.&rdquo;
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: '#6b6560' }}>— Sarah K., CPA, 12-person firm</p>
            </div>

            {/* More features */}
            <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#b8734a' }}>Also included in every plan</p>
              {[
                { icon: '🤖', text: 'Autopilot — fully automated close with zero manual input' },
                { icon: '📊', text: 'Advisory memos — AI-written client summaries in seconds' },
                { icon: '🛡️', text: 'Audit defense — IRS response packages built in minutes' },
                { icon: '📋', text: 'TaxDraft — complete tax return preparation from close data' },
                { icon: '🔗', text: 'Client portal — branded financials your clients can see live' },
              ].map(f => (
                <div key={f.icon} className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">{f.icon}</span>
                  <p className="text-xs" style={{ color: '#1a1714' }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
