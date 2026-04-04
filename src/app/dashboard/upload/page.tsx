'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import FileUpload from '@/components/FileUpload'
import ChartOfAccountsUpload from '@/components/ChartOfAccountsUpload'
import { saveJob } from '@/lib/storage'
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
  const [state, setState] = useState<CategorizeState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')

  async function handleCategorize() {
    setState('loading')
    setError(null)

    try {
      setProgress('Sending to AI…')
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, chartOfAccounts, clientName }),
      })

      setProgress('Processing results…')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

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

      setProgress('Saving…')
      saveJob(job)
      router.push(`/dashboard/review/${job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Categorization failed.')
      setState('error')
    }
  }

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
        </div>

        {/* Cost estimate */}
        <p className="text-xs" style={{ color: '#a09a94' }}>
          Estimated cost: ~${(Math.ceil(transactions.length / 20) * 0.003).toFixed(3)} · {Math.ceil(transactions.length / 20)} API batch{Math.ceil(transactions.length / 20) !== 1 ? 'es' : ''}
        </p>

        {/* Loading state */}
        {state === 'loading' && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#f5f0ea', color: '#2d5a27' }}
          >
            <Spinner />
            <span>{progress}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#fee2e2', borderLeft: '3px solid #dc2626', color: '#991b1b' }}
          >
            {error}
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

  function handleClientContinue() {
    if (!clientName.trim()) {
      setClientNameError('Please enter a client name.')
      return
    }
    setClientNameError(null)
    setStep(1)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0ea' }}>
      <DashboardNav />

      <main className="max-w-2xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: '#1a1714', letterSpacing: '-0.02em' }}>
            New Close
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Upload a bank statement and categorize transactions with AI.
          </p>
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
            <p className="text-sm mb-5" style={{ color: '#6b6560' }}>
              Upload a CSV export from your client&apos;s bank or accounting software.
            </p>
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
