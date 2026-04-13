'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJobs } from '@/lib/storage'

const DEMO_STRATEGIES = [
  {
    id: 'smith-construction',
    client: 'Smith Construction LLC',
    strategy: 'S-Corp Optimization',
    savings: 284000,
    status: 'Active',
    statusColor: '#2d5a27',
    statusBg: '#dcfce7',
    industry: 'Construction',
    entity: 'S-Corp',
    revenue: '$2.4M',
    opportunities: 4,
  },
  {
    id: 'bella-vista',
    client: 'Bella Vista Restaurant',
    strategy: 'Entity Restructuring',
    savings: 127000,
    status: 'Draft',
    statusColor: '#92400e',
    statusBg: '#fef3c7',
    industry: 'Restaurant',
    entity: 'LLC',
    revenue: '$890K',
    opportunities: 2,
  },
  {
    id: 'chen-medical',
    client: 'Chen Medical Practice',
    strategy: 'Retirement Maximization',
    savings: 193000,
    status: 'Approved',
    statusColor: '#1e40af',
    statusBg: '#dbeafe',
    industry: 'Healthcare',
    entity: 'PC',
    revenue: '$1.8M',
    opportunities: 3,
  },
]

const KEY_OPPORTUNITIES = [
  {
    title: 'QBI Deduction Optimization',
    client: 'Smith Construction LLC',
    savings: 284000,
    type: 'Entity',
    color: '#2d5a27',
    bg: '#dcfce7',
    description: 'Maximize the 20% qualified business income deduction through proper W-2 wage planning and entity structure.',
    urgency: 'Dec 31, 2024',
  },
  {
    title: 'Cost Segregation Study',
    client: 'Bella Vista Restaurant',
    savings: 127000,
    type: 'Depreciation',
    color: '#92400e',
    bg: '#fdf2e9',
    description: 'Accelerate depreciation on leasehold improvements and equipment to capture immediate tax savings.',
    urgency: 'Q4 2024',
  },
  {
    title: 'S-Corp Election Analysis',
    client: 'Chen Medical Practice',
    savings: 94000,
    type: 'Entity',
    color: '#1e40af',
    bg: '#dbeafe',
    description: 'Evaluate S-Corp election to reduce self-employment taxes by splitting income between salary and distributions.',
    urgency: 'Mar 15, 2025',
  },
  {
    title: 'Retirement Plan Upgrade',
    client: 'Smith Construction LLC',
    savings: 67000,
    type: 'Retirement',
    color: '#6b21a8',
    bg: '#faf5ff',
    description: 'Replace SIMPLE IRA with Solo 401(k) or defined benefit plan to increase pre-tax contributions significantly.',
    urgency: 'Dec 31, 2024',
  },
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, color: '#6b6560', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b6560', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function TaxStrategyPage() {
  const [clients, setClients] = useState(DEMO_STRATEGIES)
  const [selectedClient, setSelectedClient] = useState('all')
  const [showProjectionModal, setShowProjectionModal] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    if (jobs.length === 0) setClients(DEMO_STRATEGIES)
  }, [])

  const totalSavings = clients.reduce((s, c) => s + c.savings, 0)
  const filteredOpps = selectedClient === 'all'
    ? KEY_OPPORTUNITIES
    : KEY_OPPORTUNITIES.filter(o => o.client.toLowerCase().includes(selectedClient))

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', padding: '32px 32px 64px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 6 }}>
              <Link href="/dashboard" style={{ color: '#b8734a', textDecoration: 'none' }}>← Dashboard</Link>
              <span style={{ margin: '0 8px', color: '#e8e0d4' }}>·</span>
              Tax Planning
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1a1714', margin: 0, letterSpacing: '-0.02em' }}>
              Tax Strategy
            </h1>
            <p style={{ fontSize: 14, color: '#6b6560', marginTop: 6 }}>
              Multi-year planning command center — ${(totalSavings / 1000).toFixed(0)}K in projected savings identified
            </p>
          </div>
          <button
            onClick={() => setShowProjectionModal(true)}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: '#b8734a', color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(184,115,74,0.3)',
            }}
          >
            Run New Projection
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total 5-Year Savings" value={`$${(totalSavings / 1000).toFixed(0)}K`} sub="across all clients" />
          <StatCard label="Active Strategies" value={clients.filter(c => c.status === 'Active').length.toString()} sub="in implementation" />
          <StatCard label="Clients Covered" value={clients.length.toString()} sub="with tax strategy" />
          <StatCard label="Opportunities Found" value={KEY_OPPORTUNITIES.length.toString()} sub="ready to implement" />
        </div>

        {/* Client selector + filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[{ id: 'all', label: 'All Clients' }, ...clients.map(c => ({ id: c.id, label: c.client }))].map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedClient(opt.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1px solid',
                fontSize: 13, cursor: 'pointer', fontWeight: selectedClient === opt.id ? 600 : 400,
                backgroundColor: selectedClient === opt.id ? '#1a1714' : '#fff',
                color: selectedClient === opt.id ? '#fff' : '#6b6560',
                borderColor: selectedClient === opt.id ? '#1a1714' : '#e8e0d4',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Strategy Cards */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', marginBottom: 16 }}>Current Strategies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {clients.filter(c => selectedClient === 'all' || c.id === selectedClient).map(c => (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: 24,
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#b8734a'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(184,115,74,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e8e0d4'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>{c.client}</div>
                    <div style={{ fontSize: 13, color: '#6b6560' }}>{c.entity} · {c.industry} · {c.revenue} revenue</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: c.statusBg, color: c.statusColor }}>
                    {c.status}
                  </span>
                </div>

                <div style={{ backgroundColor: '#faf8f4', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#6b6560', marginBottom: 4 }}>Active Strategy</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1714' }}>{c.strategy}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b6560' }}>Est. 5-Year Savings</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#2d5a27', fontVariantNumeric: 'tabular-nums' }}>
                      ${c.savings.toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/tax-strategy/${c.id}`}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: '1px solid #e8e0d4',
                      fontSize: 13, fontWeight: 600, color: '#1a1714', textDecoration: 'none',
                      backgroundColor: '#fff',
                    }}
                  >
                    View Plan →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Opportunities */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', margin: 0 }}>Key Opportunities</h2>
            <span style={{ fontSize: 13, color: '#6b6560' }}>{filteredOpps.length} identified</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {filteredOpps.map((opp, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: 20,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                    backgroundColor: opp.bg, color: opp.color, letterSpacing: '0.05em',
                  }}>
                    {opp.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: '#a09a94' }}>Due: {opp.urgency}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>{opp.title}</div>
                <div style={{ fontSize: 12, color: '#6b6560', marginBottom: 12, lineHeight: 1.5 }}>{opp.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2d5a27' }}>
                    ${(opp.savings / 1000).toFixed(0)}K
                  </div>
                  <div style={{ fontSize: 11, color: '#a09a94' }}>{opp.client}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Projection Modal */}
      {showProjectionModal && (
        <NewProjectionModal onClose={() => setShowProjectionModal(false)} />
      )}
    </div>
  )
}

function NewProjectionModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ client: 'Smith Construction LLC', entity: 'S-Corp', revenue: '2400000', currentTax: '380000', industry: 'Construction' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(26,23,20,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', margin: 0 }}>Run New Projection</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6560' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Client Name', key: 'client' },
            { label: 'Entity Type', key: 'entity' },
            { label: 'Annual Revenue ($)', key: 'revenue', type: 'number' },
            { label: 'Current Tax Liability ($)', key: 'currentTax', type: 'number' },
            { label: 'Industry', key: 'industry' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1714', display: 'block', marginBottom: 6 }}>{field.label}</label>
              <input
                type={field.type || 'text'}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e8e0d4', fontSize: 14, color: '#1a1714', backgroundColor: '#faf8f4', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#a09a94' : '#b8734a', color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 8,
            }}
          >
            {loading ? 'Generating projection...' : 'Generate 5-Year Projection'}
          </button>
        </form>
      </div>
    </div>
  )
}
