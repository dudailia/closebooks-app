'use client'
import { useEffect, useRef, useState } from 'react'
import { executeToolClient, type ToolExecContext } from '@/lib/ai/toolClient'
import type { ChatPromptContext } from '@/lib/ai/systemPrompts'

type Msg = { role: 'user' | 'assistant'; content: string }

export interface AppChatPanelProps {
  context: ChatPromptContext
  onMutateTransactions?: ToolExecContext['mutateTransactions']
  onOpenAutoClose?: () => void
}

export default function AppChatPanel({
  context,
  onMutateTransactions,
  onOpenAutoClose,
}: AppChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const initialNudgeShownRef = useRef(false)

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages, streaming])

  useEffect(() => {
    if (open && !initialNudgeShownRef.current && !context.clientName && messages.length === 0) {
      initialNudgeShownRef.current = true
      const nudge =
        context.overdueCount > 0
          ? `Hey — you have ${context.overdueCount} client${context.overdueCount !== 1 ? 's' : ''} overdue for closing. Want me to start with the oldest?`
          : `Looks like you're on top of things. Ask me anything about your clients, or type "/" for commands.`
      setMessages([{ role: 'assistant', content: nudge }])
    }
  }, [open, context, messages.length])

  async function streamChat(seed: Msg[]): Promise<void> {
    setMessages([...seed, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: seed, context }),
      })
      if (!res.ok || !res.body) throw new Error(`chat HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let assistantText = ''
      const toolCalls: Array<{ toolUseId: string; name: string; input: Record<string, unknown> }> = []
      let needsToolResults = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'text') {
            assistantText += event.delta
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: assistantText }
              return next
            })
          } else if (event.type === 'tool_call') {
            toolCalls.push({ toolUseId: event.toolUseId, name: event.name, input: event.input })
          } else if (event.type === 'needs_tool_results') {
            needsToolResults = true
          }
        }
      }

      if (needsToolResults && toolCalls.length > 0) {
        const results: string[] = []
        for (const tc of toolCalls) {
          const r = executeToolClient(tc.name, tc.input, {
            transactions: context.transactions,
            jobId: context.jobId,
            mutateTransactions: onMutateTransactions ?? (() => {}),
          })
          results.push(`${tc.name}: ${r.summary}${r.data ? ' · ' + JSON.stringify(r.data).slice(0, 500) : ''}`)
          if (
            r.data &&
            typeof r.data === 'object' &&
            'action' in (r.data as Record<string, unknown>) &&
            (r.data as { action: string }).action === 'open_auto_close'
          ) {
            onOpenAutoClose?.()
          }
        }
        const followup: Msg = { role: 'user', content: `Tool results:\n${results.join('\n')}` }
        const resumed: Msg[] = [...seed, { role: 'assistant', content: assistantText }, followup]
        await streamChat(resumed)
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  function submit() {
    const t = input.trim()
    if (!t || streaming) return
    setInput('')
    setSlashOpen(false)
    let final = t
    if (t.startsWith('/summary')) final = "Summarize this client's financial position this month."
    else if (t.startsWith('/close')) final = 'Run the auto-close agent for this client.'
    else if (t.startsWith('/clients overdue')) final = 'Which clients are overdue for closing?'
    else if (t.startsWith('/find ')) final = `Find transactions matching: ${t.slice(6)}`
    else if (t.startsWith('/flag ')) final = `Flag all transactions where ${t.slice(6)}`
    void streamChat([...messages, { role: 'user', content: final }])
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="CloseBooks AI (⌘J)"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 700,
            backgroundColor: '#1a1714',
            color: '#fff',
            borderRadius: 999,
            border: 'none',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span> Ask CloseBooks AI
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 420,
            height: 640,
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 700,
            backgroundColor: '#fff',
            borderRadius: 14,
            border: '1px solid #e0dbd4',
            boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #e0dbd4',
              backgroundColor: '#faf8f4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1a1714',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                ✦ CloseBooks AI
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 11,
                  color: '#6b6560',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {context.clientName
                  ? `${context.clientName} · ${context.transactions.length} txs`
                  : 'Firm dashboard'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 18,
                color: '#6b6560',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <div
            ref={logRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.length === 0 && !streaming && (
              <p style={{ fontSize: 12, color: '#a09a94', fontStyle: 'italic', margin: 0 }}>
                Ask anything. Try &quot;Why did office expenses jump?&quot; or type &quot;/&quot; for commands.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.45,
                  backgroundColor: m.role === 'user' ? '#2d5a27' : '#f5f0ea',
                  color: m.role === 'user' ? '#fff' : '#1a1714',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content || (streaming && m.role === 'assistant' && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
          </div>

          {slashOpen && (
            <div style={{ padding: 8, borderTop: '1px solid #e0dbd4', backgroundColor: '#faf8f4', fontSize: 12 }}>
              {[
                '/summary — summarize this client',
                '/find <query> — find transactions',
                '/flag <criteria> — flag matching',
                '/close — run auto-close agent',
                '/clients overdue — list overdue closes',
              ].map((line) => (
                <div key={line} style={{ padding: '3px 6px', color: '#6b6560' }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: 10, borderTop: '1px solid #e0dbd4', display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setSlashOpen(e.target.value.startsWith('/'))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              placeholder="Ask anything…  (⌘J to toggle)"
              disabled={streaming}
              style={{
                flex: 1,
                border: '1px solid #e0dbd4',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={submit}
              disabled={streaming || !input.trim()}
              style={{
                backgroundColor: streaming ? '#a09a94' : '#2d5a27',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: streaming ? 'wait' : 'pointer',
              }}
            >
              {streaming ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
