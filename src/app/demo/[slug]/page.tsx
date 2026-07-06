import Link from 'next/link'
import AppFooter from '@/components/AppFooter'
import { DEMO_TRANSACTIONS, DEMO_COA } from '@/lib/demoData'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugToName(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─────────────────────────────────────────────────────────────────────────────
// Static sub-components
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

type Status = 'approved' | 'pending' | 'flagged' | 'edited'

function StatusChip({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string; label: string }> = {
    approved: { bg: '#ecfdf5', text: '#065f46', label: 'Auto-categorized ✓' },
    edited:   { bg: '#ecfdf5', text: '#065f46', label: 'Auto-categorized ✓' },
    pending:  { bg: '#fdf2e9', text: '#9a3412', label: 'Needs review'        },
    flagged:  { bg: '#fef2f2', text: '#991b1b', label: 'Flagged'             },
  }
  const s = map[status]
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
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PersonalizedDemoPage({
  params,
}: {
  params: { slug: string }
}) {
  const companyName = slugToName(params.slug)
  const preview = DEMO_TRANSACTIONS.slice(0, 8)
  const approved = DEMO_TRANSACTIONS.filter((t) => t.status === 'approved' || t.status === 'edited').length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
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
          >
            Start free trial →
          </Link>
        </div>
      </nav>

      {/* ── Personalized banner ──────────────────────────────────────────── */}
      <div
        className="border-b px-5 py-4"
        style={{ backgroundColor: '#fdf5ec', borderColor: '#f0d4b0' }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm leading-relaxed" style={{ color: '#7a4a28' }}>
            <strong>This is a personalized demo for {companyName}.</strong>{' '}
            See CloseBooks in action with real bookkeeping data — then try it with your own.
          </p>
          <Link
            href="/dashboard/upload"
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: '#b8734a' }}
          >
            Start Free Trial with Your Data
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-10 space-y-12 page-enter">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: '#b8734a', letterSpacing: '0.08em' }}>
            Personalized demo · {companyName}
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
            Hi {companyName.split(' ')[0]}, here&apos;s what CloseBooks can do for {companyName}.
          </h1>
          <p className="text-lg max-w-xl" style={{ color: '#6b6560', lineHeight: 1.6 }}>
            Sample transactions below show AI-assisted categories with confidence scores. Your team approves before export.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { value: String(DEMO_TRANSACTIONS.length), label: 'transactions' },
              { value: `${approved}`, label: 'auto-categorized' },
              { value: '~40 min', label: 'saved per close' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border px-4 py-3"
                style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
              >
                <p className="text-2xl font-semibold" style={{ color: '#1a1714' }}>{s.value}</p>
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
                Sample Close · March 2026
              </h2>
              <p className="text-sm mt-0.5" style={{ color: '#a09a94' }}>
                Sunrise Advisory LLC · Showing {preview.length} of {DEMO_TRANSACTIONS.length} transactions
              </p>
            </div>
            <span
              className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
            >
              Live demo · read only
            </span>
          </div>

          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div
              className="grid text-xs font-semibold uppercase tracking-wide px-5 py-3 border-b"
              style={{
                gridTemplateColumns: '80px 1fr 110px 140px 150px',
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

            {preview.map((tx, i) => (
              <div
                key={tx.id}
                className="grid items-center px-5 py-3.5 border-b last:border-0"
                style={{
                  gridTemplateColumns: '80px 1fr 110px 140px 150px',
                  borderColor: '#f5f0ea',
                }}
              >
                <span className="text-xs tabular-nums" style={{ color: '#a09a94' }}>
                  {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="min-w-0 pr-4">
                  <p className="text-sm truncate" style={{ color: '#1a1714' }}>{tx.description}</p>
                </div>
                <div className="text-right">
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: tx.type === 'credit' ? '#2d5a27' : '#1a1714' }}
                  >
                    {tx.type === 'credit' ? '+' : '−'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-center">
                  {tx.status !== 'flagged' ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs truncate max-w-[128px]" style={{ color: '#6b6560' }} title={tx.suggested_category}>
                        {tx.suggested_category}
                      </span>
                      <ConfBadge value={tx.confidence} />
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: '#a09a94' }}>—</span>
                  )}
                </div>
                <div className="text-center">
                  <StatusChip status={tx.status} />
                </div>
              </div>
            ))}

            {/* "See more" footer */}
            <div
              className="px-5 py-3 text-center text-sm border-t"
              style={{ borderColor: '#f0ebe3', color: '#a09a94', backgroundColor: '#faf8f4' }}
            >
              +{DEMO_TRANSACTIONS.length - preview.length} more transactions ·{' '}
              <Link href="/demo" style={{ color: '#b8734a' }}>
                Try the full interactive demo →
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section>
          <p className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: '#b8734a', letterSpacing: '0.08em' }}>
            How it works
          </p>
          <h2
            className="text-2xl mb-8"
            style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
          >
            Three steps. Month-end done.
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'Upload your bank statement',
                body: 'Drag and drop any CSV from your bank. Chase, BofA, Wells Fargo, and hundreds more.',
              },
              {
                n: '02',
                title: 'AI suggests categories',
                body: 'CloseBooks reads each line, maps it to your chart of accounts, and flags low-confidence items for your review.',
              },
              {
                n: '03',
                title: 'Review, approve, export',
                body: 'Scan the flagged ones, make edits, export a clean QuickBooks CSV. Done in minutes, not hours.',
              },
            ].map(({ n, title, body }) => (
              <div
                key={n}
                className="rounded-2xl border p-6 space-y-3"
                style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
              >
                <span
                  className="inline-block text-xs font-bold"
                  style={{ color: '#b8734a' }}
                >
                  STEP {n}
                </span>
                <h3 className="font-semibold text-base" style={{ color: '#1a1714' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{body}</p>
              </div>
            ))}
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
                Ready to try it with {companyName}&apos;s data?
              </h2>
              <p className="text-sm" style={{ color: '#4a6b46' }}>
                Upload your own bank statement and try AI-assisted categorization. Free trial — no credit card required.
              </p>
            </div>
            <div className="shrink-0 space-y-2">
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm whitespace-nowrap"
                style={{ backgroundColor: '#2d5a27' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="white" strokeWidth="1.3" />
                  <path d="M7 4v6M4 7l3-3 3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Start Free Trial with Your Data
              </Link>
              <p className="text-xs text-center" style={{ color: '#6b9965' }}>Works with any CSV</p>
            </div>
          </div>
        </section>

      </main>

      <AppFooter />
    </div>
  )
}
