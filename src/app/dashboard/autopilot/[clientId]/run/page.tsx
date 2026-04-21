'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getJobs } from '@/lib/storage'
import { useParams, useRouter } from 'next/navigation'
import PipelineViz from '@/components/autopilot/PipelineViz'
import CloseReport from '@/components/autopilot/CloseReport'
import type { StageResult, StageId, PipelineResult } from '@/lib/autopilot/pipelineTypes'
import { STAGE_ORDER, STAGE_LABELS } from '@/lib/autopilot/pipelineTypes'
import type { CloseResult } from '@/components/autopilot/CloseTerminal'
import type { Transaction, CategorizationJob } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJobForClient(clientId: string): CategorizationJob | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const jobs = getJobs() as CategorizationJob[]
    return jobs.find(j => {
      const name = j.client_name ?? ''
      return (
        name === clientId ||
        name.toLowerCase().replace(/\s+/g, '-') === clientId
      )
    })
  } catch {
    return undefined
  }
}

function buildDemoTransactions(): Transaction[] {
  const vendors = ['Amazon Web Services', 'Google Ads', 'Stripe Payment', 'Slack Technologies', 'WeWork Monthly', 'Gusto Payroll', 'Delta Airlines', 'Office Depot', 'Zoom Video', 'Salesforce CRM', 'Adobe Creative', 'Shopify', 'Ramp Corporate', 'Brex Card', 'Mercury Bank']
  const categories = ['Software & Subscriptions', 'Marketing & Advertising', 'Payroll', 'Rent', 'Travel', 'Office Supplies', 'Professional Services', 'Revenue', 'Cost of Goods Sold']

  return Array.from({ length: 120 }, (_, i) => ({
    id: `tx_demo_${i}`,
    date: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().slice(0, 10),
    description: vendors[i % vendors.length],
    amount: parseFloat((Math.random() * 2000 + 10).toFixed(2)),
    type: i % 7 === 0 ? 'credit' : 'debit',
    original_description: vendors[i % vendors.length],
    suggested_category: categories[i % categories.length],
    suggested_account_code: String(1000 + (i % 15) * 100),
    confidence: 0.65 + Math.random() * 0.34,
    status: 'pending' as const,
  }))
}

function buildInitialStages(): StageResult[] {
  return STAGE_ORDER.map(id => ({
    id,
    label: STAGE_LABELS[id],
    status: 'pending' as const,
    durationMs: 0,
    summary: '',
    outputCount: 0,
    exceptionCount: 0,
    logs: [],
  }))
}

function getPeriodLabel(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Convert PipelineResult to CloseResult for the CloseReport component
function toCloseResult(pipeline: PipelineResult): CloseResult {
  return {
    exceptions: pipeline.exceptions.map(e => ({
      id: e.id,
      transactionId: e.transactionId,
      type: e.type as 'uncategorized' | 'duplicate' | 'anomaly' | 'missing_receipt',
      description: e.description,
      amount: e.amount,
      aiSuggestion: e.aiSuggestion,
      confidence: e.confidence,
    })),
    journalEntries: pipeline.journalEntries,
    pnl: pipeline.pnl,
    stats: {
      totalTransactions: pipeline.stats.totalTransactions,
      autoCategorized: pipeline.stats.autoCategorized,
      pctCategorized: pipeline.stats.pctCategorized,
      journalEntriesCount: pipeline.stats.journalEntriesCount,
      exceptionsCount: pipeline.stats.exceptionsCount,
      elapsedSeconds: Math.round(pipeline.stats.elapsedMs / 1000),
    },
  }
}

// ─── Terminal Log ─────────────────────────────────────────────────────────────

interface LogLine {
  text: string
  type: 'info' | 'success' | 'warning' | 'error' | 'stage'
}

function LogTerminal({ lines, running }: { lines: LogLine[]; running: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  function lineColor(type: LogLine['type']): string {
    switch (type) {
      case 'success': return '#4ade80'
      case 'warning': return '#fbbf24'
      case 'error':   return '#ef4444'
      case 'stage':   return '#60a5fa'
      default:        return '#e8e0d4'
    }
  }

  return (
    <div style={{
      backgroundColor: '#0f0e0d',
      borderRadius: '12px',
      overflow: 'hidden',
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: '#0a0908',
      }}>
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
          {running && (
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              backgroundColor: '#4ade80', opacity: 0.4,
              animation: 'terminal-pulse 1.4s ease-out infinite',
            }} />
          )}
          <span style={{
            position: 'relative', width: 8, height: 8, borderRadius: '50%',
            backgroundColor: running ? '#4ade80' : '#60a5fa', display: 'inline-block',
          }} />
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: running ? '#4ade80' : '#60a5fa' }}>
          {running ? '● RUNNING' : '● COMPLETE'}
        </span>
      </div>

      {/* Log stream */}
      <div ref={scrollRef} style={{ height: 200, overflowY: 'auto', padding: '12px 16px', scrollbarWidth: 'thin' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: '11px', lineHeight: '1.7', color: lineColor(line.type) }}>
            {line.text}
          </div>
        ))}
        {running && (
          <div style={{
            display: 'inline-block', width: 7, height: 13,
            backgroundColor: '#4ade80', marginTop: 2,
            animation: 'cursor-blink 1s step-end infinite', verticalAlign: 'text-bottom',
          }} />
        )}
      </div>

      <style>{`
        @keyframes terminal-pulse { 0% { transform:scale(1); opacity:0.4; } 70% { transform:scale(2.8); opacity:0; } 100% { transform:scale(2.8); opacity:0; } }
        @keyframes cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
      `}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase = 'running' | 'complete'

