'use client'

import { useState, useRef } from 'react'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import PulseResultChart from '@/components/PulseResultChart'
import { queryNetwork, type NetworkQueryResult } from '@/lib/network/queryEngine'

// ─── Suggested queries ────────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  "What's the typical gross margin for SaaS companies?",
  "How do restaurants handle delivery platform commissions?",
  "What % of law firms take the home office deduction?",
  "What's the median AR days for medical practices?",
  "How do retail firms categorize shoplifting losses?",
  "What are typical payroll percentages for professional services?",
  "Do most construction firms use percentage-of-completion?",
  "What's the average meals & entertainment spend for tech firms?",
]

// ─── Skeleton / Loading state ─────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '32px 28px',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {/* Animated pulse ring */}
        <div style={{ position: 'relative', width: 36, height: 36 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid #2d5a27',
              opacity: 0.3,
              animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: '50%',
              backgroundColor: '#2d5a27',
            }}
          />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', margin: 0 }}>
            Querying the network...
          </p>
          <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>
            Analyzing 12,847 firms across 47 industries
          </p>
        </div>
      </div>

      {/* Skeleton bars */}
      {[80, 60, 90, 45].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            borderRadius: 7,
            backgroundColor: '#f0ece4',
            width: `${w}%`,
            marginBottom: 10,
            animation: `pulse ${1 + i * 0.15}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Result component ─────────────────────────────────────────────────────────

function PulseResult({
  query,
  result,
  onNewQuery,
}: {
  query: string
  result: NetworkQueryResult
  onNewQuery: (q: string) => void
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '28px',
        marginTop: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Query echo */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: '#e8f0e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#2d5a27" strokeWidth="1.4" />
            <path d="M9.5 9.5L13 13" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: 0, lineHeight: 1.5 }}>
          {query}
        </p>
      </div>

      {/* Answer */}
      <div
        style={{
          padding: '18px 20px',
          backgroundColor: '#faf8f4',
          borderRadius: 12,
          border: '1px solid #e8e0d4',
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: '#1a1714',
            margin: 0,
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.answer}
        </p>
      </div>

      {/* Chart */}
      {result.chartData.length > 0 && (
        <div>
          <PulseResultChart
            data={result.chartData}
            unit={result.chartData[0]?.value <= 100 && result.chartData.some((d) => d.value > 1) ? '%' : ''}
            title="Distribution across network"
          />
        </div>
      )}

      {/* Attribution */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          backgroundColor: '#f0ece4',
          borderRadius: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="#6b6560" strokeWidth="1.3" />
          <path d="M7 4v3.5M7 9.5v.5" stroke="#6b6560" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 12, color: '#6b6560' }}>
          Based on data from <strong style={{ color: '#1a1714' }}>{result.sampleCount.toLocaleString()} firms</strong> across the CloseBooks network
        </span>
      </div>

      {/* Related questions */}
      {result.relatedQuestions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Related questions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {result.relatedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onNewQuery(q)}
                style={{
                  fontSize: 12,
                  color: '#2d5a27',
                  backgroundColor: '#e8f0e6',
                  border: '1px solid #c8dcc4',
                  borderRadius: 20,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d4e8d0' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PulsePage() {
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [result, setResult] = useState<NetworkQueryResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleQuery(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return

    setSubmittedQuery(trimmed)
    setStatus('loading')
    setResult(null)
    setError('')

    try {
      const res = await queryNetwork(trimmed)
      setResult(res)
      setStatus('result')
    } catch {
      setError('Unable to query the network. Please try again.')
      setStatus('error')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleQuery(inputValue)
  }

  function handleSuggestion(q: string) {
    setInputValue(q)
    handleQuery(q)
    inputRef.current?.focus()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#e8f0e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L11.39 7.26L17 8.27L13 12.14L13.99 17.73L9 15.12L4.01 17.73L5 12.14L1 8.27L6.61 7.26L9 2Z"
                  fill="#2d5a27" />
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1714', margin: 0 }}>
              Industry Pulse
            </h1>
          </div>
          <p style={{ fontSize: 15, color: '#6b6560', margin: 0 }}>
            Ask anything about the accounting industry — powered by aggregated data from 12,847 firms.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="#6b6560" strokeWidth="1.5" />
                <path d="M12.5 12.5L16 16" stroke="#6b6560" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="How do construction firms handle equipment leases?"
              style={{
                width: '100%',
                padding: '18px 120px 18px 48px',
                fontSize: 15,
                color: '#1a1714',
                backgroundColor: '#ffffff',
                border: '2px solid #e8e0d4',
                borderRadius: 14,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !inputValue.trim()}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: inputValue.trim() ? '#2d5a27' : '#d0c8bc',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (inputValue.trim()) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { if (inputValue.trim()) e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              {status === 'loading' ? 'Querying...' : 'Ask'}
            </button>
          </div>
        </form>

        {/* Suggested queries */}
        {status === 'idle' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: '#6b6560', margin: '0 0 10px', fontWeight: 500 }}>
              Suggested questions
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(q)}
                  style={{
                    fontSize: 12,
                    color: '#4a443f',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e0d4',
                    borderRadius: 20,
                    padding: '7px 13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f0e6'
                    e.currentTarget.style.borderColor = '#c8dcc4'
                    e.currentTarget.style.color = '#2d5a27'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#e8e0d4'
                    e.currentTarget.style.color = '#4a443f'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && <LoadingState />}

        {/* Error */}
        {status === 'error' && (
          <div
            style={{
              marginTop: 24,
              padding: '16px 20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              color: '#991b1b',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {status === 'result' && result && (
          <PulseResult
            query={submittedQuery}
            result={result}
            onNewQuery={(q) => {
              setInputValue(q)
              handleQuery(q)
            }}
          />
        )}

        {/* New query prompt after result */}
        {status === 'result' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: '#6b6560', margin: '0 0 8px' }}>
              Try another question
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED_QUERIES.filter((q) => q !== submittedQuery).slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(q)}
                  style={{
                    fontSize: 12,
                    color: '#4a443f',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e0d4',
                    borderRadius: 20,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f0e6'
                    e.currentTarget.style.color = '#2d5a27'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.color = '#4a443f'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
