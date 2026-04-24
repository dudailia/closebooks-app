'use client'
import { useEffect, useState } from 'react'
import type { Transaction } from '@/types'

type Tone = 'formal' | 'conversational' | 'owner'

interface Paragraph {
  tone: Tone
  html: string
  citations: Array<{ phrase: string; txIds: string[] }>
}
interface NarrativeResult {
  paragraphs: Paragraph[]
  forwardLookingLine: string
}

interface Props {
  clientName: string
  clientIndustry?: string
  period: string
  transactions: Transaction[]
  priorTransactions?: Transaction[] | null
  onHighlight?: (ids: Set<string>) => void
  onEmailClient?: (html: string) => void
  initialNarrative?: NarrativeResult | null
  onNarrativeGenerated?: (n: NarrativeResult) => void
}

export default function NarrativeInsight({
  clientName,
  clientIndustry,
  period,
  transactions,
  priorTransactions,
  onHighlight,
  onEmailClient,
  initialNarrative,
  onNarrativeGenerated,
}: Props) {
  const [tone, setTone] = useState<Tone>('conversational')
  const [narrative, setNarrative] = useState<NarrativeResult | null>(initialNarrative ?? null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setStreaming(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            clientName,
            clientIndustry,
            period,
            transactions,
            priorTransactions: priorTransactions ?? null,
          },
        }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))
          if (event.type === 'complete') {
            setNarrative(event.result)
            onNarrativeGenerated?.(event.result)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setStreaming(false)
    }
  }

  useEffect(() => {
    if (!narrative && !streaming && transactions.length > 0) void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length])

  const current = narrative?.paragraphs.find((p) => p.tone === tone)

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ✦ AI Narrative Summary
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {clientName} · {period}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['formal', 'conversational', 'owner'] as Tone[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                borderRadius: 6,
                textTransform: 'capitalize',
                border: tone === t ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                backgroundColor: tone === t ? 'var(--accent-soft)' : '#fff',
                color: tone === t ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t === 'owner' ? 'For the owner' : t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)' }}>
          {error}{' '}
          <button
            onClick={generate}
            style={{
              marginLeft: 6,
              fontSize: 12,
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Retry
          </button>
        </p>
      )}

      {streaming && !narrative && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Generating narrative…
        </p>
      )}

      {current && (
        <>
          <div
            style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: current.html }}
          />

          {current.citations.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {current.citations.slice(0, 6).map((c, i) => (
                <button
                  key={i}
                  onClick={() => onHighlight?.(new Set(c.txIds))}
                  style={{
                    fontSize: 11,
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--warning-soft)',
                    color: 'var(--warning)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                >
                  {c.phrase} · {c.txIds.length} tx
                </button>
              ))}
            </div>
          )}

          {narrative?.forwardLookingLine && (
            <p
              style={{
                marginTop: 14,
                fontSize: 13,
                color: 'var(--accent)',
                fontStyle: 'italic',
                borderLeft: '3px solid var(--accent)',
                paddingLeft: 10,
              }}
            >
              ➜ {narrative.forwardLookingLine}
            </p>
          )}

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button
              onClick={() =>
                onEmailClient?.(narrative!.paragraphs.find((p) => p.tone === 'owner')?.html ?? '')
              }
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Email to client
            </button>
            <button
              onClick={generate}
              disabled={streaming}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  )
}
