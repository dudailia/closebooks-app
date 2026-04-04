'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import { getClient, getJobsForClient, saveClient } from '@/lib/storage'
import type { Client, ClientIndustry, AccountingSoftware, CategorizationJob } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRIES: ClientIndustry[] = [
  'Restaurant', 'Retail', 'Professional Services',
  'Construction', 'Healthcare', 'E-commerce', 'Other',
]

const SOFTWARE: AccountingSoftware[] = ['QuickBooks', 'Xero', 'Other']

const INDUSTRY_STYLE: Record<ClientIndustry, { bg: string; text: string }> = {
  'Restaurant':            { bg: '#fdf2e9', text: '#9a3412' },
  'Retail':                { bg: '#fef9c3', text: '#854d0e' },
  'Professional Services': { bg: '#e8f0e6', text: '#2d5a27' },
  'Construction':          { bg: '#f1f5f9', text: '#334155' },
  'Healthcare':            { bg: '#eff6ff', text: '#1d4ed8' },
  'E-commerce':            { bg: '#fdf4ff', text: '#7e22ce' },
  'Other':                 { bg: '#f5f5f4', text: '#57534e' },
}

const STATUS_STYLE = {
  processing: { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04', label: 'Processing' },
  review:     { bg: '#fdf2e9', text: '#9a3412', dot: '#b8734a', label: 'In Review'  },
  completed:  { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Completed'  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit modal (inline)
// ─────────────────────────────────────────────────────────────────────────────

function EditModal({ client, onSave, onClose }: { client: Client; onSave: (c: Client) => void; onClose: () => void }) {
  const [name,     setName]     = useState(client.business_name)
  const [industry, setIndustry] = useState<ClientIndustry>(client.industry)
  const [email,    setEmail]    = useState(client.contact_email)
  const [software, setSoftware] = useState<AccountingSoftware>(client.accounting_software)
  const [notes,    setNotes]    = useState(client.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...client, business_name: name.trim(), industry, contact_email: email.trim(), accounting_software: software, notes: notes.trim() || undefined })
  }

  const inputCls = 'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors'
  const s = { borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }
  const sf = { borderColor: '#b8734a', backgroundColor: '#ffffff' }
  const [f, setF] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: '#1a1714' }}>Edit Client</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-sm" style={{ color: '#6b6560' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Business Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} style={f === 'name' ? { ...s, ...sf } : s} onFocus={() => setF('name')} onBlur={() => setF('')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value as ClientIndustry)} className={inputCls + ' appearance-none'} style={f === 'ind' ? { ...s, ...sf } : s} onFocus={() => setF('ind')} onBlur={() => setF('')}>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Software</label>
              <select value={software} onChange={(e) => setSoftware(e.target.value as AccountingSoftware)} className={inputCls + ' appearance-none'} style={f === 'sw' ? { ...s, ...sf } : s} onFocus={() => setF('sw')} onBlur={() => setF('')}>
                {SOFTWARE.map((sw) => <option key={sw} value={sw}>{sw}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Contact Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={f === 'email' ? { ...s, ...sf } : s} onFocus={() => setF('email')} onBlur={() => setF('')} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none" style={f === 'notes' ? { ...s, ...sf } : s} onFocus={() => setF('notes')} onBlur={() => setF('')} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: '#e0dbd4', color: '#6b6560' }}>Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Close card (read-only)
// ─────────────────────────────────────────────────────────────────────────────

function CloseCard({ job }: { job: CategorizationJob }) {
  const router = useRouter()
  const s = STATUS_STYLE[job.status]
  const pct = job.total_transactions > 0
    ? Math.round(((job.approved + job.flagged) / job.total_transactions) * 100)
    : 0

  return (
    <div
      className="rounded-xl border p-4 cursor-pointer transition-all"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      onClick={() => router.push(`/dashboard/review/${job.id}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(184,115,74,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
            {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
            {job.total_transactions} transactions
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={{ backgroundColor: s.bg, color: s.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
          {s.label}
        </span>
      </div>

      <div className="flex gap-4 text-xs mb-3" style={{ color: '#6b6560' }}>
        <span><span className="font-semibold font-mono" style={{ color: '#059669' }}>{job.approved}</span> approved</span>
        {job.flagged > 0 && <span><span className="font-semibold font-mono" style={{ color: '#dc2626' }}>{job.flagged}</span> flagged</span>}
        <span><span className="font-semibold font-mono" style={{ color: '#1a1714' }}>{job.auto_categorized}</span> auto</span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#059669' : '#2d5a27' }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()

  const [client,   setClient]   = useState<Client | null>(null)
  const [jobs,     setJobs]     = useState<CategorizationJob[]>([])
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    const c = getClient(clientId)
    if (!c) { setNotFound(true); return }
    setClient(c)
    setJobs(getJobsForClient(c.business_name))
  }, [clientId])

  function handleSaveEdit(updated: Client) {
    saveClient(updated)
    setClient(updated)
    // Re-fetch jobs in case name changed
    setJobs(getJobsForClient(updated.business_name))
    setShowEdit(false)
  }

  function handleNewClose() {
    if (!client) return
    // Store prefill in sessionStorage for the upload page to pick up
    sessionStorage.setItem('closebooks_prefill_client', client.business_name)
    router.push('/dashboard/upload')
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <DashboardNav />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-5">
          <p className="text-lg font-semibold" style={{ color: '#1a1714' }}>Client not found</p>
          <p className="text-sm" style={{ color: '#6b6560' }}>This client may have been deleted.</p>
          <Link href="/dashboard/clients" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#2d5a27' }}>
            Back to Clients
          </Link>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#e0dbd4" strokeWidth="2" />
          <path d="M10 2a8 8 0 018 8" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  const industryStyle = INDUSTRY_STYLE[client.industry]

  // Aggregate stats from jobs
  const totalTx    = jobs.reduce((s, j) => s + j.total_transactions, 0)
  const totalAuto  = jobs.reduce((s, j) => s + j.auto_categorized, 0)
  const allConfs   = jobs.flatMap((j) => j.transactions.filter((t) => t.confidence > 0).map((t) => t.confidence))
  const avgConf    = allConfs.length > 0 ? Math.round(allConfs.reduce((a, b) => a + b, 0) / allConfs.length * 100) : null
  const timeSavedMin = totalTx * 2
  const timeSaved  = timeSavedMin === 0 ? '—' : timeSavedMin >= 60 ? `${(timeSavedMin / 60).toFixed(1)}h` : `${timeSavedMin}m`

  const stats = [
    { label: 'Total Closes',    value: String(jobs.length),        color: '#1a1714' },
    { label: 'Transactions',    value: totalTx.toLocaleString(),   color: '#1a1714' },
    { label: 'Auto-categorized',value: `${totalAuto}`,             color: '#2d5a27' },
    { label: 'Time Saved',      value: timeSaved,                  color: timeSavedMin > 0 ? '#2d5a27' : '#a09a94' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {showEdit && <EditModal client={client} onSave={handleSaveEdit} onClose={() => setShowEdit(false)} />}

      <DashboardNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 space-y-8 page-enter">

        {/* Breadcrumb */}
        <div>
          <Link href="/dashboard/clients" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
            ← All Clients
          </Link>
        </div>

        {/* Client header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-3xl"
                style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
              >
                {client.business_name}
              </h1>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: industryStyle.bg, color: industryStyle.text }}
              >
                {client.industry}
              </span>
              <span
                className="text-xs px-2 py-1 rounded font-medium"
                style={{ backgroundColor: '#f5f0ea', color: '#a09a94' }}
              >
                {client.accounting_software}
              </span>
            </div>
            {client.contact_email && (
              <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>{client.contact_email}</p>
            )}
            {client.notes && (
              <p className="text-sm mt-1 italic" style={{ color: '#a09a94' }}>{client.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="px-3 py-2 rounded-xl text-sm border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a1714'; e.currentTarget.style.color = '#1a1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.color = '#6b6560' }}
            >
              Edit
            </button>
            <button
              onClick={handleNewClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span>
              New Close
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border px-4 py-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="font-mono text-2xl font-semibold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-1.5" style={{ color: '#6b6560' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {avgConf !== null && (
          <div
            className="rounded-xl border px-4 py-3 flex items-center gap-3 text-sm"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono font-semibold text-xs"
              style={{
                backgroundColor: avgConf >= 85 ? '#ecfdf5' : avgConf >= 70 ? '#fef9c3' : '#fef2f2',
                color:           avgConf >= 85 ? '#059669' : avgConf >= 70 ? '#854d0e' : '#dc2626',
              }}
            >
              {avgConf}%
            </div>
            <div>
              <p className="font-medium" style={{ color: '#1a1714' }}>Average AI confidence</p>
              <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
                {avgConf >= 85 ? 'Excellent — most transactions auto-approved' :
                 avgConf >= 70 ? 'Good — occasional manual review needed' :
                 'Lower confidence — review carefully'}
              </p>
            </div>
          </div>
        )}

        {/* Close history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#a09a94' }}>
              Close History
            </h2>
            <span className="text-xs" style={{ color: '#a09a94' }}>
              {jobs.length} {jobs.length === 1 ? 'close' : 'closes'}
            </span>
          </div>

          {jobs.length === 0 ? (
            <div
              className="rounded-2xl border-2 border-dashed px-8 py-12 text-center"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="text-base" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
                No closes yet for this client
              </p>
              <p className="text-sm mt-1 mb-5" style={{ color: '#6b6560' }}>
                Start a close to upload and categorize their bank statement.
              </p>
              <button
                onClick={handleNewClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#2d5a27' }}
              >
                Start first close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((job) => (
                <CloseCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

      </main>

      <AppFooter />
    </div>
  )
}
