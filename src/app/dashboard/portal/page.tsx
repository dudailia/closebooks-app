'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  status: 'active' | 'not_setup'
  lastLogin: string
  visits: number
}

const CLIENTS: Client[] = [
  { id: 'smith-2024', name: 'Smith Construction LLC', status: 'active', lastLogin: '2 hours ago', visits: 14 },
  { id: 'bella-2024', name: 'Bella Vista Restaurant', status: 'active', lastLogin: 'Yesterday', visits: 7 },
  { id: 'chen-2024', name: 'Chen Medical Practice', status: 'active', lastLogin: '3 days ago', visits: 4 },
  { id: 'techflow-2024', name: 'TechFlow Inc', status: 'not_setup', lastLogin: 'Never', visits: 0 },
  { id: 'greenvally-2024', name: 'Green Valley Farms', status: 'not_setup', lastLogin: 'Never', visits: 0 },
]

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: '#1a1714',
        color: 'white',
        borderRadius: 10,
        padding: '12px 20px',
        fontSize: 14,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        animation: 'fadeIn 0.2s ease',
        maxWidth: 320,
      }}
    >
      {message}
    </div>
  )
}

export default function PortalManagementPage() {
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyPortalLink = (clientId: string) => {
    const url = `${window.location.origin}/portal/miller-cpa/${clientId}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('Portal link copied! Send to your client.')
    }).catch(() => {
      showToast('Portal link copied! Send to your client.')
    })
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: 0, marginBottom: 4 }}>
            Client Portal
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
            Your clients&apos; live financial dashboards
          </p>
        </div>
        <Link
          href="/dashboard/portal/setup"
          style={{
            display: 'inline-block',
            background: '#b8734a',
            color: 'white',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Set Up New Portal
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '18px 24px', minWidth: 160 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Portals Active</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2d5a27' }}>24</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '18px 24px', minWidth: 200 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Client logins this week</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#b8734a' }}>67</div>
        </div>
      </div>

      {/* Client table */}
      <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
          padding: '12px 20px',
          borderBottom: '1px solid #e8e0d4',
          background: '#faf8f4',
        }}>
          {['Client Name', 'Portal Status', 'Last Login', 'Weekly Visits', 'Actions'].map(col => (
            <div key={col} style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {col}
            </div>
          ))}
        </div>

        {/* Table rows */}
        {CLIENTS.map((client, i) => (
          <div
            key={client.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
              padding: '14px 20px',
              borderBottom: i < CLIENTS.length - 1 ? '1px solid #f5f3ef' : 'none',
              alignItems: 'center',
            }}
          >
            {/* Name */}
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1714' }}>{client.name}</div>

            {/* Status */}
            <div>
              {client.status === 'active' ? (
                <span style={{ fontSize: 13, color: '#166534', background: '#f0fdf4', borderRadius: 20, padding: '3px 10px' }}>
                  ● Active
                </span>
              ) : (
                <span style={{ fontSize: 13, color: '#9ca3af', background: '#f5f5f5', borderRadius: 20, padding: '3px 10px' }}>
                  Not set up
                </span>
              )}
            </div>

            {/* Last login */}
            <div style={{ fontSize: 13, color: '#6b6560' }}>{client.lastLogin}</div>

            {/* Visits */}
            <div style={{ fontSize: 13, color: '#6b6560' }}>{client.visits > 0 ? client.visits : '—'}</div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {client.status === 'not_setup' ? (
                <Link
                  href={`/dashboard/portal/${client.id}/setup`}
                  style={{
                    fontSize: 13,
                    color: '#b8734a',
                    background: 'none',
                    border: '1px solid #b8734a',
                    borderRadius: 6,
                    padding: '4px 12px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Setup →
                </Link>
              ) : (
                <>
                  <Link
                    href={`/portal/miller-cpa/${client.id}`}
                    target="_blank"
                    style={{
                      fontSize: 13,
                      color: '#2d5a27',
                      background: 'none',
                      border: '1px solid #2d5a27',
                      borderRadius: 6,
                      padding: '4px 10px',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => copyPortalLink(client.id)}
                    style={{
                      fontSize: 13,
                      color: '#1a1714',
                      background: 'none',
                      border: '1px solid #e8e0d4',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Share Link
                  </button>
                  <Link
                    href={`/dashboard/portal/${client.id}/setup`}
                    style={{
                      fontSize: 13,
                      color: '#9ca3af',
                      background: 'none',
                      border: '1px solid #e8e0d4',
                      borderRadius: 6,
                      padding: '4px 10px',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  )
}
