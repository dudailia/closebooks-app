'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getClients, saveClient, deleteClient, getJobsForClient } from '@/lib/storage'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { logActivity } from '@/lib/activity'
import type { Client, ClientIndustry, AccountingSoftware } from '@/types'
import { SkeletonBlock, SkeletonTable, StatsSkeleton } from '@/components/Skeleton'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRIES: ClientIndustry[] = [
  'Restaurant', 'Retail', 'Professional Services', 'Construction',
  'Healthcare', 'E-commerce', 'Technology', 'Manufacturing',
  'Real Estate', 'Nonprofit', 'Legal Services', 'Transportation', 'Other',
]

const SOFTWARE: AccountingSoftware[] = ['QuickBooks', 'Xero', 'Other']

const INDUSTRY_STYLE: Record<ClientIndustry, { bg: string; text: string }> = {
  'Restaurant':            { bg: '#fdf2e9', text: '#9a3412' },
  'Retail':                { bg: '#fef9c3', text: '#854d0e' },
  'Professional Services': { bg: '#e8f0e6', text: '#2d5a27' },
  'Construction':          { bg: '#f1f5f9', text: '#334155' },
  'Healthcare':            { bg: '#eff6ff', text: '#1d4ed8' },
  'E-commerce':            { bg: '#fdf4ff', text: '#7e22ce' },
  'Technology':            { bg: '#f0f9ff', text: '#0369a1' },
  'Manufacturing':         { bg: '#f8fafc', text: '#475569' },
  'Real Estate':           { bg: '#f0fdf4', text: '#15803d' },
  'Nonprofit':             { bg: '#fef3c7', text: '#92400e' },
  'Legal Services':        { bg: '#faf5ff', text: '#6d28d9' },
  'Transportation':        { bg: '#ecfeff', text: '#0e7490' },
  'Other':                 { bg: '#f5f5f4', text: '#57534e' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Add/Edit modal
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors'
const inputStyle = { borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }
const inputFocus = { borderColor: '#b8734a', backgroundColor: '#ffffff', boxShadow: '0 0 0 3px rgba(184,115,74,0.12)' }

function FocusInput({
  label, type = 'text', value, onChange, placeholder, required = true,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputCls}
        style={focused ? { ...inputStyle, ...inputFocus } : inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function FocusSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string; value: T; onChange: (v: T) => void; options: T[]
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        required
        className={inputCls + ' appearance-none cursor-pointer'}
        style={focused ? { ...inputStyle, ...inputFocus } : inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

interface ModalProps {
  client?: Client
  onSave: (client: Client) => void
  onClose: () => void
}

function ClientModal({ client, onSave, onClose }: ModalProps) {
  const [name,     setName]     = useState(client?.business_name ?? '')
  const [industry, setIndustry] = useState<ClientIndustry>(client?.industry ?? 'Professional Services')
  const [email,    setEmail]    = useState(client?.contact_email ?? '')
  const [software, setSoftware] = useState<AccountingSoftware>(client?.accounting_software ?? 'QuickBooks')
  const [notes,    setNotes]    = useState(client?.notes ?? '')
  const [error,    setError]    = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Business name is required.'); return }
    onSave({
      id:                  client?.id ?? crypto.randomUUID(),
      business_name:       name.trim(),
      industry,
      contact_email:       email.trim(),
      accounting_software: software,
      created_at:          client?.created_at ?? new Date().toISOString(),
      notes:               notes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,23,20,0.5)' }}>
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: '#1a1714' }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors"
            style={{ color: '#6b6560', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FocusInput label="Business Name" value={name} onChange={setName} placeholder="Sunrise Advisory LLC" />

          <div className="grid grid-cols-2 gap-3">
            <FocusSelect<ClientIndustry> label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
            <FocusSelect<AccountingSoftware> label="Accounting Software" value={software} onChange={setSoftware} options={SOFTWARE} />
          </div>

          <FocusInput label="Contact Email" type="email" value={email} onChange={setEmail} placeholder="jane@sunriseadvisory.com" required={false} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this client…"
              rows={2}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-none transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#b8734a' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e0dbd4' }}
            />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#faf8f4' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Client card
// ─────────────────────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: Client
  onEdit: (c: Client) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const jobs = getJobsForClient(client.business_name)
  const lastClose = jobs[0]
  const style = INDUSTRY_STYLE[client.industry]

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${client.business_name}"? This won't remove existing closes.`)) {
      onDelete(client.id)
    }
  }

  return (
    <div
      className="group rounded-xl border p-5 cursor-pointer transition-all duration-150"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#b8734a'
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(184,115,74,0.10)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e8e0d4'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: '#1a1714' }}>
              {client.business_name}
            </h3>
            <span
              className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: style.bg, color: style.text }}
            >
              {client.industry}
            </span>
          </div>
          {client.contact_email && (
            <p className="text-xs mt-0.5 truncate" style={{ color: '#a09a94' }}>
              {client.contact_email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(client) }}
            className="p-1.5 rounded transition-colors"
            title="Edit"
            style={{ color: '#a09a94' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94' }}
          >
            <EditIcon />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded transition-colors"
            title="Delete"
            style={{ color: '#a09a94' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94' }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs" style={{ color: '#6b6560' }}>
        <span>
          <span className="font-semibold font-mono" style={{ color: '#1a1714' }}>{jobs.length}</span>
          {' '}close{jobs.length !== 1 ? 's' : ''}
        </span>
        {lastClose && (
          <span>
            Last:{' '}
            <span style={{ color: '#1a1714' }}>
              {new Date(lastClose.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </span>
        )}
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: '#f5f0ea', color: '#a09a94' }}
        >
          {client.accounting_software}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { subscription, loading: subLoading } = useSubscription()
  const [clients,   setClients]   = useState<Client[]>([])
  const [mounted,   setMounted]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [industry,  setIndustry]  = useState<ClientIndustry | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState<Client | undefined>()

  useEffect(() => {
    setClients(getClients())
    setMounted(true)
  }, [])

  function handleSave(client: Client) {
    const isNew = !clients.some((c) => c.id === client.id)
    const maxC = subscription.maxClients
    if (isNew && !subLoading && maxC > 0 && maxC < 999999 && clients.length >= maxC) {
      alert(`You've reached your plan limit of ${maxC} clients. Upgrade to add more.`)
      return
    }
    saveClient(client)
    setClients(getClients())
    setShowModal(false)
    setEditing(undefined)
    if (isNew) {
      logActivity({
        type: 'client_created',
        description: `Client "${client.business_name}" added`,
        clientName: client.business_name,
      })
    }
  }

  function handleDelete(id: string) {
    const client = clients.find((c) => c.id === id)
    deleteClient(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    if (client) {
      logActivity({
        type: 'client_deleted',
        description: `Client "${client.business_name}" removed`,
      })
    }
  }

  function openEdit(c: Client) {
    setEditing(c)
    setShowModal(true)
  }

  const filtered = clients.filter((c) => {
    const matchesSearch = !search.trim() ||
      c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(search.toLowerCase())
    const matchesIndustry = industry === 'All' || c.industry === industry
    return matchesSearch && matchesIndustry
  })

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={200} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={280} style={{ marginBottom: 32 }} />
      <StatsSkeleton count={3} />
      <SkeletonTable rows={6} cols={5} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col page-content" style={{ backgroundColor: '#faf8f4' }}>
      {showModal && (
        <ClientModal
          client={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(undefined) }}
        />
      )}


      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 space-y-6 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm" style={{ color: '#a09a94' }}>
              <Link href="/dashboard" style={{ color: '#b8734a' }}>← Dashboard</Link>
            </p>
            <h1
              className="text-3xl mt-1"
              style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
            >
              Clients
            </h1>
          </div>
          {!subLoading && subscription.maxClients > 0 && clients.length >= subscription.maxClients && subscription.maxClients < 999999 ? (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#b8734a' }}
            >
              Upgrade to add more clients
            </Link>
          ) : (
            <button
              onClick={() => { setEditing(undefined); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Add Client
            </button>
          )}
        </div>

        {/* Filters */}
        {mounted && clients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="#a09a94" strokeWidth="1.4" />
                <path d="M9.5 9.5L12 12" stroke="#a09a94" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full pl-8 pr-3 py-2 rounded-xl border text-sm outline-none transition-colors"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff', color: '#1a1714' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#b8734a' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e0dbd4' }}
              />
            </div>

            {/* Industry filter */}
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as ClientIndustry | 'All')}
              className="px-3 py-2 rounded-xl border text-sm outline-none appearance-none cursor-pointer transition-colors"
              style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff', color: '#1a1714' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#b8734a' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#e0dbd4' }}
            >
              <option value="All">All industries</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        )}

        {/* Client grid */}
        {!mounted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border p-5 animate-pulse h-28" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div
            className="rounded-2xl border-2 border-dashed px-8 py-16 text-center"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mx-auto mb-4 opacity-40">
              <circle cx="18" cy="16" r="8" stroke="#b8734a" strokeWidth="1.8" fill="none" />
              <path d="M6 38c0-6.627 5.373-12 12-12h4c6.627 0 12 5.373 12 12" stroke="#b8734a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <circle cx="34" cy="34" r="8" fill="#fdf2e9" stroke="#b8734a" strokeWidth="1.5" />
              <path d="M31 34h6M34 31v6" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <p
              className="text-lg"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}
            >
              No clients yet
            </p>
            <p className="text-sm mt-1 mb-5" style={{ color: '#6b6560' }}>
              Add your first client to start tracking their closes.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#2d5a27' }}
            >
              Add your first client
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: '#a09a94' }}>
            No clients match your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((c) => (
              <ClientCard key={c.id} client={c} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M11 3.5l-.6 7.5a.5.5 0 01-.5.5H4.1a.5.5 0 01-.5-.5L3 3.5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
