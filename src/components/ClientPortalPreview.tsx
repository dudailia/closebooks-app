'use client'

import { useEffect, useState } from 'react'
import { getDocumentsForClient, getRequestsForClient } from '@/lib/vaultStorage'
import DocumentRequestModal from '@/components/DocumentRequestModal'
import type { VaultDocument, DocumentRequest } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function randomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  clientName: string
}

export default function ClientPortalPreview({ clientName }: Props) {
  const [clientDocs,   setClientDocs]   = useState<VaultDocument[]>([])
  const [requests,     setRequests]     = useState<DocumentRequest[]>([])
  const [showModal,    setShowModal]    = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [portalToken]                   = useState(randomToken)

  function reload() {
    const docs = getDocumentsForClient(clientName).filter((d) => d.uploadedBy === 'client')
    setClientDocs(docs)
    setRequests(getRequestsForClient(clientName))
  }

  useEffect(() => {
    reload()
  }, [clientName])

  const recentUploads   = clientDocs.slice(0, 3)
  const pendingCount    = requests.filter((r) => r.status === 'pending').length
  const lastActivityDoc = clientDocs[0]

  const portalUrl = `https://closebooks-app.vercel.app/portal/demo?client=${encodeURIComponent(clientName)}&token=${portalToken}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      //
    }
  }

  return (
    <>
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="12" rx="2" stroke="#2d5a27" strokeWidth="1.3" fill="none" />
              <path d="M6 3V2M12 3V2" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M2 7h14" stroke="#2d5a27" strokeWidth="1.1" />
            </svg>
            <h3
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 16,
                color: '#1a1714',
                margin: 0,
              }}
            >
              Client Portal
            </h3>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M6 3H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="#a09a94" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M9 2h3m0 0v3m0-3L7 7" stroke="#a09a94" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#2d5a27', margin: 0 }}>{clientDocs.length}</p>
            <p style={{ fontSize: 11, color: '#6b6560', margin: 0 }}>Client uploads</p>
          </div>
          <div style={{ width: 1, backgroundColor: '#e8e0d4' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#b8734a', margin: 0 }}>{pendingCount}</p>
            <p style={{ fontSize: 11, color: '#6b6560', margin: 0 }}>Pending requests</p>
          </div>
        </div>

        {/* Last activity */}
        {lastActivityDoc ? (
          <p style={{ fontSize: 12, color: '#6b6560' }}>
            Last activity: {formatDate(lastActivityDoc.uploadedAt)} — {lastActivityDoc.fileName}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: '#a09a94', lineHeight: 1.6 }}>
            Share your portal link to receive documents from {clientName}.
          </p>
        )}

        {/* Recent uploads */}
        {recentUploads.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b6560', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent from Client
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentUploads.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 8,
                    backgroundColor: '#faf8f4',
                    border: '1px solid #e8e0d4',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#b8734a" strokeWidth="1.1" fill="none" />
                    <path d="M4 5h6M4 7.5h6M4 10h4" stroke="#b8734a" strokeWidth="0.9" strokeLinecap="round" />
                  </svg>
                  <span
                    style={{ fontSize: 12, color: '#1a1714', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </span>
                  <span style={{ fontSize: 11, color: '#a09a94', whiteSpace: 'nowrap' }}>
                    {formatDate(doc.uploadedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '9px 14px',
              borderRadius: 9,
              border: 'none',
              backgroundColor: '#2d5a27',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Document Request
          </button>
          <button
            onClick={copyLink}
            style={{
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              color: copied ? '#2d5a27' : '#1a1714',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M4 1h8v8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copied ? 'Link Copied!' : 'Copy Portal Link'}
          </button>
        </div>
      </div>

      {showModal && (
        <DocumentRequestModal
          clientName={clientName}
          onSave={() => { reload(); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
