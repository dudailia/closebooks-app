'use client'

import { useState } from 'react'

export type ExceptionType = 'uncategorized' | 'duplicate' | 'anomaly' | 'missing_receipt'

interface ExceptionCardProps {
  id: string
  description: string
  amount: number
  type: ExceptionType
  aiSuggestion: string
  confidence: number
  onAccept: () => void
  onReview: () => void
}

const TYPE_CONFIG: Record<ExceptionType, { label: string; borderColor: string; badgeColor: string; badgeBg: string }> = {
  uncategorized: {
    label: 'Uncategorized',
    borderColor: '#b8734a',
    badgeColor: '#b8734a',
    badgeBg: '#fdf0e8',
  },
  duplicate: {
    label: 'Duplicate',
    borderColor: '#fbbf24',
    badgeColor: '#92400e',
    badgeBg: '#fffbeb',
  },
  anomaly: {
    label: 'Anomaly',
    borderColor: '#ef4444',
    badgeColor: '#991b1b',
    badgeBg: '#fef2f2',
  },
  missing_receipt: {
    label: 'Missing Receipt',
    borderColor: '#60a5fa',
    badgeColor: '#1e40af',
    badgeBg: '#eff6ff',
  },
}

export default function ExceptionCard({
  description,
  amount,
  type,
  aiSuggestion,
  confidence,
  onAccept,
  onReview,
}: ExceptionCardProps) {
  const [accepted, setAccepted] = useState(false)
  const config = TYPE_CONFIG[type]
  const pct = Math.round(confidence * 100)

  function handleAccept() {
    setAccepted(true)
    setTimeout(onAccept, 400)
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderLeft: `4px solid ${config.borderColor}`,
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '10px',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: accepted ? 0 : 1,
        transform: accepted ? 'translateX(12px)' : 'translateX(0)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Accepted flash overlay */}
      {accepted && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#dcfce7',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '13px' }}>✓ Accepted</span>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#1a1714',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#1a1714',
            }}
          >
            ${amount.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: config.badgeBg,
              color: config.badgeColor,
              whiteSpace: 'nowrap',
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* AI Suggestion */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: '11px', color: '#6b6560', margin: '0 0 5px 0' }}>
          <span style={{ fontWeight: 600, color: '#b8734a' }}>AI suggests:</span> {aiSuggestion}
        </p>
        {/* Confidence bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              backgroundColor: '#f0ebe3',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: pct >= 80 ? '#2d5a27' : pct >= 65 ? '#b8734a' : '#ef4444',
                borderRadius: 2,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#6b6560', whiteSpace: 'nowrap', minWidth: 32 }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleAccept}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#2d5a27',
            border: 'none',
            borderRadius: '7px',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#234820')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2d5a27')}
        >
          Accept AI Suggestion
        </button>
        <button
          onClick={onReview}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b6560',
            backgroundColor: 'transparent',
            border: '1px solid #e8e0d4',
            borderRadius: '7px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#b8734a'
            e.currentTarget.style.color = '#b8734a'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e8e0d4'
            e.currentTarget.style.color = '#6b6560'
          }}
        >
          Flag for Review
        </button>
      </div>
    </div>
  )
}
