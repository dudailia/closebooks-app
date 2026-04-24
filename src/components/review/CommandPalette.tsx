'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShortcuts } from '@/lib/review/KeyboardShortcutProvider'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const { list } = useShortcuts()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const actions = useMemo(() => {
    const all = list.filter((s) => s.id !== 'tt-cmd-k')
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter(
      (s) => s.label.toLowerCase().includes(needle) || s.group.toLowerCase().includes(needle)
    )
  }, [list, q])

  if (!open) return null

  function run(i: number) {
    const a = actions[i]
    if (!a) return
    onClose()
    setTimeout(() => a.handler(new KeyboardEvent('keydown', { key: a.key })), 0)
  }

  function keyLabel(a: { meta?: boolean; shift?: boolean; alt?: boolean; key: string }) {
    return [a.meta && '⌘', a.shift && '⇧', a.alt && '⌥', a.key === ' ' ? 'Space' : a.key.toUpperCase()]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        backgroundColor: 'rgba(10,10,10,0.35)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '90vw',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIdx((i) => Math.min(i + 1, actions.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIdx((i) => Math.max(i - 1, 0))
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              run(idx)
            }
          }}
          placeholder="Type an action…"
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 14,
            border: 'none',
            outline: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {actions.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>No actions match.</div>
          )}
          {actions.map((a, i) => (
            <button
              key={a.id}
              onMouseDown={(e) => {
                e.preventDefault()
                run(i)
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '9px 14px',
                border: 'none',
                background: i === idx ? 'var(--surface-elevated)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginRight: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {a.group}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.label}</span>
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {keyLabel(a)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
