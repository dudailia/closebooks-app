'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { PortalMessage } from '@/lib/portal/types'

interface Props {
  token: string
  accentColor: string
  firmName: string
  initialMessages: PortalMessage[]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function MessageThread({ token, accentColor, firmName, initialMessages }: Props) {
  const [messages, setMessages] = useState<PortalMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastId, setLastId] = useState<string | null>(initialMessages[initialMessages.length - 1]?.id ?? null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Update lastId when messages change
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last) setLastId(last.id)
  }, [messages])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return
      try {
        const url = lastId
          ? `/api/portal/messages?token=${token}&after=${lastId}`
          : `/api/portal/messages?token=${token}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        const newMsgs: PortalMessage[] = data.messages ?? []
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs])
        }
      } catch { /* network error — ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [token, lastId])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    // Optimistic
    const optimistic: PortalMessage = {
      id: `opt-${Date.now()}`,
      firmId: '',
      clientId: '',
      sender: 'client',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`/api/portal/messages?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m))
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }, [input, sending, token])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Group messages by date
  const grouped: { date: string; messages: PortalMessage[] }[] = []
  messages.forEach(msg => {
    const dateStr = new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = grouped[grouped.length - 1]
    if (last && last.date === dateStr) {
      last.messages.push(msg)
    } else {
      grouped.push({ date: dateStr, messages: [msg] })
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 400, background: 'white', border: '1px solid #e8e0d4', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e0d4', background: '#faf8f4' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714' }}>{firmName}</div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Your accounting team</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#9ca3af' }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ fontSize: 14 }}>No messages yet. Say hello!</div>
          </div>
        )}
        {grouped.map(group => (
          <div key={group.date}>
            <div style={{ textAlign: 'center', margin: '12px 0', fontSize: 11, color: '#9ca3af' }}>
              {group.date}
            </div>
            {group.messages.map(msg => {
              const isClient = msg.sender === 'client'
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                  <div style={{ maxWidth: '80%' }}>
                    {!isClient && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, paddingLeft: 4 }}>{firmName}</div>
                    )}
                    <div style={{
                      background: isClient ? accentColor : '#f5f3ef',
                      color: isClient ? 'white' : '#1a1714',
                      borderRadius: isClient ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, textAlign: isClient ? 'right' : 'left', paddingLeft: isClient ? 0 : 4, paddingRight: isClient ? 4 : 0 }}>
                      {formatTime(msg.createdAt)}
                      {isClient && msg.readAt && <span style={{ marginLeft: 4 }}>· Seen</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e0d4', display: 'flex', gap: 8, alignItems: 'flex-end', background: 'white' }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message your accountant… (Enter to send)"
          rows={1}
          style={{
            flex: 1, border: '1.5px solid #e8e0d4', borderRadius: 12, padding: '10px 14px',
            fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit',
            lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
            background: '#faf8f4', color: '#1a1714',
          }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = `${Math.min(t.scrollHeight, 120)}px`
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            background: input.trim() ? accentColor : '#e8e0d4',
            color: input.trim() ? 'white' : '#9ca3af',
            border: 'none', borderRadius: 10, width: 44, height: 44,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
