'use client'

import { useState } from 'react'

interface Props {
  lineNumber: string
  lineDescription: string
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
  lawReference?: string
  opportunity?: string
  opportunityValue?: number
  onMarkReviewed: () => void
  onOverride: (newValue: number, note: string) => void
}

const CONFIDENCE_CONFIG = {
  high: { color: '#2d5a27', bg: '#f0fdf4', dot: '#22c55e', label: 'High confidence' },
  medium: { color: '#92400e', bg: '#fffbeb', dot: '#f59e0b', label: 'Medium confidence' },
  low: { color: '#991b1b', bg: '#fef2f2', dot: '#ef4444', label: 'Low confidence — review required' },
}

export default function AnnotationPopover({
  lineNumber,
  lineDescription,
  reasoning,
  confidence,
  lawReference,
  opportunity,
  opportunityValue,
  onMarkReviewed,
  onOverride,
}: Props) {
  const [overrideMode, setOverrideMode] = useState(false)
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideNote, setOverrideNote] = useState('')
  const [reviewed, setReviewed] = useState(false)

  const conf = CONFIDENCE_CONFIG[confidence]

  function handleMarkReviewed() {
    setReviewed(true)
    onMarkReviewed()
  }

  function handleOverrideSubmit() {
    const val = parseFloat(overrideValue.replace(/[,$]/g, ''))
    if (isNaN(val)) return
    onOverride(val, overrideNote)
    setOverrideMode(false)
    setOverrideValue('')
    setOverrideNote('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b6560' }}>
          Why CloseBooks chose this
        </p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#1a1714' }}>
          Line {lineNumber} — {lineDescription}
        </p>
      </div>

      {/* Reasoning */}
      <div
        className="rounded-lg p-3 text-sm leading-relaxed"
        style={{ backgroundColor: '#faf8f4', color: '#1a1714', border: '1px solid #e8e0d4' }}
      >
        {reasoning}
      </div>

      {/* Metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Confidence indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: conf.bg, color: conf.color }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: conf.dot,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {conf.label}
        </div>

        {/* Law reference */}
        {lawReference && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#b8734a' }}
          >
            {lawReference}
          </span>
        )}
      </div>

      {/* Opportunity callout */}
      {opportunity && (
        <div
          className="rounded-lg p-3"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
          }}
        >
          <div className="flex items-start gap-2">
            <span style={{ fontSize: 16, lineHeight: 1.2 }}>★</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#92400e' }}>
                Opportunity
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#1a1714' }}>
                {opportunity}
              </p>
              {opportunityValue !== undefined && opportunityValue > 0 && (
                <p className="text-sm font-bold mt-1" style={{ color: '#2d5a27' }}>
                  Est. savings: ${opportunityValue.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Override form */}
      {overrideMode && (
        <div
          className="rounded-lg p-3"
          style={{ border: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#1a1714' }}>Override Value</p>
          <input
            type="text"
            value={overrideValue}
            onChange={(e) => setOverrideValue(e.target.value)}
            placeholder="New amount (e.g. 125000)"
            className="w-full text-sm px-3 py-2 rounded border mb-2"
            style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
          />
          <textarea
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            placeholder="Reason for override..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded border mb-2 resize-none"
            style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleOverrideSubmit}
              className="flex-1 py-1.5 rounded text-sm font-medium text-white"
              style={{ backgroundColor: '#b8734a' }}
            >
              Apply Override
            </button>
            <button
              onClick={() => setOverrideMode(false)}
              className="flex-1 py-1.5 rounded text-sm"
              style={{ color: '#6b6560', border: '1px solid #e8e0d4' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {!overrideMode && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleMarkReviewed}
            disabled={reviewed}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
            style={{
              backgroundColor: reviewed ? '#86efac' : '#2d5a27',
              opacity: reviewed ? 0.8 : 1,
            }}
          >
            {reviewed ? 'Reviewed ✓' : 'Mark Reviewed'}
          </button>
          <button
            onClick={() => setOverrideMode(true)}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#6b6560', border: '1px solid #e8e0d4', backgroundColor: 'transparent' }}
          >
            Override Value
          </button>
        </div>
      )}
    </div>
  )
}
