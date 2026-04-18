'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReconciliationWorkspace from '@/components/bank-rec/ReconciliationWorkspace'
import ReconciliationReport from '@/components/bank-rec/ReconciliationReport'
import { getClient, getJobsForClient } from '@/lib/storage'
import type { Reconciliation, BankStatementLine, BookTransaction } from '@/lib/bank-rec/types'

export default function RecWorkspacePage() {
  const { clientId, recId } = useParams<{ clientId: string; recId: string }>()
  const [rec, setRec] = useState<Reconciliation | null>(null)
  const [lines, setLines] = useState<BankStatementLine[]>([])
  const [bookTxns, setBookTxns] = useState<BookTransaction[]>([])
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const client = getClient(clientId)
    if (client) {
      setClientName(client.business_name)
      // Load book transactions from approved categorization jobs
      const jobs = getJobsForClient(client.business_name)
      const allTxns: BookTransaction[] = jobs.flatMap(job =>
        job.transactions
          .filter(t => t.status === 'approved' || t.status === 'edited')
          .map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: Math.abs(t.amount),
            type: t.type,
            category: t.final_category ?? t.suggested_category,
          }))
      )
      setBookTxns(allTxns)
    }
    loadRec()
  }, [recId, clientId])

  async function loadRec() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/bank-rec/reconciliation?id=${recId}`)
    if (!res.ok) {
      setError('Reconciliation not found')
      setLoading(false)
      return
    }
    const data = await res.json()
    const reconciliation: Reconciliation = data.reconciliation
    setRec(reconciliation)

    // Load bank statement lines
    if (reconciliation.statement_id) {
      const stmtRes = await fetch(`/api/bank-rec/statement?id=${reconciliation.statement_id}`)
      if (stmtRes.ok) {
        const stmtData = await stmtRes.json()
        if (stmtData.statement?.lines) setLines(stmtData.statement.lines)
      }
    }

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#6b6560', fontSize: 14 }}>
      Loading reconciliation…
    </div>
  )

  if (error || !rec) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 12 }}>
      <p style={{ color: '#6b6560', fontSize: 14 }}>{error || 'Reconciliation not found'}</p>
      <Link href={`/dashboard/clients/${clientId}/bank-rec`} style={{ color: '#b8734a', fontSize: 14 }}>
        ← Back to Bank Rec
      </Link>
    </div>
  )

  return (
    <>
      {/* Top nav strip */}
      <div style={{
        position: 'fixed', top: 0, left: 'var(--sb-width, 220px)', right: 0, zIndex: 40,
        background: '#fff', borderBottom: '1px solid #e0dbd4',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
        height: 48, boxSizing: 'border-box',
      }}>
        <Link href={`/dashboard/clients/${clientId}/bank-rec`} style={{ color: '#6b6560', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← {clientName || 'Client'} / Bank Rec
        </Link>
        <span style={{ color: '#e0dbd4' }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1714' }}>Period {rec.period}</span>
        {rec.status === 'completed' && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#ecfdf5', color: '#059669', marginLeft: 4 }}>
            COMPLETED
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowReport(true)}
          style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #e0dbd4', borderRadius: 8, fontSize: 12, color: '#6b6560', cursor: 'pointer' }}
        >
          📄 Report
        </button>
      </div>

      {/* Workspace — offset for the top nav */}
      <div style={{ paddingTop: 48 }}>
        <ReconciliationWorkspace
          reconciliation={rec}
          statementLines={lines}
          bookTransactions={bookTxns}
          onComplete={() => {
            setRec(r => r ? { ...r, status: 'completed' } : r)
            setShowReport(true)
          }}
        />
      </div>

      {showReport && rec && (
        <ReconciliationReport
          reconciliation={rec}
          clientName={clientName}
          items={rec.items ?? []}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
