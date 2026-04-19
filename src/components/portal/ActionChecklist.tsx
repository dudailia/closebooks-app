'use client'

import { useState, useRef } from 'react'
import type { PortalActionItem } from '@/lib/portal/types'

interface Props {
  token: string
  accentColor: string
  initialItems: PortalActionItem[]
}

function dueDateColor(dueDate: string | undefined): string {
  if (!dueDate) return '#9ca3af'
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0) return '#ef4444'
  if (diffDays <= 3) return '#f59e0b'
  return '#9ca3af'
}

function formatDue(dueDate: string): string {
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function ActionChecklist({ token, accentColor, initialItems }: Props) {
  const [items, setItems] = useState<PortalActionItem[]>(initialItems)
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const toggleItem = async (item: PortalActionItem, file?: File) => {
    const completing = !item.completedAt
    setLoading(item.id)

    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, completedAt: completing ? new Date().toISOString() : undefined }
      : i
    ))

    try {
      const fd = new FormData()
      fd.append('id', item.id)
      fd.append('completed', String(completing))
      if (file) fd.append('file', file)

      const res = await fetch(`/api/portal/actions?token=${token}`, { method: 'PATCH', body: fd })
      if (!res.ok) {
        // Revert
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, completedAt: item.completedAt } : i))
        showToast('Failed — try again')
      } else {
        showToast(completing ? 'Marked complete!' : 'Reopened')
        if (completing) setExpanded(null)
      }
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completedAt: item.completedAt } : i))
      showToast('Network error — try again')
    } finally {
      setLoading(null)
    }
  }

  const open = items.filter(i => !i.completedAt)
  const done = items.filter(i => i.completedAt)

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1714', color: 'white', padding: '10px 20px', borderRadius: 8,
          fontSize: 14, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {items.length === 0 && (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>All clear!</div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>Your accountant will add action items here when they need something from you.</div>
        </div>
      )}

      {open.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Open ({open.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {open.map(item => (
              <div key={item.id} style={{ background: 'white', border: `1px solid ${expanded === item.id ? accentColor + '60' : '#e8e0d4'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <div
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <button
                    onClick={e => { e.stopPropagation(); setExpanded(item.id) }}
                    disabled={loading === item.id}
                    style={{
                      width: 24, height: 24, borderRadius: 6, border: `2px solid ${accentColor}`,
                      background: 'white', cursor: 'pointer', flexShrink: 0, marginTop: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.5, marginBottom: 6 }}>{item.description}</div>
                    )}
                    {item.dueDate && (
                      <div style={{ fontSize: 12, color: dueDateColor(item.dueDate), fontWeight: 500 }}>
                        {formatDue(item.dueDate)}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 16, color: '#9ca3af', transform: expanded === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                </div>

                {/* Expanded: complete with optional attachment */}
                {expanded === item.id && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f5f3ef' }}>
                    <div style={{ paddingTop: 12, fontSize: 14, color: '#6b6560', marginBottom: 12 }}>
                      Mark this as complete? You can optionally attach a file.
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        border: '1px solid #e8e0d4', borderRadius: 8, padding: '8px 14px',
                        fontSize: 13, color: '#6b6560', cursor: 'pointer', background: '#faf8f4',
                        minHeight: 40,
                      }}>
                        📎 Attach file (optional)
                        <input
                          type="file"
                          ref={el => { fileRefs.current[item.id] = el }}
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) toggleItem(item, file)
                          }}
                        />
                      </label>
                      <button
                        onClick={() => toggleItem(item)}
                        disabled={loading === item.id}
                        style={{
                          background: accentColor, color: 'white', border: 'none', borderRadius: 8,
                          padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          minHeight: 40, opacity: loading === item.id ? 0.6 : 1,
                        }}
                      >
                        {loading === item.id ? 'Saving…' : '✓ Mark Complete'}
                      </button>
                      <button
                        onClick={() => setExpanded(null)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, padding: '8px 8px', minHeight: 40 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Completed ({done.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map(item => (
              <div key={item.id} style={{ background: '#faf8f4', border: '1px solid #e8e0d4', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#dcfce7', border: '2px solid #2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5 6.5-7" stroke="#2d5a27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#6b6560', textDecoration: 'line-through' }}>{item.title}</div>
                  {item.completedAt && (
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      Completed {new Date(item.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleItem(item)}
                  disabled={loading === item.id}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', cursor: 'pointer', padding: '4px 8px' }}
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
