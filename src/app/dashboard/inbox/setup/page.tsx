'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadFirmSettings, saveFirmSettings } from '@/lib/firmSettings'

const INBOX_DOMAIN = 'inbox.closebooks.app'

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => null)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{
        padding: '5px 12px', borderRadius: 8, border: '1px solid #e8e0d4',
        backgroundColor: copied ? '#f0fdf4' : '#fff',
        color: copied ? '#15803d' : '#6b6560',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ─── CodeBlock ───────────────────────────────────────────────────────────────

function CodeBlock({ children }: { children: string }) {
  return (
    <div style={{
      position: 'relative', backgroundColor: '#0f0e0d', borderRadius: 10,
      padding: '14px 16px', fontFamily: '"JetBrains Mono", monospace',
      fontSize: 12, color: '#e8e0d4', lineHeight: 1.6,
    }}>
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <CopyButton text={children} />
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingRight: 60 }}>
        {children}
      </pre>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InboxSetupPage() {
  const [slug, setSlug]               = useState('')
  const [savedSlug, setSavedSlug]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent]       = useState(false)
  const [testEmail, setTestEmail]     = useState('')
  const [webhookUrl, setWebhookUrl]   = useState('https://closebooks.app/api/inbox/webhook')

  useEffect(() => {
    const s = loadFirmSettings()
    setSlug(s.inboxSlug ?? '')
    setSavedSlug(s.inboxSlug ?? '')
    setWebhookUrl(`${window.location.origin}/api/inbox/webhook`)
  }, [])

  async function handleSave() {
    const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    setSaving(true)
    try {
      const current = loadFirmSettings()
      await saveFirmSettings({ ...current, inboxSlug: cleaned })
      setSavedSlug(cleaned)
      setSlug(cleaned)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!testEmail) return
    setTestSending(true)
    try {
      await fetch('/api/inbox/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmail,
          toName: 'Test User',
          clientName: 'Test Client',
          requestedItems: ['Bank statement for March 2026', 'Signed engagement letter'],
          portalToken: 'test-token',
          requestId: 'test-001',
        }),
      })
      setTestSent(true)
      setTimeout(() => setTestSent(false), 4000)
    } finally {
      setTestSending(false)
    }
  }

  const inboxAddr = savedSlug
    ? `docs@${savedSlug}.${INBOX_DOMAIN}`
    : `docs@yourfirm.${INBOX_DOMAIN}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Back */}
        <Link
          href="/dashboard/inbox"
          style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}
        >
          ← Back to Inbox
        </Link>

        <h1 style={{
          fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26,
          color: '#1a1714', margin: '0 0 6px 0', letterSpacing: '-0.02em',
        }}>
          Inbox Setup
        </h1>
        <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 32px 0' }}>
          Set up your firm's email address so clients can forward documents directly to CloseBooks.
        </p>

        {/* Step 1: Firm slug */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4',
          borderRadius: 14, padding: '24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              1
            </span>
            <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, color: '#1a1714', margin: 0 }}>
              Choose your firm slug
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 14px 0' }}>
            This becomes your firm's inbox address. Use something short and memorable.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b6560', whiteSpace: 'nowrap' }}>docs@</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="yourfirm"
              style={{
                flex: 1, padding: '9px 12px', border: '1px solid #e8e0d4', borderRadius: 9,
                fontSize: 13, fontFamily: 'monospace', color: '#1a1714', backgroundColor: '#faf8f4',
              }}
            />
            <span style={{ fontSize: 13, color: '#6b6560', whiteSpace: 'nowrap' }}>.{INBOX_DOMAIN}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <code style={{ fontSize: 12, color: '#2d5a27', fontFamily: 'monospace' }}>
              {slug ? `docs@${slug}.${INBOX_DOMAIN}` : 'Enter a slug above'}
            </code>
            <button
              onClick={handleSave}
              disabled={saving || !slug.trim()}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 700,
                backgroundColor: saving ? '#6b9f65' : '#2d5a27',
                color: '#fff', border: 'none', borderRadius: 9,
                cursor: slug.trim() ? 'pointer' : 'not-allowed',
                opacity: !slug.trim() ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {savedSlug && (
            <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: '#e8f0e6', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#2d5a27', margin: 0, fontWeight: 600 }}>
                ✓ Your inbox address:{' '}
                <code style={{ fontFamily: 'monospace' }}>{inboxAddr}</code>
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Postmark webhook */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4',
          borderRadius: 14, padding: '24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              2
            </span>
            <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, color: '#1a1714', margin: 0 }}>
              Configure Postmark Inbound
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 14px 0' }}>
            Set up Postmark to forward inbound emails to CloseBooks. This takes about 5 minutes.
          </p>
          <ol style={{ fontSize: 13, color: '#1a1714', margin: '0 0 16px 0', paddingLeft: 20, lineHeight: 2 }}>
            <li>Go to <strong>postmarkapp.com</strong> → Servers → Inbound → Add Server</li>
            <li>
              Set the Inbound address to catch-all for{' '}
              <code style={{ fontFamily: 'monospace', fontSize: 11, backgroundColor: '#f5f0ea', padding: '1px 5px', borderRadius: 4 }}>
                inbox.closebooks.app
              </code>
            </li>
            <li>Set the webhook URL to:</li>
          </ol>
          <CodeBlock>{webhookUrl}</CodeBlock>
          <p style={{ fontSize: 12, color: '#6b6560', margin: '12px 0 0 0' }}>
            4. Add your{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>POSTMARK_WEBHOOK_TOKEN</code>{' '}
            env var in Vercel and set the same value as the{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>x-postmark-token</code>{' '}
            header in Postmark's webhook settings.
          </p>
        </div>

        {/* Step 3: DNS / MX Records */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4',
          borderRadius: 14, padding: '24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              3
            </span>
            <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, color: '#1a1714', margin: 0 }}>
              Add DNS records (optional)
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 14px 0' }}>
            To receive email at{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 12 }}>
              docs@{savedSlug || 'yourfirm'}.inbox.closebooks.app
            </code>
            , add these records to your DNS:
          </p>
          <CodeBlock>{`MX  ${savedSlug || 'yourfirm'}.inbox.closebooks.app  →  inbound.postmarkapp.com  (priority 10)`}</CodeBlock>
          <p style={{ fontSize: 12, color: '#6b6560', marginTop: 10 }}>
            Or use the Postmark wildcard approach: point{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>*.inbox.closebooks.app</code>{' '}
            MX to{' '}
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>inbound.postmarkapp.com</code>.
          </p>
        </div>

        {/* Step 4: Tell clients */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4',
          borderRadius: 14, padding: '24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              4
            </span>
            <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16, color: '#1a1714', margin: 0 }}>
              Tell clients to forward documents
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 14px 0' }}>
            Copy this instruction to send to your clients:
          </p>
          <CodeBlock>{`To submit receipts, invoices, and bank statements to your accountant, forward them to:

