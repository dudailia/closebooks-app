'use client'

import { useState, useEffect } from 'react'
import type { CategorizationJob } from '@/types'
import type { AdvisoryMemo } from '@/types/advisory'
import type { AdvisoryTemplate } from '@/lib/advisoryEngine'
import AdvisoryMemoViewer from './AdvisoryMemoViewer'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tone = 'executive' | 'detailed' | 'conversational'

const FOCUS_AREAS = [
  'Cash Flow Analysis',
  'Expense Breakdown',
  'Anomaly Highlights',
  'Industry Benchmarks',
  '90-Day Forecast',
]

const TONE_OPTIONS: {
  id: Tone
  label: string
  desc: string
  icon: string
}[] = [
  {
    id: 'executive',
    label: 'Executive Brief',
    desc: 'Concise, data-first summary. No fluff — just the numbers that matter.',
    icon: '📋',
  },
  {
    id: 'detailed',
    label: 'Detailed Analysis',
    desc: 'Comprehensive breakdown with full context, methodology, and caveats.',
    icon: '📑',
  },
  {
    id: 'conversational',
    label: 'Conversational',
    desc: 'Warm and plain English — written for the business owner, not the accountant.',
    icon: '💬',
  },
]

const LOADING_STEPS = [
  'Analyzing transactions...',
  'Comparing to industry benchmarks...',
  'Writing recommendations...',
  'Finalizing memo...',
]

const TEMPLATE_OPTIONS: { id: AdvisoryTemplate; label: string; desc: string }[] = [
  {
    id: 'quarterly_review',
    label: 'Quarterly review',
    desc: 'Best for owner meetings, trend commentary, and performance summaries.',
  },
  {
    id: 'cash_flow_advisory',
    label: 'Cash flow advisory',
    desc: 'Best for runway, working capital, and near-term planning conversations.',
  },
  {
    id: 'tax_planning',
    label: 'Tax planning',
    desc: 'Best for estimated taxes, deductions, and profit-trajectory planning.',
  },
  {
    id: 'annual_planning',
    label: 'Annual planning',
    desc: 'Best for budgeting, hiring decisions, and next-year targets.',
  },
]

// ─── AdvisoryGenerateModal ────────────────────────────────────────────────────

interface AdvisoryGenerateModalProps {
  job: CategorizationJob
  previousJob?: CategorizationJob | null
  onGenerated: (memo: AdvisoryMemo) => void
  onClose: () => void
}

