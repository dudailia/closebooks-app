'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import VaultDocumentCard from '@/components/VaultDocumentCard'
import VaultSearchBar from '@/components/VaultSearchBar'
import DocumentUploader from '@/components/DocumentUploader'
import DocumentRequestModal from '@/components/DocumentRequestModal'
import {
  getDocuments,
  getVaultStats,
  saveDocument,
  getDocumentRequests,
} from '@/lib/vaultStorage'
import type { VaultDocument, DocumentRequest } from '@/types/vault'
import type { VaultSearchFilters } from '@/components/VaultSearchBar'

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

const SEED_DOCS: VaultDocument[] = [
  {
    id: 'seed-1',
    clientName: 'Acme Corp',
    fileName: 'acme-corp-march-2024.csv',
    fileSize: 142_800,
    fileType: 'bank-statement',
    mimeType: 'text/csv',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: 'firm',
    tags: ['Acme Corp', 'March 2024'],
    notes: 'Exported from Chase Business portal',
  },
  {
    id: 'seed-2',
    clientName: 'Smith & Associates',
    fileName: 'smith-associates-engagement.pdf',
    fileSize: 512_000,
    fileType: 'engagement-letter',
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: 'firm',
    tags: ['Smith & Associates', '2024 Engagement'],
  },
  {
    id: 'seed-3',
    clientName: 'Martinez LLC',
    fileName: 'martinez-payroll-q1.xlsx',
    fileSize: 88_400,
    fileType: 'payroll',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: 'firm',
    tags: ['Martinez LLC', 'Q1 2024', 'Payroll'],
  },
  {
    id: 'seed-4',
    clientName: 'Acme Corp',
    fileName: 'acme-corp-receipts.pdf',
    fileSize: 1_240_000,
    fileType: 'receipt',
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: 'client',
    tags: ['Acme Corp', 'Receipts'],
    notes: 'Uploaded by client via portal',
  },
]

function seedIfEmpty() {
  const existing = getDocuments()
  if (existing.length === 0) {
    SEED_DOCS.forEach((d) => saveDocument(d))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter / search helpers
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'all' | 'bank-statement' | 'tax-return' | 'report' | 'receipt' | 'client' | 'pending-requests'

function applyFilters(
  docs: VaultDocument[],
  query: string,
  filters: VaultSearchFilters,
  tab: TabId,
): VaultDocument[] {
  let result = docs

  // Tab filter
  if (tab === 'client') result = result.filter((d) => d.uploadedBy === 'client')
  else if (tab !== 'all' && tab !== 'pending-requests') result = result.filter((d) => d.fileType === (tab as import('@/types/vault').DocumentFileType))

  // Text search
  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter(
      (d) =>
        d.fileName.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        (d.notes?.toLowerCase().includes(q) ?? false),
    )
  }

  // File type filter
  if (filters.fileType) result = result.filter((d) => d.fileType === filters.fileType)

  // Uploaded by
  if (filters.uploadedBy && filters.uploadedBy !== 'all') {
    result = result.filter((d) => d.uploadedBy === filters.uploadedBy)
  }

  // Date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = Date.now()
    const cutoff =
      filters.dateRange === 'this-month'    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() :
      filters.dateRange === 'last-3-months' ? now - 90 * 24 * 60 * 60 * 1000 :
      filters.dateRange === 'this-year'     ? new Date(new Date().getFullYear(), 0, 1).getTime() :
      0
    result = result.filter((d) => new Date(d.uploadedAt).getTime() >= cutoff)
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 12,
        padding: '16px 20px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#6b6560', marginTop: 4 }}>{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'all',              label: 'All' },
  { id: 'bank-statement',   label: 'Bank Statements' },
  { id: 'tax-return',       label: 'Tax Returns' },
  { id: 'report',           label: 'Reports' },
  { id: 'receipt',          label: 'Receipts' },
  { id: 'client',           label: 'Client Uploads' },
  { id: 'pending-requests', label: 'Pending Requests' },
]

