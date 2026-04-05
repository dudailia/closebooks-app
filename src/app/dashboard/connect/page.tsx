'use client'

import { useState, useEffect, useRef } from 'react'
import ApiKeyCard, { type ApiKeyData } from '@/components/ApiKeyCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  lastDelivery: string | null
}

interface Partner {
  id: string
  name: string
  description: string
  initials: string
  color: string
  connected: boolean
}

interface UsageData {
  currentMonth: { total: number; limit: number; plan: string }
  daily: { date: string; calls: number }[]
  topEndpoints: { endpoint: string; calls: number; avgLatencyMs: number; errorRate: number }[]
  billing: { plan: string; amount: number; currency: string; renewsAt: string }
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_KEYS: ApiKeyData[] = [
  {
    id: 'key_01',
    name: 'Production',
    prefix: 'sk_live',
    maskedKey: 'sk_live_4xT9...mK2p',
    scopes: ['read:transactions', 'read:financials', 'read:clients'],
    createdAt: '2025-11-14T10:22:00Z',
    lastUsed: '2026-04-04T18:45:00Z',
    status: 'live',
  },
  {
    id: 'key_02',
    name: 'Test Environment',
    prefix: 'sk_test',
    maskedKey: 'sk_test_7rQ1...nW8v',
    scopes: ['read:transactions', 'write:transactions', 'read:financials'],
    createdAt: '2025-12-03T14:05:00Z',
    lastUsed: '2026-04-03T09:12:00Z',
    status: 'test',
  },
]

const DEMO_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: 'wh_01',
    url: 'https://api.yourdomain.com/webhooks/closebooks',
    events: ['transaction.created', 'close.completed'],
    status: 'active',
    lastDelivery: '2026-04-05T08:22:00Z',
  },
  {
    id: 'wh_02',
    url: 'https://staging.yourdomain.com/webhooks/cb',
    events: ['exception.flagged', 'document.received'],
    status: 'inactive',
    lastDelivery: '2026-04-01T14:10:00Z',
  },
]

const PARTNERS: Partner[] = [
  { id: 'stripe',   name: 'Stripe',    description: 'Sync payment data and reconcile transactions automatically.',  initials: 'ST', color: '#635BFF', connected: true  },
  { id: 'gusto',    name: 'Gusto',     description: 'Import payroll runs and journal entries in real time.',          initials: 'GU', color: '#F45D48', connected: true  },
  { id: 'ramp',     name: 'Ramp',      description: 'Pull corporate card spend and categorize with AI.',              initials: 'RA', color: '#00C28B', connected: false },
  { id: 'brex',     name: 'Brex',      description: 'Connect Brex business accounts for automated bookkeeping.',      initials: 'BR', color: '#0A2463', connected: false },
  { id: 'bill',     name: 'Bill.com',  description: 'Sync AP/AR data and invoice lifecycle events.',                  initials: 'BL', color: '#D4722A', connected: false },
  { id: 'mercury',  name: 'Mercury',   description: 'Pull bank feed from Mercury for daily reconciliation.',          initials: 'ME', color: '#302AE6', connected: false },
  { id: 'avalara',  name: 'Avalara',   description: 'Automate sales tax calculations and filing.',                    initials: 'AV', color: '#E84142', connected: false },
  { id: 'carta',    name: 'Carta',     description: 'Import equity events and cap table data for equity accounting.', initials: 'CA', color: '#007AFF', connected: false },
]

