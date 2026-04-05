'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import TaxProjectionChart from '@/components/TaxProjectionChart'

const CLIENT_DATA: Record<string, {
  name: string
  entity: string
  revenue: number
  currentTax: number
  industry: string
  strategies: Strategy[]
  projectionData: ProjectionPoint[]
  totalSavings: number
}> = {
  'smith-construction': {
    name: 'Smith Construction LLC',
    entity: 'S-Corp',
    revenue: 2400000,
    currentTax: 380000,
    industry: 'Construction',
    totalSavings: 284000,
    projectionData: [
      { year: 2024, current: 380000, basic: 340000, optimized: 295000 },
      { year: 2025, current: 760000, basic: 655000, optimized: 550000 },
      { year: 2026, current: 1140000, basic: 945000, optimized: 775000 },
      { year: 2027, current: 1520000, basic: 1220000, optimized: 978000 },
      { year: 2028, current: 1900000, basic: 1480000, optimized: 1190000 },
    ],
    strategies: [
      {
        id: 'qbi',
        name: 'QBI Deduction Optimization',
        type: 'Entity',
        typeColor: '#2d5a27',
        typeBg: '#dcfce7',
        year1Impact: -47000,
        fiveYearImpact: -284000,
        timeline: 'Complete by Dec 31, 2024',
        confidence: 'High',
        actions: [
          'Optimize W-2 wages to maximize 50% W-2 wage limitation',
          'Separate qualified vs. non-qualified income streams',
          'Review SSTB classification for professional services income',
        ],
        irc: 'IRC §199A',
      },
      {
        id: 'scorp-salary',
        name: 'S-Corp Reasonable Compensation',
        type: 'Entity',
        typeColor: '#2d5a27',
        typeBg: '#dcfce7',
        year1Impact: -28000,
        fiveYearImpact: -141000,
        timeline: 'Q1 2025 payroll adjustment',
        confidence: 'High',
        actions: [
          'Conduct reasonable compensation analysis using industry benchmarks',
          'Set officer salary at $145,000 to optimize SE tax savings',
          'Document compensation decision with compensation study report',
        ],
        irc: 'IRC §3121',
      },
      {
        id: 'cost-seg',
        name: 'Cost Segregation Study',
        type: 'Depreciation',
        typeColor: '#92400e',
        typeBg: '#fdf2e9',
        year1Impact: -62000,
        fiveYearImpact: -118000,
        timeline: 'Commission study by Oct 31, 2024',
        confidence: 'High',
        actions: [
          'Hire qualified cost segregation firm to analyze 2019 building acquisition',
          'Accelerate personal property (5-7 year) from 39-year classification',
          'File Form 3115 for catch-up depreciation in 2024',
        ],
        irc: 'IRC §168(k)',
      },
      {
        id: 'retirement',
        name: 'Defined Benefit Plan Addition',
        type: 'Retirement',
        typeColor: '#6b21a8',
        typeBg: '#faf5ff',
        year1Impact: -38000,
        fiveYearImpact: -190000,
        timeline: 'Establish by Dec 31, 2024',
        confidence: 'Medium',
        actions: [
          'Consult actuary to design defined benefit plan for owner age 52',
          'Combine with existing 401(k) for maximum contribution of $285,000/year',
          'Model deductible contribution based on projected income',
        ],
        irc: 'IRC §412',
      },
      {
        id: 'credits',
        name: 'R&D Tax Credit for Construction Methods',
        type: 'Credits',
        typeColor: '#0369a1',
        typeBg: '#f0f9ff',
        year1Impact: -22000,
        fiveYearImpact: -67000,
        timeline: 'Document activities by Mar 15, 2025',
        confidence: 'Medium',
        actions: [
          'Identify qualifying research activities: new building techniques, materials testing',
          'Document qualified research expenses with contemporaneous records',
          'Prepare Form 6765 with qualified wages and supplies breakdown',
        ],
        irc: 'IRC §41',
      },
    ],
  },
  'bella-vista': {
    name: 'Bella Vista Restaurant',
    entity: 'LLC',
    revenue: 890000,
    currentTax: 142000,
    industry: 'Restaurant',
    totalSavings: 127000,
    projectionData: [
      { year: 2024, current: 142000, basic: 128000, optimized: 116000 },
      { year: 2025, current: 284000, basic: 240000, optimized: 209000 },
      { year: 2026, current: 426000, basic: 348000, optimized: 299000 },
      { year: 2027, current: 568000, basic: 452000, optimized: 384000 },
      { year: 2028, current: 710000, basic: 553000, optimized: 465000 },
    ],
    strategies: [
      {
        id: 'entity',
        name: 'S-Corp Election from LLC',
        type: 'Entity',
        typeColor: '#2d5a27',
        typeBg: '#dcfce7',
        year1Impact: -31000,
        fiveYearImpact: -127000,
        timeline: 'File Form 2553 by Mar 15, 2025',
        confidence: 'High',
        actions: [
          'File Form 2553 for S-Corp election effective January 1, 2025',
          'Set owner salary at $72,000 based on industry compensation data',
          'Update payroll system and quarterly estimated tax payments',
        ],
        irc: 'IRC §1361',
      },
      {
        id: 'cost-seg-restaurant',
        name: 'Leasehold Improvement Acceleration',
        type: 'Depreciation',
        typeColor: '#92400e',
        typeBg: '#fdf2e9',
        year1Impact: -18000,
        fiveYearImpact: -54000,
        timeline: 'File with 2024 return',
        confidence: 'High',
        actions: [
          'Reclassify restaurant build-out from 39-year to 15-year qualified improvement property',
          'Apply bonus depreciation for assets placed in service in 2024',
          'Review prior years for any missed QIP deductions via amended returns',
        ],
        irc: 'IRC §168(e)',
      },
    ],
  },
  'chen-medical': {
    name: 'Chen Medical Practice',
    entity: 'PC',
    revenue: 1800000,
    currentTax: 290000,
    industry: 'Healthcare',
    totalSavings: 193000,
    projectionData: [
      { year: 2024, current: 290000, basic: 258000, optimized: 226000 },
      { year: 2025, current: 580000, basic: 498000, optimized: 419000 },
      { year: 2026, current: 870000, basic: 726000, optimized: 599000 },
      { year: 2027, current: 1160000, basic: 941000, optimized: 764000 },
      { year: 2028, current: 1450000, basic: 1143000, optimized: 917000 },
    ],
    strategies: [
      {
        id: 'db-plan',
        name: 'Defined Benefit + 401(k) Combo',
        type: 'Retirement',
        typeColor: '#6b21a8',
        typeBg: '#faf5ff',
        year1Impact: -78000,
        fiveYearImpact: -193000,
        timeline: 'Establish by Dec 31, 2024',
        confidence: 'High',
        actions: [
          'Hire actuary to design cash balance plan targeting $265,000 annual contribution',
          'Maintain existing 401(k)/profit sharing for maximum employer contribution',
          'Project defined benefit to full funding within 10-year horizon at age 58',
        ],
        irc: 'IRC §401(a)',
      },
    ],
  },
}

