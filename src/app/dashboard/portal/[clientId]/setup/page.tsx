'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { PortalToken } from '@/lib/portal/types'

const ALL_PERMISSIONS = [
  { id: 'view_reports', label: 'View Reports', desc: 'See completed monthly close reports' },
  { id: 'upload_documents', label: 'Upload Documents', desc: 'Upload receipts, invoices, and tax docs' },
  { id: 'send_messages', label: 'Send Messages', desc: 'Chat with your team directly' },
  { id: 'view_transactions', label: 'View Financials', desc: 'See revenue, expenses, and net income' },
  { id: 'approve_items', label: 'Action Items', desc: 'Complete tasks you assign them' },
]

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#2d5a27' : '#e8e0d4', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
    </button>
  )
}

export default function PortalSetupPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const clientName = clientId.replace(/-\d{4}$/, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const [token, setToken] = useState<PortalToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [permissions, setPermissions] = useState<string[]>(ALL_PERMISSIONS.map(p => p.id))
  const [expiryDays, setExpiryDays] = useState(90)
  const [clientEmail, setClientEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetch(`/api/portal/tokens?clientId=${clientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.token) {
          setToken(d.token)
          setPermissions(d.token.permissions ?? ALL_PERMISSIONS.map(p => p.id))
          setClientEmail(d.token.clientEmail ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [clientId])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const generateToken = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/portal/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientName, clientEmail: clientEmail || undefined, permissions, expiresInDays: expiryDays }),
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        showToast('Portal link generated!')
      } else {
        showToast(data.error ?? 'Failed')
      }
    } finally {
      setGenerating(false)
    }
  }

  const rotateToken = async () => {
    if (!token) return
    if (!confirm('Rotating generates a new link. The old link will stop working immediately.')) return
    setRotating(true)
    try {
      await fetch(`/api/portal/tokens?id=${token.id}`, { method: 'DELETE' })
      const res = await fetch('/api/portal/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientName, clientEmail: clientEmail || undefined, permissions, expiresInDays: expiryDays }),
      })
      const data = await res.json()
      if (res.ok) { setToken(data.token); showToast('Link rotated — old link is now invalid') }
    } finally {
      setRotating(false)
    }
  }

  const copyLink = () => {
    if (!token) return
    navigator.clipboard.writeText(`${appUrl}/portal/${token.token}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const portalUrl = token ? `${appUrl}/portal/${token.token}` : ''

  if (loading) return <div style={{ padding: 40, color: '#9ca3af', fontSize: 14 }}>Loading…</div>

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1714', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 100 }}>
          {toast}
        </div>
      )}

      <Link href="/dashboard/portal" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Portal Management
      </Link>

      <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: '0 0 24px' }}>
        {token ? 'Manage Portal' : 'Set Up Portal'} — {clientName}
      </h1>

      {/* Status */}
      {token && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Portal is active</div>
            <div style={{ fontSize: 12, color: '#166534', opacity: 0.8 }}>
              {token.lastAccessedAt
                ? `Last visited ${new Date(token.lastAccessedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Client has not yet visited'}
              {' · '}Expires {new Date(token.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* Config */}
      <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', marginBottom: 20 }}>Configuration</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6560', marginBottom: 6 }}>Client Email (for notifications)</label>
          <input
            type="email"
            value={clientEmail}
            onChange={e => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#1a1714', outline: 'none', boxSizing: 'border-box', background: '#faf8f4' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6560', marginBottom: 6 }}>Link Expiry</label>
          <select
            value={expiryDays}
            onChange={e => setExpiryDays(Number(e.target.value))}
            style={{ border: '1px solid #e8e0d4', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#1a1714', background: 'white', cursor: 'pointer', outline: 'none' }}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid #f5f3ef', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b6560', marginBottom: 14 }}>Permissions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ALL_PERMISSIONS.map(perm => (
              <div key={perm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, color: '#1a1714', fontWeight: 500 }}>{perm.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{perm.desc}</div>
                </div>
                <ToggleSwitch
                  value={permissions.includes(perm.id)}
                  onChange={on => setPermissions(prev => on ? [...prev, perm.id] : prev.filter(p => p !== perm.id))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portal URL */}
      {token && (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 10 }}>Portal Link</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              readOnly
              value={portalUrl}
              style={{ flex: 1, border: '1px solid #e8e0d4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#6b6560', background: '#faf8f4', outline: 'none' }}
            />
            <button
              onClick={copyLink}
              style={{ background: copied ? '#2d5a27' : '#1a1714', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {!token ? (
          <button
            onClick={generateToken}
            disabled={generating}
            style={{ background: '#b8734a', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: generating ? 0.6 : 1 }}
          >
            {generating ? 'Generating…' : 'Generate Portal Link'}
          </button>
        ) : (
          <>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#b8734a', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
            >
              Preview Portal →
            </a>
            <button
              onClick={rotateToken}
              disabled={rotating}
              style={{ background: 'none', color: '#6b6560', border: '1px solid #e8e0d4', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {rotating ? 'Rotating…' : 'Rotate Link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
