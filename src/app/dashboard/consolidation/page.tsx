'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EntityGroupWithMembers, ConsolidationMethod } from '@/lib/consolidation/types'

const demoGroups: EntityGroupWithMembers[] = [
  {
    id: 'grp_1', name: 'Acme Holdings Group', consolidation_method: 'full',
    currency: 'USD', fiscal_year_end: '12-31', firm_id: 'demo',
    parent_client_id: null, created_at: '', updated_at: '',
    members: [
      { id: 'm1', group_id: 'grp_1', client_id: 'c1', client_name: 'Acme Holdings LLC', relationship_type: 'parent', ownership_percentage: 100 },
      { id: 'm2', group_id: 'grp_1', client_id: 'c2', client_name: 'Acme Operations Inc', relationship_type: 'subsidiary', ownership_percentage: 80 },
      { id: 'm3', group_id: 'grp_1', client_id: 'c3', client_name: 'Acme Real Estate LLC', relationship_type: 'subsidiary', ownership_percentage: 100 },
    ],
  },
  {
    id: 'grp_2', name: 'Smith Family Enterprises', consolidation_method: 'full',
    currency: 'USD', fiscal_year_end: '12-31', firm_id: 'demo',
    parent_client_id: null, created_at: '', updated_at: '',
    members: [
      { id: 'm4', group_id: 'grp_2', client_id: 'c4', client_name: 'Smith Capital LLC', relationship_type: 'parent', ownership_percentage: 100 },
      { id: 'm5', group_id: 'grp_2', client_id: 'c5', client_name: 'Smith Properties LLC', relationship_type: 'subsidiary', ownership_percentage: 75 },
    ],
  },
]

const methodLabel: Record<ConsolidationMethod, string> = {
  full: 'Full Consolidation',
  equity: 'Equity Method',
  proportional: 'Proportional',
}

const roleDot: Record<string, string> = {
  parent: '#2d5a27',
  subsidiary: '#3b82f6',
  affiliate: '#9ca3af',
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 16, padding: 24 }}>
      {[200, 120, 160, 100].map((w, i) => (
        <div key={i} style={{ height: 16, width: w, background: '#f0ebe3', borderRadius: 8, marginBottom: 12,
          animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function GroupCard({ group, onView }: { group: EntityGroupWithMembers; onView: () => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 18, color: '#1a1714', margin: 0, lineHeight: 1.3 }}>
          {group.name}
        </h3>
        <span style={{ background: '#e8f0e6', color: '#2d5a27', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
          {methodLabel[group.consolidation_method] ?? group.consolidation_method}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: roleDot[m.relationship_type] ?? '#9ca3af', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#1a1714', flex: 1 }}>{m.client_name}</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{m.ownership_percentage}%</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', paddingTop: 4, borderTop: '1px solid #f0ebe3' }}>
        <span>FY End: {group.fiscal_year_end}</span>
        <span>Currency: {group.currency}</span>
      </div>

      <button
        onClick={onView}
        style={{ background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}
      >
        View Group →
      </button>
    </div>
  )
}

export default function ConsolidationPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<EntityGroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMethod, setNewGroupMethod] = useState<ConsolidationMethod>('full')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/consolidation/groups')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        const list: EntityGroupWithMembers[] = Array.isArray(data) ? data : data.groups ?? []
        setGroups(list.length > 0 ? list : demoGroups)
      } catch {
        setGroups(demoGroups)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleCreate() {
    if (!newGroupName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/consolidation/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), consolidation_method: newGroupMethod, currency: 'USD', fiscal_year_end: '12-31' }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const id = data.id ?? data.group?.id ?? 'new'
      router.push('/dashboard/consolidation/' + id)
    } catch {
      const id = 'grp_' + Date.now()
      router.push('/dashboard/consolidation/' + id)
    } finally {
      setCreating(false)
    }
  }

  const totalEntities = groups.reduce((s, g) => s + g.members.length, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 30, color: '#1a1714', margin: 0, letterSpacing: '-0.02em' }}>
            Multi-Entity Consolidation
          </h1>
          <button
            onClick={() => setShowNewGroupModal(true)}
            style={{ background: '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + New Group
          </button>
        </div>
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 32px' }}>
          Combine trial balances, eliminate intercompany transactions, and produce consolidated financials.
        </p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Entity Groups', value: groups.length },
            { label: 'Total Entities', value: totalEntities },
            { label: 'Competitors charge', value: '$500+/mo' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', border: '1px solid #e8e0d5', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>{card.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Groups grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6b7280', fontSize: 15 }}>
            No entity groups yet. Create your first group to start consolidating.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {groups.map(g => (
              <GroupCard key={g.id} group={g} onView={() => router.push('/dashboard/consolidation/' + g.id)} />
            ))}
          </div>
        )}
      </main>

      {/* New group modal */}
      {showNewGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: 22, color: '#1a1714', margin: '0 0 20px' }}>
              New Entity Group
            </h2>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>Group Name</label>
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="e.g. Acme Holdings Group"
              style={{ width: '100%', border: '1px solid #e8e0d5', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'system-ui' }}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>Consolidation Method</label>
            <select
              value={newGroupMethod}
              onChange={e => setNewGroupMethod(e.target.value as ConsolidationMethod)}
              style={{ width: '100%', border: '1px solid #e8e0d5', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 24, boxSizing: 'border-box', fontFamily: 'system-ui', background: '#fff' }}
            >
              <option value="full">Full Consolidation</option>
              <option value="equity">Equity Method</option>
              <option value="proportional">Proportional</option>
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewGroupModal(false)} style={{ border: '1px solid #e8e0d5', background: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'system-ui' }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newGroupName.trim()}
                style={{ background: creating || !newGroupName.trim() ? '#9ca3af' : '#2d5a27', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: creating || !newGroupName.trim() ? 'not-allowed' : 'pointer' }}
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
