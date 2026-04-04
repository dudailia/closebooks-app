'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Firm name helper — derive a readable name from the firmId slug
// ---------------------------------------------------------------------------

function firmDisplayName(firmId: string): string {
  return firmId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Month options
// ---------------------------------------------------------------------------

function monthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    opts.push({ value, label })
  }
  return opts
}

// ---------------------------------------------------------------------------
// DropZone
// ---------------------------------------------------------------------------

function DropZone({
  files,
  onFiles,
}: {
  files: File[]
  onFiles: (files: File[]) => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(
      (f) =>
        f.name.endsWith('.csv') ||
        f.name.endsWith('.pdf') ||
        f.type === 'text/csv' ||
        f.type === 'application/pdf'
    )
    if (valid.length) onFiles([...files, ...valid])
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    accept(e.dataTransfer.files)
  }

  const removeFile = (idx: number) => {
    onFiles(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 px-6 transition-colors"
        style={{
          borderColor: dragging ? '#2d5a27' : '#c8c0b8',
          backgroundColor: dragging ? '#f0f5ef' : '#f7f5f1',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          multiple
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#e8f0e6' }}
        >
          <UploadIcon />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
            Drop your files here, or{' '}
            <span style={{ color: '#2d5a27' }}>browse</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#a09a94' }}>
            Bank statements as CSV or PDF · Max 20 MB each
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: '#f0f5ef', color: '#1a1714' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileIcon ext={f.name.endsWith('.pdf') ? 'pdf' : 'csv'} />
                <span className="truncate">{f.name}</span>
                <span style={{ color: '#a09a94' }} className="shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="ml-3 shrink-0 text-lg leading-none"
                style={{ color: '#a09a94' }}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main portal page
// ---------------------------------------------------------------------------

export default function PortalPage() {
  const params   = useParams()
  const router   = useRouter()
  const firmId   = typeof params.firmId === 'string' ? params.firmId : ''
  const firmName = firmDisplayName(firmId)

  const months = monthOptions()

  const [businessName, setBusinessName] = useState('')
  const [period, setPeriod]             = useState(months[1].value) // default: last month
  const [notes, setNotes]               = useState('')
  const [files, setFiles]               = useState<File[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  function validate(): string | null {
    if (!businessName.trim()) return 'Please enter your business name.'
    if (!files.length)        return 'Please attach at least one file.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    // Simulate async save (replace with real upload when backend is ready)
    await new Promise((r) => setTimeout(r, 800))

    // Persist to localStorage so the CPA dashboard can see it
    const uploadRecord = {
      id:           `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      firmId,
      businessName: businessName.trim(),
      period,
      notes:        notes.trim(),
      fileNames:    files.map((f) => f.name),
      uploadedAt:   new Date().toISOString(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('portal_uploads') ?? '[]')
      localStorage.setItem('portal_uploads', JSON.stringify([uploadRecord, ...existing]))
    } catch { /* ignore */ }

    router.push(
      `/portal/${firmId}/success?business=${encodeURIComponent(businessName.trim())}&period=${period}&files=${files.length}`
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f5f1' }}>

      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center gap-3">
          <LedgerIcon />
          <div>
            <p
              className="leading-none"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 17,
                color: '#1a1714',
              }}
            >
              <span style={{ color: '#1a1714' }}>Close</span>
              <span style={{ color: '#b8734a' }}>Books</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
              Secure client portal
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-10">

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <LockIcon />
            <span className="text-xs font-medium" style={{ color: '#2d5a27' }}>
              Secure &amp; encrypted
            </span>
          </div>
          <h1
            className="leading-tight mb-2"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 'clamp(1.6rem, 5vw, 2.1rem)',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Upload Documents<br />for {firmName}
          </h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            Your accountant has requested bank statements for month-end close.
            Fill in the details below and attach your files — it only takes a minute.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Business name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1a1714' }}>
              Your business name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sunrise Bakery LLC"
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: '#e8e0d4',
                backgroundColor: '#ffffff',
                color: '#1a1714',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1a1714' }}>
              Statement period <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10 transition-colors"
                style={{
                  borderColor: '#e8e0d4',
                  backgroundColor: '#ffffff',
                  color: '#1a1714',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Files */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1a1714' }}>
              Bank statements <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <DropZone files={files} onFiles={setFiles} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1a1714' }}>
              Notes{' '}
              <span className="font-normal" style={{ color: '#a09a94' }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything your accountant should know — e.g. 'Missing Jan 15–18, reconciling separately'"
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none transition-colors"
              style={{
                borderColor: '#e8e0d4',
                backgroundColor: '#ffffff',
                color: '#1a1714',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: loading ? '#4a7a44' : '#2d5a27' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            {loading ? 'Uploading…' : 'Submit Documents'}
          </button>

          {/* Trust note */}
          <p className="text-xs text-center" style={{ color: '#a09a94' }}>
            Your files are sent directly to {firmName} and are never shared with third parties.
          </p>
        </form>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function LedgerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#2d5a27" strokeWidth="1.3" />
      <path d="M4.5 6V4a2.5 2.5 0 015 0v2" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7" cy="9.5" r="1" fill="#2d5a27" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 14V4M7 8l4-4 4 4" stroke="#2d5a27" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="#2d5a27" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FileIcon({ ext }: { ext: 'csv' | 'pdf' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="9" height="13" rx="1.5" stroke={ext === 'pdf' ? '#b8734a' : '#2d5a27'} strokeWidth="1.2" fill="none" />
      <path d="M9 1v3h3" stroke={ext === 'pdf' ? '#b8734a' : '#2d5a27'} strokeWidth="1.2" />
      <path d="M5 7h4M5 10h3" stroke={ext === 'pdf' ? '#b8734a' : '#2d5a27'} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 5l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
