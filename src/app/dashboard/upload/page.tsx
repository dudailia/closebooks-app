'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import ChartOfAccountsUpload from '@/components/ChartOfAccountsUpload'
import { saveJob } from '@/lib/storage'
import { dbSaveJob } from '@/lib/db'
import { getRecentCorrections } from '@/lib/corrections'
import { notify } from '@/lib/notify'
import { logActivity } from '@/lib/activity'
import { canStartClose, recordCloseUsed, getTrialStatus } from '@/lib/freeTrial'
import { startSession, endSession } from '@/lib/timeTracking'
import { consumeUploadPrefillClient } from '@/lib/uploadPrefill'
import type { Transaction, ChartOfAccounts, CategorizationJob } from '@/types'

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Client', 'Accounts', 'Statement', 'Categorize']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        const upcoming = i > current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                style={{
                  backgroundColor: done ? '#2d5a27' : active ? '#f0ece4' : '#e0dbd4',
                  color: done ? '#fff' : active ? '#2d5a27' : '#a09a94',
                  border: active ? '2px solid #2d5a27' : '2px solid transparent',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="text-xs mt-1 whitespace-nowrap"
                style={{ color: active ? '#2d5a27' : upcoming ? '#a09a94' : '#6b6560', fontWeight: active ? 500 : 400 }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 w-10 sm:w-16 mx-1 mb-4 transition-all"
                style={{ backgroundColor: i < current ? '#2d5a27' : '#e0dbd4' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4' }}
    >
      <h2 className="text-base font-semibold mb-5" style={{ color: '#1a1714' }}>{title}</h2>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Categorize step — calls API and shows progress
// ---------------------------------------------------------------------------

type CategorizeState = 'idle' | 'loading' | 'error'

function CategorizeStep({
  clientName,
  transactions,
  chartOfAccounts,
  onBack,
}: {
  clientName: string
  transactions: Transaction[]
  chartOfAccounts: ChartOfAccounts[]
  onBack: () => void
}) {
  const router = useRouter()
  const [state, setState]             = useState<CategorizeState>('idle')
  const [error, setError]             = useState<string | null>(null)
  const [batchCurrent, setBatchCurrent] = useState(0)
  const [batchTotal, setBatchTotal]   = useState(0)
  const [phase, setPhase]             = useState<'sending' | 'categorizing' | 'saving'>('sending')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const numBatches = Math.ceil(transactions.length / 20)

  // Advance simulated batch counter while loading
  useEffect(() => {
    if (state !== 'loading') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    // Advance one batch tick every ~2.5s so it roughly tracks real time
    const msPerBatch = Math.max(1800, 2500)
    let cur = 0
    timerRef.current = setInterval(() => {
      cur++
      if (cur < numBatches) {
        setBatchCurrent(cur)
        setPhase('categorizing')
      } else {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }, msPerBatch)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state, numBatches])

  async function handleCategorize() {
    // Check free trial limit before starting
    if (!canStartClose()) {
      setError('You have used all 5 free closes. Please upgrade to continue.')
      setState('error')
      return
    }

    setState('loading')
    setError(null)
    setBatchCurrent(0)
    setBatchTotal(numBatches)
    // Record usage immediately so the banner updates
    recordCloseUsed()
    // Start time tracking
    const sessionId = startSession('upload', clientName, 'upload')
    setPhase('sending')

    try {
      const corrections = getRecentCorrections(10)
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, chartOfAccounts, clientName, corrections }),
      })

      if (timerRef.current) clearInterval(timerRef.current)
      setPhase('saving')
      setBatchCurrent(numBatches)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)

      const categorized: Transaction[] = data.transactions
      const job: CategorizationJob = {
        id: crypto.randomUUID(),
        client_name: clientName,
        created_at: new Date().toISOString(),
        status: 'review',
        total_transactions: categorized.length,
        auto_categorized: categorized.filter((t) => t.status === 'approved').length,
        approved: categorized.filter((t) => t.status === 'approved').length,
        flagged: categorized.filter((t) => t.status === 'flagged').length,
        transactions: categorized,
        chart_of_accounts: chartOfAccounts,
      }

      dbSaveJob(job).catch(() => { /* memory + Supabase */ })
      logActivity({
        type: 'transactions_categorized',
        description: `${categorized.length} transactions categorized for ${clientName}`,
        clientName,
        jobId: job.id,
      })
      logActivity({
        type: 'close_started',
        description: `New close started for ${clientName}`,
        clientName,
        jobId: job.id,
      })
      notify('Categorization completed', {
        client: clientName,
        transactions: categorized.length,
        auto_approved: job.auto_categorized,
        flagged: job.flagged,
      })
      endSession(sessionId)
      router.push(`/dashboard/review/${job.id}`)
    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current)
      setError(err instanceof Error ? err.message : 'Categorization failed.')
      setState('error')
    }
  }

  const progressPct = batchTotal > 0
    ? Math.round(((phase === 'saving' ? batchTotal : batchCurrent) / batchTotal) * 100)
    : 0

  const phaseLabel =
    phase === 'sending'      ? 'Sending transactions to AI…' :
    phase === 'categorizing' ? `Categorizing batch ${batchCurrent} of ${batchTotal}…` :
                               'Saving results…'

  return (
    <StepCard title="Categorize with AI">
      <div className="space-y-4">
        {/* Summary */}
        <div
          className="rounded-xl border p-4 text-sm space-y-1"
          style={{ borderColor: '#e0dbd4', backgroundColor: '#f5f0ea' }}
        >
          <div className="flex justify-between">
            <span style={{ color: '#6b6560' }}>Client</span>
            <span className="font-medium" style={{ color: '#1a1714' }}>{clientName}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6b6560' }}>Transactions</span>
            <span className="font-mono font-medium" style={{ color: '#1a1714' }}>{transactions.length}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6b6560' }}>Chart of Accounts</span>
            <span className="font-mono font-medium" style={{ color: '#1a1714' }}>{chartOfAccounts.length} accounts</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6b6560' }}>AI batches</span>
            <span className="font-mono font-medium" style={{ color: '#1a1714' }}>{numBatches}</span>
          </div>
        </div>

        {/* Progress */}
        {state === 'loading' && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#f5f0ea' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 text-sm" style={{ color: '#2d5a27' }}>
              <Spinner />
              <span className="flex-1">{phaseLabel}</span>
              <span className="font-mono text-xs font-semibold" style={{ color: '#2d5a27' }}>
                {progressPct}%
              </span>
            </div>
            <div className="h-1.5" style={{ backgroundColor: '#e0dbd4' }}>
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%`, backgroundColor: '#2d5a27' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm space-y-1"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
          >
            <p className="font-semibold">
              {error.includes('free closes') ? '🔒 Free trial limit reached' : 'Categorization failed'}
            </p>
            {error.includes('free closes') ? (
              <div className="space-y-2">
                <p className="text-xs">You&apos;ve used all 5 free closes. Upgrade to continue with unlimited closes.</p>
                <a href="/pricing" className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#b8734a' }}>
                  View pricing plans →
                </a>
              </div>
            ) : (
              <>
                <p className="text-xs opacity-80">
                  {error.includes('API') || error.includes('key') || error.includes('auth')
                    ? 'The AI service is temporarily unavailable. Please try again in a moment.'
                    : error.includes('rate') || error.includes('429')
                    ? 'Too many requests. Wait a moment and try again.'
                    : error.includes('timeout') || error.includes('network') || error.includes('fetch')
                    ? 'Network error. Check your connection and try again.'
                    : error.length > 120
                    ? 'An unexpected error occurred with the AI service.'
                    : error}
                </p>
                <p className="text-xs" style={{ color: '#b91c1c' }}>
                  Click &ldquo;Try again&rdquo; below to retry.
                </p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onBack}
            disabled={state === 'loading'}
            className="px-4 py-2 rounded-xl text-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#faf8f4' }}
          >
            ← Back
          </button>
          <button
            onClick={handleCategorize}
            disabled={state === 'loading'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { if (state !== 'loading') e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {state === 'loading' ? (
              <><Spinner light /> Categorizing…</>
            ) : state === 'error' ? (
              '↺ Try again'
            ) : (
              '✦ Categorize with AI'
            )}
          </button>
        </div>
      </div>
    </StepCard>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UploadPage() {
  const [step, setStep] = useState(0)
  const [clientName, setClientName] = useState('')
  const [clientNameError, setClientNameError] = useState<string | null>(null)
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [trialStatus, setTrialStatus] = useState<ReturnType<typeof getTrialStatus> | null>(null)

  useEffect(() => {
    setTrialStatus(getTrialStatus())
  }, [])

  useEffect(() => {
    const prefill = consumeUploadPrefillClient()
    if (prefill) setClientName(prefill)
  }, [])

  function handleClientContinue() {
    if (!clientName.trim()) {
      setClientNameError('Please enter a client name.')
      return
    }
    setClientNameError(null)
    setStep(1)
  }

  // Trial exhausted gate
  if (trialStatus?.hasExhaustedTrial && step < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: '#f5f0ea' }}>
        <div className="max-w-md w-full text-center rounded-2xl border p-8" style={{ backgroundColor: '#fff', borderColor: '#e0dbd4' }}>
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1714' }}>Free trial complete</h2>
          <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
            You&apos;ve used all 5 free closes. Upgrade to continue — plans start at $99/month with unlimited closes.
          </p>
          <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>
            View pricing & upgrade →
          </a>
          <p className="mt-4 text-xs" style={{ color: '#a09a94' }}>
            Already upgraded? <a href="/dashboard" style={{ color: '#b8734a' }}>Go to dashboard</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f0ea' }}>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: '#1a1714', letterSpacing: '-0.02em' }}>
            New Close
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Upload a bank statement and categorize transactions with AI.
          </p>
          {trialStatus?.isOnFreeTier && !trialStatus.hasExhaustedTrial && (
            <p className="text-xs mt-1" style={{ color: '#b8734a' }}>
              {trialStatus.closesRemaining} free {trialStatus.closesRemaining === 1 ? 'close' : 'closes'} remaining
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        {/* Step 0 — Client name */}
        {step === 0 && (
          <StepCard title="Who is this close for?">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#1a1714' }}>
                  Client name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Acme Corp, Jane Smith LLC"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setClientNameError(null) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleClientContinue()}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
                  style={{ borderColor: clientNameError ? '#dc2626' : '#e0dbd4', backgroundColor: '#fff', color: '#1a1714' }}
                />
                {clientNameError && (
                  <p className="text-xs mt-1" style={{ color: '#991b1b' }}>{clientNameError}</p>
                )}
              </div>
              <button
                onClick={handleClientContinue}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                Continue →
              </button>
            </div>
          </StepCard>
        )}

        {/* Step 1 — Chart of Accounts */}
        {step === 1 && (
          <StepCard title="Chart of Accounts">
            <p className="text-sm mb-5" style={{ color: '#6b6560' }}>
              Select a template or upload your client&apos;s chart of accounts. This improves AI accuracy.
            </p>
            <ChartOfAccountsUpload
              onContinue={(accounts) => {
                setChartOfAccounts(accounts)
                setStep(2)
              }}
            />
            <button
              onClick={() => setStep(0)}
              className="mt-3 text-sm"
              style={{ color: '#a09a94' }}
            >
              ← Back
            </button>
          </StepCard>
        )}

        {/* Step 2 — Bank statement */}
        {step === 2 && (
          <StepCard title="Bank Statement">
            <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
              Upload a CSV or PDF export from your client&apos;s bank or accounting software.
            </p>
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-5 text-xs"
              style={{ backgroundColor: '#f0f4ff', color: '#3b5bdb' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span>PDF bank statements are supported — AI will extract transactions automatically. This may take 10–20 seconds.</span>
            </div>
            <FileUpload
              onContinue={(parsed) => {
                setTransactions(parsed)
                setStep(3)
              }}
            />
            <button
              onClick={() => setStep(1)}
              className="mt-3 text-sm"
              style={{ color: '#a09a94' }}
            >
              ← Back
            </button>
          </StepCard>
        )}

        {/* Step 3 — Categorize */}
        {step === 3 && (
          <CategorizeStep
            clientName={clientName}
            transactions={transactions}
            chartOfAccounts={chartOfAccounts}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner({ light }: { light?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7" cy="7" r="5.5" stroke={light ? 'rgba(255,255,255,0.3)'  : '#d4e8d0'} strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke={light ? '#fff' : '#2d5a27'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
