'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getJobs, saveJob } from '@/lib/storage'
import { dbSaveJob } from '@/lib/db'
import type { CategorizationJob } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = 'pending' | 'running' | 'complete' | 'error'

interface BulkJob {
  job: CategorizationJob
  status: JobStatus
  message: string
  autoCategorized?: number
  exceptions?: number
  elapsedSeconds?: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BulkClosePage() {
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const abortRef = useRef(false)

  useEffect(() => {
    const jobs = getJobs().filter(j => j.status !== 'completed' && j.transactions.length > 0)
    setBulkJobs(jobs.map(job => ({ job, status: 'pending', message: 'Waiting…' })))
    setMounted(true)
  }, [])

  async function runJob(idx: number) {
    if (abortRef.current) return false

    const item = bulkJobs[idx]
    setBulkJobs(prev => prev.map((b, i) => i === idx ? { ...b, status: 'running', message: 'Running autopilot…' } : b))

    try {
      const start = Date.now()
      const res = await fetch('/api/autopilot/start-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: item.job.client_name.toLowerCase().replace(/\s+/g, '-'),
          periodStart: item.job.created_at.slice(0, 10),
          periodEnd: new Date().toISOString().slice(0, 10),
          transactions: item.job.transactions,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const elapsed = Math.round((Date.now() - start) / 1000)

      // Update job status to completed
      const updatedJob: CategorizationJob = {
        ...item.job,
        status: 'completed',
        auto_categorized: data.stats?.autoCategorized ?? item.job.auto_categorized,
        approved: data.stats?.autoCategorized ?? item.job.approved,
      }
      saveJob(updatedJob)
      dbSaveJob(updatedJob).catch(() => { /* ignore */ })

      setBulkJobs(prev => prev.map((b, i) => i === idx ? {
        ...b,
        status: 'complete',
        message: `Complete in ${elapsed}s`,
        autoCategorized: data.stats?.autoCategorized ?? 0,
        exceptions: data.stats?.exceptionsCount ?? 0,
        elapsedSeconds: elapsed,
      } : b))

      return true
    } catch (err) {
      setBulkJobs(prev => prev.map((b, i) => i === idx ? {
        ...b,
        status: 'error',
        message: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      } : b))
      return false
    }
  }

  async function handleRunAll() {
    setRunning(true)
    setDone(false)
    abortRef.current = false

    for (let i = 0; i < bulkJobs.length; i++) {
      if (abortRef.current) break
      await runJob(i)
    }

    setRunning(false)
    setDone(true)
  }

  function handleStop() {
    abortRef.current = true
    setRunning(false)
  }

  if (!mounted) return <div style={{ padding: 32 }}><div style={{ height: 200, borderRadius: 12, backgroundColor: '#f0ebe3' }} className="cb-skeleton" /></div>

  const completedCount = bulkJobs.filter(j => j.status === 'complete').length
  const errorCount = bulkJobs.filter(j => j.status === 'error').length
  const pendingCount = bulkJobs.filter(j => j.status === 'pending').length
  const totalTx = bulkJobs.reduce((s, j) => s + j.job.total_transactions, 0)

  return (
    <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1a1714', margin: 0, marginBottom: 4 }}>
          Bulk Close
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          Run CloseBooks AI on all pending clients at once. Each close runs sequentially.
        </p>
      </div>

      {/* Stats */}
      {bulkJobs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Clients', value: bulkJobs.length, color: '#1a1714' },
            { label: 'Transactions', value: totalTx.toLocaleString(), color: '#1a1714' },
            { label: 'Complete', value: completedCount, color: '#2d5a27' },
            { label: 'Errors', value: errorCount, color: errorCount > 0 ? '#dc2626' : '#a09a94' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ fontSize: 11, color: '#6b6560', margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Job list */}
      {bulkJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>All caught up!</h3>
          <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 360, margin: '0 auto 24px' }}>
            No pending closes found. All your clients are either completed or you haven&apos;t uploaded any data yet.
          </p>
          <Link href="/dashboard/upload" style={{ display: 'inline-flex', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            + Start a new close
          </Link>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            {bulkJobs.map((item, i) => (
              <div key={item.job.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i > 0 ? '1px solid #f3f0eb' : 'none' }}>
                {/* Status icon */}
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: item.status === 'complete' ? '#dcfce7' : item.status === 'error' ? '#fef2f2' : item.status === 'running' ? '#fef9c3' : '#f3f4f6' }}>
                  {item.status === 'complete' && <span style={{ color: '#166534', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  {item.status === 'error' && <span style={{ color: '#dc2626', fontSize: 12 }}>✕</span>}
                  {item.status === 'running' && <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #b8734a', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />}
                  {item.status === 'pending' && <span style={{ color: '#9ca3af', fontSize: 11 }}>{i + 1}</span>}
                </div>

                {/* Client info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: 0 }}>{item.job.client_name}</p>
                  <p style={{ fontSize: 11, color: '#6b6560', margin: '2px 0 0' }}>
                    {item.job.total_transactions} transactions · {item.message}
                  </p>
                </div>

                {/* Results */}
                {item.status === 'complete' && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2d5a27', margin: 0 }}>{item.autoCategorized} categorized</p>
                    {(item.exceptions ?? 0) > 0 && <p style={{ fontSize: 11, color: '#b8734a', margin: '2px 0 0' }}>{item.exceptions} exceptions</p>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {!running && !done && (
              <button onClick={handleRunAll}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                ▶ Run Bulk Close ({pendingCount} pending)
              </button>
            )}
            {running && (
              <button onClick={handleStop}
                style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#dc2626', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                ⬛ Stop
              </button>
            )}
            {done && (
              <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#166534', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                  ✓ Done — {completedCount} closed, {errorCount} errors
                </div>
                <Link href="/dashboard" style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: '#1a1714', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  View Dashboard
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
