'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadFirmSettings } from '@/lib/firmSettings'
import type { InboxEmail } from '@/lib/inbox/types'

const INBOX_DOMAIN = 'inbox.closebooks.app'

type FilterTab = 'all' | 'unread' | 'receipt' | 'invoice' | 'statement' | 'unassigned'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'unread',     label: 'Unread' },
  { key: 'receipt',    label: 'Receipts' },
  { key: 'invoice',    label: 'Invoices' },
  { key: 'statement',  label: 'Statements' },
  { key: 'unassigned', label: 'Unassigned' },
]

// ─── Demo fallback ───────────────────────────────────────────────────────────

const DEMO_EMAILS: InboxEmail[] = [
  {
    id: 'demo-1', firmId: '', messageId: null,
    fromEmail: 'sarah@acmecorp.com', fromName: 'Sarah Chen',
    subject: 'Starbucks receipt — Mar expenses',
    bodyText: 'Hi, attaching the Starbucks receipt from last week.',
    bodyHtml: null, receivedAt: new Date(Date.now() - 3600000).toISOString(),
    clientId: 'acme', clientName: 'Acme Corp',
    matchMethod: 'email_exact', status: 'unread', attachmentCount: 1, docRequestId: null,
  },
  {
    id: 'demo-2', firmId: '', messageId: null,
    fromEmail: 'invoices@officedepot.com', fromName: 'Office Depot',
    subject: 'Invoice #INV-20241 — $847.20 due Apr 18',
    bodyText: 'Please find your invoice attached.',
    bodyHtml: null, receivedAt: new Date(Date.now() - 7200000).toISOString(),
    clientId: 'greenfield', clientName: 'Greenfield LLC',
    matchMethod: 'subject_fuzzy', status: 'read', attachmentCount: 1, docRequestId: null,
  },
  {
    id: 'demo-3', firmId: '', messageId: null,
    fromEmail: 'statements@chase.com', fromName: 'Chase Bank',
    subject: 'Your March 2026 statement is ready',
    bodyText: 'Your monthly statement is attached.',
    bodyHtml: null, receivedAt: new Date(Date.now() - 86400000).toISOString(),
    clientId: null, clientName: null,
    matchMethod: 'unassigned', status: 'unread', attachmentCount: 1, docRequestId: null,
  },
  {
    id: 'demo-4', firmId: '', messageId: null,
    fromEmail: 'billing@adobe.com', fromName: 'Adobe Inc.',
    subject: 'Adobe Creative Cloud — April 2026 invoice',
    bodyText: 'Your subscription renewal invoice.',
    bodyHtml: null, receivedAt: new Date(Date.now() - 172800000).toISOString(),
    clientId: 'sunrise', clientName: 'Sunrise Bakery',
    matchMethod: 'email_exact', status: 'read', attachmentCount: 2, docRequestId: null,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function guessDocType(email: InboxEmail): string {
  const sub = (email.subject ?? '').toLowerCase()
  if (sub.includes('statement') || sub.includes('bank')) return 'statement'
  if (sub.includes('invoice') || sub.includes('inv #') || sub.includes('bill')) return 'invoice'
  if (sub.includes('receipt')) return 'receipt'
  return 'email'
}

const DOC_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  receipt:   { bg: '#f0fdf4', color: '#15803d' },
  invoice:   { bg: '#fff7ed', color: '#c2410c' },
  statement: { bg: '#eff6ff', color: '#1d4ed8' },
  email:     { bg: '#f5f3ff', color: '#7c3aed' },
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '5px 12px', borderRadius: 8, border: '1px solid #e8e0d4',
        backgroundColor: copied ? '#f0fdf4' : '#fff',
        color: copied ? '#15803d' : '#6b6560',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

// ─── EmailRow ────────────────────────────────────────────────────────────────

function EmailRow({
  email, selected, onSelect, onClick,
}: {
  email: InboxEmail
  selected: boolean
  onSelect: (id: string, v: boolean) => void
  onClick: () => void
}) {
  const docType = guessDocType(email)
  const typeColors = DOC_TYPE_COLORS[docType] ?? DOC_TYPE_COLORS.email
  const isUnread = email.status === 'unread'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
        backgroundColor: selected ? '#f0fdf4' : '#fff',
        borderBottom: '1px solid #f0ebe3',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        borderLeft: isUnread ? '3px solid #2d5a27' : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = '#faf8f4' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = '#fff' }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={e => { e.stopPropagation(); onSelect(email.id, e.target.checked) }}
        style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0, accentColor: '#2d5a27' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Doc type badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        backgroundColor: typeColors.bg, color: typeColors.color,
        flexShrink: 0, textTransform: 'capitalize',
      }}>
        {docType}
      </span>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{
            fontSize: 13, fontWeight: isUnread ? 700 : 500, color: '#1a1714',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200,
          }}>
            {email.fromName || email.fromEmail}
          </span>
          <span style={{
            fontSize: 12, color: '#6b6560', flex: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {email.subject || '(no subject)'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {email.clientName ? (
            <span style={{
              fontSize: 11, color: '#2d5a27', fontWeight: 600,
              backgroundColor: '#e8f0e6', padding: '1px 7px', borderRadius: 999,
            }}>
              {email.clientName}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#a09a94' }}>Unassigned</span>
          )}
          {email.attachmentCount > 0 && (
            <span style={{ fontSize: 11, color: '#6b6560' }}>📎 {email.attachmentCount}</span>
          )}
        </div>
      </div>

      {/* Time */}
      <span style={{ fontSize: 11, color: '#a09a94', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {timeAgo(email.receivedAt)}
      </span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<InboxEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [inboxAddress, setInboxAddress] = useState(`docs@yourfirm.${INBOX_DOMAIN}`)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    const s = loadFirmSettings()
    const slug = s.inboxSlug?.trim()
    if (slug) setInboxAddress(`docs@${slug}.${INBOX_DOMAIN}`)
  }, [])

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inbox/emails?limit=100')
      if (res.ok) {
        const data = await res.json() as { emails: InboxEmail[] }
        setEmails(data.emails.length > 0 ? data.emails : DEMO_EMAILS)
      } else {
        setEmails(DEMO_EMAILS)
      }
    } catch {
      setEmails(DEMO_EMAILS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  // Filter
  const filtered = emails.filter(e => {
    if (activeTab === 'unread') return e.status === 'unread'
    if (activeTab === 'unassigned') return !e.clientId
    if (activeTab === 'receipt') return guessDocType(e) === 'receipt'
    if (activeTab === 'invoice') return guessDocType(e) === 'invoice'
    if (activeTab === 'statement') return guessDocType(e) === 'statement'
    return e.status !== 'archived'
  })

  function tabCount(tab: FilterTab): number {
    if (tab === 'all') return emails.filter(e => e.status !== 'archived').length
    if (tab === 'unread') return emails.filter(e => e.status === 'unread').length
    if (tab === 'unassigned') return emails.filter(e => !e.clientId && e.status !== 'archived').length
    return emails.filter(e => guessDocType(e) === tab && e.status !== 'archived').length
  }

  function handleSelect(id: string, val: boolean) {
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (val) s.add(id); else s.delete(id)
      return s
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(e => e.id)))
  }

  async function handleArchiveSelected() {
    if (selectedIds.size === 0) return
    setArchiving(true)
    try {
      await fetch('/api/inbox/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: Array.from(selectedIds) }),
      })
      setEmails(prev => prev.map(e =>
        selectedIds.has(e.id) ? { ...e, status: 'archived' as const } : e
      ))
      setSelectedIds(new Set())
    } finally {
      setArchiving(false)
    }
  }

  const stats = {
    total:      emails.filter(e => e.status !== 'archived').length,
    unread:     emails.filter(e => e.status === 'unread').length,
    unassigned: emails.filter(e => !e.clientId && e.status !== 'archived').length,
    withAttach: emails.filter(e => e.attachmentCount > 0 && e.status !== 'archived').length,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '32px 20px 60px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26,
              color: '#1a1714', margin: '0 0 4px 0', letterSpacing: '-0.02em',
            }}>
              Document Inbox
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b6560' }}>
              Emails and attachments forwarded by clients — AI-processed automatically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Inbox address */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: '#fff', border: '1px solid #e8e0d4',
              borderRadius: 10, padding: '8px 14px',
            }}>
              <span style={{ fontSize: 12, color: '#6b6560' }}>📬</span>
              <code style={{ fontSize: 12, color: '#1a1714', fontFamily: 'monospace', fontWeight: 600 }}>
                {inboxAddress}
              </code>
              <CopyButton text={inboxAddress} />
            </div>
            <Link
              href="/dashboard/inbox/setup"
              style={{
                padding: '9px 14px', fontSize: 12, fontWeight: 600, color: '#6b6560',
                border: '1px solid #e8e0d4', borderRadius: 9, textDecoration: 'none',
                backgroundColor: '#fff',
              }}
            >
              Setup →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total emails',     value: stats.total },
            { label: 'Unread',           value: stats.unread,     accent: stats.unread > 0 ? '#2d5a27' : undefined },
            { label: 'Unassigned',       value: stats.unassigned, accent: stats.unassigned > 0 ? '#c2410c' : undefined },
            { label: 'With attachments', value: stats.withAttach },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: '#fff', border: '1px solid #e8e0d4',
              borderRadius: 12, padding: '14px 16px',
            }}>
              <p style={{
                fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 24,
                color: s.accent ?? '#1a1714', margin: '0 0 2px 0',
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: '#6b6560', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0ebe3',
            padding: '0 16px', gap: 2, overflowX: 'auto',
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key
              const count = tabCount(tab.key)
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
                  style={{
                    padding: '12px 14px', fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#1a1714' : '#6b6560',
                    background: 'none', border: 'none',
                    borderBottom: isActive ? '2px solid #2d5a27' : '2px solid transparent',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                      backgroundColor: isActive ? '#e8f0e6' : '#f0ebe3',
                      color: isActive ? '#2d5a27' : '#6b6560',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Batch toolbar */}
          {selectedIds.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', backgroundColor: '#f0fdf4',
              borderBottom: '1px solid #a3c99e',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2d5a27' }}>
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleArchiveSelected}
                disabled={archiving}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  backgroundColor: '#2d5a27', color: '#fff',
                  border: 'none', borderRadius: 7, cursor: 'pointer',
                }}
              >
                {archiving ? 'Archiving…' : 'Archive selected'}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  padding: '6px 12px', fontSize: 12, color: '#6b6560',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Select all row */}
          {filtered.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 20px', borderBottom: '1px solid #f0ebe3',
              backgroundColor: '#faf8f4',
            }}>
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={handleSelectAll}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2d5a27' }}
              />
              <span style={{ fontSize: 12, color: '#6b6560' }}>Select all ({filtered.length})</span>
            </div>
          )}

          {/* Email list */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b6560', fontSize: 14 }}>
              Loading inbox…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, margin: '0 0 12px 0' }}>📭</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', margin: '0 0 6px 0' }}>Inbox zero!</p>
              <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>No emails in this category.</p>
            </div>
          ) : (
            <div>
              {filtered.map(email => (
                <EmailRow
                  key={email.id}
                  email={email}
                  selected={selectedIds.has(email.id)}
                  onSelect={handleSelect}
                  onClick={() => router.push(`/dashboard/inbox/${email.id}`)}
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