export default function AdvisoryGenerateModal({
  job,
  previousJob,
  onGenerated,
  onClose,
}: AdvisoryGenerateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [tone, setTone] = useState<Tone>('executive')
  const [template, setTemplate] = useState<AdvisoryTemplate>('quarterly_review')
  const [focusAreas, setFocusAreas] = useState<string[]>([...FOCUS_AREAS])
  const [loadingStep, setLoadingStep] = useState(0)
  const [memo, setMemo] = useState<AdvisoryMemo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Animate loading steps
  useEffect(() => {
    if (step !== 3) return
    setLoadingStep(0)

    let current = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    LOADING_STEPS.forEach((_, i) => {
      const t = setTimeout(
        () => {
          current = i
          setLoadingStep(i)
        },
        i * 800,
      )
      timers.push(t)
    })

    // Actual generation call
    const genTimer = setTimeout(async () => {
      try {
        setError(null)
        const res = await fetch('/api/advisory/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job,
            previousJobs: previousJob ? [previousJob] : [],
            tone,
            template,
            focusAreas,
          }),
        })

        if (!res.ok) throw new Error('Generation failed')

        const data = (await res.json()) as { memo: AdvisoryMemo }
        setMemo(data.memo)
        setStep(4)
      } catch (err) {
        setError('Something went wrong generating the memo.')
        setStep(3) // stay on step 3 so user sees error
      }
    }, LOADING_STEPS.length * 800 + 400)

    timers.push(genTimer)
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function toggleFocusArea(area: string) {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    )
  }

  function handleSave(status: AdvisoryMemo['status']) {
    if (!memo) return
    const final: AdvisoryMemo = {
      ...memo,
      status,
      ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
    }
    onGenerated(final)
  }

  async function handleUseFallback() {
    try {
      setError(null)
      // Call with empty ANTHROPIC_API_KEY env — server will use fallback
      const res = await fetch('/api/advisory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, tone, template, focusAreas }),
      })
      const data = (await res.json()) as { memo: AdvisoryMemo }
      setMemo(data.memo)
      setStep(4)
    } catch {
      setError('Fallback also failed. Please try again later.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e8e0d4',
          maxHeight: '90vh',
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
              }}
            >
              Generate Advisory Memo
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              {job.client_name} · {job.total_transactions} transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f0ea'
              e.currentTarget.style.color = '#1a1714'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6b6560'
            }}
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 px-6 pt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: step >= s ? '#2d5a27' : '#e8e0d4',
                    color: step >= s ? '#ffffff' : '#6b6560',
                  }}
                >
                  {s}
                </div>
                <span className="text-xs" style={{ color: step === s ? '#1a1714' : '#6b6560' }}>
                  {s === 1 ? 'Tone' : 'Focus Areas'}
                </span>
                {s < 2 && (
                  <div
                    className="w-8 h-px"
                    style={{ backgroundColor: step > s ? '#2d5a27' : '#e8e0d4' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1: Tone */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: '#1a1714' }}>
                  Choose the memo template:
                </p>
                <div className="grid gap-2">
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTemplate(opt.id)}
                      className="w-full text-left rounded-xl border p-3 transition-all"
                      style={{
                        borderColor: template === opt.id ? '#b8734a' : '#e8e0d4',
                        backgroundColor: template === opt.id ? '#fff5ed' : '#ffffff',
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                        {opt.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium mb-4" style={{ color: '#1a1714' }}>
                Choose the writing style for this memo:
              </p>
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTone(opt.id)}
                  className="w-full text-left rounded-xl border p-4 transition-all"
                  style={{
                    borderColor: tone === opt.id ? '#2d5a27' : '#e8e0d4',
                    backgroundColor: tone === opt.id ? '#f0f7ee' : '#ffffff',
                    outline: tone === opt.id ? '2px solid #2d5a27' : 'none',
                    outlineOffset: -1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1a1714' }}>
                        {opt.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                        {opt.desc}
                      </p>
                    </div>
                    {tone === opt.id && (
                      <div
                        className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#2d5a27' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Focus Areas */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-1" style={{ color: '#1a1714' }}>
                Select focus areas to include:
              </p>
              <p className="text-xs mb-4" style={{ color: '#6b6560' }}>
                All areas are pre-selected. Uncheck to exclude from the memo.
              </p>
              {FOCUS_AREAS.map((area) => {
                const checked = focusAreas.includes(area)
                return (
                  <label
                    key={area}
                    className="flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all"
                    style={{
                      borderColor: checked ? '#2d5a27' : '#e8e0d4',
                      backgroundColor: checked ? '#f0f7ee' : '#ffffff',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFocusArea(area)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center border shrink-0"
                      style={{
                        backgroundColor: checked ? '#2d5a27' : '#ffffff',
                        borderColor: checked ? '#2d5a27' : '#d1cbc4',
                      }}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm" style={{ color: '#1a1714' }}>
                      {area}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          {/* Step 3: Loading / Error */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              {error ? (
                <div className="text-center space-y-4">
                  <div className="text-4xl">⚠️</div>
                  <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                    {error}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setError(null)
                        setStep(3)
                        // re-trigger effect
                        setTimeout(() => setStep(3), 0)
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleUseFallback}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: '#b8734a' }}
                    >
                      Use Basic Template
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative w-12 h-12">
                    <div
                      className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                      style={{ borderColor: '#e8e0d4', borderTopColor: '#2d5a27' }}
                    />
                  </div>
                  <div className="space-y-2 text-center">
                    {LOADING_STEPS.map((s, i) => (
                      <p
                        key={i}
                        className="text-sm transition-all duration-300"
                        style={{
                          color: i <= loadingStep ? '#1a1714' : '#c4bdb8',
                          fontWeight: i === loadingStep ? 500 : 400,
                        }}
                      >
                        {i < loadingStep ? '✓ ' : i === loadingStep ? '→ ' : '  '}
                        {s}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && memo && (
            <AdvisoryMemoViewer memo={memo} compact={false} />
          )}
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4 border-t"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
        >
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={focusAreas.length === 0}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { if (focusAreas.length > 0) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Generate Memo →
              </button>
            </>
          )}

          {step === 3 && !error && (
            <p className="text-xs" style={{ color: '#a09a94' }}>
              This may take a few seconds…
            </p>
          )}

          {step === 4 && memo && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm border transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              >
                Discard
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave('draft')}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{ borderColor: '#2d5a27', color: '#2d5a27' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f7ee' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('sent')}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#b8734a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a5f3a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                >
                  Send Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
