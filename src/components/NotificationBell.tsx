'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  clearNotification,
  clearAllNotifications,
  generateSmartNotifications,
  isRead,
  type AppNotification,
} from '@/lib/notifications'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_ICON: Record<AppNotification['type'], string> = {
  deadline_7d: '📅',
  deadline_3d: '⏰',
  deadline_today: '🚨',
  overdue_close: '⚠️',
  flagged_high_value: '🚩',
  agent_complete: '✅',
  exception_new: '⚡',
  trial_warning: '🔔',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  function refresh() {
    generateSmartNotifications()
    setNotifications(getNotifications())
    setUnread(getUnreadCount())
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60000) // re-check every minute
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    setOpen(v => !v)
    if (!open) {
      markAllRead()
      setTimeout(() => setUnread(0), 100)
    }
  }

  function handleDismiss(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    clearNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnread(getUnreadCount())
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
        style={{
          position: 'relative',
          width: 34,
          height: 34,
          borderRadius: 8,
          border: 'none',
          backgroundColor: open ? '#f0ece4' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b6560',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {/* Bell icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 3-1.5 4-1.5 4h12s-1.5-1-1.5-4A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>

        {/* Badge */}
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            border: '1.5px solid #fff',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: 320,
          backgroundColor: '#fff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 200,
          overflow: 'hidden',
          maxHeight: 440,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => { markAllRead(); clearAll(); setNotifications([]); setUnread(0) }}
                style={{ fontSize: 11, color: '#a09a94', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                <p style={{ fontSize: 13, color: '#a09a94' }}>No notifications yet</p>
                <p style={{ fontSize: 11, color: '#c4bdb8', marginTop: 4 }}>Smart alerts will appear here</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f8f5f0',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    cursor: n.href ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (n.href) { markRead(n.id); setOpen(false) } }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', margin: 0 }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: '#6b6560', margin: '2px 0 0', lineHeight: 1.4 }}>{n.body}</p>
                    <p style={{ fontSize: 10, color: '#a09a94', marginTop: 3 }}>{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={e => handleDismiss(n.id, e)}
                    style={{ flexShrink: 0, color: '#c4bdb8', border: 'none', background: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1 }}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ece4', textAlign: 'center' }}>
            <Link href="/dashboard/calendar" onClick={() => setOpen(false)} style={{ fontSize: 11, color: '#b8734a', textDecoration: 'none' }}>
              View all deadlines →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function clearAll() {
  clearAllNotifications()
}
