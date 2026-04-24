'use client'
import { useEffect, useRef, useState } from 'react'
import type { CategorizationJob, Transaction } from '@/types'

interface Stage {
  id: string
  label: string
  status: 'pending' | 'running' | 'complete'
  tokens: number
  costUsd: number
  durationMs?: number
}

const INITIAL: Stage[] = [
  { id: 'collect',    label: 'Collect data',        status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'categorize', label: 'AI categorization',   status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'reconcile',  label: 'Bank reconciliation', status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'journal',    label: 'Journal entries',     status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'anomalies',  label: 'Anomaly scan',        status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'trial',      label: 'Trial balance',       status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'narrative',  label: 'Narrative summary',   status: 'pending', tokens: 0, costUsd: 0 },
  { id: 'review',     label: 'Human review queue',  status: 'pending', tokens: 0, costUsd: 0 },
]

interface Props {
  open: boolean
  job: CategorizationJob | null
  onClose: () => void
  onApply?: (finalTxs: Transaction[]) => void
}

export default function AutoCloseModal({ open, job, onClose, onApply }: Props) {
  const [stages, setStages] = useState<Stage[]>(INITIAL)
  const [reasoning, setReasoning] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalTxs, setFinalTxs] = useState<Transaction[] | null>(null)
  const reasoningRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!open || !job || startedRef.current) return
    startedRef.current = true
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job])

  useEffect(() => {
    if (!open) {
      startedRef.current = false
      setStages(INITIAL)
      setReasoning('')
      setRunning(false)
      setDone(false)
      setTotalCost(0)
      setTotalTokens(0)
      setElapsedMs(0)
      setFinalTxs(null)
    }
  }, [open])

  useEffect(() => {
    if (reasoningRef.current) reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight
  }, [reasoning])

  async function run() {
    if (!job) return
    setRunning(true)
    try {
      const res = await fetch('/api/ai/agent/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done: rdone, value } = await reader.read()
        if (rdone) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'stage_start') {
            setStages((prev) =>
              prev.map((s) => (s.id === event.id ? { ...s, status: 'running' } : s))
            )
            setReasoning((prev) => prev + `\n\n— ${event.label} —\n`)
          } else if (event.type === 'reasoning') {
            setReasoning((prev) => prev + event.text)
          } else if (event.type === 'action') {
            setReasoning((prev) => prev + `\n  ✓ ${event.action}\n`)
          } else if (event.type === 'stage_metric') {
            setStages((prev) =>
              prev.map((s) => (s.id === event.id ? { ...s, tokens: event.tokens, costUsd: event.costUsd } : s))
            )
          } else if (event.type === 'stage_complete') {
            setStages((prev) =>
              prev.map((s) =>
                s.id === event.id ? { ...s, status: 'complete', durationMs: event.durationMs } : s
              )
            )
          } else if (event.type === 'done') {
            setTotalCost(event.costUsd)
            setTotalTokens(event.tokens.input + event.tokens.output)
            setElapsedMs(event.elapsedMs)
            setFinalTxs(event.finalTxs)
            setDone(true)
          } else if (event.type === 'error') {
            setReasoning((prev) => prev + `\n  ✗ Error: ${event.message}`)
          }
        }
      }
    } finally {
      setRunning(false)
    }
  }

  if (!open || !job) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 960,
          maxWidth: '95vw',
          height: '85vh',
          backgroundColor: 'var(--text-primary)',
          color: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>✦ Autonomous Close Agent</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {job.client_name} · {job.transactions.length} transactions
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 13,
              padding: '5px 12px',
              borderRadius: 6,
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? 'Running…' : 'Close'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            style={{
              width: 280,
              padding: 16,
              borderRight: '1px solid rgba(255,255,255,0.12)',
              overflowY: 'auto',
            }}
          >
            {stages.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    marginTop: 4,
                    flexShrink: 0,
                    backgroundColor:
                      s.status === 'complete' ? '#10b981' : s.status === 'running' ? '#f59e0b' : '#4b5563',
                    boxShadow:
                      s.status === 'running' ? '0 0 0 4px rgba(245,158,11,0.25)' : undefined,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>{s.label}</p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {s.tokens > 0
                      ? `${s.tokens.toLocaleString()} tok · $${s.costUsd.toFixed(3)}`
                      : s.status === 'running'
                      ? '…'
                      : 'pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div
            ref={reasoningRef}
            style={{
              flex: 1,
              padding: 18,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.85)',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {reasoning || 'Starting…'}
          </div>
        </div>

        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
            {totalTokens.toLocaleString()} tokens · ${totalCost.toFixed(3)} · {(elapsedMs / 1000).toFixed(1)}s
          </span>
          {done && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  if (finalTxs) onApply?.(finalTxs)
                  onClose()
                }}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply to job
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
