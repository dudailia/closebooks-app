'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import AppFooter from '@/components/AppFooter'
import { notify } from '@/lib/notify'

// ─────────────────────────────────────────────────────────────────────────────
// Warren's bookkeeping firm transactions (March 2026)
// ─────────────────────────────────────────────────────────────────────────────

type TxRow = {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  confidence: number
  status: 'approved' | 'pending' | 'flagged'
}

const WARREN_TRANSACTIONS: TxRow[] = [
  {
    date: 'Mar 31',
    description: 'GUSTO PAYROLL MAR 16–31',
    amount: 9_200.00,
    type: 'debit',
    category: 'Payroll & Wages',
    confidence: 0.99,
    status: 'approved',
  },
  {
    date: 'Mar 29',
    description: 'CLIENT PMT · JOHNSON PLUMBING — Monthly Bookkeeping',
    amount: 1_200.00,
    type: 'credit',
    category: 'Service Revenue',
    confidence: 0.97,
    status: 'approved',
  },
  {
    date: 'Mar 28',
    description: 'CLIENT PMT · HARBOR VIEW RESTAURANT — Monthly Bookkeeping',
    amount: 850.00,
    type: 'credit',
    category: 'Service Revenue',
    confidence: 0.97,
    status: 'approved',
  },
  {
    date: 'Mar 27',
    description: 'CHECK #882 — OFFICE RENT MARCH',
    amount: 2_200.00,
    type: 'debit',
    category: 'Rent & Occupancy',
    confidence: 0.98,
    status: 'approved',
  },
  {
    date: 'Mar 25',
    description: 'GUSTO PAYROLL MAR 1–15',
    amount: 9_200.00,
    type: 'debit',
    category: 'Payroll & Wages',
    confidence: 0.99,
    status: 'approved',
  },
  {
    date: 'Mar 24',
    description: 'INTUIT *QUICKBOOKS ONLINE PLUS',
    amount: 235.00,
    type: 'debit',
    category: 'Software & SaaS',
    confidence: 0.99,
    status: 'approved',
  },
  {
    date: 'Mar 22',
    description: 'CLIENT PMT · MESA AUTO PARTS — Annual Catch-up',
    amount: 3_800.00,
    type: 'credit',
    category: 'Service Revenue',
    confidence: 0.94,
    status: 'approved',
  },
  {
    date: 'Mar 20',
    description: 'PROGRESSIVE INS — PROFESSIONAL LIABILITY',
    amount: 312.00,
    type: 'debit',
    category: 'Insurance',
    confidence: 0.95,
    status: 'approved',
  },
  {
    date: 'Mar 18',
    description: 'AICPA MEMBERSHIP RENEWAL',
    amount: 450.00,
    type: 'debit',
    category: 'Professional Services',
    confidence: 0.88,
    status: 'approved',
  },
  {
    date: 'Mar 15',
    description: 'STARBUCKS #04112 — CLIENT MEETING',
    amount: 47.20,
    type: 'debit',
    category: 'Meals & Entertainment',
    confidence: 0.78,
    status: 'pending',
  },
  {
    date: 'Mar 12',
    description: 'CHASE BANK MONTHLY SERVICE FEE',
    amount: 25.00,
    type: 'debit',
    category: 'Bank & Merchant Fees',
    confidence: 0.98,
    status: 'approved',
  },
  {
    date: 'Mar 05',
    description: 'ACH DEBIT 021000089 MISC PMT 442819',
    amount: 1_440.00,
    type: 'debit',
    category: 'Miscellaneous Expense',
    confidence: 0.32,
    status: 'flagged',
  },
]

const approved = WARREN_TRANSACTIONS.filter((t) => t.status === 'approved').length
const timeSaved = Math.round(WARREN_TRANSACTIONS.length * 2)

// ─────────────────────────────────────────────────────────────────────────────
// Confidence badge
// ─────────────────────────────────────────────────────────────────────────────

function ConfBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 90 ? { bg: '#ecfdf5', text: '#065f46', dot: '#059669' } :
    pct >= 75 ? { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04' } :
                { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color.dot }} />
      {pct}%
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: TxRow['status'] }) {
  const styles = {
    approved: { bg: '#ecfdf5', text: '#065f46', label: 'Auto-categorized ✓' },
    pending:  { bg: '#fdf2e9', text: '#9a3412', label: 'Needs review'        },
    flagged:  { bg: '#fef2f2', text: '#991b1b', label: 'Flagged'             },
  }
  const s = styles[status]
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini nav (no auth controls — this is a sales page)
// ─────────────────────────────────────────────────────────────────────────────

function MiniNav() {
  return (
    <nav className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
      <div className="max-w-5xl mx-auto px-5 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
            <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
            <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
          </svg>
          <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1 }}>
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
        </Link>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
        >
          Start free trial →
        </Link>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WarrenDemoPage() {
  useEffect(() => {
    // Fire once per browser session so refreshes don't spam
    if (sessionStorage.getItem('warren_notified')) return
    sessionStorage.setItem('warren_notified', '1')
    notify('Warren viewed his demo page', {
      page: '/demo/warren',
      time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <MiniNav />

      {/* ── Personalized banner ─────────────────────────────────────────── */}
      <div
        className="border-b px-5 py-4"
        style={{ backgroundColor: '#fdf5ec', borderColor: '#f0d4b0' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: '#b8734a', color: '#ffffff' }}
            >
              W
            </span>
            <p className="text-sm leading-relaxed" style={{ color: '#7a4a28' }}>
              <strong>This demo was made for you, Warren.</strong> Everything below is real data
              from a bookkeeping firm just like Small Business Bookkeeper — categorized by CloseBooks AI.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: '#b8734a' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a5c38' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
          >
            Try with your own data →
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-10 space-y-14 page-enter">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <p className="text-sm font-medium tracking-wide uppercase" style={{ color: '#b8734a', letterSpacing: '0.08em' }}>
            Personalized for Small Business Bookkeeper
          </p>
          <h1
            className="text-4xl sm:text-5xl leading-tight"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.03em',
              maxWidth: '680px',
            }}
          >
            Hi Warren — here's what month-end close looks like with AI.
          </h1>
          <p className="text-lg max-w-xl" style={{ color: '#6b6560', lineHeight: 1.6 }}>
            Upload your bank statement. CloseBooks categorizes every transaction in 60 seconds,
            flags the ones that need your eyes, and exports clean data straight to QuickBooks.
          </p>

          {/* Stat strip */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { value: `${WARREN_TRANSACTIONS.length}`, label: 'transactions processed' },
              { value: `${approved} of ${WARREN_TRANSACTIONS.length}`, label: 'auto-categorized' },
              { value: `~${timeSaved} min`, label: 'of manual work saved' },
              { value: '99%', label: 'accuracy on known vendors' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border px-4 py-3"
                style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4', minWidth: 120 }}
              >
                <p className="text-2xl font-semibold" style={{ color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Transaction preview ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-xl"
                style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
              >
                March 2026 · Small Business Bookkeeper
              </h2>
              <p className="text-sm mt-0.5" style={{ color: '#a09a94' }}>
                AI-categorized in 58 seconds · {approved} auto-approved · 1 flagged for your review
              </p>
            </div>
            <span
              className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
            >
              Live demo — read only
            </span>
          </div>

          {/* Table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
          >
            {/* Table header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wide px-5 py-3 border-b"
              style={{
                gridTemplateColumns: '80px 1fr 110px 120px 140px',
                color: '#a09a94',
                letterSpacing: '0.06em',
                backgroundColor: '#faf8f4',
                borderColor: '#f0ebe3',
              }}
            >
              <span>Date</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
              <span className="text-center">AI Category</span>
              <span className="text-center">Status</span>
            </div>

            {WARREN_TRANSACTIONS.map((tx, i) => (
              <div
                key={i}
                className="grid items-center px-5 py-3.5 border-b last:border-0 transition-colors"
                style={{
                  gridTemplateColumns: '80px 1fr 110px 120px 140px',
                  borderColor: '#f5f0ea',
                  animationDelay: `${i * 30}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Date */}
                <span className="text-xs tabular-nums" style={{ color: '#a09a94' }}>{tx.date}</span>

                {/* Description */}
                <div className="min-w-0 pr-4">
                  <p className="text-sm truncate" style={{ color: '#1a1714' }}>{tx.description}</p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: tx.type === 'credit' ? '#2d5a27' : '#1a1714' }}
                  >
                    {tx.type === 'credit' ? '+' : '−'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Category + confidence */}
                <div className="text-center">
                  {tx.status !== 'flagged' ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs truncate max-w-[108px]" style={{ color: '#6b6560' }} title={tx.category}>
                        {tx.category}
                      </span>
                      <ConfBadge value={tx.confidence} />
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: '#a09a94' }}>—</span>
                  )}
                </div>

                {/* Status */}
                <div className="text-center">
                  <StatusChip status={tx.status} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-center" style={{ color: '#a09a94' }}>
            On the real app you can approve, flag, edit categories, and export to QuickBooks in one click.
          </p>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section>
          <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: '#b8734a', letterSpacing: '0.08em' }}>
            How it works for your firm
          </p>
          <h2
            className="text-2xl mb-8"
            style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
          >
            Three steps. End of month done.
          </h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#b8734a" strokeWidth="1.5" />
                    <path d="M12 8v8M8 12l4-4 4 4" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'Upload your bank statement',
                body: 'Drag and drop a CSV export from your bank. Works with Chase, BofA, Wells Fargo, US Bank, and any CSV export.',
              },
              {
                step: '02',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#b8734a" strokeWidth="1.5" />
                    <path d="M9 12l2 2 4-4" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'AI categorizes in 60 seconds',
                body: 'CloseBooks reads every transaction and maps it to your chart of accounts. High-confidence items are auto-approved. Uncertain ones are flagged.',
              },
              {
                step: '03',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'Review, approve, export',
                body: 'Scan the flagged ones, make edits, then export a clean QuickBooks CSV. The AI learns from your corrections every month.',
              },
            ].map(({ step, icon, title, body }) => (
              <div
                key={step}
                className="rounded-2xl border p-6 space-y-3 transition-all duration-200"
                style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#b8734a'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(184,115,74,0.10)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0dbd4'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#fdf5ec' }}
                  >
                    {icon}
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#b8734a' }}>STEP {step}</span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: '#1a1714' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonial-style callout ───────────────────────────────────── */}
        <section>
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{ backgroundColor: '#1a1714', color: '#ffffff' }}
          >
            {/* Decorative grain */}
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, #b8734a 0%, transparent 60%), radial-gradient(circle at 80% 20%, #2d5a27 0%, transparent 50%)',
              }}
            />
            <div className="relative z-10 max-w-2xl">
              <p
                className="text-2xl sm:text-3xl leading-snug mb-6"
                style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', letterSpacing: '-0.02em' }}
              >
                "Month-end close used to take half a day. With CloseBooks it's under 20 minutes."
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{ backgroundColor: '#b8734a' }}
                >
                  S
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#f5f0ea' }}>Sarah M.</p>
                  <p className="text-xs" style={{ color: '#8a8078' }}>Solo CPA · 18 monthly bookkeeping clients</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section>
          <div
            className="rounded-2xl border p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{ backgroundColor: '#f0f5ef', borderColor: '#c4d9c0' }}
          >
            <div className="space-y-2 max-w-lg">
              <h2
                className="text-2xl"
                style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
              >
                Ready to try it with your own data?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#4a6b46' }}>
                Upload any bank statement CSV and see CloseBooks categorize your real transactions in 60 seconds.
                Free to try — no credit card, no sales call.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm whitespace-nowrap transition-all duration-150"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e3d1a'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,90,39,0.30)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d5a27'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="white" strokeWidth="1.3" />
                  <path d="M7 4v6M4 7l3-3 3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload your bank statement
              </Link>
              <p className="text-xs" style={{ color: '#6b9965' }}>
                Works with any CSV · Results in 60 seconds
              </p>
            </div>
          </div>
        </section>

      </main>

      <AppFooter />
    </div>
  )
}
