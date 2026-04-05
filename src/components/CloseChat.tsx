'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { loadChatHistory, saveChatHistory } from '@/lib/chatHistory'
import type { ChatMessage, Transaction } from '@/types'

interface Props {
  jobId: string
  clientName: string
  transactions: Transaction[]
  onHighlight: (ids: Set<string>) => void
}

const SUGGESTIONS = [
  'Show me all transactions over $1,000',
  "What's our biggest expense category?",
  'Any transactions that look like duplicates?',
  'Show me everything flagged for review',
  'Which vendors are new this month?',
  'Highlight anything that might be a personal expense',
]

function makeId() {
  return `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export default function CloseChat({ jobId, clientName, transactions, onHighlight }: Props) {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Load history on open
  useEffect(() => {
    if (open) {
      const history = loadChatHistory(jobId)
      setMessages(history)
      setShowSuggestions(history.length === 0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, jobId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)
    setShowSuggestions(false)
    setInput('')

    const userMsg: ChatMessage = {
      id:        makeId(),
      role:      'user',
      content:   text.trim(),
      timestamp: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:      text.trim(),
          jobId,
          clientName,
          transactions: transactions.slice(0, 500), // cap payload
          history:      messages.slice(-8),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Chat failed.')
      }

      const assistantMsg: ChatMessage = {
        id:           makeId(),
        role:         'assistant',
        content:      data.text,
        timestamp:    new Date().toISOString(),
        highlightIds: data.highlightIds ?? [],
      }

      const updated = [...nextMessages, assistantMsg]
      setMessages(updated)
      saveChatHistory(jobId, updated)

      if (data.highlightIds?.length > 0) {
        onHighlight(new Set(data.highlightIds))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [loading, messages, jobId, clientName, transactions, onHighlight])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function handleHighlightClick(ids: string[]) {
    onHighlight(new Set(ids))
  }

  function handleClearHighlight() {
    onHighlight(new Set())
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all"
        style={{
          backgroundColor: open ? '#1e3d1a' : '#2d5a27',
          boxShadow: '0 4px 20px rgba(45,90,39,0.35)',
        }}
        title="Ask anything about these transactions"
      >
        <ChatBubbleIcon />
        <span className="hidden sm:inline">Ask</span>
        {messages.length > 0 && !open && (
          <span
            className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: '#b8734a' }}
          >
            {Math.min(messages.length, 9)}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-40 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 360,
            height: 520,
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
          >
            <div className="flex items-center gap-2">
              <ChatBubbleIcon white />
              <div>
                <p className="text-sm font-semibold leading-tight">Close Chat</p>
                <p className="text-xs opacity-75">{clientName} · {transactions.length} transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHighlight}
                  className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                  title="Clear highlights"
                >
                  Clear ✕
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: '#a09a94' }}>
                  Ask anything about these transactions
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors"
                    style={{ backgroundColor: '#f5f0ea', color: '#1a1714' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ede7df' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: '#2d5a27', color: '#ffffff', borderBottomRightRadius: 4 }
                      : { backgroundColor: '#f5f0ea', color: '#1a1714', borderBottomLeftRadius: 4 }
                  }
                >
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {msg.highlightIds && msg.highlightIds.length > 0 && (
                    <button
                      onClick={() => handleHighlightClick(msg.highlightIds!)}
                      className="mt-1.5 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
                    >
                      ↑ Highlight {msg.highlightIds.length} row{msg.highlightIds.length !== 1 ? 's' : ''} in table
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3.5 py-2.5"
                  style={{ backgroundColor: '#f5f0ea', borderBottomLeftRadius: 4 }}
                >
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ backgroundColor: '#a09a94', animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 border-t shrink-0"
            style={{ borderColor: '#f0ece4' }}
          >
            <div
              className="flex items-end gap-2 rounded-xl border px-3 py-2"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about these transactions…"
                className="flex-1 text-xs bg-transparent resize-none focus:outline-none leading-relaxed"
                style={{ color: '#1a1714', maxHeight: 80 }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ backgroundColor: '#2d5a27' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1.5 text-center" style={{ color: '#c4bdb8' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function ChatBubbleIcon({ white }: { white?: boolean }) {
  const color = white ? '#ffffff' : '#ffffff'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13 2H3a1 1 0 00-1 1v7a1 1 0 001 1h2l2 2 2-2h3a1 1 0 001-1V3a1 1 0 00-1-1Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round"
      />
      <path d="M5 6h6M5 8.5h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
