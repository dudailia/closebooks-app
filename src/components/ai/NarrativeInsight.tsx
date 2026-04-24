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
        backgroundColor: '#fff',
        border: '1px solid #e0dbd4',
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
              color: '#1a1714',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ✦ AI Narrative Summary
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a09a94' }}>
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
                border: tone === t ? '1px solid #2d5a27' : '1px solid #e0dbd4',
                backgroundColor: tone === t ? '#e8f0e6' : '#fff',
                color: tone === t ? '#2d5a27' : '#6b6560',
                cursor: 'pointer',
              }}
            >
              {t === 'owner' ? 'For the owner' : t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#991b1b' }}>
          {error}{' '}
          <button
            onClick={generate}
            style={{
              marginLeft: 6,
              fontSize: 12,
              background: 'none',
              border: 'none',
              color: '#2d5a27',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Retry
          </button>
        </p>
      )}

      {streaming && !narrative && (
        <p style={{ fontSize: 13, color: '#6b6560', fontStyle: 'italic' }}>
          Generating narrative…
        </p>
      )}

      {current && (
        <>
          <div
            style={{ fontSize: 13, color: '#1a1714', lineHeight: 1.6 }}
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
                    backgroundColor: '#fdf2e9',
                    border: '1px solid #e8c9a8',
                    color: '#7a4e2a',
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
                color: '#2d5a27',
                fontStyle: 'italic',
                borderLeft: '3px solid #2d5a27',
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
                backgroundColor: '#2d5a27',
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
                backgroundColor: '#fff',
                color: '#6b6560',
                border: '1px solid #e0dbd4',
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
