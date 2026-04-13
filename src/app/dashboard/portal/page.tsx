'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getJobs, getClients } from '@/lib/storage'
import { loadFirmSettings } from '@/lib/firmSettings'
import { getPortalTokens, ensurePortalToken } from '@/lib/portalTokensStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalClient {
  id: string
  name: string
  status: 'active' | 'not_setup'
  token: string
  lastLogin: string
  visits: number
  portalUrl: string
}

function buildPortalClients(): PortalClient[] {
  const jobs = getJobs()
  const clients = getClients()
  const tokens = getPortalTokens()
  const firmSettings = loadFirmSettings()
  const firmSlug = (firmSettings.firmName || 'my-firm').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://closebooks-app.vercel.app'

  // Dedupe clients by name (most recent job per client)
  const byClient = new Map<string, string>() // name → jobId
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing) byClient.set(job.client_name, job.id)
  }

  // Also include stored clients without jobs
  for (const client of clients) {
    if (!byClient.has(client.business_name)) {
      byClient.set(client.business_name, `client-${client.id}`)
    }
  }

  const result: PortalClient[] = []
  for (const [name] of Array.from(byClient.entries())) {
    const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const token = tokens[key]?.token ?? ''
    const hasToken = !!token

    result.push({
      id: key,
      name,
      status: hasToken ? 'active' : 'not_setup',
      token,
      lastLogin: tokens[key]?.lastLogin ?? 'Never',
      visits: tokens[key]?.visits ?? 0,
      portalUrl: hasToken
        ? `${origin}/portal/${firmSlug}/${token}`
        : '',
    })
  }

  return result.sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1714', color: 'white', borderRadius: 10, padding: '12px 20px', fontSize: 14, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s ease', maxWidth: 320 }}>
      {message}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalManagementPage() {
  const [clients, setClients] = useState<PortalClient[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setClients(buildPortalClients())
    setMounted(true)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleActivate(clientName: string) {
    const key = clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    ensurePortalToken(key)
    setClients(buildPortalClients())
    showToast(`Portal activated for ${clientName}!`)
  }

  function handleCopy(portalUrl: string, clientName: string) {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl).catch(() => {})
    showToast(`Portal link for ${clientName} copied!`)
  }

  const activeCount = clients.filter(c => c.status === 'active').length
  const totalVisits = clients.reduce((s, c) => s + c.visits, 0)

  if (!mounted) {
    return <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ height: 120, borderRadius: 12, backgroundColor: '#f0ebe3' }} className="cb-skeleton" />
    </div>
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, color: '#1a1714', margin: 0, marginBottom: 4 }}>Client Portal</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Give clients a live view of their financials — one link, no login needed.</p>
        </div>
        <Link href="/dashboard/portal/setup" style={{ display: 'inline-block', background: '#b8734a', color: 'white', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Customize Portal
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Portals Active', value: String(activeCount), color: '#2d5a27' },
          { label: 'Total Clients', value: String(clients.length), color: '#1a1714' },
          { label: 'Total Visits', value: String(totalVisits), color: '#1a1714' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '18px 24px' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Client table */}
      <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No clients yet</h3>
            <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 360, margin: '0 auto 24px' }}>
              Upload a close to add clients. Once you have clients, you can generate their portal links here.
            </p>
            <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + New Close
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}>
                  {['Client', 'Status', 'Portal Link', 'Visits', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b6560', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={client.id} style={{ borderTop: i > 0 ? '1px solid #f3f0eb' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1714' }}>{client.name}</span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        backgroundColor: client.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color: client.status === 'active' ? '#166534' : '#6b7280',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: client.status === 'active' ? '#16a34a' : '#9ca3af', display: 'inline-block' }} />
                        {client.status === 'active' ? 'Active' : 'Not set up'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {client.status === 'active' ? (
                        <code style={{ fontSize: 11, color: '#6b6560', backgroundColor: '#f5f0ea', padding: '3px 6px', borderRadius: 4, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {client.portalUrl.replace(/^https?:\/\/[^/]+/, '')}
                        </code>
                      ) : (
                        <span style={{ fontSize: 12, color: '#a09a94' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontSize: 13, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>{client.visits}</span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontSize: 12, color: '#6b6560' }}>{client.lastLogin}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {client.status === 'active' ? (
                          <>
                            <button
                              onClick={() => handleCopy(client.portalUrl, client.name)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#1a1714', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                            >
                              Copy Link
                            </button>
                            <a
                              href={client.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2d5a27', backgroundColor: '#f0f7ee', color: '#2d5a27', fontSize: 12, cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
                            >
                              Preview
                            </a>
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivate(client.name)}
                            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', backgroundColor: '#b8734a', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                          >
                            Activate Portal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#a09a94', textAlign: 'center', marginTop: 12 }}>
        Portal links are permanent and unique per client. Share them via email or your firm&apos;s website.
      </p>

      {toast && <Toast message={toast} />}
    </div>
  )
}
