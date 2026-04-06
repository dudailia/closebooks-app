'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonBlock, SkeletonTable, StatsSkeleton } from '@/components/Skeleton'
import InvoiceCard from '@/components/InvoiceCard'
import RateCardEditor from '@/components/RateCardEditor'
import InvoiceGenerateModal from '@/components/InvoiceGenerateModal'
import EngagementLetterModal from '@/components/EngagementLetterModal'
import {
  getInvoices,
  saveInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getBillingStats,
  loadRateCard,
  saveRateCard,
  getEngagementLetters,
  saveEngagementLetter,
  deleteEngagementLetter,
  updateEngagementLetterStatus,
  getNextInvoiceNumber,
} from '@/lib/billingStorage'
import { generateInvoiceFromJob } from '@/lib/invoiceGenerator'
import { loadFirmSettings } from '@/lib/firmSettings'
import type { Invoice, EngagementLetter, RateCard } from '@/types/billing'
import type { CategorizationJob, Client } from '@/types'
import { useRouter } from 'next/navigation'

function getJobsFromStorage(): CategorizationJob[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('closebooks_jobs') ?? '[]') as CategorizationJob[]
  } catch {
    return []
  }
}

function getClientsFromStorage(): Client[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('closebooks_clients') ?? '[]') as Client[]
  } catch {
    return []
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function seedDemoInvoices(firmName: string) {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const past = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return d }
  const future = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); return d }

  const demos: Invoice[] = [
    {
      id: 'demo-inv-1',
      number: `INV-${now.getFullYear()}-0001`,
      clientName: 'Maple Street Bakery',
      issuedDate: fmt(past(14)),
      dueDate: fmt(future(16)),
      status: 'sent',
      lineItems: [
        { id: 'li-1', description: 'Transaction review & categorization — 47 transactions', quantity: 47, unitPrice: 18, total: 846, type: 'close' },
        { id: 'li-2', description: 'Close report generation', quantity: 1, unitPrice: 45, total: 45, type: 'report' },
      ],
      subtotal: 891,
      total: 891,
      firmName,
      sentAt: past(14).toISOString(),
    },
    {
      id: 'demo-inv-2',
      number: `INV-${now.getFullYear()}-0002`,
      clientName: 'Northgate Auto Parts',
      issuedDate: fmt(past(45)),
      dueDate: fmt(past(15)),
      status: 'overdue',
      lineItems: [
        { id: 'li-3', description: 'Transaction review & categorization — 120 transactions', quantity: 120, unitPrice: 18, total: 2160, type: 'close' },
        { id: 'li-4', description: 'Close report generation', quantity: 1, unitPrice: 45, total: 45, type: 'report' },
      ],
      subtotal: 2205,
      total: 2205,
      firmName,
      sentAt: past(45).toISOString(),
    },
    {
      id: 'demo-inv-3',
      number: `INV-${now.getFullYear()}-0003`,
      clientName: 'Bright Path Consulting',
      issuedDate: fmt(past(60)),
      dueDate: fmt(past(30)),
      status: 'paid',
      lineItems: [
        { id: 'li-5', description: 'Transaction review & categorization — 23 transactions', quantity: 23, unitPrice: 18, total: 414, type: 'close' },
        { id: 'li-6', description: 'Minimum engagement fee', quantity: 1, unitPrice: 86, total: 86, type: 'custom' },
      ],
      subtotal: 500,
      total: 500,
      firmName,
      paidAt: past(25).toISOString(),
      sentAt: past(60).toISOString(),
    },
  ]
  demos.forEach(saveInvoice)
}

type MainTab = 'invoices' | 'letters' | 'ratecard'
type InvoiceFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue'

const LETTER_STATUS_LABEL: Record<EngagementLetter['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
}
const LETTER_STATUS_COLOR: Record<EngagementLetter['status'], string> = {
  draft: '#6b6560',
  sent: '#b8734a',
  signed: '#2d5a27',
}
const LETTER_STATUS_BG: Record<EngagementLetter['status'], string> = {
  draft: '#f5f2ed',
  sent: '#fdf2e9',
  signed: '#e8f0e6',
}

