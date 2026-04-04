'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import TransactionTable from '@/components/TransactionTable'
import { DEMO_TRANSACTIONS, DEMO_COA, DEMO_SUMMARY } from '@/lib/demoData'
import type { Transaction } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Export helper (mirrors review page logic)
// ─────────────────────────────────────────────────────────────────────────────

async function exportTransactions(
  transactions: Transaction[],
  format: 'quickbooks' | 'standard'
) {
  const exportable = transactions.filter(
    (t) => t.status === 'approved' || t.status === 'edited'
  )
  if (exportable.length === 0) return { ok: false, warning: 'No approved transactions to export.' }

  const res = await fetch('/api/export', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      transactions: exportable,
      clientName:   DEMO_SUMMARY.clientName,
      format,
    }),
  })
  if (!res.ok) return { ok: false, warning: 'Export failed.' }

  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${DEMO_SUMMARY.clientName.replace(/\s+/g, '_')}_demo_close.csv`
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export dropdown
// ─────────────────────────────────────────────────────────────────────────────

function ExportButton({ transactions }: { transactions: Transaction[] }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null)

  async function doExport(format: 'quickbooks' | 'standard') {
    setOpen(false)
    setLoading(true)
    setMsg(null)
    const result = await exportTransactions(transactions, format)
    setLoading(false)
    setMsg({ text: result.ok ? 'Export downloaded!' : (result.warning ?? 'Export failed.'), ok: result.ok ?? false })
    setTimeout(() => setMsg(null), 3500)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
        style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#ffffff' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
      >
        {loading ? 'Exporting…' : 'Export'}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden min-w-[200px]"
            style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
          >
            {[
              { fmt: 'quickbooks' as const, label: 'QuickBooks CSV' },
              { fmt: 'standard'   as const, label: 'Standard CSV'   },
            ].map(({ fmt, label }) => (
              <button
                key={fmt}
                onClick={() => doExport(fmt)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#1a1714' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {msg && (
        <div
          className="absolute right-0 top-full mt-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: msg.ok ? '#ecfdf5' : '#fef2f2', color: msg.ok ? '#065f46' : '#991b1b', border: `1px solid ${msg.ok ? '#a7f3d0' : '#fecaca'}` }}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS)

  const approvedCount = transactions.filter(
    (t) => t.status === 'approved' || t.status === 'edited'
  ).length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      {/* Demo banner */}
      <div
        className="border-b px-5 py-3"
        style={{ backgroundColor: '#fdf8f0', borderColor: '#f0d4b0' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-0"
              style={{ backgroundColor: '#b8734a', color: '#ffffff' }}
            >
              i
            </span>
            <p className="text-sm" style={{ color: '#7a4a28' }}>
              <strong>This is a live demo</strong> with sample data for Sunrise Advisory LLC.
              All features work — approve, flag, edit categories, and export.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors whitespace-nowrap"
            style={{ backgroundColor: '#b8734a' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a5c38' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
          >
            Start free trial — use your own data
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-2xl"
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  color: '#1a1714',
                  letterSpacing: '-0.02em',
                }}
              >
                {DEMO_SUMMARY.clientName}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}
              >
                Demo · {DEMO_SUMMARY.period}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: '#a09a94' }}>
              {DEMO_SUMMARY.total} transactions · {DEMO_SUMMARY.approved} approved · {DEMO_SUMMARY.pending} pending · {DEMO_SUMMARY.flagged} flagged
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton transactions={transactions} />
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              New Close
            </Link>
          </div>
        </div>

        {/* Transaction table */}
        <TransactionTable
          initialTransactions={transactions}
          chartOfAccounts={DEMO_COA}
          onTransactionsChange={setTransactions}
        />

        {/* Bottom CTA */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: '#f0f5ef', border: '1px solid #c4d9c0' }}
        >
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1a1714' }}>
              {approvedCount > 0
                ? `${approvedCount} transactions approved — ready to close`
                : 'Approve transactions above to mark this close complete'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              In a real close, this would save to your dashboard and generate your month-end report.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors whitespace-nowrap"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Try with your own data →
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
