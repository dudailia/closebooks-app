'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getQBOConnection, saveQBOConnection, disconnectQBO } from '@/lib/integrations'
import type { QBOConnection } from '@/lib/integrations'

// ---------------------------------------------------------------------------
// Connect modal
// ---------------------------------------------------------------------------

type ConnectStep = 'form' | 'connecting' | 'success'

function ConnectModal({ onClose, onConnected }: { onClose: () => void; onConnected: (conn: QBOConnection) => void }) {
  const [companyId,   setCompanyId]   = useState('')
  const [companyName, setCompanyName] = useState('')
  const [step,        setStep]        = useState<ConnectStep>('form')
  const [error,       setError]       = useState('')

  function handleConnect() {
    if (!companyId.trim()) { setError('Please enter your Company ID.'); return }
    setError('')
    setStep('connecting')
    // Simulate OAuth handshake delay
    setTimeout(() => {
      setStep('success')
      setTimeout(() => {
        const conn: QBOConnection = {
          companyId:   companyId.trim(),
          companyName: companyName.trim() || `Company ${companyId.trim().slice(0, 6)}`,
          connectedAt: new Date().toISOString(),
          lastSyncAt:  null,
          totalSynced: 0,
        }
        saveQBOConnection(conn)
        onConnected(conn)
      }, 1200)
    }, 1800)
  }

  // Close on Escape (only when on form step)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && step === 'form') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => step === 'form' && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-3 border-b"
          style={{ backgroundColor: '#f9fffe', borderColor: '#e0dbd4' }}
        >
          <QBOLogo size={32} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Connect to QuickBooks Online
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              Authorize CloseBooks to push transactions to your company
            </p>
          </div>
          {step === 'form' && (
            <button
              onClick={onClose}
              className="ml-auto w-7 h-7 flex items-center justify-center rounded-full text-lg leading-none transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === 'form' && (
            <div className="space-y-4">
              <div
                className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-xs"
                style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>
                  You&apos;ll need your QuickBooks Company ID. Find it in your QBO URL:{' '}
                  <span className="font-mono font-medium">app.qbo.intuit.com/app/...?companyId=<strong>123456789</strong></span>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                  Company ID <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => { setCompanyId(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="e.g. 123456789012345"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2CA01C]"
                  style={{ borderColor: error ? '#dc2626' : '#e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                  autoFocus
                />
                {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>
                  Company Name <span className="text-xs font-normal" style={{ color: '#a09a94' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2CA01C]"
                  style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a1714' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{ backgroundColor: '#2CA01C' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Connect
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: '#c4bdb8' }}>
                This is a simulated connection for demo purposes.
              </p>
            </div>
          )}

          {step === 'connecting' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#2CA01C', borderTopColor: 'transparent' }}
              />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>Connecting to QuickBooks…</p>
                <p className="text-xs mt-1" style={{ color: '#6b6560' }}>Authorizing access to your company</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6 12-12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold" style={{ color: '#14532d' }}>Connected!</p>
                <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                  QuickBooks Online has been linked to CloseBooks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Disconnect confirm modal
// ---------------------------------------------------------------------------

function DisconnectModal({ companyName, onConfirm, onCancel }: { companyName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-xl p-6"
        style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Disconnect QuickBooks Online?</p>
        <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
          This will remove the connection to <strong>{companyName}</strong>. You can reconnect at any time.
        </p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm border"
            style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integration cards
// ---------------------------------------------------------------------------

interface Integration {
  id: string
  name: string
  tagline: string
  description: string
  status: 'available' | 'coming_soon'
  logo: React.ReactNode
  accentColor: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'qbo',
    name: 'QuickBooks Online',
    tagline: 'Push transactions in one click',
    description: 'Automatically sync approved and categorized transactions directly into your QuickBooks Online company file. No manual exports, no re-importing.',
    status: 'available',
    logo: <QBOLogo size={40} />,
    accentColor: '#2CA01C',
  },
  {
    id: 'xero',
    name: 'Xero',
    tagline: 'Direct journal entry sync',
    description: 'Post categorized transactions as journal entries or bank transactions directly into Xero. Full reconciliation support.',
    status: 'coming_soon',
    logo: <XeroLogo size={40} />,
    accentColor: '#00B4E3',
  },
  {
    id: 'sage',
    name: 'Sage Intacct',
    tagline: 'Enterprise-grade sync',
    description: 'Push transactions into Sage Intacct with full dimension mapping, multi-entity support, and audit trail.',
    status: 'coming_soon',
    logo: <SageLogo size={40} />,
    accentColor: '#00A550',
  },
  {
    id: 'netsuite',
    name: 'NetSuite',
    tagline: 'ERP-level integration',
    description: 'Post journal entries and expense reports into Oracle NetSuite with subsidiary and department mapping.',
    status: 'coming_soon',
    logo: <NetsuiteLogo size={40} />,
    accentColor: '#2f5eb3',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const [mounted,    setMounted]    = useState(false)
  const [qboConn,    setQboConn]    = useState<QBOConnection | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  useEffect(() => {
    setQboConn(getQBOConnection())
    setMounted(true)
  }, [])

  function handleConnected(conn: QBOConnection) {
    setQboConn(conn)
    setShowModal(false)
  }

  function handleDisconnect() {
    disconnectQBO()
    setQboConn(null)
    setShowDisconnect(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {showModal && (
        <ConnectModal onClose={() => setShowModal(false)} onConnected={handleConnected} />
      )}
      {showDisconnect && qboConn && (
        <DisconnectModal
          companyName={qboConn.companyName}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnect(false)}
        />
      )}


      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-10 page-enter">

        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-xs transition-colors" style={{ color: '#b8734a' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#8a4f2e' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#b8734a' }}
          >
            ← Dashboard
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Integrations
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
            Connect CloseBooks to your accounting software to push categorized transactions in one click.
          </p>
        </div>

        {/* Connected banner */}
        {mounted && qboConn && (
          <div
            className="rounded-2xl border-2 px-5 py-4 flex flex-wrap items-center justify-between gap-4"
            style={{ borderColor: '#2CA01C', backgroundColor: '#f0fdf4' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9l4 4 8-8" stroke="#2CA01C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#14532d' }}>
                  QuickBooks Online connected
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#166534' }}>
                  {qboConn.companyName} · ID: {qboConn.companyId}
                  {qboConn.lastSyncAt && (
                    <> · Last sync: {new Date(qboConn.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                  )}
                  {qboConn.totalSynced > 0 && (
                    <> · {qboConn.totalSynced.toLocaleString()} transactions synced</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDisconnect(true)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: '#16a34a', color: '#166534', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {INTEGRATIONS.map((integration) => {
            const isQBO       = integration.id === 'qbo'
            const isConnected = isQBO && mounted && !!qboConn
            const dimmed      = integration.status === 'coming_soon'

            return (
              <div
                key={integration.id}
                className="rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200"
                style={{
                  borderColor: isConnected ? integration.accentColor : '#e8e0d4',
                  backgroundColor: '#ffffff',
                  opacity: dimmed ? 0.65 : 1,
                  boxShadow: isConnected ? `0 0 0 1px ${integration.accentColor}22` : 'none',
                }}
              >
                {/* Logo + name row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-xl flex items-center justify-center shrink-0"
                      style={{ width: 52, height: 52, backgroundColor: `${integration.accentColor}12` }}
                    >
                      {integration.logo}
                    </div>
                    <div>
                      <p
                        className="text-base font-semibold"
                        style={{ color: dimmed ? '#a09a94' : '#1a1714' }}
                      >
                        {integration.name}
                      </p>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: integration.accentColor, opacity: dimmed ? 0.6 : 1 }}>
                        {integration.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  {isConnected ? (
                    <span
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                      Connected
                    </span>
                  ) : integration.status === 'coming_soon' ? (
                    <span
                      className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#f5f0ea', color: '#a09a94' }}
                    >
                      Coming soon
                    </span>
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-sm flex-1" style={{ color: dimmed ? '#a09a94' : '#6b6560', lineHeight: 1.6 }}>
                  {integration.description}
                </p>

                {/* Features list */}
                {!dimmed && (
                  <ul className="space-y-1.5">
                    {getFeatures(integration.id).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: '#6b6560' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                          <circle cx="6" cy="6" r="5.5" fill={`${integration.accentColor}18`} />
                          <path d="M3.5 6l2 2 3-3" stroke={integration.accentColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action */}
                <div className="mt-auto pt-1">
                  {isQBO && !dimmed ? (
                    isConnected ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDisconnect(true)}
                          className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                          style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#faf8f4' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.color = '#6b6560' }}
                        >
                          Disconnect
                        </button>
                        <button
                          disabled
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white opacity-60 cursor-default"
                          style={{ backgroundColor: '#2CA01C' }}
                          title="Push transactions from the review page"
                        >
                          ✓ Ready to push
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
                        style={{ backgroundColor: '#2CA01C' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1v6M4 4l3-3 3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1 9v2.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V9" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        Connect to QuickBooks Online
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-sm font-medium border cursor-not-allowed"
                      style={{ borderColor: '#e0dbd4', color: '#c4bdb8', backgroundColor: '#faf8f4' }}
                    >
                      Coming Soon — Join Waitlist
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div
          className="rounded-2xl border px-5 py-4 flex items-start gap-3"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="6.5" stroke="#a09a94" strokeWidth="1.3" />
            <path d="M8 7v4M8 5.5v.5" stroke="#a09a94" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="text-xs" style={{ color: '#a09a94', lineHeight: 1.6 }}>
            <span className="font-semibold" style={{ color: '#6b6560' }}>Demo note:</span>{' '}
            The QuickBooks connection above is simulated for demonstration purposes. In production, this would use the official Intuit OAuth 2.0 flow requiring a verified developer account. All other integrations are on the roadmap.
          </p>
        </div>

      </main>
    </div>
  )
}

function getFeatures(id: string): string[] {
  switch (id) {
    case 'qbo':
      return [
        'Push approved transactions with one click',
        'Automatic account code mapping',
        'Duplicate detection before sync',
      ]
    default: return []
  }
}

// ---------------------------------------------------------------------------
// Logo components
// ---------------------------------------------------------------------------

function QBOLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#2CA01C" />
      <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="system-ui,sans-serif" fill="white">QB</text>
    </svg>
  )
}

function XeroLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="20" fill="#00B4E3" />
      <path d="M14 15l12 10M26 15L14 25" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function SageLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#00A550" />
      <text x="20" y="26" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="system-ui,sans-serif" fill="white">S</text>
    </svg>
  )
}

function NetsuiteLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#2f5eb3" />
      <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif" fill="white">NS</text>
    </svg>
  )
}