interface ProjectionPoint { year: number; current: number; basic: number; optimized: number }
interface Strategy {
  id: string; name: string; type: string; typeColor: string; typeBg: string
  year1Impact: number; fiveYearImpact: number; timeline: string; confidence: string
  actions: string[]; irc: string
}

const TYPE_LABELS = ['Entity', 'Retirement', 'Depreciation', 'Credits', 'Timing']

export default function ClientTaxStrategyPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const client = CLIENT_DATA[clientId] ?? CLIENT_DATA['smith-construction']

  const [scenarioModal, setScenarioModal] = useState<Strategy | null>(null)
  const [addedStrategies, setAddedStrategies] = useState<Set<string>>(new Set())

  function fmt(v: number) {
    const abs = Math.abs(v)
    return `${v < 0 ? '-' : '+'}$${abs >= 1000 ? (abs / 1000).toFixed(0) + 'K' : abs}`
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', padding: '32px 32px 64px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb + Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>
            <Link href="/dashboard/tax-strategy" style={{ color: '#b8734a', textDecoration: 'none' }}>← Tax Strategy</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1714', margin: 0 }}>{client.name}</h1>
              <p style={{ fontSize: 14, color: '#6b6560', marginTop: 4 }}>
                {client.entity} · {client.industry} · ${(client.revenue / 1000000).toFixed(1)}M revenue · Current tax: ${(client.currentTax / 1000).toFixed(0)}K/yr
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#1a1714', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Export Plan
              </button>
              <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#b8734a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Send to Client
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: '5-Year Savings', value: `$${(client.totalSavings / 1000).toFixed(0)}K`, color: '#2d5a27' },
            { label: 'Strategies Available', value: client.strategies.length.toString(), color: '#1a1714' },
            { label: 'Effective Tax Rate Now', value: `${((client.currentTax / client.revenue) * 100).toFixed(1)}%`, color: '#ef4444' },
            { label: 'Effective Rate Optimized', value: `${(((client.currentTax - client.totalSavings / 5) / client.revenue) * 100).toFixed(1)}%`, color: '#2d5a27' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#6b6560', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 5-Year Projection Chart */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '28px 28px 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', margin: 0 }}>5-Year Tax Projection</h2>
              <p style={{ fontSize: 13, color: '#6b6560', marginTop: 4 }}>Cumulative tax paid — strategies compound over time</p>
            </div>
            <div style={{ padding: '8px 16px', borderRadius: 20, backgroundColor: '#dcfce7', color: '#2d5a27', fontSize: 13, fontWeight: 700 }}>
              Save ${(client.totalSavings / 1000).toFixed(0)}K over 5 years
            </div>
          </div>
          <TaxProjectionChart data={client.projectionData} totalSavings={client.totalSavings} />
        </div>

        {/* Strategy Recommendation Cards */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1714', marginBottom: 16 }}>Strategy Recommendations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {client.strategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                fmt={fmt}
                added={addedStrategies.has(strategy.id)}
                onModel={() => setScenarioModal(strategy)}
                onAdd={() => setAddedStrategies(prev => new Set([...prev, strategy.id]))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Calculator Modal */}
      {scenarioModal && (
        <ScenarioModal
          strategies={client.strategies}
          initialStrategy={scenarioModal}
          onClose={() => setScenarioModal(null)}
        />
      )}
    </div>
  )
}

