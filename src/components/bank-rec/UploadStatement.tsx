'use client'
import { useRef, useState } from 'react'

interface Props {
  clientId: string
  onUploaded: (statementId: string, lineCount: number, endingBalance: number) => void
}

const BG = '#faf8f4'
const BORDER = '#e0dbd4'
const ACCENT = '#b8734a'
const TEXT = '#1a1714'
const MUTED = '#6b6560'

export default function UploadStatement({ clientId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bankName, setBankName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function detectFormat(name: string, content: string): 'csv' | 'ofx' | 'pdf' | null {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'ofx' || ext === 'qfx') return 'ofx'
    if (ext === 'pdf') return 'pdf'
    if (content.startsWith('OFXHEADER') || content.includes('<OFX>') || content.includes('<ofx>')) return 'ofx'
    const firstLine = content.split('\n')[0].toLowerCase()
    if (firstLine.includes(',') && (firstLine.includes('date') || firstLine.includes('amount'))) return 'csv'
    return null
  }

  async function processFile(file: File) {
    setError('')
    setLoading(true)
    try {
      let content: string
      let format: 'csv' | 'ofx' | 'pdf' | null

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        bytes.forEach(b => { binary += String.fromCharCode(b) })
        content = btoa(binary)
        format = 'pdf'
      } else {
        content = await file.text()
        format = detectFormat(file.name, content)
      }

      if (!format) {
        setError('Unsupported file type. Upload a CSV, OFX, QFX, or PDF bank statement.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/bank-rec/statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, format, content, bankName: bankName.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setLoading(false)
        return
      }
      onUploaded(data.statement.id, data.lineCount, data.statement.ending_balance ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
    setLoading(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: TEXT, display: 'block', marginBottom: 4 }}>
          Bank Name <span style={{ color: MUTED, fontWeight: 400 }}>(optional — auto-detected from file)</span>
        </label>
        <input
          value={bankName}
          onChange={e => setBankName(e.target.value)}
          placeholder="e.g. Chase, Bank of America, Wells Fargo"
          style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: TEXT, background: BG, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? ACCENT : BORDER}`,
          borderRadius: 16,
          padding: '40px 24px',
          textAlign: 'center',
          background: dragging ? '#fdf2e9' : BG,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.ofx,.qfx,.pdf"
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
        {loading ? (
          <div>
            <p style={{ color: ACCENT, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Parsing statement…</p>
            <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>This may take a moment for PDF files</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '0 0 6px' }}>
              Drop your bank statement here
            </p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
              CSV · OFX · QFX · PDF — format auto-detected
            </p>
            <p style={{ fontSize: 11, color: MUTED, margin: '8px 0 0' }}>
              or click to browse files
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}
    </div>
  )
}
