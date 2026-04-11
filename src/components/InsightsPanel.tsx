'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCachedInsights, setCachedInsights, clearCachedInsights } from '@/lib/insightsCache'
import type { Insight } from '@/app/api/insights/route'
import type { Transaction, CategorizationJob } from '@/types'

// ---------------------------------------------------------------------------
// Insight card
// ---------------------------------------------------------------------------

const TYPE_CONFIG = {
  warning: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L13 12.5H1L7 1.5z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
        <path d="M7 5.5v3M7 10v.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    iconBg:    '#fef9c3',
    border:    '#fde68a',
    title:     '#854d0e',
    text:      '#92400e',
    tagBg:     '#fef3c7',
    tagText:   '#92400e',
    tagLabel:  'Warning',
  },
  opportunity: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="5.5" r="3.5" stroke="#059669" strokeWidth="1.3" />
        <path d="M5 9.5h4M6 11.5h2" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M7 3v1.5l1 1" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    iconBg:    '#ecfdf5',
    border:    '#a7f3d0',
    title:     '#065f46',
    text:      '#065f46',
    tagBg:     '#d1fae5',
    tagText:   '#065f46',
    tagLabel:  'Opportunity',
  },
  info: {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#3b82f6" strokeWidth="1.3" />
        <path d="M7 6v4M7 4.5v.5" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    iconBg:    '#eff6ff',
    border:    '#bfdbfe',
    title:     '#1e40af',
    text:      '#1d4ed8',
    tagBg:     '#dbeafe',
    tagText:   '#1e40af',
    tagLabel:  'Info',
  },
}

