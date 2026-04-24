'use client'
import { useEffect, useState } from 'react'

interface Props {
  vendor: string
  categoryName: string
  matchingCount: number
  onSave: () => void
  onDismiss: () => void
}

export default function SaveRuleToast({ vendor, categoryName, matchingCount, onSave, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: `translate(-50%, ${mounted ? '0' : '12px'})`,
        opacity: mounted ? 1 : 0,
        transition: 'all 0.2s',
        zIndex: 1001,
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--accent)',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        maxWidth: 560,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 8l4 4 8-8" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>
          Always categorize <strong>{vendor || '(this vendor)'}</strong> as <strong>{categoryName}</strong>?
        </p>
        {matchingCount > 0 && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Will also fix <strong style={{ color: 'var(--accent)' }}>{matchingCount}</strong> other pending transaction
            {matchingCount !== 1 ? 's' : ''}.
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onSave}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save rule
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
