'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { CopilotMessage, ActionCardType, ActionCardPayload, SSEEvent } from '@/lib/copilot/types'
import ChatMessage from '@/components/copilot/ChatMessage'
import SuggestedPrompts from '@/components/copilot/SuggestedPrompts'
import CopilotInput from '@/components/copilot/CopilotInput'
import ToolCallIndicator from '@/components/copilot/ToolCallIndicator'

const BRIEF_TRIGGER = '__morning_brief__'

export default function CopilotPage() {
  const params = useParams()
  const clientId = params.clientId as string

  const [messages, setMessages]       = useState<CopilotMessage[]>([])
  const [activeTools, setActiveTools] = useState<{ name: string; label: string }[]>([])
  const [streaming, setStreaming]     = useState(false)
  const [input, setInput]             = useState('')
  const bottomRef                     = useRef<HTMLDivElement>(null)
  const briefSent                     = useRef(false)
  // keep a stable ref to messages for the sendMessage closure
  const messagesRef                   = useRef<CopilotMessage[]>([])
  messagesRef.current = messages

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (streaming) return

    const isBrief   = text === BRIEF_TRIGGER
    const userText  = isBrief ? 'Deliver a morning brief for this client.' : text
    const assistId  = crypto.randomUUID()

    const assistMsg: CopilotMessage = { id: assistId, role: 'assistant', text: '', actionCards: [], streaming: true }

    setMessages(prev => {
      const userMsg: CopilotMessage = { id: crypto.randomUUID(), role: 'user', text: userText, actionCards: [], streaming: false }
      return isBrief ? [...prev, assistMsg] : [...prev, userMsg, assistMsg]
    })
    setStreaming(true)

    const history = messagesRef.current.map(m => ({ role: m.role, content: m.text }))
    if (!isBrief) history.push({ role: 'user', content: userText })

    try {
      const res = await fetch('/api/copilot/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history, clientId }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw   = decoder.decode(value, { stream: true })
        const lines = raw.split('\n\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent

            switch (event.type) {
              case 'text':
                setMessages(prev => prev.map(m => m.id === assistId ? { ...m, text: m.text + event.delta } : m))
                scrollToBottom()
                break
              case 'tool_start':
                setActiveTools(prev => [...prev.filter(t => t.name !== event.name), { name: event.name, label: event.label }])
                break
              case 'tool_done':
                setActiveTools(prev => prev.filter(t => t.name !== event.name))
                break
              case 'action_card':
                setMessages(prev => prev.map(m => m.id === assistId ? { ...m, actionCards: [...m.actionCards, event.card] } : m))
                scrollToBottom()
                break
              case 'done':
                setMessages(prev => prev.map(m => m.id === assistId ? { ...m, streaming: false } : m))
                setActiveTools([])
                setStreaming(false)
                break
              case 'error':
                setMessages(prev => prev.map(m => m.id === assistId ? { ...m, text: m.text || `Error: ${event.message}`, streaming: false } : m))
                setActiveTools([])
                setStreaming(false)
                break
            }
          } catch { /* malformed line — skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === assistId ? { ...m, text: 'Connection failed. Please try again.', streaming: false } : m))
      setActiveTools([])
      setStreaming(false)
    }
  }, [streaming, clientId, scrollToBottom])

  useEffect(() => {
    if (!briefSent.current) { briefSent.current = true; sendMessage(BRIEF_TRIGGER) }
  }, [sendMessage])

  const handleApprove = useCallback(async (msgId: string, cardId: string, payload: ActionCardPayload, type: ActionCardType) => {
    const res = await fetch('/api/copilot/action', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, clientId, payload }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, actionCards: m.actionCards.map(c => c.id === cardId ? { ...c, status: 'approved' as const } : c) } : m
      ))
    }
  }, [clientId])

  const handleDismiss = useCallback((msgId: string, cardId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, actionCards: m.actionCards.map(c => c.id === cardId ? { ...c, status: 'dismissed' as const } : c) } : m
    ))
  }, [])

  const handleNewChat = () => {
    setMessages([]); setActiveTools([]); setStreaming(false)
    briefSent.current = false
    setTimeout(() => sendMessage(BRIEF_TRIGGER), 50)
  }

  const handleSubmit = () => {
    if (!input.trim() || streaming) return
    const text = input.trim(); setInput(''); sendMessage(text)
  }

  const showSuggested = messages.length === 0 && !streaming

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', backgroundColor: '#faf8f4' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: '1px solid #e8e0d4', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href={`/dashboard/clients/${clientId}`} style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>← Client</Link>
          <span style={{ color: '#e8e0d4' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>✦ Copilot</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#c4bdb6' }}>⌘K anywhere</span>
          <button onClick={handleNewChat} style={{ fontSize: 12, color: '#6b6560', background: 'none', border: '1px solid #e8e0d4', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: showSuggested ? 0 : '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {showSuggested ? (
          <SuggestedPrompts onSelect={p => { setInput(p); sendMessage(p) }} />
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onApprove={(cardId, payload, type) => handleApprove(msg.id, cardId, payload, type)}
              onDismiss={cardId => handleDismiss(msg.id, cardId)}
            />
          ))
        )}

        {activeTools.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeTools.map(t => <ToolCallIndicator key={t.name} label={t.label} />)}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '12px 24px 16px', borderTop: '1px solid #e8e0d4', background: '#ffffff' }}>
        <CopilotInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={streaming}
          placeholder="Ask anything about this client's financials…"
        />
        <p style={{ fontSize: 11, color: '#c4bdb6', textAlign: 'center', margin: '6px 0 0' }}>
          CloseBooks Copilot may make mistakes. Review all actions before approving.
        </p>
      </div>
    </div>
  )
}
