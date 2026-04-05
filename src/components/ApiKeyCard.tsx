'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiKeyData {
  id: string
  name: string
  prefix: string
  maskedKey: string
  scopes: string[]
  createdAt: string
  lastUsed: string | null
  status: 'live' | 'test'
}

interface ApiKeyCardProps {
  apiKey: ApiKeyData
  onRevoke: (id: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ScopeTag({ scope }: { scope: string }) {
  return (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded-full font-mono"
      style={{
        backgroundColor: '#f0ece4',
        color: '#6b6560',
        border: '1px solid #e8e0d4',
      }}
    >
      {scope}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Eye icon
// ---------------------------------------------------------------------------

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiKeyCard({ apiKey, onRevoke }: ApiKeyCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const displayKey = revealed
    ? apiKey.maskedKey.replace('...', '••••••••••••••••••••••••')
    : apiKey.maskedKey

  function handleCopy() {
    navigator.clipboard.writeText(apiKey.maskedKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleRevoke() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onRevoke(apiKey.id)
    setConfirming(false)
  }

  const isLive = apiKey.status === 'live'

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e8e0d4',
        boxShadow: '0 1px 4px rgba(26,23,20,0.05)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="text-sm font-semibold"
            style={{ color: '#1a1714' }}
          >
            {apiKey.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isLive ? '#eef5ed' : '#f5f0ea',
              color: isLive ? '#2d5a27' : '#b8734a',
              border: `1px solid ${isLive ? '#c8dfc6' : '#e0c9b6'}`,
            }}
          >
            {isLive ? 'Live' : 'Test'}
          </span>
        </div>

        {/* Revoke button */}
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#6b6560' }}>Revoke key?</span>
            <button
              onClick={handleRevoke}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e8e0d4' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleRevoke}
            className="text-xs px-2.5 py-1 rounded-lg transition-colors"
            style={{ color: '#6b6560', border: '1px solid #e8e0d4', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.borderColor = '#e8e0d4' }}
          >
            Revoke
          </button>
        )}
      </div>

      {/* Key display */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-3 font-mono text-sm"
        style={{ backgroundColor: '#faf8f4', border: '1px solid #e8e0d4' }}
      >
        <span className="flex-1 truncate" style={{ color: '#1a1714', letterSpacing: '0.02em' }}>
          {displayKey}
        </span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="flex-shrink-0 transition-colors"
          style={{ color: '#6b6560' }}
          title={revealed ? 'Hide key' : 'Reveal key'}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1714')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}
        >
          <EyeIcon open={revealed} />
        </button>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 text-xs px-2 py-1 rounded transition-colors"
          style={{
            backgroundColor: copied ? '#eef5ed' : '#f0ece4',
            color: copied ? '#2d5a27' : '#6b6560',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Scopes */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {apiKey.scopes.map((s) => (
          <ScopeTag key={s} scope={s} />
        ))}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#6b6560' }}>
        <span>Created {formatDate(apiKey.createdAt)}</span>
        <span>Last used {formatDate(apiKey.lastUsed)}</span>
      </div>
    </div>
  )
}
