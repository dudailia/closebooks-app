'use client'

import { useCallback, useRef, useState } from 'react'
import { saveDocument } from '@/lib/vaultStorage'
import type { VaultDocument, DocumentFileType } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function detectFileType(name: string): DocumentFileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    const lower = name.toLowerCase()
    if (lower.includes('bank') || lower.includes('statement')) return 'bank-statement'
    if (lower.includes('payroll')) return 'payroll'
    if (lower.includes('report')) return 'report'
  }
  if (ext === 'pdf') {
    const lower = name.toLowerCase()
    if (lower.includes('tax') || lower.includes('return')) return 'tax-return'
    if (lower.includes('engagement')) return 'engagement-letter'
    if (lower.includes('receipt')) return 'receipt'
    if (lower.includes('payroll')) return 'payroll'
    if (lower.includes('bank') || lower.includes('statement')) return 'bank-statement'
  }
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'receipt'
  return 'other'
}

const FILE_TYPES: { value: DocumentFileType; label: string }[] = [
  { value: 'bank-statement',    label: 'Bank Statement' },
  { value: 'tax-return',        label: 'Tax Return' },
  { value: 'report',            label: 'Report' },
  { value: 'receipt',           label: 'Receipt' },
  { value: 'engagement-letter', label: 'Engagement Letter' },
  { value: 'payroll',           label: 'Payroll' },
  { value: 'other',             label: 'Other' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  clientName?: string
  jobId?: string
  requestId?: string
  onUploaded: (doc: VaultDocument) => void
  compact?: boolean
}

interface PendingFile {
  file: File
  fileType: DocumentFileType
  customTag: string
  notes: string
}

export default function DocumentUploader({ clientName, jobId, requestId, onUploaded, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [pending,  setPending]    = useState<PendingFile | null>(null)
  const [progress, setProgress]   = useState<number | null>(null)
  const [uploaded, setUploaded]   = useState(false)
  const [clientInput, setClientInput] = useState(clientName ?? '')

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) selectFile(file)
  }, [])

  function selectFile(file: File) {
    setUploaded(false)
    setProgress(null)
    setPending({
      file,
      fileType: detectFileType(file.name),
      customTag: '',
      notes: '',
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) selectFile(file)
    e.target.value = ''
  }

  function handleUpload() {
    if (!pending) return
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(p + 8, 100)
      })
    }, 120)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)

      const tags: string[] = []
      if (clientInput) tags.push(clientInput)
      if (pending.customTag.trim()) tags.push(pending.customTag.trim())

      const doc: VaultDocument = {
        id:         uid(),
        clientName: clientInput || 'Unknown',
        jobId,
        fileName:   pending.file.name,
        fileSize:   pending.file.size || Math.floor(Math.random() * 2_000_000) + 50_000,
        fileType:   pending.fileType,
        mimeType:   pending.file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'firm',
        tags,
        notes:      pending.notes.trim() || undefined,
        requestId,
      }

      saveDocument(doc)
      onUploaded(doc)
      setPending(null)
      setProgress(null)
      setUploaded(true)
    }, 1600)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const zoneBorder = dragging ? '#b8734a' : '#e8e0d4'
  const zoneBg     = dragging ? 'rgba(184,115,74,0.04)' : '#faf8f4'

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Drop zone */}
      {!pending && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${zoneBorder}`,
            borderRadius: 12,
            backgroundColor: zoneBg,
            padding: compact ? '20px 16px' : '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <svg
            width={compact ? 28 : 36}
            height={compact ? 28 : 36}
            viewBox="0 0 36 36"
            fill="none"
            style={{ margin: '0 auto 10px' }}
          >
            <rect x="4" y="6" width="28" height="24" rx="3" stroke="#b8734a" strokeWidth="1.5" fill="none" />
            <path d="M18 14v10M13 19l5-5 5 5" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ color: '#1a1714', fontWeight: 500, fontSize: compact ? 13 : 14, marginBottom: 4 }}>
            Drop a file here, or click to browse
          </p>
          <p style={{ color: '#a09a94', fontSize: 12 }}>
            Accepted: .pdf, .csv, .xlsx, .png, .jpg, .txt
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.txt"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* File form */}
      {pending && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* File info row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="#b8734a" strokeWidth="1.3" fill="none" />
              <path d="M7 7h6M7 10h6M7 13h4" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={pending.file.name}
              >
                {pending.file.name}
              </p>
              <p style={{ fontSize: 11, color: '#a09a94' }}>
                {formatBytes(pending.file.size || 512_000)}
              </p>
            </div>
            <button
              onClick={() => setPending(null)}
              style={{ color: '#a09a94', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Client name */}
          {!clientName && (
            <div>
              <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Client Name</label>
              <input
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                placeholder="e.g. Acme Corp"
                style={{
                  width: '100%',
                  border: '1px solid #e8e0d4',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#1a1714',
                  backgroundColor: '#faf8f4',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* File type */}
          <div>
            <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Document Type</label>
            <select
              value={pending.fileType}
              onChange={(e) => setPending({ ...pending, fileType: e.target.value as DocumentFileType })}
              style={{
                width: '100%',
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                outline: 'none',
              }}
            >
              {FILE_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>

          {/* Custom tag */}
          <div>
            <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Tag (optional)</label>
            <input
              value={pending.customTag}
              onChange={(e) => setPending({ ...pending, customTag: e.target.value })}
              placeholder="e.g. Q1 2024, Reviewed"
              style={{
                width: '100%',
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Notes */}
          {!compact && (
            <div>
              <label style={{ fontSize: 12, color: '#6b6560', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
              <textarea
                value={pending.notes}
                onChange={(e) => setPending({ ...pending, notes: e.target.value })}
                placeholder="Any context for this document…"
                rows={2}
                style={{
                  width: '100%',
                  border: '1px solid #e8e0d4',
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
            </div>
          )}

          {/* Progress bar */}
          {progress !== null && (
            <div>
              <div style={{ height: 6, borderRadius: 99, backgroundColor: '#e8e0d4', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: '#2d5a27',
                    transition: 'width 0.1s ease',
                    borderRadius: 99,
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#a09a94', marginTop: 4 }}>
                {progress < 100 ? `Uploading… ${progress}%` : 'Complete!'}
              </p>
            </div>
          )}

          {/* Actions */}
          {progress === null && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPending(null)}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: 8,
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
                onClick={handleUpload}
                style={{
                  flex: 2,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#2d5a27',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Upload
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {uploaded && !pending && (
        <p style={{ fontSize: 13, color: '#2d5a27', fontWeight: 500, textAlign: 'center', padding: '12px 0' }}>
          Document uploaded successfully.
        </p>
      )}
    </div>
  )
}
