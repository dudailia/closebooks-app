'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getClient, getJobsForClient } from '@/lib/storage'
import {
  buildAdvisoryMemoPrompt,
  buildCashFlowForecast,
  calculateKpis,
  flattenClientTransactions,
  generateProactiveAlerts,
  MEMO_TEMPLATES,
  scoreClientHealth,
} from '@/lib/advisoryEngine'

function fmtMoney(v: number): string {
  return `$${Math.round(v).toLocaleString()}`
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

export default function ClientAdvisoryPredictPage() {
  const params = useParams<{ clientId: string }>()
  const client = getClient(params.clientId)
  const jobs = useMemo(() => (client ? getJobsForClient(client.business_name) : []), [client])
  const tx = useMemo(() => flattenClientTransactions(jobs), [jobs])
  const [scenarioDrop, setScenarioDrop] = useState(0)
  const [template, setTemplate] = useState<keyof typeof MEMO_TEMPLATES>('quarterly')

  const forecast = useMemo(() => buildCashFlowForecast(tx, -scenarioDrop / 100), [tx, scenarioDrop])
  const kpi = useMemo(() => calculateKpis(tx), [tx])
  const health = useMemo(() => scoreClientHealth(kpi), [kpi])
  const uncategorized = tx.filter((t) => !t.final_category && !t.suggested_category).reduce((s, t) => s + Math.abs(t.amount), 0)
  const alerts = useMemo(() => (client ? generateProactiveAlerts(client, kpi, uncategorized) : []), [client, kpi, uncategorized])

  if (!client) {
    return <div className="p-8">Client not found.</div>
  }

  const prompt = buildAdvisoryMemoPrompt({
    clientName: client.business_name,
    industry: client.industry,
    kpi,
    forecastSummary: `Expected minimum balance ${fmtMoney(forecast.minBalanceAmount)} in ~${forecast.minBalanceEtaDays} days.`,
    template,
  })

  return (
    <main className="min-h-screen p-6" style={{ backgroundColor: '#faf8f4' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#a09a94' }}>AI Advisory Engine</p>
            <h1 className="text-2xl font-semibold" style={{ color: '#1a1714' }}>{client.business_name}</h1>
            <p className="text-sm" style={{ color: '#6b6560' }}>Close the books + advise the client with predictive cash flow, KPI intelligence, alerts, and memo drafts.</p>
          </div>
          <Link href={`/dashboard/clients/${client.id}`} className="text-sm underline" style={{ color: '#2d5a27' }}>Back to client</Link>
        </div>

        <section className="rounded-xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-2">1) Predictive cash flow</h2>
          <p className="text-sm mb-3" style={{ color: '#6b6560' }}>Scenario builder: revenue drop {scenarioDrop}%</p>
          <input type="range" min={0} max={50} value={scenarioDrop} onChange={(e) => setScenarioDrop(Number(e.target.value))} className="w-full" />
          <p className="text-sm mt-3" style={{ color: '#1a1714' }}>
            Alert: Client will hit {fmtMoney(forecast.minBalanceAmount)} minimum balance in ~{forecast.minBalanceEtaDays} days.
          </p>
          <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#f0f7ee' }}>Recurring revenue: <strong>{fmtMoney(forecast.recurringRevenue)}/mo</strong></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#fff7ed' }}>Recurring expenses: <strong>{fmtMoney(forecast.recurringExpenses)}/mo</strong></div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#eff6ff' }}>Confidence bands: <strong>Optimistic / Expected / Pessimistic</strong></div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: '#6b6560' }}><th className="text-left py-1">Period</th><th className="text-right">Expected</th><th className="text-right">Optimistic</th><th className="text-right">Pessimistic</th></tr></thead>
              <tbody>
                {forecast.points.slice(-6).map((p) => (
                  <tr key={p.date} className="border-t" style={{ borderColor: '#f0ece4' }}>
                    <td className="py-1">{p.date}</td>
                    <td className="text-right">{p.expected ? fmtMoney(p.expected) : 'historical'}</td>
                    <td className="text-right">{p.optimistic ? fmtMoney(p.optimistic) : '—'}</td>
                    <td className="text-right">{p.pessimistic ? fmtMoney(p.pessimistic) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-3">2) KPI dashboard + industry benchmark</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div>Gross margin: <strong>{pct(kpi.grossMargin)}</strong> (industry avg 38%)</div>
            <div>Net margin: <strong>{pct(kpi.netMargin)}</strong></div>
            <div>Operating margin: <strong>{pct(kpi.operatingMargin)}</strong></div>
            <div>Revenue growth MoM: <strong>{pct(kpi.revenueGrowthMoM)}</strong></div>
            <div>Revenue growth YoY: <strong>{pct(kpi.revenueGrowthYoY)}</strong></div>
            <div>DSO: <strong>{kpi.dso.toFixed(1)} days</strong></div>
            <div>Current ratio: <strong>{kpi.currentRatio.toFixed(2)}</strong></div>
            <div>Quick ratio: <strong>{kpi.quickRatio.toFixed(2)}</strong></div>
            <div>Burn rate / runway: <strong>{fmtMoney(kpi.burnRate)} · {kpi.runwayMonths.toFixed(1)} months</strong></div>
          </div>
        </section>

        <section className="rounded-xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-3">3) AI advisory memos</h2>
          <div className="flex gap-2 items-center mb-3">
            <label className="text-sm">Template:</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value as keyof typeof MEMO_TEMPLATES)} className="border rounded px-2 py-1 text-sm">
              {Object.entries(MEMO_TEMPLATES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <button className="px-3 py-1 rounded text-sm text-white" style={{ backgroundColor: '#2d5a27' }}>Generate memo draft</button>
          </div>
          <textarea readOnly value={prompt} className="w-full h-40 border rounded p-3 text-xs" style={{ borderColor: '#e8e0d4' }} />
          <p className="text-xs mt-2" style={{ color: '#6b6560' }}>CPA can edit before send. Hook this prompt to Claude API and export using your PDF utility for firm-branded output.</p>
        </section>

        <section className="rounded-xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-3">4) Proactive alerts + digest</h2>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-sm" style={{ color: '#6b6560' }}>No active alerts.</p>}
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border p-3" style={{ borderColor: '#f0ece4' }}>
                <p className="text-sm font-semibold">[{a.severity.toUpperCase()}] {a.title}</p>
                <p className="text-xs" style={{ color: '#6b6560' }}>{a.description}</p>
                <p className="text-xs mt-1" style={{ color: '#2d5a27' }}>→ {a.recommendation}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#6b6560' }}>Digest cadence: Daily/weekly summary can be sent from existing notification jobs.</p>
        </section>

        <section className="rounded-xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
          <h2 className="font-semibold mb-3">5) Client scoring</h2>
          <p className="text-sm">Financial health score: <strong>{health.overall}/100</strong> · churn risk: <strong>{health.churnRisk}</strong></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
            <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc' }}>Profitability: {Math.round(health.profitability)}</div>
            <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc' }}>Liquidity: {Math.round(health.liquidity)}</div>
            <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc' }}>Growth: {Math.round(health.growth)}</div>
            <div className="p-3 rounded" style={{ backgroundColor: '#f8fafc' }}>Compliance: {Math.round(health.compliance)}</div>
          </div>
          <ul className="mt-3 text-xs list-disc ml-5" style={{ color: '#6b6560' }}>
            {forecast.assumptions.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </section>
      </div>
    </main>
  )
}
