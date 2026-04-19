'use client'

import { useState, useRef, useCallback } from 'react'
import type { PortalDocument } from '@/lib/portal/types'

interface Props {
  token: string
  accentColor: string
  documents: (PortalDocument & { signedUrl?: string })[]
  onRefresh: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  invoice: 'Invoice',
  statement: 'Statement',
  tax: 'Tax Doc',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  receipt: '#fef3c7',
  invoice: '#eff6ff',
  statement: '#f0fdf4',
  tax: '#fdf4ff',
  other: '#f5f3ef',
}

export default function DocumentUpload({ token, accentColor, documents, onRefresh }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const uploadFile = useCallback(async (file: File, docId?: string) => {
    const key = docId ?? file.name
    setUploading(key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (docId) fd.append('docId', docId)
      const res = await fetch(`/api/portal/documents?token=${token}`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error ?? 'Upload failed')
      } else {
        showToast('Uploaded successfully')
        onRefresh()
      }
    } catch {
      showToast('Upload failed — try again')
    } finally {
      setUploading(null)
    }
  }, [token, onRefresh])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadFile(f))
  }, [uploadFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const filtered = filter === 'all' ? documents : documents.filter(d => d.category === filter || d.status === filter)
  const categories = Array.from(new Set(documents.map(d => d.category)))

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1714', color: 'white', padding: '10px 20px', borderRadius: 8,
          fontSize: 14, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? accentColor : '#e8e0d4'}`,
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center',
          background: dragging ? `${accentColor}08` : 'white',
          marginBottom: 20,
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📎</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>
          Drop files here or tap to browse
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          PDF, JPG, PNG, HEIC — up to 50 MB each
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
            style={{
              background: accentColor, color: 'white', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Browse Files
          </button>
          <button
            onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
            style={{
              background: 'white', color: accentColor, border: `1.5px solid ${accentColor}`,
              borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              minHeight: 44, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>📷</span> Take Photo
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.webp" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Filter pills */}
      {documents.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['all', 'requested', 'uploaded', 'reviewed', ...categories].filter((v, i, a) => a.indexOf(v) === i).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '1px solid',
                borderColor: filter === f ? accentColor : '#e8e0d4',
                background: filter === f ? `${accentColor}15` : 'white',
                color: filter === f ? accentColor : '#6b6560',
                cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
                minHeight: 36,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Document list */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 15, color: '#6b6560' }}>
            {documents.length === 0 ? 'No documents yet. Upload something or wait for your accountant to request docs.' : 'No documents match that filter.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(doc => (
            <div key={doc.id} style={{
              background: 'white', border: '1px solid #e8e0d4', borderRadius: 12,
              padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center',
            }}>
              {/* Category badge */}
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: CATEGORY_COLORS[doc.category] ?? '#f5f3ef',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {doc.category === 'receipt' ? '🧾' : doc.category === 'invoice' ? '📄' : doc.category === 'statement' ? '🏦' : doc.category === 'tax' ? '📊' : '📁'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: doc.status === 'reviewed' ? '#dcfce7' : doc.status === 'uploaded' ? '#dbeafe' : '#fef3c7',
                    color: doc.status === 'reviewed' ? '#166534' : doc.status === 'uploaded' ? '#1d4ed8' : '#92400e',
                  }}>
                    {doc.status === 'reviewed' ? '✓ Reviewed' : doc.status === 'uploaded' ? '↑ Uploaded' : '⏳ Needed'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{CATEGORY_LABELS[doc.category]}</span>
                </div>
                {doc.requestedNote && doc.status === 'requested' && (
                  <div style={{ fontSize: 12, color: '#6b6560', marginTop: 4, fontStyle: 'italic' }}>{doc.requestedNote}</div>
                )}
              </div>

              {/* Actions */}
              <div style={{ flexShrink: 0 }}>
                {doc.status === 'requested' && (
                  <label style={{
                    background: accentColor, color: 'white', borderRadius: 8,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 36,
                    opacity: uploading === doc.id ? 0.6 : 1,
                  }}>
                    {uploading === doc.id ? 'Uploading…' : 'Upload'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,image/*" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], doc.id) }}
                    />
                  </label>
                )}
                {doc.status !== 'requested' && (doc as PortalDocument & { signedUrl?: string }).signedUrl && (
                  <a
                    href={(doc as PortalDocument & { signedUrl?: string }).signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: accentColor, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      padding: '8px 14px', border: `1px solid ${accentColor}`, borderRadius: 8,
                      display: 'inline-block', minHeight: 36, lineHeight: '20px',
                    }}
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
