'use client'

import { useState } from 'react'
import type { AdvisoryMemo, AdvisorySection } from '@/types/advisory'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<AdvisorySection['type'], string> = {
  headline: '📰',
  cashflow: '💰',
  expense: '📊',
  anomaly: '⚠️',
  benchmark: '📈',
  recommendation: '💡',
  forecast: '🔮',
}

const URGENCY_BORDER: Record<AdvisorySection['urgency'], string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#3b82f6',
}

const URGENCY_BG: Record<AdvisorySection['urgency'], string> = {
  high: '#fef2f2',
  medium: '#fffbeb',
  low: '#eff6ff',
}

const URGENCY_LABEL: Record<AdvisorySection['urgency'], string> = {
  high: 'High Priority',
  medium: 'Medium',
  low: 'Low',
}

const TONE_LABELS: Record<AdvisoryMemo['tone'], string> = {
  executive: 'Executive Brief',
  detailed: 'Detailed Analysis',
  conversational: 'Conversational',
}

const STATUS_STYLES: Record<AdvisoryMemo['status'], { bg: string; color: string; label: string }> = {
  draft: { bg: '#fef3c7', color: '#92400e', label: 'Draft' },
  sent: { bg: '#dcfce7', color: '#166534', label: 'Sent' },
  archived: { bg: '#f3f4f6', color: '#6b7280', label: 'Archived' },
}

// ─── PencilIcon ───────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M9 2l2 2-7 7H2v-2L9 2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  onEdit,
}: {
  section: AdvisorySection
  index: number
  onEdit?: (section: AdvisorySection, index: number, newBody: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(section.body)

  function handleBlur() {
    setEditing(false)
    if (draft !== section.body && onEdit) {
      onEdit(section, index, draft)
    }
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e8e0d4',
        borderLeftWidth: 4,
        borderLeftColor: URGENCY_BORDER[section.urgency],
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{TYPE_ICONS[section.type]}</span>
            <h3 className="font-semibold text-sm" style={{ color: '#1a1714' }}>
              {section.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: URGENCY_BG[section.urgency],
                color: URGENCY_BORDER[section.urgency],
              }}
            >
              {URGENCY_LABEL[section.urgency]}
            </span>
            {onEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors"
                style={{ color: '#6b6560', borderColor: '#e8e0d4' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf8f4'
                  e.currentTarget.style.color = '#1a1714'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b6560'
                }}
              >
                <PencilIcon />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {editing ? (
          <textarea
            className="w-full text-sm rounded-lg border p-2 resize-none focus:outline-none focus:ring-1"
            style={{
              color: '#1a1714',
              borderColor: '#b8734a',
              backgroundColor: '#faf8f4',
              minHeight: 80,
            }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: '#3d3835' }}>
            {section.body}
          </p>
        )}

        {/* Data points */}
        {section.dataPoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {section.dataPoints.map((dp, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full border font-mono"
                style={{
                  backgroundColor: '#faf8f4',
                  borderColor: '#e8e0d4',
                  color: '#6b6560',
                }}
              >
                {dp}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AdvisoryMemoViewer ───────────────────────────────────────────────────────

interface AdvisoryMemoViewerProps {
  memo: AdvisoryMemo
  onEdit?: (section: AdvisorySection, index: number, newBody: string) => void
  compact?: boolean
  onReadMore?: () => void
}

export default function AdvisoryMemoViewer({
  memo,
  onEdit,
  compact = false,
  onReadMore,
}: AdvisoryMemoViewerProps) {
  const statusStyle = STATUS_STYLES[memo.status]
  const dateStr = new Date(memo.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (compact) {
    // Compact mode: headline + first non-headline section body + "Read more"
    const summarySection = memo.sections.find((s) => s.type !== 'headline')
    const previewText = summarySection?.body ?? ''
    const twoSentences = previewText.split('. ').slice(0, 2).join('. ') + (previewText.split('. ').length > 2 ? '...' : '')

    return (
      <div className="p-4 rounded-xl border" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
        <p
          className="text-base italic mb-2 leading-snug"
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            color: '#1a1714',
          }}
        >
          {memo.headline}
        </p>
        {twoSentences && (
          <p className="text-sm mb-3" style={{ color: '#6b6560' }}>
            {twoSentences}
          </p>
        )}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: '#b8734a' }}
          >
            Read more →
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2
              className="text-xl"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
              }}
            >
              {memo.clientName}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>
              Generated {dateStr}
              {memo.clientIndustry ? ` · ${memo.clientIndustry}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium border"
              style={{ borderColor: '#e8e0d4', color: '#6b6560', backgroundColor: '#faf8f4' }}
            >
              {TONE_LABELS[memo.tone]}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          className="mt-2 pt-4 border-t"
          style={{ borderColor: '#e8e0d4' }}
        >
          <p
            className="text-lg italic leading-snug"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            {memo.headline}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {memo.sections.map((section, i) => (
          <SectionCard
            key={i}
            section={section}
            index={i}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        className="text-xs text-center py-3 border-t"
        style={{ color: '#a09a94', borderColor: '#e8e0d4' }}
      >
        Advisory memo generated by CloseBooks AI · {dateStr}
        {memo.sentAt && ` · Sent ${new Date(memo.sentAt).toLocaleDateString()}`}
      </div>
    </div>
  )
}