${inboxAddr}

For Gmail auto-forwarding:
1. Settings → Filters → Create a new filter
2. From: (leave blank) / Has attachment: checked
3. Forward to: ${inboxAddr}

Your documents will be automatically extracted and matched to your account.`}</CodeBlock>
        </div>

        {/* Test email */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4',
          borderRadius: 14, padding: '24px',
        }}>
          <h2 style={{
            fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 16,
            color: '#1a1714', margin: '0 0 12px 0',
          }}>
            Send a test document request
          </h2>
          <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 14px 0' }}>
            Send a test document request email to verify your Postmark setup is working.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              style={{
                flex: 1, padding: '9px 12px', border: '1px solid #e8e0d4', borderRadius: 9,
                fontSize: 13, color: '#1a1714', backgroundColor: '#faf8f4',
              }}
            />
            <button
              onClick={handleSendTest}
              disabled={testSending || !testEmail || testSent}
              style={{
                padding: '9px 18px', fontSize: 13, fontWeight: 700,
                backgroundColor: testSent ? '#2d5a27' : '#1a1714',
                color: '#fff', border: 'none', borderRadius: 9,
                cursor: testEmail ? 'pointer' : 'not-allowed',
                opacity: !testEmail ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {testSent ? '✓ Sent!' : testSending ? 'Sending…' : 'Send Test →'}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
