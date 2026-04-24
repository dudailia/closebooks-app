'use client'
import type { UndoEntry } from '@/lib/review/undoStack'

interface Props {
  open: boolean
  entries: UndoEntry[]
  onClose: () => void
  onUndoUpTo: (entryId: string) => void
}

export default function HistoryDrawer({ open, entries, onClose, onUndoUpTo }: Props) {
  if (!open) return null
  const list = entries.slice().reverse().slice(0, 20)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.25)',
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: '90vw',
          backgroundColor: 'var(--surface-card)',
          height: '100%',
          padding: 18,
          overflowY: 'auto',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: 'var(--text-primary)',
            }}
          >
            History
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-secondary)',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        {list.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            No actions yet. Approve, flag, or edit a transaction to see it here.
          </p>
        )}
        {list.map((e) => (
          <div
            key={e.id}
            style={{
              padding: '10px 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                {new Date(e.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onUndoUpTo(e.id)}
              style={{
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Revert to here
            </button>
          </div>
        ))}
      </aside>
    </div>
  )
}
