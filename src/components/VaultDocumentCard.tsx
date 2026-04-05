'use client'

import { useState } from 'react'
import { deleteDocument } from '@/lib/vaultStorage'
import type { VaultDocument, DocumentFileType } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_COLORS: Record<DocumentFileType, { bg: string; color: string; label: string }> = {
  'bank-statement':    { bg: '#eff6ff', color: '#1d4ed8', label: 'Bank Statement' },
  'tax-return':        { bg: '#fdf4ff', color: '#7e22ce', label: 'Tax Return' },
  'report':            { bg: '#f0fdf4', color: '#15803d', label: 'Report' },
  'receipt':           { bg: '#fff7ed', color: '#c2410c', label: 'Receipt' },
  'engagement-letter': { bg: '#fefce8', color: '#a16207', label: 'Engagement Letter' },
  'payroll':           { bg: '#ecfeff', color: '#0e7490', label: 'Payroll' },
  'other':             { bg: '#f5f5f4', color: '#57534e', label: 'Other' },
}

function fileIconColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return '#dc2626'
  if (ext === 'csv') return '#16a34a'
  if (['xlsx', 'xls'].includes(ext)) return '#15803d'
  if (['png', 'jpg', 'jpeg'].includes(ext)) return '#2563eb'
  return '#78716c'
}

function FileIcon({ fileName }: { fileName: string }) {
  const ext   = fileName.split('.').pop()?.toLowerCase() ?? ''
  const color = fileIconColor(fileName)

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="5" y="3" width="18" height="24" rx="2.5" stroke={color} strokeWidth="1.4" fill="none" />
      {ext === 'pdf' && (
        <text x="6" y="22" style={{ fontSize: 7, fontWeight: 700 }} fill={color}>PDF</text>
      )}
      {ext === 'csv' && (
        <text x="6" y="22" style={{ fontSize: 7, fontWeight: 700 }} fill={color}>CSV</text>
      )}
      {['xlsx', 'xls'].includes(ext) && (
        <text x="6" y="22" style={{ fontSize: 6, fontWeight: 700 }} fill={color}>XLSX</text>
      )}
      {['png', 'jpg', 'jpeg'].includes(ext) && (
        <>
          <circle cx="11" cy="12" r="2.5" stroke={color} strokeWidth="1.2" />
          <path d="M6 20l5-5 4 4 3-3 5 4" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      )}
      {!['pdf', 'csv', 'xlsx', 'xls', 'png', 'jpg', 'jpeg'].includes(ext) && (
        <path d="M10 11h12M10 15h12M10 19h8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      )}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  doc: VaultDocument
  onDelete?: (id: string) => void
  showClient?: boolean
}

export default function VaultDocumentCard({ doc, onDelete, showClient }: Props) {
  const [showNotes,    setShowNotes]    = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)

  const typeStyle = TYPE_COLORS[doc.fileType]

  function handleDelete() {
    if (!confirmDel) {
      setConfirmDel(true)
      return
    }
    deleteDocument(doc.id)
    onDelete?.(doc.id)
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Top row: icon + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <FileIcon fileName={doc.fileName} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            title={doc.fileName}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1a1714',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 2,
            }}
          >
            {doc.fileName}
          </p>
          <p style={{ fontSize: 11, color: '#a09a94' }}>
            {formatBytes(doc.fileSize)} · {formatDate(doc.uploadedAt)}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        {/* File type badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 99,
            backgroundColor: typeStyle.bg,
            color: typeStyle.color,
          }}
        >
          {typeStyle.label}
        </span>

        {/* Uploaded by badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 99,
            backgroundColor: doc.uploadedBy === 'firm' ? '#e8f0e6' : 'rgba(184,115,74,0.12)',
            color: doc.uploadedBy === 'firm' ? '#2d5a27' : '#b8734a',
          }}
        >
          {doc.uploadedBy === 'firm' ? 'Firm' : 'Client'}
        </span>

        {/* Client name */}
        {showClient && (
          <span style={{ fontSize: 11, color: '#6b6560', fontWeight: 500 }}>
            {doc.clientName}
          </span>
        )}
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {doc.tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                padding: '1px 7px',
                borderRadius: 99,
                backgroundColor: '#f5f0ea',
                color: '#6b6560',
                border: '1px solid #e8e0d4',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes toggle */}
      {doc.notes && (
        <div>
          <button
            onClick={() => setShowNotes((v) => !v)}
            style={{
              fontSize: 11,
              color: '#b8734a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showNotes ? 'Hide notes' : 'Show notes'}
          </button>
          {showNotes && (
            <p style={{ fontSize: 12, color: '#6b6560', marginTop: 4, lineHeight: 1.5 }}>
              {doc.notes}
            </p>
          )}
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {confirmDel ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setConfirmDel(false)}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  color: '#6b6560',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
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
                fontSize: 11,
                color: '#a09a94',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94' }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
