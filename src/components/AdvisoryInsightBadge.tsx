'use client'

import { useEffect, useState } from 'react'
import { getAdvisoryMemosForClient } from '@/lib/advisoryStorage'
import type { AdvisoryMemo } from '@/types/advisory'

interface AdvisoryInsightBadgeProps {
  clientName: string
  onClick?: () => void
}

export default function AdvisoryInsightBadge({
  clientName,
  onClick,
}: AdvisoryInsightBadgeProps) {
  const [memos, setMemos] = useState<AdvisoryMemo[]>([])

  useEffect(() => {
    setMemos(getAdvisoryMemosForClient(clientName))
  }, [clientName])

  if (memos.length === 0) return null

  const hasUnsent = memos.some((m) => m.status === 'draft')

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors"
      style={{
        backgroundColor: '#fdf2e9',
        borderColor: '#f0c8a0',
        color: '#b8734a',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#fae4cc'
        e.currentTarget.style.borderColor = '#b8734a'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fdf2e9'
        e.currentTarget.style.borderColor = '#f0c8a0'
      }}
      title={`${memos.length} advisory memo${memos.length !== 1 ? 's' : ''}`}
    >
      {/* Lightbulb icon */}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1a3.5 3.5 0 0 1 2.5 5.95V8.5a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V6.95A3.5 3.5 0 0 1 6 1z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M4.5 10.5h3"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>

      {memos.length === 1 ? '1 memo' : `${memos.length} memos`}

      {/* Amber dot for unsent */}
      {hasUnsent && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: '#f59e0b' }}
          title="Unsent draft"
        />
      )}
    </button>
  )
}