const TEMPLATE_LABEL: Record<EngagementLetter['template'], string> = {
  'monthly-bookkeeping': 'Monthly Bookkeeping',
  'tax-prep': 'Tax Preparation',
  'full-service': 'Full Service',
  'custom': 'Custom',
}

export default function BillingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('invoices')
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [letters, setLetters] = useState<EngagementLetter[]>([])
  const [rateCard, setRateCard] = useState<RateCard>(loadRateCard())
  const [stats, setStats] = useState({ totalInvoiced: 0, outstanding: 0, overdue: 0, paidYTD: 0 })
  const [firmName, setFirmName] = useState('')

  // Modal states
  const [showJobSelector, setShowJobSelector] = useState(false)
  const [selectedJob, setSelectedJob] = useState<CategorizationJob | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showLetterModal, setShowLetterModal] = useState(false)
  const [letterClientName, setLetterClientName] = useState('')
  const [letterClientEmail, setLetterClientEmail] = useState('')
  const [showClientSelect, setShowClientSelect] = useState(false)

  const [jobs, setJobs] = useState<CategorizationJob[]>([])
  const [clients, setClients] = useState<Client[]>([])

  const reload = useCallback(() => {
    const invs = getInvoices()
    setInvoices(invs)
    setLetters(getEngagementLetters())
    setStats(getBillingStats())
  }, [])

  useEffect(() => {
    const settings = loadFirmSettings()
    setFirmName(settings.firmName || 'CloseBooks Accounting')

    // Seed demo invoices if empty
    const existing = getInvoices()
    if (existing.length === 0) {
      seedDemoInvoices(settings.firmName || 'CloseBooks Accounting')
    }

    setJobs(getJobsFromStorage())
    setClients(getClientsFromStorage())
    setRateCard(loadRateCard())
    reload()
    setMounted(true)
  }, [reload])

  function handleMarkPaid(id: string) {
    updateInvoiceStatus(id, 'paid', new Date().toISOString())
    reload()
  }

  function handleDeleteInvoice(id: string) {
    deleteInvoice(id)
    reload()
  }

  function handleSaveInvoice(inv: Invoice) {
    saveInvoice(inv)
    setShowInvoiceModal(false)
    setSelectedJob(null)
    reload()
  }

  function handleSaveLetter(letter: EngagementLetter) {
    saveEngagementLetter(letter)
    setShowLetterModal(false)
    setLetterClientName('')
    setLetterClientEmail('')
    reload()
  }

  function handleDeleteLetter(id: string) {
    deleteEngagementLetter(id)
    reload()
  }

  function handleRateCardChange(rc: RateCard) {
    setRateCard(rc)
    saveRateCard(rc)
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'all') return true
    return inv.status === invoiceFilter
  })

  // Completed jobs without an invoice
  const billedJobIds = new Set(invoices.map((inv) => inv.jobId).filter(Boolean) as string[])
  const unbilledJobs = jobs.filter((j) => j.status === 'completed' && !billedJobIds.has(j.id))
  const allCompletedJobs = jobs.filter((j) => j.status === 'completed')

  const avgInvoice =
    invoices.length > 0
      ? invoices.reduce((s, inv) => s + inv.total, 0) / invoices.length
      : 0

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={160} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={280} style={{ marginBottom: 32 }} />
      <StatsSkeleton count={4} />
      <SkeletonTable rows={6} cols={5} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col page-content" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Page header */}
        <div>
          <h1
            className="text-3xl"
            style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
          >
            Billing
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Invoices, engagement letters, and rate management
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'YTD Invoiced', value: fmtMoney(stats.totalInvoiced), color: '#1a1714' },
            { label: 'Outstanding', value: fmtMoney(stats.outstanding), color: '#b8734a' },
            { label: 'Overdue', value: fmtMoney(stats.overdue), color: stats.overdue > 0 ? '#dc2626' : '#1a1714' },
            { label: 'Avg Invoice', value: fmtMoney(avgInvoice), color: '#1a1714' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border p-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: '#6b6560' }}>{stat.label}</p>
              <p
                className="text-xl font-mono font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div className="flex items-center gap-1 border-b" style={{ borderColor: '#e8e0d4' }}>
          {([
            { key: 'invoices', label: 'Invoices' },
            { key: 'letters', label: 'Engagement Letters' },
            { key: 'ratecard', label: 'Rate Card' },
          ] as { key: MainTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: mainTab === tab.key ? '#2d5a27' : 'transparent',
                color: mainTab === tab.key ? '#2d5a27' : '#6b6560',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Invoices tab */}
        {mainTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {/* Filter tabs */}
              <div className="flex items-center gap-1">
                {(['all', 'draft', 'sent', 'paid', 'overdue'] as InvoiceFilter[]).map((f) => {
                  const count = f === 'all' ? invoices.length : invoices.filter((inv) => inv.status === f).length
                  return (
                    <button
                      key={f}
                      onClick={() => setInvoiceFilter(f)}
                      className="px-3 py-1.5 rounded-lg text-sm capitalize"
                      style={{
                        backgroundColor: invoiceFilter === f ? '#2d5a27' : 'transparent',
                        color: invoiceFilter === f ? '#ffffff' : '#6b6560',
                      }}
                      onMouseEnter={(e) => { if (invoiceFilter !== f) e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                      onMouseLeave={(e) => { if (invoiceFilter !== f) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {f} {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
                    </button>
                  )
                })}
              </div>

              {/* New Invoice button */}
              <button
                onClick={() => setShowJobSelector(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New Invoice
              </button>
            </div>

            {filteredInvoices.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <p className="text-sm" style={{ color: '#6b6560' }}>
                  {invoiceFilter === 'all'
                    ? 'No invoices yet. Generate your first invoice from a completed close.'
                    : `No ${invoiceFilter} invoices.`}
                </p>
                {invoiceFilter === 'all' && (
                  <button
                    onClick={() => setShowJobSelector(true)}
                    className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: '#2d5a27' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                  >
                    Generate First Invoice
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    onMarkPaid={handleMarkPaid}
                    onDelete={handleDeleteInvoice}
                    onClick={() => router.push(`/dashboard/billing/${inv.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Engagement Letters tab */}
        {mainTab === 'letters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowClientSelect(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#b8734a' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a6040' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New Letter
              </button>
            </div>

            {letters.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
                  No engagement letters yet. Create one for a client to define your scope and fees.
                </p>
                <button
                  onClick={() => setShowClientSelect(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: '#b8734a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9a6040' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                >
                  Create Engagement Letter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="rounded-2xl border p-4 flex items-center gap-4"
                    style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: LETTER_STATUS_BG[letter.status],
                            color: LETTER_STATUS_COLOR[letter.status],
                          }}
                        >
                          {LETTER_STATUS_LABEL[letter.status]}
                        </span>
                        <span className="text-xs" style={{ color: '#a09a94' }}>
                          {TEMPLATE_LABEL[letter.template]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                        {letter.clientName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                        ${letter.monthlyFee.toLocaleString()}/mo · {letter.services.length} services · starts {letter.startDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {letter.status === 'draft' && (
                        <button
                          onClick={() => updateEngagementLetterStatus(letter.id, 'sent') || reload()}
                          className="text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                          style={{ borderColor: '#b8734a', color: '#b8734a' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          Mark Sent
                        </button>
                      )}
                      {letter.status === 'sent' && (
                        <button
                          onClick={() => { updateEngagementLetterStatus(letter.id, 'signed'); reload() }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border font-medium"
                          style={{ borderColor: '#2d5a27', color: '#2d5a27' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          Mark Signed
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLetter(letter.id)}
                        className="p-1.5 rounded-lg"
                        style={{ color: '#6b6560' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 8h7l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rate Card tab */}
        {mainTab === 'ratecard' && (
          <div className="max-w-xl">
            <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
              Changes are saved automatically and applied to all future invoice generation.
            </p>
            <RateCardEditor value={rateCard} onChange={handleRateCardChange} />
          </div>
        )}
      </main>


      {/* Job selector modal */}
      {showJobSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: '#e8e0d4' }}
            >
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
              >
                Select a Completed Close
              </h2>
              <button
                onClick={() => setShowJobSelector(false)}
                className="p-1.5 rounded-lg"
                style={{ color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {allCompletedJobs.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#6b6560' }}>
                  No completed closes found. Complete a close to generate an invoice.
                </p>
              ) : (
                allCompletedJobs.map((job) => {
                  const alreadyBilled = billedJobIds.has(job.id)
                  return (
                    <button
                      key={job.id}
                      disabled={alreadyBilled}
                      onClick={() => {
                        setSelectedJob(job)
                        setShowJobSelector(false)
                        setShowInvoiceModal(true)
                      }}
                      className="w-full text-left p-3 rounded-xl border transition-all"
                      style={{
                        borderColor: '#e8e0d4',
                        backgroundColor: alreadyBilled ? '#faf8f4' : '#ffffff',
                        opacity: alreadyBilled ? 0.6 : 1,
                        cursor: alreadyBilled ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => { if (!alreadyBilled) e.currentTarget.style.borderColor = '#2d5a27' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{job.client_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                            {job.total_transactions} transactions · {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {alreadyBilled && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
                          >
                            Invoiced
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client selector for engagement letter */}
      {showClientSelect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: '#e8e0d4' }}
            >
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: 'var(--font-dm-serif)', color: '#1a1714' }}
              >
                Select Client
              </h2>
              <button
                onClick={() => setShowClientSelect(false)}
                className="p-1.5 rounded-lg"
                style={{ color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f2ed' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {clients.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-center" style={{ color: '#6b6560' }}>
                    No clients found. Enter manually:
                  </p>
                  <input
                    placeholder="Client name"
                    className="w-full text-sm rounded-xl border px-3 py-2"
                    style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    value={letterClientName}
                    onChange={(e) => setLetterClientName(e.target.value)}
                  />
                  <input
                    placeholder="Client email (optional)"
                    type="email"
                    className="w-full text-sm rounded-xl border px-3 py-2"
                    style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                    value={letterClientEmail}
                    onChange={(e) => setLetterClientEmail(e.target.value)}
                  />
                  <button
                    disabled={!letterClientName.trim()}
                    onClick={() => {
                      setShowClientSelect(false)
                      setShowLetterModal(true)
                    }}
                    className="w-full py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: '#b8734a', opacity: letterClientName.trim() ? 1 : 0.5 }}
                    onMouseEnter={(e) => { if (letterClientName.trim()) e.currentTarget.style.backgroundColor = '#9a6040' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b8734a' }}
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setLetterClientName(client.business_name)
                        setLetterClientEmail(client.contact_email)
                        setShowClientSelect(false)
                        setShowLetterModal(true)
                      }}
                      className="w-full text-left p-3 rounded-xl border transition-all"
                      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.backgroundColor = '#ffffff' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{client.business_name}</p>
                      <p className="text-xs" style={{ color: '#6b6560' }}>{client.contact_email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice generate modal */}
      {showInvoiceModal && selectedJob && (
        <InvoiceGenerateModal
          job={selectedJob}
          rateCard={rateCard}
          firmName={firmName}
          onSave={handleSaveInvoice}
          onClose={() => { setShowInvoiceModal(false); setSelectedJob(null) }}
        />
      )}

      {/* Engagement letter modal */}
      {showLetterModal && (
        <EngagementLetterModal
          clientName={letterClientName}
          clientEmail={letterClientEmail}
          firmName={firmName}
          rateCard={rateCard}
          onSave={handleSaveLetter}
          onClose={() => setShowLetterModal(false)}
        />
      )}
    </div>
  )
}
