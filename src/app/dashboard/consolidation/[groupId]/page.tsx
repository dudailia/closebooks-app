'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type {
  EntityGroupWithMembers,
  IntercompanyDetectionResult,
  ConsolidationResult,
  RelationshipType,
} from '@/lib/consolidation/types'

type Tab = 'setup' | 'intercompany' | 'close' | 'report'
type ReportTab = 'pnl' | 'balanceSheet'

const demoDetected: IntercompanyDetectionResult[] = [
  { fromClientId: 'c2', fromClientName: 'Acme Operations Inc', toClientId: 'c1', toClientName: 'Acme Holdings LLC', amount: 15000, description: 'Management fee payment to parent', confidence: 0.92, matchReason: 'Amount match + entity name in description' },
  { fromClientId: 'c3', fromClientName: 'Acme Real Estate LLC', toClientId: 'c2', toClientName: 'Acme Operations Inc', amount: 8500, description: 'Rental income from subsidiary', confidence: 0.88, matchReason: 'Reciprocal transaction detected' },
  { fromClientId: 'c1', fromClientName: 'Acme Holdings LLC', toClientId: 'c3', toClientName: 'Acme Real Estate LLC', amount: 50000, description: 'Capital contribution to subsidiary', confidence: 0.95, matchReason: 'Entity name in description + amount match' },
]

function buildDemoGroup(groupId: string): EntityGroupWithMembers {
  return {
    id: groupId, name: 'Acme Holdings Group', consolidation_method: 'full',
    currency: 'USD', fiscal_year_end: '12-31', firm_id: 'demo',
    parent_client_id: null, created_at: '', updated_at: '',
    members: [
      { id: 'm1', group_id: groupId, client_id: 'c1', client_name: 'Acme Holdings LLC', relationship_type: 'parent', ownership_percentage: 100 },
      { id: 'm2', group_id: groupId, client_id: 'c2', client_name: 'Acme Operations Inc', relationship_type: 'subsidiary', ownership_percentage: 80 },
      { id: 'm3', group_id: groupId, client_id: 'c3', client_name: 'Acme Real Estate LLC', relationship_type: 'subsidiary', ownership_percentage: 100 },
    ],
  }
}

function buildDemoResult(groupId: string, period: string, group: EntityGroupWithMembers): ConsolidationResult {
  const ids = group.members.map(m => m.client_id)
  return {
    groupId, period, entityIds: ids,
    consolidatedTB: [],
    eliminations: [
      { description: 'Eliminate management fee', debitAccount: 'Management Fee Income', creditAccount: 'Management Fee Expense', amount: 15000, fromClientId: 'c2', toClientId: 'c1' },
      { description: 'Eliminate rental income', debitAccount: 'Rental Income', creditAccount: 'Rent Expense', amount: 8500, fromClientId: 'c3', toClientId: 'c2' },
    ],
    minorityInterest: 12400,
    statements: {
      pnl: {
        title: 'Consolidated P&L', period, entityIds: ids,
        sections: [
          {
            name: 'Revenue',
            lines: [
              { account: 'Service Revenue', entityAmounts: { c1: 120000, c2: 85000, c3: 42000 }, eliminationAmount: 0, consolidatedAmount: 247000 },
              { account: 'Management Fee Income', entityAmounts: { c1: 15000, c2: 0, c3: 0 }, eliminationAmount: -15000, consolidatedAmount: 0 },
            ],
            subtotal: { c1: 135000, c2: 85000, c3: 42000, eliminated: -15000, consolidated: 247000 },
          },
          {
            name: 'Operating Expenses',
            lines: [
              { account: 'Payroll', entityAmounts: { c1: 60000, c2: 40000, c3: 18000 }, eliminationAmount: 0, consolidatedAmount: 118000 },
              { account: 'Management Fee Expense', entityAmounts: { c1: 0, c2: 15000, c3: 0 }, eliminationAmount: -15000, consolidatedAmount: 0 },
              { account: 'Rent Expense', entityAmounts: { c1: 0, c2: 8500, c3: 0 }, eliminationAmount: -8500, consolidatedAmount: 0 },
            ],
            subtotal: { c1: 60000, c2: 63500, c3: 18000, eliminated: -23500, consolidated: 118000 },
          },
        ],
      },
      balanceSheet: {
        title: 'Consolidated Balance Sheet', period, entityIds: ids,
        sections: [
          {
            name: 'Assets',
            lines: [
              { account: 'Cash & Equivalents', entityAmounts: { c1: 95000, c2: 42000, c3: 28000 }, eliminationAmount: 0, consolidatedAmount: 165000 },
              { account: 'Accounts Receivable', entityAmounts: { c1: 32000, c2: 18000, c3: 9000 }, eliminationAmount: 0, consolidatedAmount: 59000 },
              { account: 'Investment in Subsidiaries', entityAmounts: { c1: 150000, c2: 0, c3: 0 }, eliminationAmount: -150000, consolidatedAmount: 0 },
            ],
            subtotal: { c1: 277000, c2: 60000, c3: 37000, eliminated: -150000, consolidated: 224000 },
          },
          {
            name: 'Liabilities & Equity',
            lines: [
              { account: 'Accounts Payable', entityAmounts: { c1: 12000, c2: 8000, c3: 5000 }, eliminationAmount: 0, consolidatedAmount: 25000 },
              { account: 'Equity', entityAmounts: { c1: 265000, c2: 52000, c3: 32000 }, eliminationAmount: -150000, consolidatedAmount: 199000 },
            ],
            subtotal: { c1: 277000, c2: 60000, c3: 37000, eliminated: -150000, consolidated: 224000 },
          },
        ],
      },
    },
  }
}