function InsightCard({ insight }: { insight: Insight }) {
  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info
  return (
    <div
      className="rounded-xl border p-4 flex gap-3"
      style={{ borderColor: cfg.border, backgroundColor: '#ffffff' }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: cfg.iconBg }}
      >
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold leading-snug" style={{ color: cfg.title }}>
            {insight.title}
          </p>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: cfg.tagBg, color: cfg.tagText }}
          >
            {cfg.tagLabel}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>
          {insight.insight}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function InsightSkeleton() {
  return (
    <div className="rounded-xl border p-4 flex gap-3 animate-pulse" style={{ borderColor: '#e8e0d4' }}>
      <div className="w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: '#f0ece4' }} />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3.5 w-2/5 rounded" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-3 w-full rounded" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#f0ece4' }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel — single job (review page)
// ---------------------------------------------------------------------------

interface SingleJobProps {
  job: CategorizationJob
  /** Auto-generate on mount if no cache */
  autoGenerate?: boolean
}

export function JobInsightsPanel({ job, autoGenerate = true }: SingleJobProps) {
  const cacheKey = `job-${job.id}`
  const [open,     setOpen]     = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'monthly',
          clientName: job.client_name,
          transactions: job.transactions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      const list: Insight[] = data.insights ?? []
      setInsights(list)
      setCachedInsights(cacheKey, list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights.')
    } finally {
      setLoading(false)
    }
  }, [job, cacheKey])

  useEffect(() => {
    const cached = getCachedInsights(cacheKey)
    if (cached) {
      setInsights(cached)
      return
    }
    if (autoGenerate && job.transactions.length > 0) {
      generate()
    }
  }, [cacheKey, autoGenerate, job.transactions.length, generate])

  const hasInsights = insights && insights.length > 0

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left"
        style={{ backgroundColor: open ? '#fdf6f0' : '#ffffff' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf6f0' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = open ? '#fdf6f0' : '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <SparklesIcon />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              AI Insights
            </span>
            {loading && (
              <span className="text-xs" style={{ color: '#6b6560' }}>
                Analyzing…
              </span>
            )}
            {hasInsights && !loading && (
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}
              >
                {insights.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Regenerate button */}
          {hasInsights && !loading && (
            <button
              onClick={(e) => { e.stopPropagation(); clearCachedInsights(cacheKey); generate() }}
              className="text-xs px-2 py-1 rounded-lg border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#a09a94' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.color = '#b8734a' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.color = '#a09a94' }}
              title="Regenerate insights"
            >
              ↺ Refresh
            </button>
          )}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path d="M3 5l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: '#f0ebe3' }}>
          {loading && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: '#b8734a', borderTopColor: 'transparent' }}
                />
                <p className="text-xs" style={{ color: '#6b6560' }}>
                  CloseBooks AI is analyzing {job.transactions.length} transactions for {job.client_name}…
                </p>
              </div>
              {[0, 1, 2].map((i) => <InsightSkeleton key={i} />)}
            </>
          )}

          {error && !loading && (
            <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <span style={{ color: '#dc2626' }}>⚠</span>
              <div>
                <p className="text-xs font-medium" style={{ color: '#991b1b' }}>Could not generate insights</p>
                <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{error}</p>
                <button
                  onClick={generate}
                  className="text-xs mt-1.5 underline underline-offset-2"
                  style={{ color: '#991b1b' }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !hasInsights && (
            <div className="py-4 text-center">
              <p className="text-xs mb-3" style={{ color: '#a09a94' }}>
                AI insights haven&apos;t been generated yet for this close.
              </p>
              <button
                onClick={generate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                <SparklesIcon />
                Generate Insights
              </button>
            </div>
          )}

          {hasInsights && !loading && (
            <>
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              <p className="text-xs pt-1" style={{ color: '#c4bdb8' }}>
                Generated by CloseBooks AI · For reference only, not financial advice
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel — multi-month trends (client detail page)
// ---------------------------------------------------------------------------

interface TrendsProps {
  clientName: string
  jobs: CategorizationJob[]
}

function buildMonthSummary(jobs: CategorizationJob[]) {
  return jobs.map((job) => {
    const txs = job.transactions
    const totalDebits  = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
    const totalCredits = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    const categories: Record<string, number> = {}
    for (const tx of txs) {
      const cat = tx.final_category || tx.suggested_category || 'Uncategorized'
      categories[cat] = (categories[cat] ?? 0) + tx.amount
    }
    return {
      label: new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalDebits,
      totalCredits,
      categories,
      txCount: txs.length,
    }
  })
}

export function ClientInsightsPanel({ clientName, jobs }: TrendsProps) {
  const cacheKey = `client-${clientName.toLowerCase().replace(/\s+/g, '-')}`
  const [open,     setOpen]     = useState(false)   // collapsed by default on client page
  const [loading,  setLoading]  = useState(false)
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (jobs.length === 0) return
    setLoading(true)
    setError(null)
    setOpen(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'trends',
          clientName,
          months: buildMonthSummary(jobs),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)
      const list: Insight[] = data.insights ?? []
      setInsights(list)
      setCachedInsights(cacheKey, list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights.')
    } finally {
      setLoading(false)
    }
  }, [clientName, jobs, cacheKey])

  useEffect(() => {
    const cached = getCachedInsights(cacheKey)
    if (cached) { setInsights(cached); return }
  }, [cacheKey])

  if (jobs.length === 0) return null

  const hasInsights = insights && insights.length > 0

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <button
        onClick={() => {
          if (!open && !hasInsights && !loading) { generate(); return }
          setOpen((v) => !v)
        }}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left"
        style={{ backgroundColor: open ? '#fdf6f0' : '#ffffff' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf6f0' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = open ? '#fdf6f0' : '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <SparklesIcon />
          <div>
            <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              AI Trends &amp; Insights
            </span>
            <span className="ml-2 text-xs" style={{ color: '#a09a94' }}>
              {jobs.length} month{jobs.length !== 1 ? 's' : ''} of data
            </span>
            {!hasInsights && !loading && (
              <span className="ml-2 text-xs font-medium" style={{ color: '#b8734a' }}>
                · click to generate
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasInsights && !loading && (
            <>
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}
              >
                {insights.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); clearCachedInsights(cacheKey); generate() }}
                className="text-xs px-2 py-1 rounded-lg border transition-colors"
                style={{ borderColor: '#e0dbd4', color: '#a09a94' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.color = '#b8734a' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.color = '#a09a94' }}
              >
                ↺
              </button>
            </>
          )}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path d="M3 5l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: '#f0ebe3' }}>
          {loading && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: '#b8734a', borderTopColor: 'transparent' }}
                />
                <p className="text-xs" style={{ color: '#6b6560' }}>
                  Analyzing {jobs.length} months of data for {clientName}…
                </p>
              </div>
              {[0, 1, 2].map((i) => <InsightSkeleton key={i} />)}
            </>
          )}

          {error && !loading && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-xs font-medium" style={{ color: '#991b1b' }}>{error}</p>
              <button onClick={generate} className="text-xs mt-1 underline" style={{ color: '#991b1b' }}>
                Try again
              </button>
            </div>
          )}

          {hasInsights && !loading && (
            <>
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              <p className="text-xs pt-1" style={{ color: '#c4bdb8' }}>
                Cross-month analysis by CloseBooks AI · Not financial advice
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared icon
// ---------------------------------------------------------------------------

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M7 1l1.5 3.5L12 6l-3.5 1.5L7 11l-1.5-3.5L2 6l3.5-1.5L7 1z" stroke="#b8734a" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      <path d="M11.5 1.5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" stroke="#b8734a" strokeWidth="1" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// Re-export Insight type for convenience
export type { Insight }
export type { Transaction }
