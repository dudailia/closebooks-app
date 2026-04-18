'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadStatement from '@/components/bank-rec/UploadStatement'
import { getClient } from '@/lib/storage'
import type { Reconciliation, BankStatement } from '@/lib/bank-rec/types'

const ACCENT = '#b8734a'
const TEXT = '#1a1714'
const MUTED = '#6b6560'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function BankRecIndexPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [bookBalance, setBookBalance] = useState('')
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [creatingRec, setCreatingRec] = useState(false)
  const [pendingStatementId, setPendingStatementId] = useState<string | null>(null)
  const [pendingEndingBalance, setPendingEndingBalance] = useState(0)

  useEffect(() => {
    const c = getClient(clientId)
    if (c) setClientName(c.business_name)
    fetchRecs()
  }, [clientId])

  async function fetchRecs() {
    setLoading(true)
    const res = await fetch(`/api/bank-rec/reconciliation?clientId=${clientId}`)
    if (res.ok) {
      const data = await res.json()
      setReconciliations(data.reconciliations ?? [])
    }
    setLoading(false)
  }

  function handleUploaded(statementId: string, lineCount: number, endingBalance: number) {
    setPendingStatementId(statementId)
    setPendingEndingBalance(endingBalance)
    // Auto-fill bank balance from parsed statement
    if (!bookBalance) {
      // Leave book balance for user to fill in
    }
  }

  async function startRec() {
    if (!pendingStatementId) return
    setCreatingRec(true)
    const res = await fetch('/api/bank-rec/reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        clientId,
        statementId: pendingStatementId,
        period,
        bankBalance: pendingEndingBalance,
        bookBalance: parseFloat(bookBalance) || 0,
      }),
    })
    const data = await res.json()
    setCreatingRec(false)
    if (data.reconciliation) {
      router.push(`/dashboard/clients/${clientId}/bank-rec/${data.reconciliation.id}`)
    }
  }

  const statusColor = (s: string) =>
    s === 'completed' ? '#059669' : s === 'locked' ? '#6366f1' : ACCENT

  const statusLabel = (s: string) =>
    s === 'in_progress' ? 'In Progress' : s === 'completed' ? 'Completed' : 'Locked'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 8 }}>
        <Link href={`/dashboard/clients/${clientId}`} style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>
          ← {clientName || 'Client'}
        </Link>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Bank Reconciliation
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            {clientName ? `${clientName} · ` : ''}Match bank statements to book transactions
          </p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          style={{ padding: '10px 20px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Upload Statement
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={{ background: '#fff', border: '1px solid #e0dbd4', borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>
              {pendingStatementId ? 'Statement Uploaded — Start Reconciliation' : 'Upload Bank Statement'}
            </h2>
            <button onClick={() => { setShowUpload(false); setPendingStatementId(null) }} style={{ border: 'none', background: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>

          {!pendingStatementId ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 4 }}>
                    Period <span style={{ color: MUTED, fontWeight: 400 }}>(YYYY-MM)</span>
                  </label>
                  <input
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    placeholder="2024-01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 4 }}>
                    Book Balance <span style={{ color: MUTED, fontWeight: 400 }}>(from QB / Xero)</span>
                  </label>
                  <input
                    value={bookBalance}
                    onChange={e => setBookBalance(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <UploadStatement clientId={clientId} onUploaded={(id, count, bal) => { handleUploaded(id, count, bal); }} />
            </>
          ) : (
            <div>
              <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#059669', margin: '0 0 4px' }}>
                  ✓ Statement parsed successfully
                </p>
                <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                  Bank balance (from statement): {fmt(pendingEndingBalance)}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 4 }}>Period</label>
                  <input value={period} onChange={e => setPeriod(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TEXT, display: 'block', marginBottom: 4 }}>
                    Book Balance <span style={{ color: MUTED, fontWeight: 400 }}>(from QB / Xero)</span>
                  </label>
                  <input
                    value={bookBalance}
                    onChange={e => setBookBalance(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0dbd4', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <button
                onClick={startRec}
                disabled={creatingRec || !bookBalance}
                style={{ padding: '10px 24px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: creatingRec || !bookBalance ? 'not-allowed' : 'pointer', opacity: !bookBalance ? 0.6 : 1 }}
              >
                {creatingRec ? 'Creating…' : 'Start Reconciliation →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reconciliation list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontSize: 14 }}>Loading…</div>
      ) : reconciliations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, background: '#fff', borderRadius: 16, border: '1px solid #e0dbd4' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>No reconciliations yet</h3>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 20px' }}>Upload a bank statement to start your first reconciliation</p>
          <button onClick={() => setShowUpload(true)} style={{ padding: '10px 24px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Upload Statement
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reconciliations.map(rec => (
            <Link key={rec.id} href={`/dashboard/clients/${clientId}/bank-rec/${rec.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{ background: '#fff', border: '1px solid #e0dbd4', borderRadius: 14, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 20, transition: 'box-shadow 0.15s, transform 0.1s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: statusColor(rec.status) + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🏦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Period {rec.period}</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                    Bank: {fmt(rec.bank_balance)} · Book: {fmt(rec.book_balance)} · Diff: {' '}
                    <span style={{ color: Math.abs(rec.difference) < 0.005 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                      {fmt(rec.difference)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    background: statusColor(rec.status) + '18', color: statusColor(rec.status),
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {statusLabel(rec.status)}
                  </span>
                  {rec.completed_at && (
                    <span style={{ fontSize: 11, color: MUTED }}>
                      {new Date(rec.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span style={{ color: '#c5bfb9', fontSize: 18 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
