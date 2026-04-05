'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedField {
  label: string
  value: string
}

interface AuditEvent {
  time: string
  event: string
  actor: string
}

interface MatchCandidate {
  id: string
  description: string
  amount: number
  date: string
  account: string
  confidence: number
  method: string
}

interface DocumentDetail {
  id: string
  title: string
  documentType: 'receipt' | 'invoice' | 'statement'
  status: 'matched' | 'unmatched' | 'review' | 'processing' | 'archived'
  source: 'email' | 'sms' | 'upload'
  fields: ParsedField[]
  auditTrail: AuditEvent[]
  matchCandidates: MatchCandidate[]
  confirmedMatchId?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo data keyed by document ID
// ─────────────────────────────────────────────────────────────────────────────

const DEMO: Record<string, DocumentDetail> = {
  'doc-1': {
    id: 'doc-1',
    title: 'Starbucks #447 Receipt',
    documentType: 'receipt',
    status: 'matched',
    source: 'email',
    fields: [
      { label: 'Merchant',  value: 'Starbucks #447' },
      { label: 'Amount',    value: '$12.50' },
      { label: 'Date',      value: 'Apr 5, 2026' },
      { label: 'Category',  value: 'Meals & Entertainment' },
      { label: 'Tax',       value: '$1.04' },
      { label: 'Client',    value: 'Acme Corp' },
      { label: 'Confidence','value': '97%' },
    ],
    auditTrail: [
      { time: '9:14 AM', event: 'Email received from sarah@acme.com', actor: 'System' },
      { time: '9:14 AM', event: 'Document parsed by AI — merchant, amount, date extracted', actor: 'AI' },
      { time: '9:14 AM', event: 'Matched to transaction TXN-9821 with 97% confidence', actor: 'AI' },
      { time: '9:15 AM', event: 'Auto-approved — confidence above threshold', actor: 'Autopilot' },
    ],
    matchCandidates: [
      { id: 'TXN-9821', description: 'STARBUCKS #447 DEBIT', amount: 12.50, date: 'Apr 5, 2026', account: 'Chase Business Checking ···4821', confidence: 0.97, method: 'exact' },
      { id: 'TXN-9719', description: 'SBUX COFFEE 04/04',    amount: 12.50, date: 'Apr 4, 2026', account: 'Chase Business Checking ···4821', confidence: 0.60, method: 'amount_only' },
      { id: 'TXN-9540', description: 'STARBUCKS MOBILE APP', amount: 15.00, date: 'Apr 3, 2026', account: 'Amex Platinum ···9001',           confidence: 0.22, method: 'fuzzy' },
    ],
    confirmedMatchId: 'TXN-9821',
  },
  'doc-2': {
    id: 'doc-2',
    title: 'Office Depot Invoice #INV-20241',
    documentType: 'invoice',
    status: 'review',
    source: 'email',
    fields: [
      { label: 'Vendor',    value: 'Office Depot' },
      { label: 'Invoice #', value: 'INV-20241' },
      { label: 'Amount',    value: '$847.20' },
      { label: 'Date',      value: 'Apr 4, 2026' },
      { label: 'Due Date',  value: 'Apr 18, 2026' },
      { label: 'Category',  value: 'Office Supplies' },
      { label: 'Client',    value: 'Greenfield LLC' },
      { label: 'Confidence','value': '83%' },
    ],
    auditTrail: [
      { time: '2:31 PM', event: 'Email received from invoices@officedepot.com', actor: 'System' },
      { time: '2:31 PM', event: 'Invoice parsed — amount $847.20, due Apr 18', actor: 'AI' },
      { time: '2:32 PM', event: 'No exact match found — flagged for review', actor: 'AI' },
    ],
    matchCandidates: [
      { id: 'TXN-9830', description: 'OFFICE DEPOT ONLINE ORDER', amount: 847.20, date: 'Apr 4, 2026', account: 'Chase Business Checking ···4821', confidence: 0.83, method: 'fuzzy_amount' },
      { id: 'TXN-9800', description: 'OFFICE DEPOT #2241',        amount: 842.00, date: 'Apr 2, 2026', account: 'Chase Business Checking ···4821', confidence: 0.55, method: 'fuzzy' },
      { id: 'TXN-9750', description: 'STAPLES.COM PURCHASE',      amount: 850.00, date: 'Apr 1, 2026', account: 'Amex Platinum ···9001',           confidence: 0.31, method: 'fuzzy' },
    ],
  },
}

function getFallbackDoc(id: string): DocumentDetail {
  return {
    id,
    title: `Document ${id}`,
    documentType: 'receipt',
    status: 'review',
    source: 'email',
    fields: [
      { label: 'Status',  value: 'Pending review' },
      { label: 'Source',  value: 'Email' },
    ],
    auditTrail: [{ time: 'Just now', event: 'Document received', actor: 'System' }],
    matchCandidates: [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt/Invoice placeholder visual
// ─────────────────────────────────────────────────────────────────────────────

function DocumentPreview({ doc }: { doc: DocumentDetail }) {
  const isStatement = doc.documentType === 'statement'
  const isInvoice   = doc.documentType === 'invoice'

  if (isStatement) {
    return (
      <div style={{ backgroundColor: '#faf8f4', borderRadius: 12, padding: 20, border: '1px solid #e8e0d4' }}>
        {/* Bank statement mock */}
        <div style={{ backgroundColor: '#1d4ed8', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#ffffff', fontWeight: 800, fontSize: 15 }}>CHASE BANK</p>
          <p style={{ margin: '4px 0 0', color: '#bfdbfe', fontSize: 12 }}>Business Checking Statement</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Opening Balance · $12,450.00', 'Credits · $8,200.00', 'Debits · $6,930.50', 'Closing Balance · $13,719.50'].map(row => (
            <div key={row} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e8e0d4' }}>
              <span style={{ fontSize: 12, color: '#6b6560' }}>{row.split('·')[0].trim()}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1714' }}>{row.split('·')[1].trim()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isInvoice) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #e8e0d4', fontFamily: 'serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: '#1a1714' }}>INVOICE</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b6560' }}>{doc.fields.find(f => f.label === 'Invoice #')?.value ?? ''}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#b8734a' }}>Office Depot</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b6560' }}>officedepot.com</p>
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: '#e8e0d4', marginBottom: 16 }} />
        {[
          { desc: 'Printer Paper (5 reams)', qty: 5, price: 49.99 },
          { desc: 'Toner Cartridge HP LaserJet', qty: 2, price: 189.99 },
          { desc: 'Manila Folders (100pk)', qty: 3, price: 22.49 },
          { desc: 'Desk Organizer Set', qty: 1, price: 87.75 },
        ].map(item => (
          <div key={item.desc} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0ea' }}>
            <span style={{ fontSize: 11, color: '#1a1714' }}>{item.desc} ×{item.qty}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1714' }}>${(item.qty * item.price).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '4px 0', fontSize: 12, color: '#6b6560' }}>Subtotal: $780.19</p>
            <p style={{ margin: '4px 0', fontSize: 12, color: '#6b6560' }}>Tax (8.6%): $67.10</p>
            <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 800, color: '#1a1714' }}>Total: $847.20</p>
          </div>
        </div>
      </div>
    )
  }

  // Receipt
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e8e0d4',
        maxWidth: 280,
        margin: '0 auto',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      {/* Receipt header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#00704a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#1a1714', fontFamily: 'monospace' }}>STARBUCKS</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b6560' }}>Store #447 · Austin, TX</p>
      </div>

      <div style={{ height: 1, borderTop: '1px dashed #e8e0d4', marginBottom: 12 }} />

      {[
        ['Venti Oat Latte', '$6.25'],
        ['Blueberry Muffin', '$3.45'],
        ['Cake Pop', '$2.80'],
      ].map(([item, price]) => (
        <div key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#1a1714' }}>{item}</span>
          <span style={{ color: '#1a1714' }}>{price}</span>
        </div>
      ))}

      <div style={{ height: 1, borderTop: '1px dashed #e8e0d4', margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#6b6560' }}>Subtotal</span>
        <span>$11.46</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#6b6560' }}>Tax 8.25%</span>
        <span>$1.04</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
        <span>TOTAL</span>
        <span>$12.50</span>
      </div>

      <div style={{ height: 1, borderTop: '1px dashed #e8e0d4', margin: '10px 0' }} />
      <p style={{ margin: 0, textAlign: 'center', color: '#6b6560', fontSize: 11 }}>VISA ···4821 · Apr 5 2026 09:14</p>
      <p style={{ margin: '6px 0 0', textAlign: 'center', color: '#00704a', fontSize: 11 }}>Thank you for your visit!</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence meter
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#6b6560' }}>Match confidence</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 5, backgroundColor: '#f0ebe3', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 9999, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params)
  const router = useRouter()

  const doc = DEMO[documentId] ?? getFallbackDoc(documentId)
  const [confirmedId, setConfirmedId] = useState<string | undefined>(doc.confirmedMatchId)
  const [reprocessing, setReprocessing] = useState(false)
  const [archived, setArchived] = useState(doc.status === 'archived')

  function handleMatch(txnId: string) {
    setConfirmedId(txnId)
  }

  async function handleReprocess() {
    setReprocessing(true)
    await new Promise(r => setTimeout(r, 1800))
    setReprocessing(false)
  }

  function handleArchive() {
    setArchived(true)
    setTimeout(() => router.push('/dashboard/inbox'), 1000)
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    matched:    { bg: '#dcfce7', color: '#166534' },
    unmatched:  { bg: '#fef3c7', color: '#92400e' },
    review:     { bg: '#dbeafe', color: '#1e40af' },
    processing: { bg: '#f1f5f9', color: '#475569' },
    archived:   { bg: '#f5f5f4', color: '#78716c' },
  }
  const statusStyle = statusColors[archived ? 'archived' : doc.status] ?? statusColors.review

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, maxWidth: 1060, margin: '0 auto', width: '100%', padding: '28px 20px 60px' }}>

        {/* Back */}
        <Link
          href="/dashboard/inbox"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6560', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Inbox
        </Link>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#1a1714' }}>{doc.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6b6560', textTransform: 'capitalize' }}>{doc.source} · {doc.documentType}</span>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                }}
              >
                {archived ? 'Archived' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                border: '1px solid #e8e0d4', backgroundColor: '#ffffff',
                color: '#1a1714', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: reprocessing ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: reprocessing ? 'spin 1s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              {reprocessing ? 'Re-processing…' : 'Re-process'}
            </button>

            <button
              onClick={handleArchive}
              disabled={archived}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                border: '1px solid #e8e0d4', backgroundColor: '#ffffff',
                color: '#6b6560', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: archived ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              Archive
            </button>
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left: document preview */}
          <div style={{ flex: '0 0 auto', width: 320 }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e0d4',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Document Preview</p>
              <DocumentPreview doc={doc} />
            </div>
          </div>

          {/* Right: parsed data + matcher + audit */}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Parsed fields */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 22 }}>
              <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extracted Data</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {doc.fields.map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, color: '#6b6560' }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction matcher */}
            {doc.matchCandidates.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 22 }}>
                <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Transaction Matcher
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {doc.matchCandidates.map(cand => {
                    const isConfirmed = confirmedId === cand.id
                    const pct = Math.round(cand.confidence * 100)
                    const methodLabel = cand.method === 'exact' ? 'Exact match' : cand.method === 'fuzzy_amount' ? 'Fuzzy amount' : 'Approximate'
                    return (
                      <div
                        key={cand.id}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: isConfirmed ? '2px solid #22c55e' : '1px solid #e8e0d4',
                          backgroundColor: isConfirmed ? '#f0fdf4' : '#faf8f4',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1a1714' }}>{cand.description}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b6560' }}>{cand.date} · {cand.account}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a1714' }}>
                              ${cand.amount.toFixed(2)}
                            </p>
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 9999,
                                backgroundColor: '#f5f0ea',
                                color: '#6b6560',
                              }}
                            >
                              {methodLabel}
                            </span>
                          </div>
                        </div>

                        <ConfidenceMeter value={cand.confidence} />

                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#6b6560' }}>ID: {cand.id}</span>
                          {isConfirmed ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Confirmed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMatch(cand.id)}
                              style={{
                                padding: '5px 14px',
                                borderRadius: 8,
                                border: 'none',
                                backgroundColor: '#2d5a27',
                                color: '#ffffff',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Match to Transaction
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Audit trail */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 22 }}>
              <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audit Trail</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {doc.auditTrail.map((evt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 14, paddingBottom: idx < doc.auditTrail.length - 1 ? 16 : 0, position: 'relative' }}>
                    {/* Timeline dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2d5a27', marginTop: 3, flexShrink: 0 }} />
                      {idx < doc.auditTrail.length - 1 && (
                        <div style={{ width: 2, flex: 1, backgroundColor: '#e8e0d4', marginTop: 4 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ paddingBottom: idx < doc.auditTrail.length - 1 ? 8 : 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{evt.event}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b6560' }}>{evt.time} · {evt.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <AppFooter />
    </div>
  )
}
