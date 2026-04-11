'use client'

import { useState, useEffect, useRef } from 'react'
import { getJobs, getClients } from '@/lib/storage'
import {
  getAllThreads,
  getMessagesForClient,
  sendMessage,
  markRead,
  getTotalUnread,
  type ClientMessage,
} from '@/lib/clientMessages'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_LABEL: Record<ClientMessage['type'], string> = {
  message: '',
  document_request: '📋 Document request',
  close_summary: '📊 Close summary',
  alert: '⚠️ Alert',
}

// ─── Thread sidebar ───────────────────────────────────────────────────────────

function ThreadList({
  threads,
  activeClient,
  onSelect,
}: {
  threads: { clientName: string; lastMessage: ClientMessage; unread: number }[]
  activeClient: string | null
  onSelect: (name: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0ece4' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', margin: 0 }}>Messages</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {threads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#a09a94' }}>No conversations yet</p>
          </div>
        ) : (
          threads.map(t => (
            <button
              key={t.clientName}
              onClick={() => onSelect(t.clientName)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                border: 'none',
                borderBottom: '1px solid #f8f5f0',
                backgroundColor: activeClient === t.clientName ? '#f0f5ef' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
              onMouseEnter={e => { if (activeClient !== t.clientName) e.currentTarget.style.backgroundColor = '#faf8f4' }}
              onMouseLeave={e => { if (activeClient !== t.clientName) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2d5a27' }}>{t.clientName.slice(0, 2).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: t.unread > 0 ? 700 : 500, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{t.clientName}</span>
                  <span style={{ fontSize: 10, color: '#a09a94', flexShrink: 0 }}>{timeAgo(t.lastMessage.sentAt)}</span>
                </div>
                <p style={{ fontSize: 11, color: '#6b6560', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.lastMessage.direction === 'outbound' ? 'You: ' : ''}{t.lastMessage.content}
                </p>
              </div>
              {t.unread > 0 && (
                <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {t.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ClientMessage }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{ maxWidth: '75%' }}>
        {TYPE_LABEL[msg.type] && (
          <p style={{ fontSize: 10, color: '#a09a94', textAlign: isOut ? 'right' : 'left', margin: '0 0 3px' }}>
            {TYPE_LABEL[msg.type]}
          </p>
        )}
        <div style={{
          padding: '10px 14px',
          borderRadius: isOut ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          backgroundColor: isOut ? '#2d5a27' : '#f0f5ef',
          color: isOut ? '#fff' : '#1a1714',
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {msg.content}
        </div>
        <p style={{ fontSize: 10, color: '#a09a94', textAlign: isOut ? 'right' : 'left', marginTop: 3 }}>
          {timeAgo(msg.sentAt)}
        </p>
      </div>
    </div>
  )
}

// ─── Chat view ────────────────────────────────────────────────────────────────

function ChatView({ clientName }: { clientName: string }) {
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const msgs = getMessagesForClient(clientName)
    setMessages(msgs.slice().reverse())
    markRead(clientName)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [clientName])

  function handleSend() {
    if (!text.trim()) return
    const msg = sendMessage(clientName, text.trim())
    setMessages(prev => [...prev, msg])
    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2d5a27' }}>{clientName.slice(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: 0 }}>{clientName}</p>
          <p style={{ fontSize: 11, color: '#a09a94', margin: 0 }}>All messages are private to your firm</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 13, color: '#a09a94' }}>No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f0ece4', display: 'flex', gap: 10 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={`Message ${clientName}…`}
          style={{ flex: 1, border: '1px solid #e8e0d4', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#2d5a27' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e8e0d4' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{ padding: '10px 16px', borderRadius: 12, border: 'none', backgroundColor: text.trim() ? '#2d5a27' : '#e8e0d4', color: '#fff', fontSize: 14, cursor: text.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
          Send
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [threads, setThreads] = useState<{ clientName: string; lastMessage: ClientMessage; unread: number }[]>([])
  const [activeClient, setActiveClient] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = getAllThreads()
    setThreads(t)
    if (t.length > 0 && !activeClient) setActiveClient(t[0].clientName)
    setMounted(true)
  }, [activeClient])

  function handleSelect(name: string) {
    setActiveClient(name)
    // Refresh threads to update unread counts
    setTimeout(() => setThreads(getAllThreads()), 100)
  }

  if (!mounted) return <div style={{ padding: 32 }}><div style={{ height: 200, borderRadius: 12, backgroundColor: '#f0ebe3' }} className="cb-skeleton" /></div>

  const hasNoClients = threads.length === 0

  return (
    <div style={{ height: 'calc(100vh - 97px)', display: 'flex', backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden', margin: '16px' }}>
      {/* Thread list */}
      <div style={{ width: 280, borderRight: '1px solid #f0ece4', flexShrink: 0 }}>
        {hasNoClients ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>No conversations yet</p>
            <p style={{ fontSize: 12, color: '#6b6560' }}>Add clients by uploading a close first.</p>
          </div>
        ) : (
          <ThreadList threads={threads} activeClient={activeClient} onSelect={handleSelect} />
        )}
      </div>

      {/* Chat view */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeClient ? (
          <ChatView key={activeClient} clientName={activeClient} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14, color: '#a09a94' }}>Select a client to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
