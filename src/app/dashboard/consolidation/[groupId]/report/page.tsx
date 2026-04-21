'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { ConsolidationResult, ConsolidatedStatement } from '@/lib/consolidation/types'

type ReportTab = 'pnl' | 'balanceSheet'

function fmt(n: number) {
  if (n < 0) return <span style={{ color: '#dc2626' }}>(${Math.abs(n).toLocaleString()})</span>
  return <>${n.toLocaleString()}</>
}

function StatementTable({ statement, entityIds, entityNames }: {
  statement: ConsolidatedStatement
  entityIds: string[]
  entityNames: Record<string, string>
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#1a1714', borderBottom: '2px solid #e8e0d5', minWidth: 200, background: '#fff' }}>
              Account
            </th>
            {entityIds.map(id => (
              <th key={id} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#1a1714', borderBottom: '2px solid #e8e0d5', minWidth: 130, background: '#fff' }}>
                {entityNames[id] ?? id}
              </th>
            ))}
            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#b8734a', borderBottom: '2px solid #e8e0d5', minWidth: 120, background: '#fff' }}>
              Eliminations
            </th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#fff', borderBottom: '2px solid #2d5a27', minWidth: 140, background: '#2d5a27' }}>
              Consolidated
            </th>
          </tr>
        </thead>
        <tbody>
          {statement.sections.map(section => (
            <>
              <tr key={'sec-' + section.name}>
                <td
                  colSpan={entityIds.length + 3}
                  style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, background: '#2d5a27', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  {section.name}
                </td>
              </tr>
              {section.lines.map((line, li) => (
                <tr key={line.account + li} style={{ borderBottom: '1px solid #e8e0d5', background: li % 2 === 0 ? '#fff' : '#faf8f4' }}>
                  <td style={{ padding: '10px 16px', color: '#1a1714', paddingLeft: 28, border: '1px solid #e8e0d5' }}>{line.account}</td>
                  {entityIds.map(id => (
                    <td key={id} style={{ padding: '10px 16px', textAlign: 'right', color: '#1a1714', border: '1px solid #e8e0d5' }}>
                      {fmt(line.entityAmounts[id] ?? 0)}
                    </td>
                  ))}
                  <td style={{ padding: '10px 16px', textAlign: 'right', border: '1px solid #e8e0d5' }}>
                    {fmt(line.eliminationAmount)}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, background: '#f5f0e8', border: '1px solid #e8e0d5' }}>
                    {fmt(line.consolidatedAmount)}
                  </td>
                </tr>
              ))}
              <tr key={'sub-' + section.name} style={{ background: '#f0ebe3' }}>
                <td style={{ padding: '11px 16px', fontWeight: 700, color: '#1a1714', border: '1px solid #e8e0d5' }}>
                  Total {section.name}
                </td>
                {entityIds.map(id => (
                  <td key={id} style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#1a1714', border: '1px solid #e8e0d5' }}>
                    {fmt(section.subtotal[id] ?? 0)}
                  </td>
                ))}
                <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, border: '1px solid #e8e0d5' }}>
                  {fmt(section.subtotal['eliminated'] ?? 0)}
                </td>
                <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#2d5a27', background: '#e8f0e6', border: '1px solid #c8d8c4' }}>
                  {fmt(section.subtotal['consolidated'] ?? 0)}
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ConsolidationReportPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  const [result, setResult] = useState<ConsolidationResult | null>(null)
  const [reportTab, setReportTab] = useState<ReportTab>('pnl')
  const [groupName, setGroupName] = useState('Entity Group')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('consolidation_result_' + groupId)
    if (stored) {
      try {
        setResult(JSON.parse(stored))
      } catch { /* ignore */ }
    }

    fetch(`/api/consolidation/groups/${groupId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setGroupName(data.name ?? data.group?.name ?? 'Entity Group')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [groupId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Loading report…</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
        <div style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 22, color: '#1a1714', marginBottom: 10 }}>
          No report available
        </div>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
          Run consolidation from the group page first to generate a report.
        </div>
        <button
          onClick={() => router.push(`/dashboard/consolidation/${groupId}`)}
          style={{ background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ← Go to Group
        </button>
      </div>
    )
  }

  const statement = result.statements[reportTab]
  const entityIds = result.entityIds
  const entityNames: Record<string, string> = {}
  entityIds.forEach((id, i) => { entityNames[id] = `Entity ${i + 1}` })

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'system-ui' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print" style={{ background: '#faf8f4', borderBottom: '1px solid #e8e0d5', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => router.push(`/dashboard/consolidation/${groupId}`)}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Group
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: '#1a1714', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          🖨 Print
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 40px' }}>

        {/* Report header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#6b7280', textTransform: 'uppercase', marginBottom: 10 }}>
            Consolidated Financial Statements
          </div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 32, color: '#1a1714', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {groupName}
          </h1>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Period: {result.period} &nbsp;|&nbsp; Currency: USD
          </div>
          <div style={{ height: 2, background: '#1a1714', maxWidth: 400, margin: '18px auto 0' }} />
        </div>

        {/* Sub-tabs */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 4, background: '#f0ebe3', borderRadius: 999, padding: 4 }}>
            {(['pnl', 'balanceSheet'] as ReportTab[]).map(rt => (
              <button
                key={rt}
                onClick={() => setReportTab(rt)}
                style={{
                  padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: reportTab === rt ? '#2d5a27' : 'transparent',
                  color: reportTab === rt ? '#fff' : '#6b7280',
                }}
              >
                {rt === 'pnl' ? 'P&L' : 'Balance Sheet'}
              </button>
            ))}
          </div>
        </div>

        {/* Statement title */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 20, color: '#1a1714', margin: 0 }}>
            {statement.title}
          </h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>For the period ending {result.period}</div>
        </div>

        <StatementTable statement={statement} entityIds={entityIds} entityNames={entityNames} />

        {/* Footnotes */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #e8e0d5', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.minorityInterest > 0 && (
            <div style={{ fontSize: 13, color: '#1a1714' }}>
              Minority Interest: <strong>${result.minorityInterest.toLocaleString()}</strong>
            </div>
          )}
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Total Eliminations: <strong>{result.eliminations.length} entries</strong>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #f0ebe3', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
          Generated by CloseBooks · {today}
        </div>
      </div>
    </div>
  )
}