export default function RunClosePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : (params.clientId ?? '')

  const [phase, setPhase] = useState<Phase>('running')
  const [stages, setStages] = useState<StageResult[]>(buildInitialStages())
  const [logLines, setLogLines] = useState<LogLine[]>([])
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null)
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const period = getPeriodLabel()
  const startTimeRef = useRef(Date.now())
  const hasStarted = useRef(false)

  const addLog = useCallback((text: string, type: LogLine['type'] = 'info') => {
    setLogLines(prev => [...prev, { text, type }])
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
    return () => clearInterval(id)
  }, [phase])

  // Animate stages from a completed pipeline result
  const animateStages = useCallback((result: PipelineResult) => {
    const realStages = result.stages
    let delay = 0

    realStages.forEach((stage, i) => {
      // Mark as running
      setTimeout(() => {
        setStages(prev => prev.map((s, si) => si === i ? { ...s, status: 'running' } : s))
        addLog(`[◉] ${stage.label}…`, 'stage')
      }, delay)

      // Emit logs
      stage.logs.forEach((log, li) => {
        setTimeout(() => addLog(`  ${log}`, log.startsWith('✓') ? 'success' : log.startsWith('⚠') ? 'warning' : log.startsWith('✗') ? 'error' : 'info'), delay + 80 * (li + 1))
      })

      delay += Math.max(stage.durationMs, 400) + stage.logs.length * 80

      // Mark as complete
      setTimeout(() => {
        setStages(prev => prev.map((s, si) => si === i ? { ...stage } : s))
      }, delay)

      delay += 200
    })

    // Finish
    setTimeout(() => {
      setPhase('complete')
      addLog('✓ Pipeline complete', 'success')
    }, delay)
  }, [addLog])

  // Start the pipeline on mount
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    async function runPipeline() {
      setClientName(decodeURIComponent(clientId).replace(/-/g, ' '))
      addLog('[◉] Initializing close pipeline…', 'info')

      const job = getJobForClient(clientId)
      const transactions: Transaction[] = job?.transactions ?? buildDemoTransactions()

      if (!job) {
        addLog('  No saved data found — using demo transactions', 'warning')
      } else {
        addLog(`  Loaded ${transactions.length} transactions from saved job`, 'success')
      }

      try {
        addLog('[◉] Calling pipeline API…', 'info')
        const res = await fetch('/api/autopilot/pipeline/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            period,
            transactions,
            config: { autoApproveThreshold: 0.90 },
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }

        const result: PipelineResult = await res.json()
        setPipelineResult(result)
        animateStages(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pipeline failed'
        setError(msg)
        addLog(`✗ Error: ${msg}`, 'error')
      }
    }

    runPipeline()
  }, [clientId, period, addLog, animateStages])

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0')
  const ss = String(elapsedSec % 60).padStart(2, '0')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 w-full max-w-6xl mx-auto px-5 py-8">

        {/* Back nav */}
        <button
          onClick={() => router.push(`/dashboard/autopilot/${clientId}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '13px', color: '#6b6560', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}
        >
          ← Back to {clientName || 'Client'}
        </button>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '26px', color: '#1a1714', letterSpacing: '-0.02em', margin: '0 0 4px 0',
            }}>
              {phase === 'complete' ? 'Close Report' : 'Running Month-End Close'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>
              {clientName} · {period}
            </p>
          </div>
          {phase === 'running' && (
            <div style={{
              fontSize: '13px', fontFamily: '"JetBrains Mono", monospace',
              color: '#6b6560', letterSpacing: '0.05em',
            }}>
              {mm}:{ss}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px',
          }}>
            <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>
              <strong>Pipeline error:</strong> {error}
            </p>
          </div>
        )}

        {/* Pipeline visualization - always shown */}
        <div style={{ marginBottom: 20 }}>
          <PipelineViz stages={stages} />
        </div>

        {/* Running: show terminal log */}
        {phase === 'running' && (
          <LogTerminal lines={logLines} running={true} />
        )}

        {/* Complete: show close report */}
        {phase === 'complete' && pipelineResult && (
          <>
            {/* Time saved banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              backgroundColor: '#e8f0e6',
              borderRadius: '10px',
              marginBottom: 20,
            }}>
              <span style={{ fontSize: '20px' }}>⏱</span>
              <p style={{ fontSize: '13px', color: '#2d5a27', margin: 0, fontWeight: 600 }}>
                Estimated {pipelineResult.stats.timeSavedMinutes} minutes saved on this close
                <span style={{ fontWeight: 400, color: '#4a7a44', marginLeft: 8 }}>
                  · Run completed in {(pipelineResult.stats.elapsedMs / 1000).toFixed(1)}s
                </span>
              </p>
            </div>

            <CloseReport
              result={toCloseResult(pipelineResult)}
              clientName={clientName || decodeURIComponent(clientId)}
              period={period}
            />
          </>
        )}

        {/* Complete but error fallback */}
        {phase === 'complete' && !pipelineResult && (
          <LogTerminal lines={logLines} running={false} />
        )}

      </main>
    </div>
  )
}
