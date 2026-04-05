'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function formatClientName(id: string): string {
  return id
    .replace(/-\d{4}$/, '')
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface Toggle {
  id: string
  label: string
  value: boolean
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? '#2d5a27' : '#e8e0d4',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: value ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function InviteModal({ clientName, portalUrl, onClose }: { clientName: string; portalUrl: string; onClose: () => void }) {
  const emailSubject = 'Your financial dashboard is ready'
  const emailBody = `Hi ${clientName},

Your financial dashboard is now live. You can view your real-time cash position, recent transactions, and upcoming expenses anytime.

Click here to access your dashboard: ${portalUrl}

Best,
Miller CPA`

  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.3)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        maxWidth: 560,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 22, color: '#1a1714', marginBottom: 4 }}>
          Invite Email
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
          Copy and send this to your client
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Subject</div>
          <div style={{ fontSize: 14, color: '#1a1714', fontWeight: 500 }}>{emailSubject}</div>
        </div>

        <div style={{
          background: '#faf8f4',
          border: '1px solid #e8e0d4',
          borderRadius: 10,
          padding: 16,
          fontSize: 13,
          color: '#1a1714',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          marginBottom: 24,
        }}>
          {emailBody}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={copyEmail}
            style={{
              flex: 1,
              background: '#b8734a',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'none',
              color: '#6b6560',
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortalSetupPage() {
  const params = useParams()
  const clientId = (params?.clientId as string) || 'client-2024'
  const clientName = formatClientName(clientId)

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/portal/miller-cpa/${clientId}`
    : `https://closebooks.app/portal/miller-cpa/${clientId}`

  const [email, setEmail] = useState(`contact@${clientId.replace(/-\d{4}$/, '').toLowerCase().replace(/-/g, '')}.com`)
  const [displayName, setDisplayName] = useState('Miller CPA')
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Welcome! Your financial dashboard is ready. Check your cash position, upcoming expenses, and more.'
  )
  const [toggles, setToggles] = useState<Toggle[]>([
    { id: 'cash', label: 'Show cash position', value: true },
    { id: 'transactions', label: 'Show transactions', value: true },
    { id: 'ai-chat', label: 'Show AI chat', value: true },
    { id: 'obligations', label: 'Show upcoming obligations', value: true },
  ])
  const [linkCopied, setLinkCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saved, setSaved] = useState(false)

  const updateToggle = (id: string, value: boolean) => {
    setToggles(prev => prev.map(t => t.id === id ? { ...t, value } : t))
  }

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720 }}>
      {/* Back link */}
      <Link
        href="/dashboard/portal"
        style={{
          fontSize: 13,
          color: '#9ca3af',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 20,
        }}
      >
        ← Portal Management
      </Link>

      {/* Header */}
      <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: 0, marginBottom: 24 }}>
        Set Up Portal — {clientName}
      </h1>

      {/* Config card */}
      <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Portal Configuration</div>

        {/* Client email */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6560', marginBottom: 6 }}>
            Client Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: '#1a1714',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#faf8f4',
            }}
          />
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6560', marginBottom: 6 }}>
            Display Name (firm name shown to client)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: '#1a1714',
              outline: 'none',
              boxSizing: 'border-box',
              background: '#faf8f4',
            }}
          />
        </div>

        {/* Welcome message */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6560', marginBottom: 6 }}>
            Welcome Message
          </label>
          <textarea
            value={welcomeMessage}
            onChange={e => setWelcomeMessage(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              color: '#1a1714',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
              background: '#faf8f4',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Feature toggles */}
        <div style={{ borderTop: '1px solid #f5f3ef', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b6560', marginBottom: 14 }}>Feature Toggles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {toggles.map(toggle => (
              <div key={toggle.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#1a1714' }}>{toggle.label}</span>
                <ToggleSwitch value={toggle.value} onChange={v => updateToggle(toggle.id, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            marginTop: 24,
            background: '#1a1714',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      {/* Generated Portal Link */}
      <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 12 }}>Generated Portal Link</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={portalUrl}
            style={{
              flex: 1,
              border: '1px solid #e8e0d4',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#6b6560',
              background: '#faf8f4',
              outline: 'none',
            }}
          />
          <button
            onClick={copyLink}
            style={{
              background: linkCopied ? '#2d5a27' : '#1a1714',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#b8734a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Send Invite Email
        </button>
        <Link
          href="/portal/miller-cpa/demo-token"
          target="_blank"
          style={{
            fontSize: 14,
            color: '#b8734a',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Preview as Client →
        </Link>
      </div>

      {/* Invite modal */}
      {showModal && (
        <InviteModal
          clientName={clientName}
          portalUrl={portalUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
