'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import {
  getDocuments,
  saveDocument,
  deleteDocument,
  getDocumentRequests,
} from '@/lib/vaultStorage'
import type { VaultDocument, DocumentRequest, DocumentFileType } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const TYPE_LABELS: Record<DocumentFileType, string> = {
  'bank-statement':    'Bank Statement',
  'tax-return':        'Tax Return',
  'report':            'Report',
  'receipt':           'Receipt',
  'engagement-letter': 'Engagement Letter',
  'payroll':           'Payroll',
  'other':             'Other',
}

const TYPE_COLORS: Record<DocumentFileType, { bg: string; color: string }> = {
  'bank-statement':    { bg: '#eff6ff', color: '#1d4ed8' },
  'tax-return':        { bg: '#fdf4ff', color: '#7e22ce' },
  'report':            { bg: '#f0fdf4', color: '#15803d' },
  'receipt':           { bg: '#fff7ed', color: '#c2410c' },
  'engagement-letter': { bg: '#fefce8', color: '#a16207' },
  'payroll':           { bg: '#ecfeff', color: '#0e7490' },
  'other':             { bg: '#f5f5f4', color: '#57534e' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const docId   = params.documentId as string

  const [doc,          setDoc]          = useState<VaultDocument | null>(null)
  const [request,      setRequest]      = useState<DocumentRequest | null>(null)
  const [notFound,     setNotFound]     = useState(false)
  const [editNotes,    setEditNotes]    = useState('')
  const [notesEditing, setNotesEditing] = useState(false)
  const [newTag,       setNewTag]       = useState('')
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [downloaded,   setDownloaded]   = useState(false)
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
    const all = getDocuments()
    const found = all.find((d) => d.id === docId)
    if (!found) {
      setNotFound(true)
      return
    }
    setDoc(found)
    setEditNotes(found.notes ?? '')

    if (found.requestId) {
      const reqs = getDocumentRequests()
      const req  = reqs.find((r) => r.id === found.requestId)
      setRequest(req ?? null)
    }
  }, [docId])

  function saveNotes() {
    if (!doc) return
    const updated = { ...doc, notes: editNotes.trim() || undefined }
    saveDocument(updated)
    setDoc(updated)
    setNotesEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addTag() {
    if (!doc || !newTag.trim()) return
    if (doc.tags.includes(newTag.trim())) { setNewTag(''); return }
    const updated = { ...doc, tags: [...doc.tags, newTag.trim()] }
    saveDocument(updated)
    setDoc(updated)
    setNewTag('')
  }

  function removeTag(tag: string) {
    if (!doc) return
    const updated = { ...doc, tags: doc.tags.filter((t) => t !== tag) }
    saveDocument(updated)
    setDoc(updated)
  }

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    deleteDocument(docId)
    router.push('/dashboard/vault')
  }

  function handleDownload() {
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
        <DashboardNav />
        <main style={{ flex: 1, maxWidth: 700, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: '#6b6560' }}>Document not found.</p>
          <Link href="/dashboard/vault" style={{ color: '#b8734a', fontSize: 14 }}>
            ← Back to Document Vault
          </Link>
        </main>
        <AppFooter />
      </div>
    )
  }

  if (!doc) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
        <DashboardNav />
        <main style={{ flex: 1 }} />
        <AppFooter />
      </div>
    )
  }

  const typeStyle = TYPE_COLORS[doc.fileType]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', width: '100%', padding: '28px 20px' }}>
        {/* Breadcrumb */}
        <Link
          href="/dashboard/vault"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#b8734a',
            textDecoration: 'none',
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Document Vault
        </Link>

        {/* Main card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {/* File header strip */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e8e0d4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: typeStyle.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="4" y="3" width="18" height="20" rx="2.5" stroke={typeStyle.color} strokeWidth="1.4" fill="none" />
                <path d="M8 10h10M8 13.5h10M8 17h6" stroke={typeStyle.color} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: 20,
                  color: '#1a1714',
                  margin: '0 0 6px',
                  wordBreak: 'break-word',
                }}
              >
                {doc.fileName}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: 99,
                    backgroundColor: typeStyle.bg,
                    color: typeStyle.color,
                  }}
                >
                  {TYPE_LABELS[doc.fileType]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: 99,
                    backgroundColor: doc.uploadedBy === 'firm' ? '#e8f0e6' : 'rgba(184,115,74,0.12)',
                    color: doc.uploadedBy === 'firm' ? '#2d5a27' : '#b8734a',
                  }}
                >
                  Uploaded by {doc.uploadedBy === 'firm' ? 'Firm' : 'Client'}
                </span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Meta rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  File Size
                </p>
                <p style={{ fontSize: 14, color: '#1a1714', margin: 0 }}>{formatBytes(doc.fileSize)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Upload Date
                </p>
                <p style={{ fontSize: 14, color: '#1a1714', margin: 0 }}>{formatDate(doc.uploadedAt)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Client
                </p>
                <Link
                  href={`/dashboard/clients`}
                  style={{ fontSize: 14, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
                >
                  {doc.clientName}
                </Link>
              </div>
              {doc.jobId && (
                <div>
                  <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Linked Job
                  </p>
                  <Link
                    href={`/dashboard/review/${doc.jobId}`}
                    style={{ fontSize: 14, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View Job →
                  </Link>
                </div>
              )}
            </div>

            {/* Request context */}
            {request && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#faf8f4',
                  border: '1px solid #e8e0d4',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6b6560', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Fulfills Document Request
                </p>
                <p style={{ fontSize: 13, color: '#1a1714', margin: '0 0 4px' }}>
                  Requested on {formatDate(request.requestedAt)}
                </p>
                <p style={{ fontSize: 12, color: '#6b6560', margin: 0 }}>
                  Items: {request.requestedItems.join(', ')}
                </p>
                <Link
                  href="/dashboard/vault/requests"
                  style={{ fontSize: 12, color: '#b8734a', textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 6 }}
                >
                  View Request →
                </Link>
              </div>
            )}

            {/* Tags */}
            <div>
              <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tags
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 99,
                      backgroundColor: '#f5f0ea',
                      color: '#6b6560',
                      border: '1px solid #e8e0d4',
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#a09a94',
                        fontSize: 13,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {doc.tags.length === 0 && (
                  <span style={{ fontSize: 13, color: '#a09a94' }}>No tags</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTag() }}
                  placeholder="Add tag…"
                  style={{
                    flex: 1,
                    maxWidth: 200,
                    border: '1px solid #e8e0d4',
                    borderRadius: 7,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: '#1a1714',
                    backgroundColor: '#faf8f4',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: '1px solid #e8e0d4',
                    backgroundColor: '#ffffff',
                    fontSize: 12,
                    color: '#b8734a',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: '#a09a94', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Notes
                </p>
                {!notesEditing && (
                  <button
                    onClick={() => setNotesEditing(true)}
                    style={{ fontSize: 12, color: '#b8734a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Edit
                  </button>
                )}
              </div>
              {notesEditing ? (
                <div>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      border: '1px solid #b8734a',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#1a1714',
                      backgroundColor: '#faf8f4',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button
                      onClick={() => setNotesEditing(false)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        border: '1px solid #e8e0d4',
                        backgroundColor: '#ffffff',
                        fontSize: 12,
                        color: '#6b6560',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNotes}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 7,
                        border: 'none',
                        backgroundColor: '#2d5a27',
                        fontSize: 12,
                        color: '#ffffff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {saved ? 'Saved!' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: doc.notes ? '#1a1714' : '#a09a94', lineHeight: 1.6, margin: 0 }}>
                  {doc.notes ?? 'No notes for this document.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '10px 20px',
              borderRadius: 9,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              fontSize: 13,
              fontWeight: 500,
              color: '#1a1714',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {downloaded ? 'Download simulated (demo mode)' : 'Download'}
          </button>

          {confirmDel ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmDel(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 9,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  fontSize: 13,
                  color: '#6b6560',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: 9,
                  border: 'none',
                  backgroundColor: '#dc2626',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 20px',
                borderRadius: 9,
                border: '1px solid #fca5a5',
                backgroundColor: '#fef2f2',
                fontSize: 13,
                fontWeight: 500,
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              Delete Document
            </button>
          )}
        </div>

        {/* Download notice */}
        {downloaded && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: '#fefce8',
              border: '1px solid #fef08a',
            }}
          >
            <p style={{ fontSize: 13, color: '#a16207', margin: 0 }}>
              In production, this would download the file. Document storage is simulated in this demo.
            </p>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
