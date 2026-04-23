'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  hydrateRules,
  listRules,
  deleteRule,
  setRuleActive,
  type CategoryRule,
} from '@/lib/review/rules'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

const TH: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b6560',
  textAlign: 'left',
}
const TD: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' }

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: '#6b6560',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          fontSize: 22,
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          color: '#1a1714',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function RulesSettingsPage() {
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) {
      setRules(listRules())
      return
    }
    await hydrateRules(ctx.supabase, ctx.firmId)
    setRules(listRules())
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  const totalApplied = rules.reduce((s, r) => s + r.timesApplied, 0)
  const activeCount = rules.filter((r) => r.active).length
  const hoursSaved = ((totalApplied * 40) / 3600).toFixed(1)

  return (
    <main
      style={{
        padding: '32px 24px',
        maxWidth: 960,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#faf8f4',
      }}
    >
      <Link
        href="/dashboard"
        style={{ fontSize: 12, color: '#b8734a', textDecoration: 'none' }}
      >
        ← Back to dashboard
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: 32,
          color: '#1a1714',
          margin: '10px 0 4px',
        }}
      >
        Category Rules
      </h1>
      <p style={{ color: '#6b6560', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Rules learned from your corrections. When a matching transaction appears, CloseBooks categorizes
        it automatically.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 40,
          marginBottom: 24,
          padding: '14px 20px',
          backgroundColor: '#fff',
          borderRadius: 12,
          border: '1px solid #e0dbd4',
        }}
      >
        <Stat label="Active rules" value={activeCount} />
        <Stat label="Applications" value={totalApplied} />
        <Stat label="Est. hours saved" value={hoursSaved} />
      </div>

      {loading ? (
        <p style={{ color: '#6b6560' }}>Loading…</p>
      ) : rules.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: '#a09a94',
            fontSize: 14,
            border: '1px dashed #c4bdb8',
            borderRadius: 12,
            backgroundColor: '#fff',
          }}
        >
          No rules yet. Change a transaction&apos;s category during review and CloseBooks will offer to
          save a rule.
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #e0dbd4',
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f0ea' }}>
                <th style={TH}>Vendor pattern</th>
                <th style={TH}>Category</th>
                <th style={{ ...TH, textAlign: 'right' }}>Applied</th>
                <th style={{ ...TH, textAlign: 'center' }}>Active</th>
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f0ece4' }}>
                  <td style={TD}>
                    <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#1a1714' }}>
                      {r.vendorPattern}
                    </code>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: 13, color: '#1a1714' }}>{r.categoryName}</span>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#a09a94' }}>
                      {r.accountCode}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                    {r.timesApplied}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={async () => {
                        await setRuleActive(r.id, !r.active)
                        reload()
                      }}
                      style={{ accentColor: '#2d5a27' }}
                    />
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete rule for "${r.vendorPattern}"?`)) {
                          await deleteRule(r.id)
                          reload()
                        }
                      }}
                      style={{
                        border: '1px solid #e0dbd4',
                        borderRadius: 6,
                        backgroundColor: '#fff',
                        color: '#991b1b',
                        fontSize: 12,
                        padding: '4px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
