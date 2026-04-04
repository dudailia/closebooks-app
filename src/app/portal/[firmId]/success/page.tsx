'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function firmDisplayName(firmId: string): string {
  return firmId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatPeriod(value: string): string {
  const [year, month] = value.split('-')
  if (!year || !month) return value
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Inner component (needs useSearchParams, must be inside Suspense)
// ---------------------------------------------------------------------------

function SuccessContent() {
  const params       = useParams()
  const searchParams = useSearchParams()

  const firmId      = typeof params.firmId === 'string' ? params.firmId : ''
  const firmName    = firmDisplayName(firmId)
  const business    = searchParams.get('business') ?? 'your business'
  const period      = searchParams.get('period') ?? ''
  const fileCount   = Number(searchParams.get('files') ?? 1)
  const timestamp   = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f5f1' }}>

      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center gap-3">
          <LedgerIcon />
          <div>
            <p
              className="leading-none"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 17,
                color: '#1a1714',
              }}
            >
              <span style={{ color: '#1a1714' }}>Close</span>
              <span style={{ color: '#b8734a' }}>Books</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>Secure client portal</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center">

          {/* Check circle */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#e8f0e6' }}
          >
            <CheckIcon />
          </div>

          <h1
            className="mb-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 'clamp(1.7rem, 5vw, 2.2rem)',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Documents received.
          </h1>

          <p className="text-sm mb-8" style={{ color: '#6b6560' }}>
            Thank you — {firmName} has been notified and will begin processing your
            statements shortly.
          </p>

          {/* Summary card */}
          <div
            className="rounded-2xl border text-left mb-8"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: '#e8e0d4' }}>
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#b8734a' }}>
                Upload Summary
              </p>
            </div>
            <ul className="divide-y" style={{ borderColor: '#f0ebe4' }}>
              <SummaryRow label="Business" value={business} />
              {period && <SummaryRow label="Period" value={formatPeriod(period)} />}
              <SummaryRow
                label="Files submitted"
                value={`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
              />
              <SummaryRow label="Submitted at" value={timestamp} />
              <SummaryRow label="Sent to" value={firmName} />
            </ul>
          </div>

          {/* What happens next */}
          <div
            className="rounded-2xl p-5 text-left mb-8"
            style={{ backgroundColor: '#f0f5ef', border: '1px solid #d4e5d0' }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: '#2d5a27' }}>
              What happens next?
            </p>
            <ol className="space-y-2">
              {[
                `${firmName} reviews your documents`,
                'Transactions are categorized and reconciled',
                'You\'ll receive a summary report when complete',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#3d6e38' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-px"
                    style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Upload another */}
          <Link
            href={`/portal/${firmId}`}
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#2d5a27' }}
          >
            <span>←</span>
            <span>Upload more documents</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs" style={{ color: '#c4bdb8' }}>
          Powered by CloseBooks · Your data is encrypted in transit and at rest
        </p>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row helper
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
      <span style={{ color: '#a09a94' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: '#1a1714' }}>{value}</span>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Page (Suspense wrapper required for useSearchParams in App Router)
// ---------------------------------------------------------------------------

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LedgerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M7 14.5l5 5 9-10" stroke="#2d5a27" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