function StrategyCard({ strategy, fmt, added, onModel, onAdd }: {
  strategy: Strategy; fmt: (v: number) => string; added: boolean
  onModel: () => void; onAdd: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', margin: 0 }}>{strategy.name}</h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, backgroundColor: strategy.typeBg, color: strategy.typeColor }}>
                {strategy.type}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, backgroundColor: strategy.confidence === 'High' ? '#dcfce7' : '#fef3c7', color: strategy.confidence === 'High' ? '#2d5a27' : '#92400e', fontWeight: 600 }}>
                {strategy.confidence} Confidence
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#a09a94', fontFamily: 'var(--font-dm-mono)' }}>{strategy.irc}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
            <div style={{ backgroundColor: '#faf8f4', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 11, color: '#6b6560' }}>Year 1 Impact</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{fmt(strategy.year1Impact)}</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 11, color: '#6b6560' }}>5-Year Impact</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2d5a27' }}>{fmt(strategy.fiveYearImpact)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#6b6560' }}>
            <span style={{ fontWeight: 600, color: '#1a1714' }}>Timeline:</span> {strategy.timeline}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
            >
              {expanded ? 'Hide actions ▲' : 'Show actions ▾'}
            </button>
            <button
              onClick={onModel}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #b8734a', backgroundColor: '#fff', color: '#b8734a', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Model Scenario
            </button>
            <button
              onClick={onAdd}
              disabled={added}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                backgroundColor: added ? '#dcfce7' : '#2d5a27',
                color: added ? '#2d5a27' : '#fff', fontSize: 13, cursor: added ? 'default' : 'pointer', fontWeight: 600,
              }}
            >
              {added ? '✓ Added to Plan' : 'Add to Client Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable actions */}
      {expanded && (
        <div style={{ padding: '16px 24px 20px', backgroundColor: '#faf8f4', borderTop: '1px solid #e8e0d4' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b6560', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Required Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {strategy.actions.map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#2d5a27', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, color: '#1a1714', lineHeight: 1.5 }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScenarioModal({ strategies, initialStrategy, onClose }: { strategies: Strategy[]; initialStrategy: Strategy; onClose: () => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(strategies.map(s => [s.id, s.id === initialStrategy.id]))
  )
  const [sending, setSending] = useState(false)

  const totalSavings = strategies
    .filter(s => enabled[s.id])
    .reduce((sum, s) => sum + Math.abs(s.fiveYearImpact), 0)

  async function handleSend() {
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(26,23,20,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', margin: 0 }}>Scenario Calculator</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#6b6560' }}>×</button>
        </div>

        <p style={{ fontSize: 13, color: '#6b6560', marginBottom: 20 }}>Toggle strategies to see how savings compound. Share the optimized scenario with your client.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {strategies.map(s => (
            <div
              key={s.id}
              onClick={() => setEnabled(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${enabled[s.id] ? '#2d5a27' : '#e8e0d4'}`,
                backgroundColor: enabled[s.id] ? '#f0fdf4' : '#faf8f4',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, border: `2px solid ${enabled[s.id] ? '#2d5a27' : '#e8e0d4'}`,
                  backgroundColor: enabled[s.id] ? '#2d5a27' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {enabled[s.id] && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#6b6560' }}>{s.type}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2d5a27' }}>
                  -${(Math.abs(s.fiveYearImpact) / 1000).toFixed(0)}K
                </div>
                <div style={{ fontSize: 10, color: '#a09a94' }}>5-year</div>
              </div>
            </div>
          ))}
        </div>

        {/* Total savings display */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '18px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#2d5a27', marginBottom: 4 }}>Total 5-Year Savings with Selected Strategies</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#2d5a27' }}>
            ${totalSavings.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#6b6560', marginTop: 4 }}>
            {strategies.filter(s => enabled[s.id]).length} of {strategies.length} strategies enabled
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || totalSavings === 0}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            backgroundColor: sending || totalSavings === 0 ? '#a09a94' : '#b8734a',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending || totalSavings === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending to client...' : 'Send to Client'}
        </button>
      </div>
    </div>
  )
}
