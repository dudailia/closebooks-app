'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getClients, getJobs } from '@/lib/storage'
import {
  getDocRequests,
  createDocRequest,
  deleteDocRequest,
  updateItemStatus,
  STANDARD_TEMPLATES,
  type DocRequest,
} from '@/lib/documentRequests'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocRequest['status'] }) {
  const cfg = {
    open: { bg: '#fef9c3', color: '#854d0e', label: 'Open' },
    complete: { bg: '#dcfce7', color: '#166534', label: 'Complete' },
    overdue: { bg: '#fef2f2', color: '#991b1b', label: 'Overdue' },
  }[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

// ─── New request modal ────────────────────────────────────────────────────────

function NewRequestModal({ clientNames, onClose, onCreate }: {
  clientNames: string[]
  onClose: () => void
  onCreate: (req: DocRequest) => void
}) {
  const [client, setClient] = useState(clientNames[0] ?? '')
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState<keyof typeof STANDARD_TEMPLATES | 'custom'>('Monthly Close')
  const [dueDate, setDueDate] = useState('')
  const [customItems, setCustomItems] = useState('')

  function handleCreate() {
    if (!client || !title) return
    const templateItems = template !== 'custom'
      ? STANDARD_TEMPLATES[template]
      : customItems.split('\n').filter(Boolean).map(l => ({ label: l.trim(), required: true }))

    const req = createDocRequest(client, title, templateItems, dueDate || undefined)
    onCreate(req)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', marginBottom: 20 }}>New Document Request</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 6 }}>Client</label>
            <select value={client} onChange={e => setClient(e.target.value)}
              style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4' }}>
              {clientNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 6 }}>Request title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. March 2026 Close Documents"
              style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', boxSizing: 'border-box' }} />
          </div>

          {/* Template */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 6 }}>Template</label>
            <select value={template} onChange={e => setTemplate(e.target.value as typeof template)}
              style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4' }}>
              {Object.keys(STANDARD_TEMPLATES).map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">Custom items</option>
            </select>
          </div>

          {template === 'custom' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 6 }}>Items (one per line)</label>
              <textarea value={customItems} onChange={e => setCustomItems(e.target.value)}
                rows={4} placeholder="Bank statements&#10;Receipts over $500&#10;Payroll records"
                style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* Due date */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', display: 'block', marginBottom: 6 }}>Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', border: '1px solid #e8e0d4', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e8e0d4', background: '#fff', color: '#6b6560', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} disabled={!client || !title}
            style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', backgroundColor: !client || !title ? '#c8c0b8' : '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, cursor: !client || !title ? 'not-allowed' : 'pointer' }}>
            Create Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({ req, onDelete }: { req: DocRequest; onDelete: (id: string) => void }) {
  const done = req.items.filter(i => i.status === 'submitted' || i.status === 'approved').length
  const total = req.items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/portal/requests/${req.shareToken}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', margin: 0 }}>{req.title}</p>
          <p style={{ fontSize: 12, color: '#6b6560', margin: '2px 0 0' }}>{req.clientName}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b6560', marginBottom: 4 }}>
          <span>{done} of {total} items</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, backgroundColor: '#e8e0d4', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#2d5a27' : '#b8734a', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Items preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {req.items.slice(0, 3).map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${item.status === 'submitted' || item.status === 'approved' ? '#2d5a27' : '#d1d5db'}`, backgroundColor: item.status === 'submitted' || item.status === 'approved' ? '#2d5a27' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {(item.status === 'submitted' || item.status === 'approved') && <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>✓</span>}
            </span>
            <span style={{ color: item.status === 'submitted' || item.status === 'approved' ? '#6b6560' : '#1a1714', textDecoration: item.status === 'approved' ? 'line-through' : 'none' }}>{item.label}</span>
          </div>
        ))}
        {req.items.length > 3 && <p style={{ fontSize: 11, color: '#a09a94', margin: 0 }}>+{req.items.length - 3} more items</p>}
      </div>

      {/* Due date */}
      {req.dueDate && (
        <p style={{ fontSize: 11, color: new Date(req.dueDate) < new Date() ? '#dc2626' : '#6b6560', margin: 0 }}>
          Due: {new Date(req.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button onClick={copyLink}
          style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #e8e0d4', background: '#fff', color: '#1a1714', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
          📋 Copy Link
        </button>
        <button onClick={() => onDelete(req.id)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [requests, setRequests] = useState<DocRequest[]>([])
  const [showNew, setShowNew] = useState(false)
  const [clientNames, setClientNames] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    const clients = getClients()
    const fromJobs = [...new Set(jobs.map(j => j.client_name))]
    const fromClients = clients.map(c => c.business_name).filter(n => !fromJobs.includes(n))
    setClientNames([...fromJobs, ...fromClients])
    setRequests(getDocRequests())
    setMounted(true)
  }, [])

  function handleCreate(req: DocRequest) {
    setRequests(prev => [req, ...prev])
    setShowNew(false)
  }

  function handleDelete(id: string) {
    deleteDocRequest(id)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const open = requests.filter(r => r.status === 'open').length
  const complete = requests.filter(r => r.status === 'complete').length

  if (!mounted) return <div style={{ padding: 32 }}><div style={{ height: 120, borderRadius: 12, backgroundColor: '#f0ebe3' }} className="cb-skeleton" /></div>

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1a1714', margin: 0, marginBottom: 4 }}>
            Document Requests
          </h1>
          <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
            Send checklists to clients — track what you&apos;ve received and what&apos;s missing.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          disabled={clientNames.length === 0}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: clientNames.length === 0 ? '#c8c0b8' : '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, cursor: clientNames.length === 0 ? 'not-allowed' : 'pointer' }}>
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Requests', value: requests.length, color: '#1a1714' },
          { label: 'Open', value: open, color: '#b8734a' },
          { label: 'Complete', value: complete, color: '#2d5a27' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#6b6560', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No requests yet</h3>
          <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 360, margin: '0 auto 24px' }}>
            Send a document request checklist to a client and track what you&apos;ve received.
            {clientNames.length === 0 && ' Upload a close first to add clients.'}
          </p>
          {clientNames.length > 0 ? (
            <button onClick={() => setShowNew(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              + Create first request
            </button>
          ) : (
            <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Upload a close first
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {requests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {requests.map(req => (
            <RequestCard key={req.id} req={req} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showNew && (
        <NewRequestModal
          clientNames={clientNames}
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
