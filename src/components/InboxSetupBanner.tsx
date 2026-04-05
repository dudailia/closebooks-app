'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// InboxSetupBanner
// Shown at the top of the inbox when the inbox email has not been configured.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  inboxEmail: string
}

export default function InboxSetupBanner({ inboxEmail }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (dismissed) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inboxEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API not available
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#fdf4e7',
        border: '1px solid #f5d9a8',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: '#fde8c5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1a1714' }}>
          Set up your CloseBooks inbox to start receiving documents
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b6560' }}>
          Forward receipts, invoices, and statements to your unique inbox address. AI will parse and match them automatically.
        </p>

        {/* Email address + copy */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 8,
            padding: '6px 12px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <code style={{ fontSize: 13, color: '#1a1714', fontFamily: 'monospace' }}>{inboxEmail}</code>
          <button
            onClick={handleCopy}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: copied ? '#15803d' : '#b8734a',
              transition: 'color 0.2s',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Link
          href="/dashboard/inbox/setup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 9,
            backgroundColor: '#2d5a27',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          Set Up Inbox
        </Link>

        <button
          onClick={() => setDismissed(true)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            color: '#6b6560',
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
