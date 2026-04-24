'use client'
import { useEffect, useState, ReactNode } from 'react'

export interface ToastMsg {
  id: string
  message: ReactNode
  onUndo?: () => void
  durationMs?: number
  tone?: 'default' | 'success' | 'warning'
}

interface Props {
  toasts: ToastMsg[]
  onDismiss: (id: string) => void
}

export default function ActionToastStack({ toasts, onDismiss }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {toasts.slice(-3).map((t) => (
        <ActionToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ActionToast({ toast, onDismiss }: { toast: ToastMsg; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    const t = setTimeout(() => onDismiss(toast.id), toast.durationMs ?? 6000)
    return () => clearTimeout(t)
  }, [toast.id, toast.durationMs, onDismiss])

  const toneBg =
    toast.tone === 'success' ? 'var(--accent)' : toast.tone === 'warning' ? 'var(--warning)' : 'var(--text-primary)'
  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: toneBg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        fontSize: 13,
        minWidth: 280,
        maxWidth: 420,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.18s ease, opacity 0.18s ease',
      }}
    >
      <div style={{ flex: 1 }}>{toast.message}</div>
      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.()
            onDismiss(toast.id)
          }}
          style={{
            border: '1px solid rgba(255,255,255,0.35)',
            backgroundColor: 'transparent',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Undo ⌘Z
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
