'use client'

import { useEffect, useState } from 'react'
import DocumentRequestModal from '@/components/DocumentRequestModal'
import DocumentUploader from '@/components/DocumentUploader'
import {
  getDocumentRequests,
  saveDocumentRequest,
  updateRequestStatus,
  fulfillRequest,
  saveDocument,
  getDocuments,
} from '@/lib/vaultStorage'
import type { DocumentRequest, VaultDocument } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isPastDue(dueDate?: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    //
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request card
// ─────────────────────────────────────────────────────────────────────────────

interface RequestCardProps {
  req: DocumentRequest
  onUpdate: () => void
}

function RequestCard({ req, onUpdate }: RequestCardProps) {
  const [showUploader, setShowUploader] = useState(false)
  const [reminderSent, setReminderSent] = useState(!!req.reminderSentAt)
  const [copied,       setCopied]       = useState(false)

  const portalUrl = `https://closebooks-app.vercel.app/portal/demo?req=${req.portalToken}`
  const progress  = req.requestedItems.length > 0 ? req.fulfillmentIds.length / req.requestedItems.length : 0
  const past      = isPastDue(req.dueDate)

  const statusColor =
    req.status === 'complete' ? { bg: '#f0fdf4', text: '#15803d' } :
    req.status === 'partial'  ? { bg: '#eff6ff', text: '#1d4ed8' } :
                                { bg: '#fff7ed', text: '#c2410c' }

  function handleCopyLink() {
    copyToClipboard(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReminder() {
    const reqs = getDocumentRequests()
    const r    = reqs.find((x) => x.id === req.id)
    if (r) {
      r.reminderSentAt = new Date().toISOString()
      saveDocumentRequest(r)
      setReminderSent(true)
    }
  }

  function handleMarkComplete() {
    updateRequestStatus(req.id, 'complete')
    onUpdate()
  }

  function handleFulfillment(doc: VaultDocument) {
    fulfillRequest(req.id, doc.id)
    setShowUploader(false)
    onUpdate()
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', margin: '0 0 3px' }}>{req.clientName}</p>
          <p style={{ fontSize: 12, color: '#6b6560' }}>
            Requested {formatDate(req.requestedAt)}
            {req.dueDate && (
              <span style={{ color: past ? '#dc2626' : '#6b6560' }}>
                {' '}· Due {formatDate(req.dueDate)}{past && ' (overdue)'}
              </span>
            )}
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 99,
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            whiteSpace: 'nowrap',
          }}
        >
          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
        </span>
      </div>

      {/* Items list */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#6b6560', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Requested Items
        </p>
        <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {req.requestedItems.map((item, i) => (
            <li key={i} style={{ fontSize: 13, color: '#1a1714' }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Progress bar */}
      {req.requestedItems.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#6b6560' }}>
              {req.fulfillmentIds.length} of {req.requestedItems.length} fulfilled
            </span>
            <span style={{ fontSize: 11, color: '#6b6560' }}>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, backgroundColor: '#e8e0d4', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: progress === 1 ? '#2d5a27' : '#b8734a',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {req.notes && (
        <p style={{ fontSize: 12, color: '#6b6560', lineHeight: 1.5, margin: 0 }}>
          Note: {req.notes}
        </p>
      )}

      {/* Reminder sent */}
      {reminderSent && req.reminderSentAt && (
        <p style={{ fontSize: 11, color: '#2d5a27' }}>
          Reminder sent {formatDate(req.reminderSentAt)}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={handleCopyLink}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid #e8e0d4',
            backgroundColor: '#ffffff',
            fontSize: 12,
            color: copied ? '#2d5a27' : '#6b6560',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        <button
          onClick={() => setShowUploader(true)}
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid #e8e0d4',
            backgroundColor: '#ffffff',
            fontSize: 12,
            color: '#6b6560',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Upload Fulfillment
        </button>

        {req.status !== 'complete' && (
          <>
            <button
              onClick={handleMarkComplete}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #2d5a27',
                backgroundColor: '#f0f7ef',
                fontSize: 12,
                color: '#2d5a27',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Mark Complete
            </button>

            <button
              onClick={handleReminder}
              disabled={reminderSent}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #e8e0d4',
                backgroundColor: '#ffffff',
                fontSize: 12,
                color: reminderSent ? '#a09a94' : '#6b6560',
                cursor: reminderSent ? 'default' : 'pointer',
                fontWeight: 500,
              }}
            >
              {reminderSent ? 'Reminder Sent' : 'Send Reminder'}
            </button>
          </>
        )}
      </div>

      {/* Uploader inline */}
      {showUploader && (
        <div
          style={{
            borderTop: '1px solid #e8e0d4',
            paddingTop: 14,
          }}
        >
          <p style={{ fontSize: 12, color: '#6b6560', marginBottom: 10 }}>
            Upload a document to fulfill this request:
          </p>
          <DocumentUploader
            clientName={req.clientName}
            jobId={req.jobId}
            requestId={req.id}
            compact
            onUploaded={handleFulfillment}
          />
          <button
            onClick={() => setShowUploader(false)}
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#a09a94',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type StatusTab = 'all' | 'pending' | 'partial' | 'complete'

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'partial',  label: 'Partial' },
  { id: 'complete', label: 'Complete' },
]

export default function RequestsPage() {
  const [requests,    setRequests]    = useState<DocumentRequest[]>([])
  const [activeTab,   setActiveTab]   = useState<StatusTab>('all')
  const [showModal,   setShowModal]   = useState(false)
  const [modalClient, setModalClient] = useState('')

  function reload() {
    setRequests(getDocumentRequests())
  }

  useEffect(() => { reload() }, [])

  const filtered = activeTab === 'all' ? requests : requests.filter((r) => r.status === activeTab)

  // Get unique client names from stored clients (simplified — just grab from requests)
  const clientNames = Array.from(new Set(requests.map((r) => r.clientName)))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>

      <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(184,115,74,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3v16M3 11h16" stroke="#b8734a" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="11" cy="11" r="9" stroke="#b8734a" strokeWidth="1.3" fill="none" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: 26,
                  color: '#1a1714',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Document Requests
              </h1>
              <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>
                Track and manage document requests sent to clients
              </p>
            </div>
          </div>

          <button
            onClick={() => { setModalClient(''); setShowModal(true) }}
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: 'none',
              backgroundColor: '#2d5a27',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Request
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid #e8e0d4',
            marginBottom: 24,
          }}
        >
          {STATUS_TABS.map((tab) => {
            const count = tab.id === 'all' ? requests.length : requests.filter((r) => r.status === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? '#2d5a27' : '#6b6560',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #2d5a27' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 99,
                      backgroundColor: activeTab === tab.id ? '#2d5a27' : '#e8e0d4',
                      color: activeTab === tab.id ? '#ffffff' : '#6b6560',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 14,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 14px' }}>
              <circle cx="24" cy="24" r="20" stroke="#e8e0d4" strokeWidth="2" fill="none" />
              <path d="M24 16v8l5 5" stroke="#e8e0d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#6b6560', margin: '0 0 6px' }}>
              No document requests
            </p>
            <p style={{ fontSize: 13, color: '#a09a94' }}>
              Create one from a client&apos;s page or using the button above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((req) => (
              <RequestCard key={req.id} req={req} onUpdate={reload} />
            ))}
          </div>
        )}
      </main>


      {/* New request modal */}
      {showModal && (
        <DocumentRequestModal
          clientName={modalClient}
          onSave={() => { reload(); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