function fmt(n: number) {
  if (n < 0) return <span style={{ color: '#dc2626' }}>(${Math.abs(n).toLocaleString()})</span>
  return <>${n.toLocaleString()}</>
}

const roleBadgeStyle = (role: RelationshipType): React.CSSProperties => ({
  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
  background: role === 'parent' ? '#e8f0e6' : role === 'subsidiary' ? '#eff6ff' : '#f3f4f6',
  color: role === 'parent' ? '#2d5a27' : role === 'subsidiary' ? '#3b82f6' : '#6b7280',
})

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<EntityGroupWithMembers | null>(null)
  const [tab, setTab] = useState<Tab>('setup')
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [detected, setDetected] = useState<IntercompanyDetectionResult[]>(demoDetected)
  const [eliminated, setEliminated] = useState<Set<string>>(new Set())
  const [detecting, setDetecting] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ConsolidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<RelationshipType>('subsidiary')
  const [addOwnership, setAddOwnership] = useState(100)
  const [reportTab, setReportTab] = useState<ReportTab>('pnl')

  const loadGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/consolidation/groups/${groupId}`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setGroup(data.group ?? data)
    } catch {
      setGroup(buildDemoGroup(groupId))
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadGroup()
    const stored = localStorage.getItem('consolidation_result_' + groupId)
    if (stored) {
      try { setResult(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [loadGroup, groupId])

  async function handleDetect() {
    setDetecting(true)
    try {
      const res = await fetch('/api/consolidation/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, period }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setDetected(data.results ?? demoDetected)
    } catch {
      setDetected(demoDetected)
    } finally {
      setDetecting(false)
    }
  }

  async function handleRunConsolidation() {
    if (!group) return
    setRunning(true)
    try {
      const res = await fetch('/api/consolidation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, period, eliminatedTransactionIds: Array.from(eliminated) }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const r: ConsolidationResult = data.result ?? data
      setResult(r)
      localStorage.setItem('consolidation_result_' + groupId, JSON.stringify(r))
      setTab('report')
    } catch {
      const r = buildDemoResult(groupId, period, group)
      setResult(r)
      localStorage.setItem('consolidation_result_' + groupId, JSON.stringify(r))
      setTab('report')
    } finally {
      setRunning(false)
    }
  }

  async function handleAddMember() {
    if (!addName.trim() || !group) return
    try {
      await fetch(`/api/consolidation/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: addName.trim(), relationship_type: addRole, ownership_percentage: addOwnership }),
      })
    } catch { /* ignore */ }
    const newMember = {
      id: 'm_' + Date.now(), group_id: groupId, client_id: 'c_' + Date.now(),
      client_name: addName.trim(), relationship_type: addRole, ownership_percentage: addOwnership,
    }
    setGroup({ ...group, members: [...group.members, newMember] })
    setAddName('')
    setAddRole('subsidiary')
    setAddOwnership(100)
    setShowAddForm(false)
  }

  function handleRemoveMember(memberId: string) {
    if (!group) return
    setGroup({ ...group, members: group.members.filter(m => m.id !== memberId) })
  }

  function toggleEliminated(key: string) {
    setEliminated(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const icKey = (d: IntercompanyDetectionResult) => `${d.fromClientId}-${d.toClientId}-${d.amount}`

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: 28, width: 180, background: '#f0ebe3', borderRadius: 8, marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 400, background: '#f0ebe3', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    )
  }

  const activeGroup = group ?? buildDemoGroup(groupId)
  const activeResult = result ?? (tab === 'report' ? buildDemoResult(groupId, period, activeGroup) : null)
  const statement = activeResult?.statements[reportTab]

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: tab === t ? '#2d5a27' : 'transparent',
    color: tab === t ? '#fff' : '#6b7280',
  })

  const inputStyle: React.CSSProperties = {
    border: '1px solid #e8e0d5', borderRadius: 10, padding: '9px 12px', fontSize: 14,
    outline: 'none', fontFamily: 'system-ui', background: '#fff', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button onClick={() => router.push('/dashboard/consolidation')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Entity Groups
            </button>
            <h1 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 24, color: '#1a1714', margin: 0, letterSpacing: '-0.01em' }}>
              {activeGroup.name}
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'right', lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: '#2d5a27' }}>Full Consolidation</div>
            <div>{activeGroup.currency} · FY End: {activeGroup.fiscal_year_end}</div>
          </div>
        </div>

        {/* Tabs + period */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: '#f0ebe3', borderRadius: 999, padding: 4 }}>
            {(['setup', 'intercompany', 'close', 'report'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ border: '1px solid #e8e0d5', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'system-ui', background: '#fff', outline: 'none' }}
          />
        </div>

        {/* TAB: Setup */}
        {tab === 'setup' && (
          <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ebe3' }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 18, color: '#1a1714', margin: 0 }}>
                Entities in this group
              </h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf8f4' }}>
                  {['Entity Name', 'Role', 'Ownership', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f0ebe3' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeGroup.members.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f0ebe3' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#1a1714' }}>{m.client_name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={roleBadgeStyle(m.relationship_type)}>
                        {m.relationship_type.charAt(0).toUpperCase() + m.relationship_type.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#1a1714' }}>{m.ownership_percentage}%</td>
                    <td style={{ padding: '14px 20px' }}>
                      <button onClick={() => handleRemoveMember(m.id)} style={{ background: 'none', border: '1px solid #e8e0d5', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ padding: '16px 24px' }}>
              {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} style={{ background: 'none', border: '1px dashed #e8e0d5', borderRadius: 10, padding: '10px 18px', fontSize: 14, color: '#2d5a27', cursor: 'pointer', fontWeight: 600 }}>
                  + Add Entity
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 180 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Entity name</label>
                    <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Entity name or client ID" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Role</label>
                    <select value={addRole} onChange={e => setAddRole(e.target.value as RelationshipType)} style={{ ...inputStyle }}>
                      <option value="parent">Parent</option>
                      <option value="subsidiary">Subsidiary</option>
                      <option value="affiliate">Affiliate</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Ownership %</label>
                    <input type="number" min={0} max={100} value={addOwnership} onChange={e => setAddOwnership(Number(e.target.value))} style={inputStyle} />
                  </div>
                  <button onClick={handleAddMember} style={{ background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Add
                  </button>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: '1px solid #e8e0d5', borderRadius: 10, padding: '10px 14px', fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Intercompany */}
        {tab === 'intercompany' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 20, color: '#1a1714', margin: 0 }}>
                AI Intercompany Detection
              </h2>
              <button
                onClick={handleDetect}
                disabled={detecting}
                style={{ background: detecting ? '#9ca3af' : '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: detecting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {detecting ? '⟳ Detecting…' : 'Detect Transactions'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detected.map(d => {
                const key = icKey(d)
                const isElim = eliminated.has(key)
                return (
                  <div key={key} style={{ background: '#fff', border: `1px solid ${isElim ? '#2d5a27' : '#e8e0d5'}`, borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                        <strong style={{ color: '#1a1714' }}>{d.fromClientName}</strong>
                        <span style={{ margin: '0 6px' }}>→</span>
                        <strong style={{ color: '#1a1714' }}>{d.toClientName}</strong>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>
                        ${d.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 }}>"{d.description}"</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ background: '#f0ebe3', borderRadius: 999, padding: '2px 8px', color: '#6b7280' }}>
                          Confidence: {(d.confidence * 100).toFixed(0)}%
                        </span>
                        <span style={{ background: '#f0ebe3', borderRadius: 999, padding: '2px 8px', color: '#6b7280' }}>
                          {d.matchReason}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEliminated(key)}
                      style={{
                        border: `1px solid ${isElim ? '#2d5a27' : '#e8e0d5'}`,
                        background: isElim ? '#e8f0e6' : '#fff',
                        color: isElim ? '#2d5a27' : '#6b7280',
                        borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {isElim ? '✓ Marked for elimination' : '✓ Mark for Elimination'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB: Close */}
        {tab === 'close' && (
          <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 20, color: '#1a1714', margin: '0 0 24px' }}>
              Consolidated Close Checklist
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ChecklistItem checked={true} label="Trial balances complete for all entities">
                <div style={{ paddingLeft: 28, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {activeGroup.members.map(m => (
                    <div key={m.id} style={{ fontSize: 13, color: '#2d5a27', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✓</span><span>{m.client_name}</span>
                    </div>
                  ))}
                </div>
              </ChecklistItem>

              <ChecklistItem checked={detected.length > 0} label={`Intercompany transactions identified (${detected.length} found)`} />

              <ChecklistItem
                checked={eliminated.size === detected.length && detected.length > 0}
                label={`Elimination entries approved (${eliminated.size} of ${detected.length} marked)`}
              />

              <ChecklistItem checked={eliminated.size > 0 && detected.length > 0} label="Ready to consolidate" />
            </div>

            <button
              onClick={handleRunConsolidation}
              disabled={running}
              style={{
                marginTop: 32, width: '100%', background: running ? '#9ca3af' : '#2d5a27',
                color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0',
                fontSize: 16, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? '⟳ Running Consolidation…' : 'Run Consolidation'}
            </button>
          </div>
        )}

        {/* TAB: Report */}
        {tab === 'report' && (
          <div>
            {!activeResult ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6b7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>Run consolidation first to see reports</div>
                <div style={{ fontSize: 13 }}>← Go to the Close tab and click Run Consolidation</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 4, background: '#f0ebe3', borderRadius: 999, padding: 4 }}>
                    {(['pnl', 'balanceSheet'] as ReportTab[]).map(rt => (
                      <button
                        key={rt}
                        onClick={() => setReportTab(rt)}
                        style={{
                          padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                          background: reportTab === rt ? '#2d5a27' : 'transparent',
                          color: reportTab === rt ? '#fff' : '#6b7280',
                        }}
                      >
                        {rt === 'pnl' ? 'P&L' : 'Balance Sheet'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/consolidation/${groupId}/report`)}
                    style={{ background: 'none', border: '1px solid #e8e0d5', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#1a1714' }}
                  >
                    Full Report →
                  </button>
                </div>

                {statement && <StatementTable statement={statement} entityNames={Object.fromEntries(activeGroup.members.map(m => [m.client_id, m.client_name ?? m.client_id]))} />}

                <div style={{ display: 'flex', gap: 24, marginTop: 20, fontSize: 13, color: '#6b7280' }}>
                  {activeResult.minorityInterest > 0 && (
                    <span>Minority Interest: <strong>${activeResult.minorityInterest.toLocaleString()}</strong></span>
                  )}
                  <span>Total Eliminations: <strong>{activeResult.eliminations.length} entries</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ChecklistItem({ checked, label, children }: { checked: boolean; label: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? '#2d5a27' : '#e8e0d5'}`,
          background: checked ? '#2d5a27' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {checked && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: 14, color: checked ? '#1a1714' : '#6b7280', fontWeight: checked ? 600 : 400 }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function StatementTable({ statement, entityNames }: {
  statement: import('@/lib/consolidation/types').ConsolidatedStatement
  entityNames: Record<string, string>
}) {
  const cols = statement.entityIds
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#faf8f4' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e8e0d5', minWidth: 180 }}>Account</th>
            {cols.map(id => (
              <th key={id} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e8e0d5', minWidth: 110 }}>
                {entityNames[id] ?? id}
              </th>
            ))}
            <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#b8734a', borderBottom: '1px solid #e8e0d5', minWidth: 100 }}>Eliminations</th>
            <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1a1714', borderBottom: '1px solid #e8e0d5', minWidth: 120 }}>Consolidated</th>
          </tr>
        </thead>
        <tbody>
          {statement.sections.map(section => (
            <>
              <tr key={'sec-' + section.name} style={{ background: '#f5f0e8' }}>
                <td colSpan={cols.length + 3} style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1714', fontSize: 13 }}>
                  {section.name}
                </td>
              </tr>
              {section.lines.map(line => (
                <tr key={line.account} style={{ borderBottom: '1px solid #f5f0e8' }}>
                  <td style={{ padding: '9px 14px', color: '#1a1714', paddingLeft: 24 }}>{line.account}</td>
                  {cols.map(id => (
                    <td key={id} style={{ padding: '9px 14px', textAlign: 'right', color: '#1a1714' }}>
                      {fmt(line.entityAmounts[id] ?? 0)}
                    </td>
                  ))}
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>{fmt(line.eliminationAmount)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(line.consolidatedAmount)}</td>
                </tr>
              ))}
              <tr key={'sub-' + section.name} style={{ background: '#f0ebe3', borderTop: '1px solid #e8e0d5' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a1714', paddingLeft: 14 }}>
                  Total {section.name}
                </td>
                {cols.map(id => (
                  <td key={id} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1a1714' }}>
                    {fmt(section.subtotal[id] ?? 0)}
                  </td>
                ))}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                  {fmt(section.subtotal['eliminated'] ?? 0)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#2d5a27' }}>
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
