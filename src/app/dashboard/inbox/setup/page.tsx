'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3

interface RoutingRule {
  id: string
  fromEmail: string
  clientName: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INBOX_EMAIL = 'books@yourfirm.closebooks.io'
const SMS_NUMBER  = '+1 (415) 555-0142'

// ─────────────────────────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: small ? '4px 10px' : '7px 14px',
        borderRadius: 8,
        border: '1px solid #e8e0d4',
        backgroundColor: copied ? '#f0fdf4' : '#ffffff',
        color: copied ? '#15803d' : '#6b6560',
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({ current, completed }: { current: StepKey; completed: Set<StepKey> }) {
  const steps: { key: StepKey; label: string }[] = [
    { key: 1, label: 'Inbox Email' },
    { key: 2, label: 'SMS Setup' },
    { key: 3, label: 'Routing Rules' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((step, idx) => {
        const isDone    = completed.has(step.key)
        const isCurrent = current === step.key

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'none' }}>
            {/* Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${isDone ? '#22c55e' : isCurrent ? '#2d5a27' : '#e8e0d4'}`,
                  backgroundColor: isDone ? '#dcfce7' : isCurrent ? '#2d5a27' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s',
                }}
              >
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? '#ffffff' : '#6b6560' }}>
                    {step.key}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? '#1a1714' : '#6b6560', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: completed.has(step.key) ? '#22c55e' : '#e8e0d4',
                  margin: '-18px 8px 0',
                  transition: 'background-color 0.3s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Inbox Email
// ─────────────────────────────────────────────────────────────────────────────

function Step1({ onComplete }: { onComplete: () => void }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1a1714' }}>
        Your CloseBooks Inbox Address
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b6560' }}>
        Clients and vendors can forward documents to this address. CloseBooks AI will parse and match them automatically.
      </p>

      {/* Email display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <code style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a1714', fontFamily: 'monospace' }}>
          {INBOX_EMAIL}
        </code>
        <CopyButton text={INBOX_EMAIL} />
      </div>

      {/* Instructions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {[
          { n: '1', title: 'Share with clients', body: 'Tell your clients to forward receipts and invoices to your inbox address.' },
          { n: '2', title: 'Configure vendor auto-forward', body: 'Set up automatic forwarding from vendors like Office Depot or Amazon Business.' },
          { n: '3', title: 'Use sub-addressing for routing', body: `Use books+clientname@yourfirm.closebooks.io to route documents to the right client.` },
        ].map(item => (
          <div
            key={item.n}
            style={{
              display: 'flex',
              gap: 14,
              padding: '14px 18px',
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#e8f0e6',
                color: '#2d5a27',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {item.n}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{item.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b6560' }}>{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 12,
          border: 'none',
          backgroundColor: '#2d5a27',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Continue to SMS Setup →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — SMS Setup
// ─────────────────────────────────────────────────────────────────────────────

function Step2({ onComplete }: { onComplete: () => void }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1a1714' }}>
        SMS Document Capture
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b6560' }}>
        Clients can text photos of receipts directly to your CloseBooks phone number. Powered by Twilio.
      </p>

      {/* Phone number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 14,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.69 1.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <code style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a1714', fontFamily: 'monospace' }}>
          {SMS_NUMBER}
        </code>
        <CopyButton text={SMS_NUMBER} />
      </div>

      {/* Instructions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '📸', title: 'Snap a photo', body: 'Client takes a photo of a receipt with their phone.' },
          { icon: '📩', title: 'Text to your number', body: `Client texts the photo to ${SMS_NUMBER}. No app required.` },
          { icon: '🤖', title: 'AI parses instantly', body: 'CloseBooks reads the receipt, extracts data, and queues it for matching.' },
        ].map(item => (
          <div
            key={item.title}
            style={{
              display: 'flex',
              gap: 14,
              padding: '14px 18px',
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{item.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b6560' }}>{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 10,
          marginBottom: 24,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
          <strong>Demo mode:</strong> SMS is simulated. In production, connect your Twilio account in Settings → Integrations.
        </p>
      </div>

      <button
        onClick={onComplete}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 12,
          border: 'none',
          backgroundColor: '#2d5a27',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Continue to Routing Rules →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Routing Rules
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_CLIENTS = ['Acme Corp', 'Greenfield LLC', 'Sunrise Bakery', 'Harbor Design Co.']

function Step3({ onComplete }: { onComplete: () => void }) {
  const [rules, setRules] = useState<RoutingRule[]>([
    { id: 'r1', fromEmail: 'sarah@acme.com',          clientName: 'Acme Corp' },
    { id: 'r2', fromEmail: 'invoices@officedepot.com', clientName: 'Greenfield LLC' },
  ])
  const [newFrom, setNewFrom] = useState('')
  const [newClient, setNewClient] = useState(DEMO_CLIENTS[0])

  function addRule() {
    if (!newFrom.trim()) return
    setRules(r => [...r, { id: `r${Date.now()}`, fromEmail: newFrom.trim(), clientName: newClient }])
    setNewFrom('')
  }

  function removeRule(id: string) {
    setRules(r => r.filter(x => x.id !== id))
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1a1714' }}>
        Email Routing Rules
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b6560' }}>
        Map sender email addresses to clients. When a document arrives from a matched address, CloseBooks automatically assigns it to the right client.
      </p>

      {/* Existing rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {rules.map(rule => (
          <div
            key={rule.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 10,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style={{ flex: 1, fontSize: 13, color: '#1a1714', fontFamily: 'monospace' }}>{rule.fromEmail}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8734a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2d5a27' }}>{rule.clientName}</span>
            <button
              onClick={() => removeRule(rule.id)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b6560', padding: 4, borderRadius: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new rule */}
      <div
        style={{
          padding: '16px 18px',
          backgroundColor: '#faf8f4',
          border: '1px dashed #d4c9bc',
          borderRadius: 12,
          marginBottom: 28,
        }}
      >
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Add Routing Rule
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="sender@example.com"
            value={newFrom}
            onChange={e => setNewFrom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            style={{
              flex: 2,
              minWidth: 160,
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              fontSize: 13,
              color: '#1a1714',
              outline: 'none',
            }}
          />
          <select
            value={newClient}
            onChange={e => setNewClient(e.target.value)}
            style={{
              flex: 1,
              minWidth: 140,
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              fontSize: 13,
              color: '#1a1714',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {DEMO_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={addRule}
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: 'none',
              backgroundColor: '#b8734a',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Add Rule
          </button>
        </div>
      </div>

      <button
        onClick={onComplete}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 12,
          border: 'none',
          backgroundColor: '#2d5a27',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Finish Setup →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function InboxSetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<StepKey>(1)
  const [completed, setCompleted]     = useState<Set<StepKey>>(new Set())
  const [done, setDone]               = useState(false)

  function completeStep(step: StepKey) {
    setCompleted(prev => { const next = new Set(prev); next.add(step); return next })
    if (step < 3) {
      setCurrentStep((step + 1) as StepKey)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard/inbox'), 2000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>

      <main style={{ flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '32px 20px 60px' }}>
        {/* Back */}
        <Link
          href="/dashboard/inbox"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6560', textDecoration: 'none', marginBottom: 28, fontWeight: 500 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Inbox
        </Link>

        <div style={{ marginBottom: 8 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#1a1714' }}>Inbox Setup</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#6b6560' }}>Configure your document inbox in 3 quick steps.</p>
        </div>

        <div style={{ height: 1, backgroundColor: '#e8e0d4', margin: '20px 0 32px' }} />

        {/* Step indicator */}
        <StepIndicator current={currentStep} completed={completed} />

        {/* Step content */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 18,
            padding: '30px 32px',
          }}
        >
          {done ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#1a1714' }}>Inbox configured!</h2>
              <p style={{ margin: 0, fontSize: 14, color: '#6b6560' }}>Redirecting to your inbox…</p>
            </div>
          ) : currentStep === 1 ? (
            <Step1 onComplete={() => completeStep(1)} />
          ) : currentStep === 2 ? (
            <Step2 onComplete={() => completeStep(2)} />
          ) : (
            <Step3 onComplete={() => completeStep(3)} />
          )}
        </div>
      </main>

    </div>
  )
}