const ALL_EVENTS = ['transaction.created', 'close.completed', 'exception.flagged', 'document.received']
const ALL_SCOPES = ['read:transactions', 'write:transactions', 'read:financials', 'read:clients']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function genId(): string {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function genKey(type: 'live' | 'test'): { full: string; masked: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const body = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const prefix = type === 'live' ? 'sk_live' : 'sk_test'
  return {
    full: `${prefix}_${body}`,
    masked: `${prefix}_${body.slice(0, 4)}...${body.slice(-4)}`,
  }
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = 'api-keys' | 'webhooks' | 'partners' | 'usage'

// ---------------------------------------------------------------------------
// SVG Bar Chart
// ---------------------------------------------------------------------------

function UsageBarChart({ daily }: { daily: { date: string; calls: number }[] }) {
  const W = 640
  const H = 140
  const PADDING = { top: 10, right: 8, bottom: 28, left: 40 }
  const chartW = W - PADDING.left - PADDING.right
  const chartH = H - PADDING.top - PADDING.bottom

  const last30 = daily.slice(-30)
  const maxVal = Math.max(...last30.map((d) => d.calls), 1)
  const barW = (chartW / last30.length) * 0.7
  const gap = chartW / last30.length

  const yTicks = [0, Math.round(maxVal * 0.5), maxVal]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
    >
      {/* Y-axis labels */}
      {yTicks.map((val) => {
        const y = PADDING.top + chartH - (val / maxVal) * chartH
        return (
          <g key={val}>
            <line
              x1={PADDING.left} y1={y}
              x2={PADDING.left + chartW} y2={y}
              stroke="#e8e0d4" strokeWidth="1"
            />
            <text
              x={PADDING.left - 6} y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b6560"
            >
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {last30.map((d, i) => {
        const barH = (d.calls / maxVal) * chartH
        const x = PADDING.left + i * gap + (gap - barW) / 2
        const y = PADDING.top + chartH - barH

        // Label every 5th
        const showLabel = i % 5 === 0
        const labelDate = new Date(d.date)
        const labelText = `${labelDate.getMonth() + 1}/${labelDate.getDate()}`

        return (
          <g key={d.date}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx="2"
              fill="#2d5a27"
              opacity="0.75"
            />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={PADDING.top + chartH + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#6b6560"
              >
                {labelText}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// API Keys Tab
// ---------------------------------------------------------------------------

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyData[]>(DEMO_KEYS)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>(['read:transactions'])
  const [newType, setNewType] = useState<'live' | 'test'>('live')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  function handleGenerate() {
    if (!newName.trim()) return
    const { full, masked } = genKey(newType)
    const created: ApiKeyData = {
      id: genId(),
      name: newName.trim(),
      prefix: newType === 'live' ? 'sk_live' : 'sk_test',
      maskedKey: masked,
      scopes: newScopes,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: newType,
    }
    setKeys((prev) => [...prev, created])
    setGeneratedKey(full)
    setNewName('')
    setNewScopes(['read:transactions'])
    setShowForm(false)
  }

  function handleRevoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }

  function handleCopyGenerated() {
    if (!generatedKey) return
    navigator.clipboard.writeText(generatedKey).then(() => {
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    })
  }

  function toggleScope(scope: string) {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  return (
    <div>
      {/* Generated key banner */}
      {generatedKey && (
        <div
          className="rounded-xl p-4 mb-6 border"
          style={{ backgroundColor: '#fffbf5', borderColor: '#f0d090' }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1" style={{ color: '#1a1714' }}>
                Your new API key — store this securely
              </p>
              <p className="text-xs mb-3" style={{ color: '#6b6560' }}>
                We won&apos;t show it again. Copy it now and save it somewhere safe.
              </p>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: '#0f0e0d', border: '1px solid #2a2826' }}
              >
                <code className="flex-1 text-xs break-all" style={{ color: '#4caf70', fontFamily: 'ui-monospace, monospace' }}>
                  {generatedKey}
                </code>
                <button
                  onClick={handleCopyGenerated}
                  className="flex-shrink-0 text-xs px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: keyCopied ? '#1a2e1a' : '#2a2826',
                    color: keyCopied ? '#4caf70' : '#6b6560',
                  }}
                >
                  {keyCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <button onClick={() => setGeneratedKey(null)} style={{ color: '#6b6560', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Your API Keys</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Manage keys that give programmatic access to your CloseBooks data.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setGeneratedKey(null) }}
          className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
        >
          {showForm ? 'Cancel' : '+ Create New Key'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-5 border"
          style={{ backgroundColor: '#faf8f4', borderColor: '#e8e0d4' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>Create New API Key</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6560' }}>Key Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Production App"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e8e0d4',
                  color: '#1a1714',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#2d5a27')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e0d4')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6560' }}>Environment</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'live' | 'test')}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e8e0d4',
                  color: '#1a1714',
                }}
              >
                <option value="live">Live</option>
                <option value="test">Test</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium mb-2" style={{ color: '#6b6560' }}>Scopes</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SCOPES.map((scope) => (
                <button
                  key={scope}
                  onClick={() => toggleScope(scope)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all font-mono"
                  style={{
                    backgroundColor: newScopes.includes(scope) ? '#eef5ed' : '#f0ece4',
                    color: newScopes.includes(scope) ? '#2d5a27' : '#6b6560',
                    border: `1px solid ${newScopes.includes(scope) ? '#c8dfc6' : '#e8e0d4'}`,
                  }}
                >
                  {newScopes.includes(scope) ? '✓ ' : ''}{scope}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!newName.trim() || newScopes.length === 0}
            className="mt-4 text-sm px-5 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: newName.trim() && newScopes.length > 0 ? '#2d5a27' : '#e8e0d4',
              color: newName.trim() && newScopes.length > 0 ? '#ffffff' : '#6b6560',
            }}
          >
            Generate Key
          </button>
        </div>
      )}

      {/* Key list */}
      <div className="grid gap-3">
        {keys.map((k) => (
          <ApiKeyCard key={k.id} apiKey={k} onRevoke={handleRevoke} />
        ))}
      </div>

      {/* Rate limits */}
      <div
        className="mt-6 rounded-xl p-5 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>Rate Limits</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { plan: 'Free', limit: '1,000 req/day', color: '#6b6560', bg: '#f0ece4', border: '#e8e0d4' },
            { plan: 'Growth', limit: '10,000 req/day', color: '#b8734a', bg: '#fdf5ef', border: '#e0c9b6', current: true },
            { plan: 'Enterprise', limit: 'Unlimited', color: '#2d5a27', bg: '#eef5ed', border: '#c8dfc6' },
          ].map((tier) => (
            <div
              key={tier.plan}
              className="rounded-lg p-4 text-center relative"
              style={{ backgroundColor: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {tier.current && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#b8734a', color: '#ffffff' }}
                >
                  Current
                </span>
              )}
              <p className="text-xs font-semibold mb-1" style={{ color: tier.color }}>{tier.plan}</p>
              <p className="text-sm font-medium" style={{ color: '#1a1714' }}>{tier.limit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Webhooks Tab
// ---------------------------------------------------------------------------

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(DEMO_WEBHOOKS)
  const [showForm, setShowForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newEvents, setNewEvents] = useState<string[]>([])
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testedId, setTestedId] = useState<string | null>(null)

  function handleSave() {
    if (!newUrl.trim() || newEvents.length === 0) return
    setWebhooks((prev) => [
      ...prev,
      {
        id: genId(),
        url: newUrl.trim(),
        events: newEvents,
        status: 'active',
        lastDelivery: null,
      },
    ])
    setNewUrl('')
    setNewEvents([])
    setShowForm(false)
  }

  function handleDelete(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  function handleTest(id: string) {
    setTestingId(id)
    setTimeout(() => {
      setTestingId(null)
      setTestedId(id)
      setTimeout(() => setTestedId(null), 3000)
    }, 1500)
  }

  function toggleEvent(event: string) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Webhook Endpoints</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Receive real-time event notifications to your server.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
        >
          {showForm ? 'Cancel' : '+ Add Endpoint'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-5 border"
          style={{ backgroundColor: '#faf8f4', borderColor: '#e8e0d4' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>New Webhook Endpoint</h3>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6560' }}>Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://yourapp.com/webhooks/closebooks"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', color: '#1a1714' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#2d5a27')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e0d4')}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: '#6b6560' }}>Events to Listen For</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all font-mono"
                  style={{
                    backgroundColor: newEvents.includes(event) ? '#eef5ed' : '#f0ece4',
                    color: newEvents.includes(event) ? '#2d5a27' : '#6b6560',
                    border: `1px solid ${newEvents.includes(event) ? '#c8dfc6' : '#e8e0d4'}`,
                  }}
                >
                  {newEvents.includes(event) ? '✓ ' : ''}{event}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!newUrl.trim() || newEvents.length === 0}
            className="text-sm px-5 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: newUrl.trim() && newEvents.length > 0 ? '#2d5a27' : '#e8e0d4',
              color: newUrl.trim() && newEvents.length > 0 ? '#ffffff' : '#6b6560',
            }}
          >
            Save Endpoint
          </button>
        </div>
      )}

      {/* Webhook list */}
      <div className="grid gap-3">
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className="rounded-xl p-5 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4', boxShadow: '0 1px 4px rgba(26,23,20,0.05)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Status dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: wh.status === 'active' ? '#2d5a27' : '#6b6560' }}
                />
                <div className="min-w-0">
                  <p
                    className="text-sm font-mono truncate"
                    style={{ color: '#1a1714' }}
                    title={wh.url}
                  >
                    {wh.url}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    Last delivery: {formatDate(wh.lastDelivery)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {testedId === wh.id && (
                  <span className="text-xs" style={{ color: '#2d5a27' }}>✓ Sent!</span>
                )}
                <button
                  onClick={() => handleTest(wh.id)}
                  disabled={testingId === wh.id}
                  className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#f0ece4',
                    color: '#6b6560',
                    border: '1px solid #e8e0d4',
                    opacity: testingId === wh.id ? 0.7 : 1,
                  }}
                >
                  {testingId === wh.id ? 'Sending…' : 'Test'}
                </button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wh.events.map((ev) => (
                <span
                  key={ev}
                  className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e8e0d4' }}
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Supported events legend */}
      <div
        className="mt-6 rounded-xl p-5 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>Supported Events</h3>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {[
            { event: 'transaction.created', desc: 'New transaction imported or created' },
            { event: 'close.completed',     desc: 'Monthly close finalized by bookkeeper' },
            { event: 'exception.flagged',   desc: 'Anomaly or exception raised by Radar' },
            { event: 'document.received',   desc: 'New document uploaded to Vault' },
          ].map((e) => (
            <div key={e.event} className="flex items-start gap-2">
              <span
                className="text-xs font-mono mt-0.5"
                style={{ color: '#b8734a' }}
              >
                {e.event}
              </span>
              <span className="text-xs" style={{ color: '#6b6560' }}>— {e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Partners Tab
// ---------------------------------------------------------------------------

function PartnersTab() {
  const [partners, setPartners] = useState<Partner[]>(PARTNERS)
  const [oauthPartner, setOauthPartner] = useState<Partner | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  function handleConnect(partner: Partner) {
    setOauthPartner(partner)
    setConnecting(false)
    setConnected(false)
  }

  function startOAuth() {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      setTimeout(() => {
        setPartners((prev) =>
          prev.map((p) => (p.id === oauthPartner?.id ? { ...p, connected: true } : p))
        )
        setOauthPartner(null)
        setConnected(false)
      }, 1500)
    }, 2000)
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Partner Integrations</h2>
        <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Connect your existing tools to power automated bookkeeping.</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="rounded-xl p-5 border flex flex-col gap-4"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e8e0d4',
              boxShadow: '0 1px 4px rgba(26,23,20,0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Logo placeholder */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: partner.color, color: '#ffffff' }}
              >
                {partner.initials}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{partner.name}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: partner.connected ? '#eef5ed' : '#f0ece4',
                    color: partner.connected ? '#2d5a27' : '#6b6560',
                    border: `1px solid ${partner.connected ? '#c8dfc6' : '#e8e0d4'}`,
                  }}
                >
                  {partner.connected ? '● Connected' : 'Available'}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed flex-1" style={{ color: '#6b6560' }}>
              {partner.description}
            </p>
            {partner.connected ? (
              <button
                className="text-xs px-3 py-1.5 rounded-lg w-full transition-colors"
                style={{ backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e8e0d4' }}
              >
                Manage
              </button>
            ) : (
              <button
                onClick={() => handleConnect(partner)}
                className="text-xs px-3 py-1.5 rounded-lg w-full font-medium transition-colors"
                style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
              >
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {/* OAuth modal */}
      {oauthPartner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
          onClick={() => !connecting && !connected && setOauthPartner(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4"
              style={{ backgroundColor: oauthPartner.color, color: '#ffffff' }}
            >
              {oauthPartner.initials}
            </div>

            {!connecting && !connected && (
              <>
                <h3 className="text-base font-semibold mb-2" style={{ color: '#1a1714' }}>
                  Connect {oauthPartner.name}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
                  You&apos;ll be redirected to {oauthPartner.name} to authorize access. This is read-only unless you grant write permissions.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOauthPartner(null)}
                    className="flex-1 text-sm py-2.5 rounded-xl border transition-colors"
                    style={{ borderColor: '#e8e0d4', color: '#6b6560', backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startOAuth}
                    className="flex-1 text-sm py-2.5 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {connecting && (
              <>
                <p className="text-base font-semibold mb-2" style={{ color: '#1a1714' }}>
                  Redirecting to {oauthPartner.name}…
                </p>
                <p className="text-sm mb-4" style={{ color: '#6b6560' }}>Completing OAuth handshake</p>
                {/* Spinner */}
                <div className="flex justify-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#2d5a27', borderTopColor: 'transparent' }}
                  />
                </div>
              </>
            )}

            {connected && (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"
                  style={{ backgroundColor: '#eef5ed' }}
                >
                  ✓
                </div>
                <p className="text-base font-semibold" style={{ color: '#2d5a27' }}>
                  {oauthPartner.name} connected!
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Usage Tab
// ---------------------------------------------------------------------------

function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/connect/usage')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#2d5a27', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm" style={{ color: '#6b6560' }}>Failed to load usage data.</p>
  }

  const pct = Math.min((data.currentMonth.total / data.currentMonth.limit) * 100, 100)

  return (
    <div className="grid gap-6">
      {/* Usage meter */}
      <div
        className="rounded-xl p-5 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>API Calls This Month</h3>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>Resets May 1, 2026</p>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: pct > 80 ? '#b8734a' : '#2d5a27' }}
          >
            {data.currentMonth.total.toLocaleString()} / {data.currentMonth.limit.toLocaleString()}
          </span>
        </div>
        <div
          className="w-full rounded-full h-3 overflow-hidden"
          style={{ backgroundColor: '#f0ece4' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: pct > 80 ? '#b8734a' : '#2d5a27',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6b6560' }}>
          {(data.currentMonth.limit - data.currentMonth.total).toLocaleString()} calls remaining
        </p>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-xl p-5 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#1a1714' }}>Daily API Calls — Last 30 Days</h3>
        <UsageBarChart daily={data.daily} />
      </div>

      {/* Top endpoints */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: '#e8e0d4' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#1a1714' }}>Top Endpoints</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#faf8f4' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6b6560' }}>Endpoint</th>
                <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: '#6b6560' }}>Calls</th>
                <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: '#6b6560' }}>Avg Latency</th>
                <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: '#6b6560' }}>Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.topEndpoints.map((ep, i) => (
                <tr
                  key={ep.endpoint}
                  style={{ borderTop: i > 0 ? '1px solid #f0ece4' : 'none' }}
                >
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#1a1714' }}>{ep.endpoint}</td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: '#1a1714' }}>{ep.calls.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: '#6b6560' }}>{ep.avgLatencyMs}ms</td>
                  <td className="px-5 py-3 text-right text-xs">
                    <span
                      style={{ color: ep.errorRate > 0.3 ? '#dc2626' : ep.errorRate > 0.1 ? '#b8734a' : '#2d5a27' }}
                    >
                      {ep.errorRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing */}
      <div
        className="rounded-xl p-5 border flex items-center justify-between"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            {data.billing.plan} Plan
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
            Renews {new Date(data.billing.renewsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold" style={{ color: '#1a1714' }}>
            ${data.billing.amount.toLocaleString()}<span className="text-xs font-normal" style={{ color: '#6b6560' }}>/month</span>
          </p>
          <button
            className="text-xs mt-1 underline"
            style={{ color: '#b8734a' }}
          >
            Manage billing
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'api-keys',  label: 'API Keys'  },
    { id: 'webhooks',  label: 'Webhooks'  },
    { id: 'partners',  label: 'Partners'  },
    { id: 'usage',     label: 'Usage'     },
  ]

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: '#b8734a' }}
        >
          Developer
        </p>
        <h1
          className="text-2xl font-semibold mb-2"
          style={{
            color: '#1a1714',
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          }}
        >
          CloseBooks Connect
        </h1>
        <p className="text-sm" style={{ color: '#6b6560' }}>
          API keys, webhooks, and partner integrations — the programmable layer for your accounting data.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ backgroundColor: '#f0ece4', border: '1px solid #e8e0d4' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-sm px-4 py-2 rounded-lg transition-all font-medium"
            style={{
              backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? '#1a1714' : '#6b6560',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(26,23,20,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'api-keys'  && <ApiKeysTab />}
      {activeTab === 'webhooks'  && <WebhooksTab />}
      {activeTab === 'partners'  && <PartnersTab />}
      {activeTab === 'usage'     && <UsageTab />}
    </div>
  )
}
