'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PortalToken } from '@/lib/portal/types'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export default function PortalManagementPage() {
  const [tokens, setTokens] = useState<PortalToken[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetch('/api/portal/tokens')
      .then(r => r.json())
      .then(d => setTokens(d.tokens ?? []))
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${appUrl}/portal/${token}`).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const revokeToken = async (id: string, clientName: string) => {
    if (!confirm(`Revoke portal access for ${clientName}? Their link will stop working immediately.`)) return
    setRevoking(id)
    await fetch(`/api/portal/tokens?id=${id}`, { method: 'DELETE' })
    setTokens(prev => prev.filter(t => t.id !== id))
    setRevoking(null)
    showToast(`Access revoked for ${clientName}`)
  }

  const activeTokens = tokens.filter(t => new Date(t.expiresAt) > new Date())
  const expiredTokens = tokens.filter(t => new Date(t.expiresAt) <= new Date())

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1714', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 100 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: '0 0 4px' }}>
            Client Portals
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
            Manage access links for your clients
          </p>
        </div>
        <Link href="/dashboard/clients" style={{
          background: '#1a1714', color: 'white', textDecoration: 'none',
          borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600,
        }}>
          + New Portal
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Loading portals…</div>
      ) : tokens.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No portals yet</div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>Generate a portal link for a client to get started.</div>
          <Link href="/dashboard/clients" style={{ background: '#b8734a', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}>
            Set Up First Portal
          </Link>
        </div>
      ) : (
        <>
          {activeTokens.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Active ({activeTokens.length})
              </div>
              <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
                {activeTokens.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < activeTokens.length - 1 ? '1px solid #f5f3ef' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      👤
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 2 }}>{t.clientName}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                          {t.lastAccessedAt ? `Last visited ${timeAgo(t.lastAccessedAt)}` : 'Never visited'}
                        </span>
                        <span style={{ fontSize: 12, color: new Date(t.expiresAt).getTime() - Date.now() < 7 * 86400000 ? '#f59e0b' : '#9ca3af' }}>
                          {daysUntil(t.expiresAt)}
                        </span>
                        {t.clientEmail && <span style={{ fontSize: 12, color: '#9ca3af' }}>{t.clientEmail}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => copyLink(t.token)}
                        style={{ background: copied === t.token ? '#dcfce7' : '#f5f3ef', color: copied === t.token ? '#166534' : '#1a1714', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {copied === t.token ? '✓ Copied' : 'Copy Link'}
                      </button>
                      <Link
                        href={`/dashboard/portal/${t.clientId}/setup`}
                        style={{ background: '#f5f3ef', color: '#1a1714', textDecoration: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                      >
                        Manage
                      </Link>
                      <button
                        onClick={() => revokeToken(t.id, t.clientName)}
                        disabled={revoking === t.id}
                        style={{ background: 'none', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiredTokens.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Expired ({expiredTokens.length})
              </div>
              <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden', opacity: 0.7 }}>
                {expiredTokens.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < expiredTokens.length - 1 ? '1px solid #f5f3ef' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#6b6560' }}>{t.clientName}</div>
                      <div style={{ fontSize: 12, color: '#ef4444' }}>Expired {timeAgo(t.expiresAt)}</div>
                    </div>
                    <Link href={`/dashboard/portal/${t.clientId}/setup`} style={{ background: '#f5f3ef', color: '#1a1714', textDecoration: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                      Renew
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
