'use client'

import { useState } from 'react'
import { loadCopilotConfig, saveCopilotRun } from '@/lib/copilotStorage'
import { logAuditEvent } from '@/lib/auditTrail'
import type { CategorizationJob, Transaction, CopilotRun } from '@/types'

interface Props {
  job: CategorizationJob
  onTransactionsUpdated: (txs: Transaction[]) => void
  jobId: string
}

type Phase = 'idle' | 'running' | 'done' | 'error'

interface RunResult {
  autoApproved: number
  flagged: number
  leftPending: number
  totalProcessed: number
  briefing: string
}

export default function CopilotPanel({ job, onTransactionsUpdated, jobId }: Props) {
  const [phase, setPhase]     = useState<Phase>('idle')
  const [result, setResult]   = useState<RunResult | null>(null)
  const [errMsg, setErrMsg]   = useState<string | null>(null)
  const [step, setStep]       = useState(0)

  const pendingCount = job.transactions.filter((t) => t.status === 'pending').length

  const STEPS = [
    'Analyzing pending transactions…',
    'Applying confidence thresholds…',
    'Cross-checking anomalies…',
    'Generating your briefing…',
  ]

  async function handleRun() {
    setPhase('running')
    setResult(null)
    setErrMsg(null)
    setStep(0)

    // Simulate step progression while waiting
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, 900)

    try {
      const config = loadCopilotConfig()
      const res = await fetch('/api/copilot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, config }),
      })

      clearInterval(stepTimer)
      setStep(STEPS.length - 1)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Copilot run failed.')
      }

      const data = await res.json()

      // Update parent with new transaction states
      onTransactionsUpdated(data.updatedTransactions)

      // Log to audit trail
      logAuditEvent(jobId, {
        action:    'tx_bulk_approved',
        actor:     'Copilot',
        details:   {
          autoApproved:   data.autoApproved,
          flagged:        data.flagged,
          leftPending:    data.leftPending,
        },
      })

      // Persist run to localStorage
      const run: CopilotRun = {
        id:                  `cp-${Date.now()}`,
        jobId,
        clientName:          job.client_name,
        startedAt:           new Date(Date.now() - 4000).toISOString(),
        completedAt:         new Date().toISOString(),
        status:              'complete',
        autoApproved:        data.autoApproved,
        flagged:             data.flagged,
        leftPending:         data.leftPending,
        totalProcessed:      data.totalProcessed,
        briefing:            data.briefing,
        confidenceThreshold: config.confidenceThreshold,
        error:               null,
      }
      saveCopilotRun(run)

      setResult({
        autoApproved: data.autoApproved,
        flagged:      data.flagged,
        leftPending:  data.leftPending,
        totalProcessed: data.totalProcessed,
        briefing:     data.briefing,
      })
      setPhase('done')
    } catch (err) {
      clearInterval(stepTimer)
      setErrMsg(err instanceof Error ? err.message : 'Copilot failed.')
      setPhase('error')
    }
  }

  function handleReset() {
    setPhase('idle')
    setResult(null)
    setErrMsg(null)
    setStep(0)
  }

  // ─── Idle — show trigger button ───────────────────────────────────────────
  if (phase === 'idle') {
    if (pendingCount === 0) return null   // nothing to do
    return (
      <div
        className="rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: '#c0debb', backgroundColor: '#f6faf5' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#d4e8d0' }}
          >
            <CopilotIcon />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Close Copilot
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#4a7c43' }}>
              {pendingCount} pending — Copilot can auto-approve high-confidence transactions
            </p>
          </div>
        </div>
        <button
          onClick={handleRun}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <CopilotIcon white />
          Run Copilot
        </button>
      </div>
    )
  }

  // ─── Running ──────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <div
        className="rounded-xl border px-5 py-4 space-y-3"
        style={{ borderColor: '#c0debb', backgroundColor: '#f6faf5' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
            style={{ borderColor: '#2d5a27', borderTopColor: 'transparent' }}
          />
          <span className="text-sm font-semibold" style={{ color: '#2d5a27' }}>
            Copilot is running…
          </span>
        </div>
        <div className="space-y-1.5">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span style={{ color: i < step ? '#2d5a27' : i === step ? '#2d5a27' : '#c0debb', fontSize: 10 }}>
                {i < step ? '✓' : i === step ? '●' : '○'}
              </span>
              <span style={{ color: i <= step ? '#1a1714' : '#a09a94' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div
        className="rounded-xl border px-5 py-4 space-y-3"
        style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
      >
        <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>
          Copilot couldn't complete this run
        </p>
        <p className="text-xs" style={{ color: '#6b6560' }}>{errMsg}</p>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            className="text-xs px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: '#991b1b' }}
          >
            Try again
          </button>
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // ─── Done ─────────────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const nothingFlagged = result.flagged === 0 && result.leftPending === 0
    return (
      <div
        className="rounded-xl border px-5 py-4 space-y-3"
        style={{
          borderColor: nothingFlagged ? '#6ee7b7' : '#fed7aa',
          backgroundColor: nothingFlagged ? '#ecfdf5' : '#fffbf5',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: 18 }}>{nothingFlagged ? '✓' : '⚡'}</span>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Copilot complete
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs shrink-0"
            style={{ color: '#a09a94' }}
          >
            Dismiss
          </button>
        </div>

        {/* Briefing */}
        <p className="text-sm leading-relaxed" style={{ color: '#1a1714' }}>
          &ldquo;{result.briefing}&rdquo;
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-xs pt-1">
          <span style={{ color: '#059669' }}>
            <strong>{result.autoApproved}</strong> auto-approved
          </span>
          {result.flagged > 0 && (
            <span style={{ color: '#dc2626' }}>
              <strong>{result.flagged}</strong> flagged for review
            </span>
          )}
          {result.leftPending > 0 && (
            <span style={{ color: '#d97706' }}>
              <strong>{result.leftPending}</strong> still pending
            </span>
          )}
        </div>
      </div>
    )
  }

  return null
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function CopilotIcon({ white }: { white?: boolean }) {
  const color = white ? '#ffffff' : '#2d5a27'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5Z"
        stroke={color} strokeWidth="1.3"
      />
      <path
        d="M5.5 8.5l2 2 3-4"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="8" cy="4" r="0.8" fill={color} />
    </svg>
  )
}
