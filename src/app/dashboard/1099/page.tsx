'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getJobs } from '@/lib/storage'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormType = '1099-NEC' | '1099-MISC' | '1099-K'
type Status = 'ready' | 'needs-tin' | 'filed' | 'error'
type FilterTab = 'all' | 'NEC' | 'MISC' | 'K' | 'needs-review' | 'filed'

interface Recipient {
  id: string
  name: string
  tin: string
  formType: FormType
  amount: number
  status: Status
  email?: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_RECIPIENTS: Recipient[] = [
  { id: 'r1',  name: 'Martinez Plumbing LLC',      tin: '45-6789012', formType: '1099-NEC',  amount: 8500,  status: 'ready',     email: 'jose@martinezplumbing.com' },
  { id: 'r2',  name: 'Sarah Johnson Consulting',   tin: '32-1098765', formType: '1099-NEC',  amount: 9800,  status: 'ready',     email: 'sarah@sjconsult.com' },
  { id: 'r3',  name: 'Rodriguez Design Studio',    tin: '67-8901234', formType: '1099-NEC',  amount: 4200,  status: 'ready',     email: 'studio@rdesign.co' },
  { id: 'r4',  name: 'Williams Legal Services',    tin: '89-0123456', formType: '1099-NEC',  amount: 15000, status: 'ready',     email: 'billing@williamslaw.com' },
  { id: 'r5',  name: 'Tom Chen Photography',       tin: '11-2233445', formType: '1099-NEC',  amount: 1800,  status: 'ready',     email: 'tom@tcphoto.com' },
  { id: 'r6',  name: 'Blue Ridge Landscaping',     tin: '55-6677889', formType: '1099-NEC',  amount: 7200,  status: 'ready',     email: 'info@blueridge.biz' },
  { id: 'r7',  name: 'Patel Accounting Group',     tin: '23-4567890', formType: '1099-NEC',  amount: 12400, status: 'ready',     email: 'patel@pagroup.com' },
  { id: 'r8',  name: 'Rivera Event Planning',      tin: '78-9012345', formType: '1099-NEC',  amount: 3600,  status: 'ready',     email: 'eva@riveraevents.com' },
  { id: 'r9',  name: 'Summit Tech Consulting',     tin: '',           formType: '1099-NEC',  amount: 6700,  status: 'needs-tin', email: 'hello@summittech.io' },
  { id: 'r10', name: 'Green Valley Repairs',       tin: '',           formType: '1099-NEC',  amount: 2900,  status: 'needs-tin', email: 'contact@gvrepairs.com' },
  { id: 'r11', name: 'Lakewood Creative Agency',   tin: '',           formType: '1099-MISC', amount: 5100,  status: 'needs-tin', email: 'team@lakewoodcreative.com' },
  { id: 'r12', name: 'Apex Property Management',   tin: '34-5678901', formType: '1099-MISC', amount: 18000, status: 'needs-tin', email: 'rent@apexproperty.com' },
  { id: 'r13', name: 'Nguyen IT Solutions',        tin: '90-1234567', formType: '1099-NEC',  amount: 11200, status: 'needs-tin', email: 'support@nguyenit.com' },
  { id: 'r14', name: 'Parker & Associates CPA',    tin: '45-0987654', formType: '1099-NEC',  amount: 8900,  status: 'needs-tin', email: 'office@parkercpa.com' },
  { id: 'r15', name: 'Sunrise Cleaning Services',  tin: '12-3456789', formType: '1099-NEC',  amount: 4800,  status: 'filed',     email: 'admin@sunrisecleaning.com' },
  { id: 'r16', name: 'Thompson Media Group',       tin: '56-7890123', formType: '1099-MISC', amount: 7500,  status: 'filed',     email: 'billing@thompsonmedia.com' },
  { id: 'r17', name: 'K&S Electrical Contractors', tin: '78-2345678', formType: '1099-NEC',  amount: 22000, status: 'filed',     email: 'ks@kselectric.com' },
  { id: 'r18', name: 'DataFlow Analytics',         tin: '34-5555555', formType: '1099-K',    amount: 95000, status: 'error',     email: 'data@dataflow.ai' },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  'ready':     { label: 'Ready',     bg: '#dcfce7', text: '#15803d' },
  'needs-tin': { label: 'Needs TIN', bg: '#fef9c3', text: '#854d0e' },
  'filed':     { label: 'Prepared',  bg: '#dbeafe', text: '#1d4ed8' },
  'error':     { label: 'Error',     bg: '#fee2e2', text: '#991b1b' },
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: cfg.bg,
        color: cfg.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: cfg.text, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (count: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  async function handleImport() {
    setLoading(true)
    try {
      const jobs = getJobs()
      const allTx = jobs.flatMap(j => j.transactions)
      const res = await fetch('/api/1099/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: allTx }),
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.vendors?.length ?? 0
        setImportedCount(count)
        onImported(count)
      }
    } catch { /* ignore */ }
    setLoading(false)
    setDone(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1714', marginBottom: '8px' }}>
          Import from Books
        </h3>
        <p style={{ fontSize: '14px', color: '#6b6560', marginBottom: '24px' }}>
          Scans all transactions and identifies vendors paid &gt;$600 who require a 1099.
        </p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#2d5a27', marginBottom: '4px' }}>Import Complete</div>
            <div style={{ fontSize: '14px', color: '#6b6560', marginBottom: '24px' }}>
              {importedCount > 0
                ? `Found ${importedCount} vendors from your transaction history. Review below.`
                : 'Scan complete. Upload more closes to identify additional 1099 vendors.'
              }
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                backgroundColor: '#2d5a27', color: '#ffffff', border: 'none', cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'QuickBooks transactions (2024)',
              'Xero ledger data (2024)',
              'Uploaded CSV / Bank feed',
            ].map((source) => (
              <label
                key={source}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #e8e0d4', cursor: 'pointer',
                  fontSize: '14px', color: '#1a1714',
                }}
              >
                <input type="radio" name="source" value={source} defaultChecked={source.includes('QuickBooks')} />
                {source}
              </label>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                  backgroundColor: 'transparent', color: '#6b6560',
                  border: '1px solid #e8e0d4', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                style={{
                  flex: 2, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                  backgroundColor: loading ? '#a0c0a0' : '#2d5a27', color: '#ffffff',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Scanning…' : 'Import Vendors'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Filing confirmation modal ─────────────────────────────────────────────────

function FileConfirmModal({
  recipients,
  onClose,
  onConfirm,
}: {
  recipients: Recipient[]
  onClose: () => void
  onConfirm: () => void
}) {
  const total = recipients.reduce((s, r) => s + r.amount, 0)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
        <div
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1714', marginBottom: '8px' }}>
          Mark forms as prepared
        </h3>
        <p style={{ fontSize: '14px', color: '#6b6560', marginBottom: '16px' }}>
          You are about to mark{' '}
          <strong style={{ color: '#1a1714' }}>{recipients.length} form{recipients.length !== 1 ? 's' : ''}</strong>{' '}
          totalling <strong style={{ color: '#1a1714' }}>{fmt(total)}</strong> as prepared.
          <br /><br />
          <strong style={{ color: '#92400e' }}>This does not file anything with the IRS.</strong>{' '}
          CloseBooks is not an IRS-authorized e-file provider and does not transmit forms.
          It only tracks which forms you have prepared; you must still submit them through
          an authorized transmitter or the IRS IRIS portal.
        </p>
        <div
          style={{
            backgroundColor: '#faf8f4', borderRadius: '10px', padding: '14px 16px',
            marginBottom: '20px', fontSize: '13px', color: '#6b6560',
            border: '1px solid #e8e0d4',
          }}
        >
          Recipients: {recipients.map(r => r.name).join(', ')}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
              backgroundColor: 'transparent', color: '#6b6560',
              border: '1px solid #e8e0d4', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
              backgroundColor: '#2d5a27', color: '#ffffff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Mark as prepared
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Filing1099Page() {
  const [taxYear, setTaxYear] = useState('2024')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showImport, setShowImport] = useState(false)
  const [importedVendorCount, setImportedVendorCount] = useState(0)
  const [showFileModal, setShowFileModal] = useState(false)
  const [fileTargets, setFileTargets] = useState<Recipient[]>([])
  const [filedIds, setFiledIds] = useState<Set<string>>(new Set(['r15', 'r16', 'r17']))

  // Days until Jan 31
  const deadline = new Date('2025-01-31')
  const today = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const bannerColor = daysLeft < 7 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#2d5a27'
  const bannerBg = daysLeft < 7 ? '#fef2f2' : daysLeft < 30 ? '#fffbeb' : '#f0fdf4'

  function statusOf(r: Recipient): Status {
    if (filedIds.has(r.id)) return 'filed'
    return r.status
  }

  const filtered = DEMO_RECIPIENTS.filter((r) => {
    const s = statusOf(r)
    if (activeTab === 'NEC') return r.formType === '1099-NEC'
    if (activeTab === 'MISC') return r.formType === '1099-MISC'
    if (activeTab === 'K') return r.formType === '1099-K'
    if (activeTab === 'needs-review') return s === 'needs-tin' || s === 'error'
    if (activeTab === 'filed') return s === 'filed'
    return true
  })

  const stats = {
    total: DEMO_RECIPIENTS.length,
    ready: DEMO_RECIPIENTS.filter(r => statusOf(r) === 'ready').length,
    review: DEMO_RECIPIENTS.filter(r => ['needs-tin', 'error'].includes(statusOf(r))).length,
    filed: filedIds.size,
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  function handleFileSelected() {
    const targets = filtered.filter(r => selected.has(r.id) && statusOf(r) === 'ready')
    if (targets.length === 0) return
    setFileTargets(targets)
    setShowFileModal(true)
  }

  function confirmFiling() {
    const next = new Set(filedIds)
    fileTargets.forEach(r => next.add(r.id))
    setFiledIds(next)
    setSelected(new Set())
    setShowFileModal(false)
  }

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',         label: `All (${DEMO_RECIPIENTS.length})` },
    { id: 'NEC',         label: '1099-NEC' },
    { id: 'MISC',        label: '1099-MISC' },
    { id: 'K',           label: '1099-K' },
    { id: 'needs-review', label: `Needs Review (${stats.review})` },
    { id: 'filed',       label: `Prepared (${stats.filed})` },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px', marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1714', margin: 0 }}>
            1099 Filing
          </h1>
          <p style={{ fontSize: '14px', color: '#6b6560', marginTop: '4px' }}>
            Prepare and validate 1099 forms. CloseBooks does not transmit to the IRS.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px',
              border: '1px solid #e8e0d4', fontSize: '14px',
              backgroundColor: '#ffffff', color: '#1a1714', cursor: 'pointer',
            }}
          >
            {['2024', '2023', '2022'].map(y => (
              <option key={y} value={y}>Tax Year {y}</option>
            ))}
          </select>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              border: '1px solid #b8734a', color: '#b8734a',
              backgroundColor: 'transparent', cursor: 'pointer',
            }}
          >
            Import from Books
          </button>
          <button
            onClick={() => {
              const ready = filtered.filter(r => statusOf(r) === 'ready')
              setFileTargets(ready)
              setShowFileModal(true)
            }}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
              backgroundColor: '#2d5a27', color: '#ffffff',
              border: 'none', cursor: 'pointer',
            }}
          >
            File All Ready
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px', marginBottom: '20px',
        }}
      >
        {[
          { label: 'Total Recipients', value: stats.total, color: '#1a1714' },
          { label: 'Ready to File',    value: stats.ready, color: '#2d5a27' },
          { label: 'Needs Review',     value: stats.review, color: '#854d0e' },
          { label: 'Prepared',         value: stats.filed, color: '#1d4ed8' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#ffffff', borderRadius: '12px',
              padding: '20px', border: '1px solid #e8e0d4',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#6b6560', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Deadline banner */}
      <div
        style={{
          backgroundColor: bannerBg, border: `1px solid ${bannerColor}`,
          borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bannerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 600, color: bannerColor }}>
          IRS deadline: January 31, 2025 —{' '}
          {daysLeft > 0 ? `${daysLeft} days remaining` : 'DEADLINE PASSED'}
        </span>
        <span style={{ fontSize: '13px', color: '#6b6560', marginLeft: 'auto' }}>
          {stats.ready} forms ready · {stats.review} need attention
        </span>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex', gap: '4px', marginBottom: '16px',
          borderBottom: '2px solid #e8e0d4', paddingBottom: '0',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #2d5a27' : '2px solid transparent',
              marginBottom: '-2px',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#2d5a27' : '#6b6560',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px', marginBottom: '12px',
            backgroundColor: '#e8f0e6', borderRadius: '10px',
            border: '1px solid #c5d9c2',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#2d5a27' }}>
            {selected.size} selected
          </span>
          <button
            onClick={handleFileSelected}
            style={{
              padding: '6px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '13px',
              backgroundColor: '#2d5a27', color: '#ffffff', border: 'none', cursor: 'pointer',
            }}
          >
            Mark as prepared
          </button>
          <button
            style={{
              padding: '6px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '13px',
              backgroundColor: 'transparent', color: '#2d5a27',
              border: '1px solid #2d5a27', cursor: 'pointer',
            }}
          >
            Download Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', fontSize: '13px',
              backgroundColor: 'transparent', color: '#6b6560',
              border: '1px solid #e8e0d4', cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff', borderRadius: '14px',
          border: '1px solid #e8e0d4', overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
                <th style={{ padding: '12px 16px', width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                {['Recipient', 'TIN', 'Form', 'Amount', 'Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '12px', fontWeight: 700,
                      color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const s = statusOf(r)
                const isSelected = selected.has(r.id)
                const maskedTin = r.tin
                  ? r.tin.replace(/(\d{2})-(\d{3})(\d{4})/, '**-***$3')
                  : '—'

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid #f0ede8' : 'none',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/dashboard/1099/${r.id}`}
                        style={{ fontWeight: 600, color: '#1a1714', textDecoration: 'none', fontSize: '14px' }}
                      >
                        {r.name}
                      </Link>
                      {r.email && (
                        <div style={{ fontSize: '12px', color: '#6b6560', marginTop: '2px' }}>
                          {r.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b6560', fontFamily: 'monospace' }}>
                      {maskedTin}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '12px', fontWeight: 600, padding: '3px 8px',
                          borderRadius: '6px', backgroundColor: '#f0f4ff', color: '#3730a3',
                        }}
                      >
                        {r.formType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '14px', color: '#1a1714', whiteSpace: 'nowrap' }}>
                      {fmt(r.amount)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={s} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Link
                          href={`/dashboard/1099/${r.id}`}
                          style={{
                            padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                            border: '1px solid #e8e0d4', color: '#6b6560', textDecoration: 'none',
                            backgroundColor: 'transparent',
                          }}
                        >
                          Review
                        </Link>
                        {s !== 'filed' && (
                          <button
                            onClick={() => {
                              setFileTargets([r])
                              setShowFileModal(true)
                            }}
                            disabled={s !== 'ready'}
                            style={{
                              padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                              border: 'none',
                              backgroundColor: s === 'ready' ? '#2d5a27' : '#e8e0d4',
                              color: s === 'ready' ? '#ffffff' : '#a0a0a0',
                              cursor: s === 'ready' ? 'pointer' : 'not-allowed',
                            }}
                          >
                            File
                          </button>
                        )}
                        <button
                          style={{
                            padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                            border: '1px solid #e8e0d4', color: '#6b6560',
                            backgroundColor: 'transparent', cursor: 'pointer',
                          }}
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560', fontSize: '14px' }}>
            No recipients match this filter.
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b6560' }}>
        Showing {filtered.length} of {DEMO_RECIPIENTS.length} recipients · Tax Year {taxYear}
      </div>

      {/* Modals */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={(count) => { setImportedVendorCount(count); setShowImport(false) }} />}
      {showFileModal && fileTargets.length > 0 && (
        <FileConfirmModal
          recipients={fileTargets}
          onClose={() => setShowFileModal(false)}
          onConfirm={confirmFiling}
        />
      )}
    </div>
  )
}