export default function VaultPage() {
  const [docs,           setDocs]           = useState<VaultDocument[]>([])
  const [requests,       setRequests]       = useState<DocumentRequest[]>([])
  const [stats,          setStats]          = useState({ totalDocuments: 0, totalClients: 0, pendingRequests: 0, documentsThisMonth: 0 })
  const [query,          setQuery]          = useState('')
  const [filters,        setFilters]        = useState<VaultSearchFilters>({})
  const [activeTab,      setActiveTab]      = useState<TabId>('all')
  const [showUploader,   setShowUploader]   = useState(false)
  const [showReqModal,   setShowReqModal]   = useState(false)

  function reload() {
    setDocs(getDocuments())
    setRequests(getDocumentRequests())
    setStats(getVaultStats())
  }

  useEffect(() => {
    seedIfEmpty()
    reload()
  }, [])

  const handleSearch = useCallback((q: string, f: VaultSearchFilters) => {
    setQuery(q)
    setFilters(f)
  }, [])

  const visibleDocs = activeTab === 'pending-requests'
    ? []
    : applyFilters(docs, query, filters, activeTab)

  const pendingRequests = requests.filter((r) => r.status === 'pending')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4', display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, maxWidth: 1080, margin: '0 auto', width: '100%', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#e8f0e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="4" width="18" height="15" rx="2.5" stroke="#2d5a27" strokeWidth="1.5" fill="none" />
                <path d="M2 9h18" stroke="#2d5a27" strokeWidth="1.2" />
                <path d="M7 4V2M15 4V2" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7" cy="14" r="1.2" fill="#2d5a27" />
                <circle cx="11" cy="14" r="1.2" fill="#2d5a27" />
                <circle cx="15" cy="14" r="1.2" fill="#2d5a27" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: 26,
                  color: '#1a1714',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Document Vault
              </h1>
              <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>
                All client documents in one secure place
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowReqModal(true)}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: '1px solid #e8e0d4',
                backgroundColor: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1714',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11 8v2.5a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5h2.5" stroke="#6b6560" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M8.5 1.5l3 3-5.5 5.5H3.5V7.5L8.5 1.5z" stroke="#6b6560" strokeWidth="1.1" strokeLinejoin="round" />
              </svg>
              New Request
            </button>
            <button
              onClick={() => setShowUploader(true)}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: 'none',
                backgroundColor: '#2d5a27',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 9V2M3.5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <StatCard value={stats.totalDocuments}     label="Total Documents"      color="#1a1714" />
          <StatCard value={stats.totalClients}       label="Clients with Docs"    color="#2d5a27" />
          <StatCard value={stats.pendingRequests}    label="Pending Requests"     color="#b8734a" />
          <StatCard value={stats.documentsThisMonth} label="Uploaded This Month"  color="#0e7490" />
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <VaultSearchBar onSearch={handleSearch} />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 24,
            borderBottom: '1px solid #e8e0d4',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#2d5a27' : '#6b6560',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #2d5a27' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document grid */}
        {activeTab !== 'pending-requests' && (
          <>
            {visibleDocs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e8e0d4',
                  borderRadius: 14,
                }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 14px' }}>
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke="#e8e0d4" strokeWidth="2" fill="none" />
                  <path d="M16 18h16M16 24h16M16 30h10" stroke="#e8e0d4" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#6b6560', margin: '0 0 8px' }}>
                  No documents yet
                </p>
                <p style={{ fontSize: 13, color: '#a09a94' }}>
                  Upload your first document or send a request to a client.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                }}
              >
                {visibleDocs.map((doc) => (
                  <Link key={doc.id} href={`/dashboard/vault/${doc.id}`} style={{ textDecoration: 'none' }}>
                    <VaultDocumentCard
                      doc={doc}
                      showClient
                      onDelete={(id) => {
                        setDocs((prev) => prev.filter((d) => d.id !== id))
                        setStats(getVaultStats())
                      }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pending requests section */}
        {(activeTab === 'pending-requests' || pendingRequests.length > 0) && (
          <div style={{ marginTop: (activeTab as string) !== 'pending-requests' ? 32 : 0 }}>
            {(activeTab as string) !== 'pending-requests' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                    fontSize: 18,
                    color: '#1a1714',
                    margin: 0,
                  }}
                >
                  Pending Requests
                </h2>
                <Link
                  href="/dashboard/vault/requests"
                  style={{ fontSize: 12, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
                >
                  View all →
                </Link>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(activeTab === 'pending-requests' ? requests.filter((r) => r.status === 'pending') : pendingRequests).map((req) => (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e0d4',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: '0 0 2px' }}>{req.clientName}</p>
                    <p style={{ fontSize: 12, color: '#6b6560' }}>
                      {req.requestedItems.length} item{req.requestedItems.length !== 1 ? 's' : ''} requested
                      {req.dueDate && ` · Due ${new Date(req.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 99,
                      backgroundColor: '#fff7ed',
                      color: '#c2410c',
                    }}
                  >
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />

      {/* Upload modal */}
      {showUploader && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: 'rgba(26,23,20,0.45)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e8e0d4',
              width: '100%',
              maxWidth: 460,
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: 18,
                  color: '#1a1714',
                  margin: 0,
                }}
              >
                Upload Document
              </h2>
              <button
                onClick={() => setShowUploader(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09a94', fontSize: 20 }}
              >
                ✕
              </button>
            </div>
            <DocumentUploader
              onUploaded={(doc) => {
                reload()
                setShowUploader(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Request modal */}
      {showReqModal && (
        <DocumentRequestModal
          clientName=""
          onSave={() => { reload(); setShowReqModal(false) }}
          onClose={() => setShowReqModal(false)}
        />
      )}
    </div>
  )
}
