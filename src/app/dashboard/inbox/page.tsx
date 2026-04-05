'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import InboxDocumentCard, { type InboxDocumentCardProps } from '@/components/InboxDocumentCard'
import InboxSetupBanner from '@/components/InboxSetupBanner'
import ReceiptAnimation from '@/components/ReceiptAnimation'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INBOX_EMAIL = 'books@yourfirm.closebooks.io'

type FilterTab = 'all' | 'receipt' | 'invoice' | 'statement' | 'unmatched'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'receipt',   label: 'Receipts' },
  { key: 'invoice',   label: 'Invoices' },
  { key: 'statement', label: 'Statements' },
  { key: 'unmatched', label: 'Unmatched' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic demo documents
// ─────────────────────────────────────────────────────────────────────────────

type DocItem = Omit<InboxDocumentCardProps, 'onClick'> & {
  merchantName: string
  category: string
}

const DEMO_DOCS: DocItem[] = [
  {
    id: 'doc-1',
    source: 'email',
    documentType: 'receipt',
    title: 'Starbucks #447 Receipt',
    merchantName: 'Starbucks',
    amount: 12.50,
    date: '2026-04-05',
    clientName: 'Acme Corp',
    status: 'matched',
    matchConfidence: 0.97,
    processingDuration: 820,
    category: 'Meals & Entertainment',
  },
  {
    id: 'doc-2',
    source: 'email',
    documentType: 'invoice',
    title: 'Office Depot Invoice #INV-20241',
    merchantName: 'Office Depot',
    amount: 847.20,
    date: '2026-04-04',
    clientName: 'Greenfield LLC',
    status: 'review',
    processingDuration: 1140,
    category: 'Office Supplies',
  },
  {
    id: 'doc-3',
    source: 'email',
    documentType: 'statement',
    title: 'Chase Bank Statement Dec 2024',
    merchantName: 'Chase Bank',
    date: '2026-04-04',
    clientName: 'Sunrise Bakery',
    status: 'matched',
    matchConfidence: 0.94,
    processingDuration: 2300,
    category: 'Banking',
  },
  {
    id: 'doc-4',
    source: 'sms',
    documentType: 'receipt',
    title: 'Uber Eats Receipt',
    merchantName: 'Uber Eats',
    amount: 38.75,
    date: '2026-04-04',
    clientName: 'Acme Corp',
    status: 'unmatched',
    processingDuration: 640,
    category: 'Meals & Entertainment',
  },
  {
    id: 'doc-5',
    source: 'email',
    documentType: 'invoice',
    title: 'Adobe Creative Cloud — Apr 2026',
    merchantName: 'Adobe Inc.',
    amount: 599.88,
    date: '2026-04-03',
    clientName: 'Greenfield LLC',
    status: 'matched',
    matchConfidence: 0.99,
    processingDuration: 510,
    category: 'Software',
  },
  {
    id: 'doc-6',
    source: 'upload',
    documentType: 'receipt',
    title: 'Delta Airlines Ticket — DFW→LAX',
    merchantName: 'Delta Airlines',
    amount: 412.00,
    date: '2026-04-03',
    clientName: 'Sunrise Bakery',
    status: 'review',
    processingDuration: 1880,
    category: 'Travel',
  },
  {
    id: 'doc-7',
    source: 'email',
    documentType: 'statement',
    title: 'Wells Fargo Business Checking — Mar 2026',
    merchantName: 'Wells Fargo',
    date: '2026-04-02',
    clientName: 'Acme Corp',
    status: 'matched',
    matchConfidence: 0.91,
    processingDuration: 3100,
    category: 'Banking',
  },
  {
    id: 'doc-8',
    source: 'sms',
    documentType: 'receipt',
    title: 'Amazon Business — Office Chair',
    merchantName: 'Amazon',
    amount: 289.99,
    date: '2026-04-01',
    clientName: 'Greenfield LLC',
    status: 'processing',
    category: 'Office Supplies',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 8,
        border: '1px solid #e8e0d4',
        backgroundColor: copied ? '#f0fdf4' : '#ffffff',
        color: copied ? '#15803d' : '#6b6560',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const messages: Record<FilterTab, { title: string; body: string }> = {
    all:       { title: 'No documents yet', body: 'Forward a receipt or invoice to your inbox address and it will appear here instantly.' },
    receipt:   { title: 'No receipts found', body: 'Forward receipts from email or snap a photo via SMS to get started.' },
    invoice:   { title: 'No invoices found', body: 'Forward vendor invoices and CloseBooks will extract and match them automatically.' },
    statement: { title: 'No bank statements', body: 'Forward your bank statement PDFs here to begin automated reconciliation.' },
    unmatched: { title: 'All matched — inbox zero!', body: 'Every document has been matched to a transaction. Great work!' },
  }

  const { title, body } = messages[tab]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        color: '#6b6560',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#f5f0ea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#b8734a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
      </div>
      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16, color: '#1a1714' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 13, maxWidth: 320 }}>{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ value, label, accent }: { value: number | string; label: string; accent?: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 120,
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 12,
        padding: '14px 18px',
      }}
    >
      <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: accent ?? '#1a1714' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: '#6b6560', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [docs]  = useState<DocItem[]>(DEMO_DOCS)

  // Demo animation state — clicking a matched receipt triggers it
  const [animTrigger, setAnimTrigger] = useState(false)
  const [animDoc, setAnimDoc] = useState<DocItem | null>(null)

  // Inbox not configured for demo = false (show banner = true)
  const [inboxConfigured] = useState(false)

  // Stats
  const todayDocs  = docs.filter(d => d.date === '2026-04-05').length
  const matched    = docs.filter(d => d.status === 'matched').length
  const pending    = docs.filter(d => d.status === 'review' || d.status === 'unmatched').length

  // Filter logic
  const filtered = docs.filter(d => {
    if (activeTab === 'all')       return true
    if (activeTab === 'unmatched') return d.status === 'unmatched'
    return d.documentType === activeTab
  })

  const handleCardClick = useCallback((doc: DocItem) => {
    // If receipt and matched — show demo animation first, then navigate
    if (doc.documentType === 'receipt' && doc.status === 'matched') {
      setAnimDoc(doc)
      setAnimTrigger(true)
    } else {
      router.push(`/dashboard/inbox/${doc.id}`)
    }
  }, [router])

  const handleAnimComplete = useCallback(() => {
    setAnimTrigger(false)
    if (animDoc) router.push(`/dashboard/inbox/${animDoc.id}`)
  }, [animDoc, router])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>

      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 20px 60px' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#1a1714' }}>Document Inbox</h1>
            <p style={{ margin: 0, fontSize: 14, color: '#6b6560' }}>
              AI-powered receipt &amp; invoice capture — your accounting inbox zero.
            </p>
          </div>

          {/* Inbox email */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 12,
              padding: '10px 16px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <code style={{ fontSize: 13, color: '#1a1714', fontFamily: 'monospace', fontWeight: 600 }}>
              {INBOX_EMAIL}
            </code>
            <CopyButton text={INBOX_EMAIL} />
          </div>
        </div>

        {/* ── Setup banner (when not configured) ─────────────────────────── */}
        {!inboxConfigured && <InboxSetupBanner inboxEmail={INBOX_EMAIL} />}

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard value={todayDocs} label="Documents today" />
          <StatCard value={matched}   label="Matched"   accent="#15803d" />
          <StatCard value={pending}   label="Pending review" accent="#92400e" />
          <StatCard value={docs.filter(d => d.status === 'processing').length} label="Processing" accent="#475569" />
        </div>

        {/* ── Filter tabs ────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '4px',
            backgroundColor: '#f0ebe3',
            borderRadius: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            const count = tab.key === 'all'
              ? docs.length
              : tab.key === 'unmatched'
              ? docs.filter(d => d.status === 'unmatched').length
              : docs.filter(d => d.documentType === tab.key).length

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#1a1714' : '#6b6560',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {tab.label}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: isActive ? '#f5f0ea' : '#e8e0d4',
                    color: isActive ? '#1a1714' : '#6b6560',
                    padding: '0 5px',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Document feed ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 14 }}>
              <EmptyState tab={activeTab} />
            </div>
          ) : (
            filtered.map(doc => (
              <InboxDocumentCard
                key={doc.id}
                {...doc}
                onClick={() => handleCardClick(doc)}
              />
            ))
          )}
        </div>
      </main>


      {/* ── Receipt animation overlay ─────────────────────────────────── */}
      {animDoc && (
        <ReceiptAnimation
          trigger={animTrigger}
          documentTitle={animDoc.title}
          amount={animDoc.amount ?? 0}
          category={animDoc.category}
          merchantName={animDoc.merchantName}
          onComplete={handleAnimComplete}
        />
      )}
    </div>
  )
}
