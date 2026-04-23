'use client'
import { useEffect, useState } from 'react'
import { useShortcuts, useShortcut } from '@/lib/review/KeyboardShortcutProvider'

const STORAGE_KEY = 'cb_shortcuts_hint_seen'

export default function ShortcutLegend() {
  const { list } = useShortcuts()
  const [pinned, setPinned] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setShowHint(true)
      window.localStorage.setItem(STORAGE_KEY, '1')
      const t = setTimeout(() => setShowHint(false), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  useShortcut({
    id: 'tt-legend',
    key: '?',
    shift: true,
    label: 'Show shortcut legend',
    group: 'Help',
    handler: () => setPinned((p) => !p),
  })

  const groups = Array.from(new Set(list.map((s) => s.group)))

  function keyLabel(s: { meta?: boolean; shift?: boolean; alt?: boolean; key: string }) {
    const parts = [s.meta && '⌘', s.shift && '⇧', s.alt && '⌥']
      .filter(Boolean)
      .join(' ')
    const k = s.key === ' ' ? 'Space' : s.key === 'enter' ? '↵' : s.key.toUpperCase()
    return parts ? `${parts} ${k}` : k
  }

  return (
    <>
      {showHint && !pinned && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 900,
            backgroundColor: '#1a1714',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            animation: 'cb-fade 3s ease-in-out forwards',
          }}
        >
          Press{' '}
          <kbd
            style={{
              fontFamily: 'monospace',
              backgroundColor: 'rgba(255,255,255,0.12)',
              padding: '1px 5px',
              borderRadius: 3,
            }}
          >
            ?
          </kbd>{' '}
          for keyboard shortcuts
        </div>
      )}
      <style jsx>{`
        @keyframes cb-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          15% {
            opacity: 1;
            transform: translateY(0);
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }
      `}</style>
      {pinned && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            width: 360,
            maxHeight: '70vh',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #e0dbd4',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1714' }}>
              Keyboard shortcuts
            </h3>
            <button
              onClick={() => setPinned(false)}
              style={{
                border: 'none',
                background: 'none',
                color: '#6b6560',
                fontSize: 18,
                lineHeight: 1,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6b6560',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 6px',
                }}
              >
                {g}
              </p>
              {list
                .filter((s) => s.group === g)
                .map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: '#1a1714' }}>{s.label}</span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#1a1714',
                        border: '1px solid #e0dbd4',
                        borderRadius: 4,
                        padding: '1px 5px',
                      }}
                    >
                      {keyLabel(s)}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
