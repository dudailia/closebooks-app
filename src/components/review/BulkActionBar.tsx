'use client'
import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface BulkAction {
  id: string
  label: string
  tone?: 'default' | 'success' | 'danger'
  icon?: ReactNode
  disabled?: boolean
  onClick: () => void
}

interface Props {
  count: number
  totalAmount?: number
  actions: BulkAction[]
  onClear: () => void
}

export default function BulkActionBar({ count, totalAmount, actions, onClear }: Props) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setPortalEl(document.body)
  }, [])

  useEffect(() => {
    if (count > 0) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    } else {
      setVisible(false)
    }
  }, [count])

  if (!portalEl || count === 0) return null

  return createPortal(
    <div
      data-bulk-bar
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translate(-50%, ${visible ? '0' : '100%'})`,
        transition: 'transform 0.22s cubic-bezier(.2,.8,.2,1)',
        zIndex: 800,
        backgroundColor: 'var(--text-primary)',
        color: '#fff',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.28)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 'calc(100vw - 48px)',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingRight: 10,
          borderRight: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {count} selected
        </span>
        {typeof totalAmount === 'number' && Number.isFinite(totalAmount) && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
            ${Math.abs(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      {actions.map((a) => {
        const bg =
          a.tone === 'success'
            ? 'var(--accent)'
            : a.tone === 'danger'
            ? 'var(--danger)'
            : 'rgba(255,255,255,0.08)'
        const hoverBg =
          a.tone === 'success'
            ? 'var(--accent)'
            : a.tone === 'danger'
            ? 'var(--danger)'
            : 'rgba(255,255,255,0.18)'
        return (
          <button
            key={a.id}
            onClick={a.onClick}
            disabled={a.disabled}
            onMouseEnter={(e) => {
              if (!a.disabled) e.currentTarget.style.backgroundColor = hoverBg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = bg
            }}
            style={{
              backgroundColor: bg,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 500,
              cursor: a.disabled ? 'not-allowed' : 'pointer',
              opacity: a.disabled ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {a.icon}
            {a.label}
          </button>
        )
      })}
      <button
        onClick={onClear}
        aria-label="clear selection"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer',
          paddingLeft: 6,
        }}
      >
        ×
      </button>
    </div>,
    portalEl
  )
}
