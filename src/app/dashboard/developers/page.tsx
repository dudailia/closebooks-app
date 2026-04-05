'use client'

import { useEffect, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY_STORAGE_KEY = 'cb_api_key'
const WEBHOOK_URL_STORAGE_KEY = 'cb_webhook_url'

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `cb_sk_live_${result}`
}

function maskKey(key: string): string {
  if (key.length <= 12) return key
  return key.slice(0, 12) + '•••••••••'
}

// ---------------------------------------------------------------------------
// Code block component
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1e1e2e', border: '1px solid #2e2e42' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: '#2e2e42', backgroundColor: '#16162a' }}
      >
        <span className="text-xs font-mono font-medium" style={{ color: '#7c7c9e' }}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: copied ? '#1a3a1a' : '#2e2e42',
            color: copied ? '#4ade80' : '#7c7c9e',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre
        className="p-4 overflow-x-auto text-xs leading-relaxed"
        style={{ color: '#cdd6f4', fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace', margin: 0 }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Endpoint block
// ---------------------------------------------------------------------------

function EndpointBlock({
  method,
  path,
  description,
  headers,
  body,
  response,
}: {
  method: 'GET' | 'POST'
  path: string
  description: string
  headers: string
  body?: string
  response: string
}) {
  const [open, setOpen] = useState(false)

  const methodColors =
    method === 'POST'
      ? { bg: '#dcfce7', text: '#166534', border: '#86efac' }
      : { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded font-mono"
          style={{
            backgroundColor: methodColors.bg,
            color: methodColors.text,
            border: `1px solid ${methodColors.border}`,
            minWidth: 44,
            textAlign: 'center',
          }}
        >
          {method}
        </span>
        <span
          className="flex-1 text-sm font-mono font-medium"
          style={{ color: '#1a1714' }}
        >
          {path}
        </span>
        <span className="text-xs" style={{ color: '#6b6560' }}>{description}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#a09a94' }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: '#f0ebe3' }}
        >
          <div className="pt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>HEADERS</p>
              <div
                className="rounded-lg px-3 py-2 font-mono text-xs"
                style={{ backgroundColor: '#f5f0ea', color: '#1a1714' }}
              >
                {headers}
              </div>
            </div>

            {body && (
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>REQUEST BODY</p>
                <div
                  className="rounded-lg px-3 py-2 font-mono text-xs whitespace-pre"
                  style={{ backgroundColor: '#f5f0ea', color: '#1a1714' }}
                >
                  {body}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#6b6560' }}>RESPONSE</p>
              <div
                className="rounded-lg px-3 py-2 font-mono text-xs whitespace-pre"
                style={{ backgroundColor: '#f5f0ea', color: '#1a1714' }}
              >
                {response}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Code examples
// ---------------------------------------------------------------------------

const JS_EXAMPLE = `const response = await fetch('https://closebooks-app.vercel.app/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    client_name: 'Acme Corp',
    transactions: [
      {
        date: '2024-03-01',
        description: 'STRIPE PAYOUT',
        amount: 5000,
        type: 'credit'
      }
    ]
  })
});
const data = await response.json();
console.log(data.job_id);`

const PYTHON_EXAMPLE = `import requests

url = 'https://closebooks-app.vercel.app/api/v1/jobs'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
payload = {
    'client_name': 'Acme Corp',
    'transactions': [
        {
            'date': '2024-03-01',
            'description': 'STRIPE PAYOUT',
            'amount': 5000,
            'type': 'credit'
        }
    ]
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print(data['job_id'])`

const CURL_EXAMPLE = `curl -X POST https://closebooks-app.vercel.app/api/v1/jobs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "Acme Corp",
    "transactions": [
      {
        "date": "2024-03-01",
        "description": "STRIPE PAYOUT",
        "amount": 5000,
        "type": "credit"
      }
    ]
  }'`

const WEBHOOK_PAYLOAD_EXAMPLE = `{
  "event": "job.completed",
  "timestamp": "2024-03-01T14:32:00Z",
  "data": {
    "job_id": "job_a1b2c3d4e5",
    "client_name": "Acme Corp",
    "status": "completed",
    "transactions_count": 42,
    "flagged_count": 2,
    "review_url": "https://closebooks-app.vercel.app/dashboard/review/job_a1b2c3d4e5"
  }
}`

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type MainTab = 'endpoints' | 'examples' | 'webhooks'
type LangTab = 'javascript' | 'python' | 'curl'

export default function DevelopersPage() {
  const [mounted, setMounted] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSaved, setWebhookSaved] = useState(false)

  const [mainTab, setMainTab] = useState<MainTab>('endpoints')
  const [langTab, setLangTab] = useState<LangTab>('javascript')

  // Load from localStorage on mount
  useEffect(() => {
    let key = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (!key) {
      key = generateApiKey()
      localStorage.setItem(API_KEY_STORAGE_KEY, key)
    }
    setApiKey(key)

    const savedWebhook = localStorage.getItem(WEBHOOK_URL_STORAGE_KEY) ?? ''
    setWebhookUrl(savedWebhook)

    setMounted(true)
  }, [])

  const handleCopyKey = useCallback(() => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    })
  }, [apiKey])

  function handleRegenerate() {
    if (!confirmRegen) {
      setConfirmRegen(true)
      return
    }
    const newKey = generateApiKey()
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey)
    setApiKey(newKey)
    setKeyVisible(false)
    setConfirmRegen(false)
  }

  function handleSaveWebhook() {
    localStorage.setItem(WEBHOOK_URL_STORAGE_KEY, webhookUrl)
    setWebhookSaved(true)
    setTimeout(() => setWebhookSaved(false), 2000)
  }

  const displayedKey = mounted ? (keyVisible ? apiKey : maskKey(apiKey)) : '••••••••••••••••••••'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-8 page-enter">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#e8f0e6', border: '1px solid #c8dbc4' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M7 8l-4 3 4 3M15 8l4 3-4 3M13 5l-4 12" stroke="#2d5a27" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1
              className="text-3xl"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
                letterSpacing: '-0.02em',
              }}
            >
              Developers
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
              Integrate CloseBooks into your workflow with our REST API and webhooks.
            </p>
          </div>
        </div>

        {/* Beta banner */}
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{ borderColor: '#fcd34d', backgroundColor: '#fffbeb' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <path d="M8 2L1.5 13.5h13L8 2z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
            <path d="M8 6.5v3.5M8 11.5v.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="text-xs" style={{ color: '#92400e', lineHeight: 1.6 }}>
            <span className="font-semibold">The CloseBooks API is in beta.</span>{' '}
            Endpoints may change before general availability. Join our beta program to stay updated.
          </p>
        </div>

        {/* API Key card */}
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  color: '#1a1714',
                }}
              >
                API Key
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                Use this key to authenticate all API requests.
              </p>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
            >
              Live
            </span>
          </div>

          {/* Key display */}
          <div
            className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5"
            style={{ backgroundColor: '#faf8f4', borderColor: '#e8e0d4' }}
          >
            <span
              className="flex-1 font-mono text-sm select-all overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: '#1a1714' }}
            >
              {displayedKey}
            </span>

            <button
              onClick={() => setKeyVisible((v) => !v)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: '#6b6560', backgroundColor: '#f0ebe3' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e0d4' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0ebe3' }}
            >
              {keyVisible ? 'Hide' : 'Show'}
            </button>

            <button
              onClick={handleCopyKey}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: keyCopied ? '#dcfce7' : '#f0ebe3',
                color: keyCopied ? '#166534' : '#6b6560',
              }}
            >
              {keyCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
              <rect x="1" y="5.5" width="11" height="7" rx="1.5" stroke="#b8734a" strokeWidth="1.2" fill="none" />
              <path d="M4 5.5V4a2.5 2.5 0 015 0v1.5" stroke="#b8734a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <circle cx="6.5" cy="9" r="1" fill="#b8734a" />
            </svg>
            <p className="text-xs" style={{ color: '#b8734a' }}>
              Keep your API key secret. Never share it publicly or commit it to version control.
            </p>
          </div>

          {/* Regenerate */}
          <div className="flex items-center gap-3 pt-1">
            {confirmRegen ? (
              <>
                <p className="text-xs" style={{ color: '#dc2626' }}>
                  This will invalidate your current key. Are you sure?
                </p>
                <button
                  onClick={handleRegenerate}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: '#dc2626' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626' }}
                >
                  Yes, regenerate
                </button>
                <button
                  onClick={() => setConfirmRegen(false)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors border"
                  style={{ color: '#6b6560', borderColor: '#e8e0d4', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleRegenerate}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors border flex items-center gap-1.5"
                style={{ color: '#6b6560', borderColor: '#e8e0d4', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea'; e.currentTarget.style.color = '#1a1714' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b6560' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Regenerate key
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div
            className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ backgroundColor: '#f0ebe3' }}
          >
            {(['endpoints', 'examples', 'webhooks'] as MainTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
                style={{
                  backgroundColor: mainTab === tab ? '#ffffff' : 'transparent',
                  color: mainTab === tab ? '#1a1714' : '#6b6560',
                  boxShadow: mainTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab === 'endpoints' ? 'Endpoints' : tab === 'examples' ? 'Code Examples' : 'Webhooks'}
              </button>
            ))}
          </div>

          {/* Endpoints tab */}
          {mainTab === 'endpoints' && (
            <div className="mt-6 space-y-3">
              <EndpointBlock
                method="POST"
                path="/api/v1/jobs"
                description="Submit transactions for categorization"
                headers="Authorization: Bearer {API_KEY}"
                body={`{
  "client_name": "Acme Corp",
  "transactions": [
    {
      "date": "2024-03-01",
      "description": "STRIPE PAYOUT",
      "amount": 5000,
      "type": "credit"
    }
  ]
}`}
                response={`{
  "job_id": "job_a1b2c3d4e5",
  "status": "processing",
  "transactions_count": 1
}`}
              />
              <EndpointBlock
                method="GET"
                path="/api/v1/jobs/{job_id}"
                description="Get categorization results for a job"
                headers="Authorization: Bearer {API_KEY}"
                response={`{
  "job_id": "job_a1b2c3d4e5",
  "client_name": "Acme Corp",
  "status": "completed",
  "transactions": [
    {
      "date": "2024-03-01",
      "description": "STRIPE PAYOUT",
      "amount": 5000,
      "type": "credit",
      "category": "Revenue",
      "confidence": 0.97
    }
  ]
}`}
              />
              <EndpointBlock
                method="GET"
                path="/api/v1/clients"
                description="List all clients"
                headers="Authorization: Bearer {API_KEY}"
                response={`{
  "clients": [
    {
      "id": "client_xyz123",
      "name": "Acme Corp",
      "job_count": 14
    }
  ]
}`}
              />
            </div>
          )}

          {/* Code examples tab */}
          {mainTab === 'examples' && (
            <div className="mt-6 space-y-4">
              {/* Language selector */}
              <div
                className="flex gap-1 p-1 rounded-xl w-fit"
                style={{ backgroundColor: '#1e1e2e' }}
              >
                {(['javascript', 'python', 'curl'] as LangTab[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLangTab(lang)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
                    style={{
                      backgroundColor: langTab === lang ? '#2e2e42' : 'transparent',
                      color: langTab === lang ? '#cdd6f4' : '#7c7c9e',
                    }}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6b6560' }}>
                  POST /api/v1/jobs — Submit transactions for categorization
                </p>
                {langTab === 'javascript' && (
                  <CodeBlock code={JS_EXAMPLE} language="javascript" />
                )}
                {langTab === 'python' && (
                  <CodeBlock code={PYTHON_EXAMPLE} language="python" />
                )}
                {langTab === 'curl' && (
                  <CodeBlock code={CURL_EXAMPLE} language="bash (cURL)" />
                )}
              </div>
            </div>
          )}

          {/* Webhooks tab */}
          {mainTab === 'webhooks' && (
            <div className="mt-6 space-y-6">
              {/* Webhook URL config */}
              <div
                className="rounded-2xl border p-6 space-y-4"
                style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
              >
                <div>
                  <h3
                    className="text-base font-semibold"
                    style={{
                      fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                      color: '#1a1714',
                    }}
                  >
                    Webhook Endpoint
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                    CloseBooks will POST event payloads to this URL when jobs complete or transactions are flagged.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => { setWebhookUrl(e.target.value); setWebhookSaved(false) }}
                    placeholder="https://your-app.com/webhooks/closebooks"
                    className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: '#e8e0d4',
                      backgroundColor: '#faf8f4',
                      color: '#1a1714',
                    }}
                  />
                  <button
                    onClick={handleSaveWebhook}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors shrink-0"
                    style={{
                      backgroundColor: webhookSaved ? '#2d5a27' : '#2d5a27',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                  >
                    {webhookSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>

                {/* Events */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#6b6560' }}>EVENTS</p>
                  <div className="space-y-2">
                    {[
                      { event: 'job.completed', desc: 'Fired when a categorization job finishes successfully.' },
                      { event: 'job.needs_review', desc: 'Fired when a job has transactions requiring human review.' },
                      { event: 'transaction.flagged', desc: 'Fired when an individual transaction is flagged for review.' },
                    ].map(({ event, desc }) => (
                      <div
                        key={event}
                        className="flex items-start gap-3 rounded-xl px-3.5 py-2.5"
                        style={{ backgroundColor: '#faf8f4', border: '1px solid #e8e0d4' }}
                      >
                        <code
                          className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
                        >
                          {event}
                        </code>
                        <span className="text-xs" style={{ color: '#6b6560', lineHeight: 1.5 }}>
                          {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payload example */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6b6560' }}>
                  EXAMPLE WEBHOOK PAYLOAD
                </p>
                <CodeBlock code={WEBHOOK_PAYLOAD_EXAMPLE} language="json" />
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
