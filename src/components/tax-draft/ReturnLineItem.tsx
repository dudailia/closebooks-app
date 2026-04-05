'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  lineNumber: string
  description: string
  priorYearAmount: number | null
  currentAmount: number | null
  hasAnnotation: boolean
  hasOpportunity: boolean
  needsReview: boolean
  isHighlighted: boolean
  onClick: () => void
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return '$0'
  const abs = Math.abs(value)
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : abs.toString()
  return value < 0 ? `($${formatted})` : `$${formatted}`
}

function pctChange(prior: number | null, current: number | null): number | null {
  if (prior === null || current === null || prior === 0) return null
  return Math.round(((current - prior) / Math.abs(prior)) * 100)
}

export default function ReturnLineItem({
  lineNumber,
  description,
  priorYearAmount,
  currentAmount,
  hasAnnotation,
  hasOpportunity,
  needsReview,
  isHighlighted,
  onClick,
}: Props) {
  const [pulsing, setPulsing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!hasOpportunity) return
    intervalRef.current = setInterval(() => {
      setPulsing(true)
      setTimeout(() => setPulsing(false), 800)
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [hasOpportunity])

  const pct = pctChange(priorYearAmount, currentAmount)
  const pctColor =
    pct === null ? '#9ca3af'
    : pct > 5 ? '#2d5a27'
    : pct < -5 ? '#dc2626'
    : '#9ca3af'

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        backgroundColor: isHighlighted
          ? '#fdf6f0'
          : hovered
          ? '#faf8f4'
          : '#ffffff',
        borderLeft: isHighlighted ? '3px solid #b8734a' : '3px solid transparent',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Line number */}
      <td
        className="py-2 px-3 text-xs font-mono"
        style={{ color: '#9ca3af', width: 48, whiteSpace: 'nowrap' }}
      >
        {lineNumber}
      </td>

      {/* Description */}
      <td className="py-2 px-3 text-sm" style={{ color: '#1a1714', minWidth: 200 }}>
        <div className="flex items-center gap-2">
          <span>{description}</span>
          {needsReview && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
            >
              Review
            </span>
          )}
        </div>
      </td>

      {/* Prior year */}
      <td
        className="py-2 px-3 text-sm text-right font-mono"
        style={{ color: '#6b6560', width: 120 }}
      >
        {formatCurrency(priorYearAmount)}
      </td>

      {/* Current year */}
      <td
        className="py-2 px-3 text-sm text-right font-mono font-medium"
        style={{ color: '#1a1714', width: 130 }}
      >
        {formatCurrency(currentAmount)}
      </td>

      {/* Change % */}
      <td className="py-2 px-3 text-xs text-right font-mono" style={{ color: pctColor, width: 70 }}>
        {pct !== null ? (pct > 0 ? `+${pct}%` : `${pct}%`) : '—'}
      </td>

      {/* Badges */}
      <td className="py-2 px-3 text-right" style={{ width: 90 }}>
        <div className="flex items-center justify-end gap-1.5">
          {hasOpportunity && (
            <span
              title="Tax opportunity"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                transition: 'transform 0.2s ease',
                transform: pulsing ? 'scale(1.4)' : 'scale(1)',
                filter: pulsing ? 'brightness(1.2)' : 'none',
              }}
            >
              ★
            </span>
          )}
          {hasAnnotation && (hovered || isHighlighted) && (
            <span
              title="AI annotation"
              className="inline-flex items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{
                backgroundColor: '#b8734a',
                width: 18,
                height: 18,
                fontSize: 10,
                lineHeight: 1,
              }}
            >
              ?
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}
