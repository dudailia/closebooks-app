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
  { id: 'categorizing', label: '2. AI Categorizes',       desc: 'CloseBooks AI analyzes every transaction' },
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(0,200,83,0.1)', color: '#00C853' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00C853' }} />
          Step 1 of 4
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#FAFAFA' }}>
          Upload your bank statement
        </h2>
        <p className="text-sm" style={{ color: '#888888' }}>
          CloseBooks reads any CSV export from Chase, Bank of America, Wells Fargo, and more.
        </p>
      </div>

      {/* Sample download prompt */}
      <div className="rounded-xl border p-4 flex items-center justify-between gap-4" style={{ borderColor: 'rgba(0,200,83,0.2)', backgroundColor: 'rgba(0,200,83,0.06)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Don&apos;t have a CSV handy?</p>
          <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Download our sample — 20 real transactions from Sunrise Advisory LLC</p>
        </div>
        <button
          onClick={downloadSample}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: '#00C853', color: '#080808' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00b34a' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00C853' }}
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
          borderColor: dragging ? '#00C853' : fileName ? '#00C853' : '#1f1f1f',
          backgroundColor: dragging ? 'rgba(0,200,83,0.06)' : fileName ? 'rgba(0,200,83,0.06)' : '#141414',
        }}
      >
        <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
        {fileName ? (
          <div className="space-y-2">
            <div className="text-3xl">✓</div>
            <p className="font-semibold text-sm" style={{ color: '#00C853' }}>{fileName}</p>
            <p className="text-xs" style={{ color: '#888888' }}>Uploading…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📂</div>
            <p className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>Drop your CSV here, or click to browse</p>
            <p className="text-xs" style={{ color: '#444444' }}>Supports any bank CSV export · Encrypted in transit</p>
          </div>
        )}
      </label>

      <div className="text-center">
        <span className="text-xs" style={{ color: '#444444' }}>or</span>
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
    { id: 'sending', label: 'Sending to CloseBooks AI engine', done: phase === 'ai' || phase === 'done' },
    { id: 'ai',      label: `Categorizing against ${DEMO_COA.length} accounts…`, done: phase === 'done' },
  ]

  const autoApproved = categorized.filter(t => t.confidence >= 0.85).length

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(184,115,74,0.15)', color: '#b8734a' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#b8734a' }} />
          Step 2 of 4
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#FAFAFA' }}>
          CloseBooks AI is categorizing your transactions
        </h2>
        <p className="text-sm" style={{ color: '#888888' }}>
          Every transaction is matched to your chart of accounts with a confidence score
        </p>
      </div>

      {/* Progress ring */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1f1f1f" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="#00C853" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - (isAiPhase ? count / total : 0))}`}
              style={{ transition: 'stroke-dashoffset 0.1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: '#FAFAFA' }}>
              {isAiPhase ? count : 0}
            </span>
            <span className="text-xs" style={{ color: '#888888' }}>of {total}</span>
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
                style={{ backgroundColor: s.done ? '#00C853' : isActive ? 'rgba(184,115,74,0.2)' : '#1f1f1f', color: s.done ? '#080808' : isActive ? '#b8734a' : '#444444' }}>
                {s.done ? '✓' : isActive ? '…' : i + 1}
              </span>
              <span className="text-sm" style={{ color: s.done ? '#00C853' : isActive ? '#FAFAFA' : '#444444', fontWeight: isActive ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {phase === 'done' && (
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(0,200,83,0.3)', backgroundColor: 'rgba(0,200,83,0.1)' }}>
          <p className="font-semibold text-sm" style={{ color: '#00C853' }}>
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#1f1f1f', color: '#888888' }}>
          Step 3 of 4
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#FAFAFA' }}>
          Review AI categorizations
        </h2>
        <p className="text-sm" style={{ color: '#888888' }}>Approve, edit, or flag — your call is final</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Approved', count: approved, color: '#00C853', bg: 'rgba(0,200,83,0.1)', filter: 'all' as const },
          { label: 'Pending',  count: pending,  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)', filter: 'pending' as const },
          { label: 'Flagged',  count: flagged,  color: '#dc2626', bg: 'rgba(220,38,38,0.1)', filter: 'flagged' as const },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.filter)}
            className="rounded-xl p-3 text-center border transition-all"
            style={{ backgroundColor: s.bg, borderColor: filter === s.filter ? s.color : '#1f1f1f' }}>
            <div className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs" style={{ color: '#888888' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {pending > 0 && (
        <button onClick={approveAll}
          className="w-full py-2 rounded-xl text-sm font-semibold border transition-all"
          style={{ borderColor: '#00C853', color: '#00C853', backgroundColor: 'rgba(0,200,83,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,200,83,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,200,83,0.08)' }}>
          ✓ Approve all {pending} pending transactions
        </button>
      )}

      {/* Transaction list */}
      <div className="space-y-1 max-h-64 sm:max-h-72 overflow-y-auto rounded-xl border" style={{ borderColor: '#1f1f1f' }}>
        {visible.map(tx => {
          const sc = STATUS_COLORS[tx.status]
          return (
            <div key={tx.id} className="flex items-start sm:items-center gap-2 sm:gap-3 px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#FAFAFA' }}>{tx.description}</p>
                <p className="text-xs" style={{ color: '#444444' }}>
                  {tx.suggested_category || tx.final_category || '—'} · {Math.round(tx.confidence * 100)}%
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-xs font-semibold tabular-nums" style={{ color: tx.type === 'credit' ? '#00C853' : '#FAFAFA' }}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(0)}
                </span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: sc.bg }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                </span>
                {tx.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => approve(tx.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: '#00C853', color: '#080808', minHeight: 'auto' }}>✓</button>
                    <button onClick={() => flag(tx.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: '#dc2626', minHeight: 'auto' }}>⚑</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onNext(txs)}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ backgroundColor: approved > 0 ? '#00C853' : '#1f1f1f', color: approved > 0 ? '#080808' : '#444444' }}
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(107,33,168,0.15)', color: '#a855f7' }}>
          Step 4 of 4
        </div>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#FAFAFA' }}>
          Close complete — ready to export
        </h2>
        <p className="text-sm" style={{ color: '#888888' }}>
          Download your QBO-ready file or standard CSV
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
        <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>Sunrise Advisory LLC · March 2026</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Transactions', value: String(approved.length) },
            { label: 'Total Expenses', value: `$${totalDebits.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: 'Total Revenue', value: `$${totalCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          ].map(s => (
            <div key={s.label} className="text-center rounded-lg py-2" style={{ backgroundColor: '#141414' }}>
              <p className="text-base font-bold" style={{ color: '#FAFAFA' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#444444' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export buttons */}
      <div className="space-y-2">
        {[
          { format: 'quickbooks' as const, label: 'Export to QuickBooks', sub: 'QBO-compatible CSV — import directly', icon: '📥', accent: '#00C853' },
          { format: 'standard' as const,   label: 'Export Standard CSV',  sub: 'Date · Category · Amount · Status',   icon: '📄', accent: '#888888' },
        ].map(b => (
          <button key={b.format} onClick={() => doExport(b.format)} disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all disabled:opacity-60"
            style={{ borderColor: done === b.format ? b.accent : '#1f1f1f', backgroundColor: done === b.format ? 'rgba(0,200,83,0.08)' : '#141414' }}
            onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = b.accent }}
            onMouseLeave={e => { if (done !== b.format) e.currentTarget.style.borderColor = '#1f1f1f' }}>
            <span className="text-2xl">{done === b.format ? '✓' : b.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: done === b.format ? b.accent : '#FAFAFA' }}>{b.label}</p>
              <p className="text-xs" style={{ color: '#444444' }}>{b.sub}</p>
            </div>
            {done === b.format && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,200,83,0.15)', color: '#00C853' }}>Downloaded!</span>}
          </button>
        ))}
      </div>

      {/* CTA to sign up */}
      <div className="rounded-2xl p-5 text-center space-y-3" style={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f' }}>
        <p className="font-bold" style={{ color: '#FAFAFA' }}>You just closed a client&apos;s books in under 2 minutes.</p>
        <p className="text-sm" style={{ color: '#888888' }}>Start your free trial and do this for all your clients.</p>
        <Link href="/get-started"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: '#00C853', color: '#080808' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00b34a' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00C853' }}>
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
    <div className="min-h-screen" data-theme="dark" style={{ backgroundColor: '#080808' }}>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1f1f1f' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
              <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 17, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#FAFAFA' }}>Close</span><span style={{ color: '#b8734a' }}>Books</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,200,83,0.1)', color: '#00C853' }}>Live Demo</span>
            <Link href="/get-started" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#00C853', color: '#080808' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-5 pt-20 sm:pt-24 pb-16">

        {/* Page title */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#FAFAFA', letterSpacing: '-0.02em' }}>
            Watch CloseBooks close books — live
          </h1>
          <p className="text-sm" style={{ color: '#888888' }}>
            Real AI. Real transactions. No signup required.
          </p>
        </div>

        {/* Step progress — compact on mobile */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto pb-1 -mx-1 px-1">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex(x => x.id === step)
            const done = i < idx
            const active = s.id === step
            return (
              <div key={s.id} className="flex items-center shrink-0">
                <button
                  onClick={() => done && goTo(s.id)}
                  className="flex flex-col items-center px-1.5 sm:px-3 py-1 rounded-lg transition-all"
                  style={{ opacity: done || active ? 1 : 0.4, cursor: done ? 'pointer' : 'default', minHeight: 'auto' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0"
                    style={{
                      backgroundColor: done ? '#00C853' : active ? '#FAFAFA' : '#1f1f1f',
                      color: done ? '#080808' : active ? '#080808' : '#444444',
                    }}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="text-xs font-medium mt-1 whitespace-nowrap hidden sm:block" style={{ color: active ? '#FAFAFA' : '#444444', fontSize: 11 }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="w-6 sm:w-12 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 shrink-0" style={{ backgroundColor: i < idx ? '#00C853' : '#1f1f1f' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* Left: Interactive step */}
          <div className="rounded-2xl border p-4 sm:p-6 lg:p-8" style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
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
            <div className="rounded-2xl border p-5" style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#b8734a' }}>What just happened</p>
              {step === 'upload' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#FAFAFA' }}><strong>CloseBooks reads any CSV</strong> exported from your client&apos;s bank.</p>
                  <p className="text-sm" style={{ color: '#888888' }}>Chase, Bank of America, Wells Fargo, Citi — one CSV, zero formatting required.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#888888' }}>
                    <li>✓ Handles 1 or 10,000 transactions</li>
                    <li>✓ Auto-detects column formats</li>
                    <li>✓ Security-first upload workflow</li>
                  </ul>
                </div>
              )}
              {step === 'categorizing' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#FAFAFA' }}><strong>CloseBooks AI</strong> reads every transaction description and maps it to the right account — with a confidence score.</p>
                  <p className="text-sm" style={{ color: '#888888' }}>Payroll, rent, SaaS subscriptions, client payments — recognized instantly.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#888888' }}>
                    <li>✓ Learns your firm&apos;s past corrections</li>
                    <li>✓ 85–95% auto-approval rate</li>
                    <li>✓ Under 60 seconds for 500 transactions</li>
                  </ul>
                </div>
              )}
              {step === 'review' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#FAFAFA' }}><strong>You stay in control.</strong> High-confidence items are pre-approved. Low-confidence ones are flagged for your review.</p>
                  <p className="text-sm" style={{ color: '#888888' }}>Approve all, approve selectively, or edit categories inline. Every decision is logged in your audit trail.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#888888' }}>
                    <li>✓ One-click bulk approve</li>
                    <li>✓ Inline category editing</li>
                    <li>✓ Full audit trail for every change</li>
                  </ul>
                </div>
              )}
              {step === 'export' && (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#FAFAFA' }}><strong>One click to QuickBooks.</strong> Your export is formatted exactly how QBO expects it — no reformatting, no pivot tables.</p>
                  <p className="text-sm" style={{ color: '#888888' }}>Also supports standard CSV, Xero format, and our full close report PDF.</p>
                  <ul className="text-xs space-y-1 mt-3" style={{ color: '#888888' }}>
                    <li>✓ QBO-native column format</li>
                    <li>✓ Xero and standard CSV</li>
                    <li>✓ Branded client PDF report</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Time saved */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#00C853' }}>Time saved on this close</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#00C853' }}>
                  ~{Math.round(DEMO_TRANSACTIONS.length * 2)} min
                </span>
                <span className="text-sm pb-1" style={{ color: '#888888' }}>vs manual review</span>
              </div>
              <p className="text-xs mt-2" style={{ color: '#888888' }}>
                At 50 clients/month, CloseBooks saves your firm <strong style={{ color: '#FAFAFA' }}>~83 hours</strong> every month.
              </p>
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl border p-5" style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#f59e0b' }}>★</span>)}
              </div>
              <p className="text-sm italic" style={{ color: '#FAFAFA' }}>
                &ldquo;We closed 18 clients in the time it used to take us to close 6. CloseBooks paid for itself in the first week.&rdquo;
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: '#888888' }}>— Sarah K., CPA, 12-person firm</p>
            </div>

            {/* More features */}
            <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: '#1f1f1f', backgroundColor: '#0f0f0f' }}>
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
                  <p className="text-xs" style={{ color: '#FAFAFA' }}>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
