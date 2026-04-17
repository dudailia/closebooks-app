'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Status = {
  connected: boolean
  oauthConfigured: boolean
  companyName?: string
  realmId?: string
  lastSyncAt?: string | null
  totalSynced?: number
  expiresAt?: string | null
  tokenExpiringSoon?: boolean
  lastErrorCode?: string | null
  lastErrorMessage?: string | null
  lastErrorAt?: string | null
  autoSyncEnabled?: boolean
  nextSyncAt?: string | null
}

type RunRow = {
  id: string
  kind: string
  started_at: string
  finished_at: string | null
  status: string
  pulled_accounts?: number
  pulled_vendors?: number
  pulled_customers?: number
  pulled_bank?: number
  pushed_journal?: number
  error_count?: number
  error_message?: string | null
}

export default function QuickBooksSyncPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [runs, setRuns] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sRes, hRes] = await Promise.all([
        fetch('/api/integrations/quickbooks/status'),
        fetch('/api/integrations/quickbooks/sync/history'),
      ])
      const s = (await sRes.json()) as Status
      setStatus(s)
      const h = (await hRes.json()) as { runs?: RunRow[] }
      setRuns(h.runs ?? [])
    } catch {
      setError('Could not load QuickBooks status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runSync(autoToggle?: boolean) {
    setSyncing(true)
    setError('')
    try {
      const body =
        autoToggle === undefined
          ? undefined
          : JSON.stringify({ autoSyncEnabled: autoToggle })
      const res = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Sync failed.')
        return
      }
      await load()
    } catch {
      setError('Network error during sync.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
        <p className="text-sm" style={{ color: '#6b6560' }}>Loading…</p>
      </div>
    )
  }

  const conn = status?.connected
  const oauth = status?.oauthConfigured

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-8">
        <div>
          <Link
            href="/dashboard/integrations"
            className="text-xs transition-colors"
            style={{ color: '#b8734a' }}
          >
            ← Integrations
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            QuickBooks Online
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Connection health, manual sync, and history. Intuit rate limit: 500 calls/min per company (defensive client-side throttle).
          </p>
        </div>

        {!oauth && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#fffbeb', color: '#92400e' }}
          >
            OAuth env vars are not set. Configure <code className="font-mono">INTUIT_CLIENT_ID</code> and{' '}
            <code className="font-mono">INTUIT_CLIENT_SECRET</code> for production.
          </div>
        )}

        {error && (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <section
          className="rounded-2xl border p-6 space-y-4"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Connection</h2>
          {!conn ? (
            <p className="text-sm" style={{ color: '#6b6560' }}>
              Not connected. Use <Link href="/dashboard/integrations" className="underline">Integrations</Link> to connect with Intuit.
            </p>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt style={{ color: '#a09a94' }}>Company</dt>
                <dd className="font-medium" style={{ color: '#1a1714' }}>{status?.companyName}</dd>
              </div>
              <div>
                <dt style={{ color: '#a09a94' }}>Realm ID</dt>
                <dd className="font-mono text-xs" style={{ color: '#1a1714' }}>{status?.realmId}</dd>
              </div>
              <div>
                <dt style={{ color: '#a09a94' }}>Access token</dt>
                <dd style={{ color: status?.tokenExpiringSoon ? '#b45309' : '#166534' }}>
                  {status?.expiresAt
                    ? `Expires ${new Date(status.expiresAt).toLocaleString()}${status.tokenExpiringSoon ? ' (refreshing on next API call)' : ''}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: '#a09a94' }}>Last sync</dt>
                <dd style={{ color: '#1a1714' }}>
                  {status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}
                  {typeof status?.totalSynced === 'number' && status.totalSynced > 0 && (
                    <span style={{ color: '#6b6560' }}> · {status.totalSynced} JE lines posted</span>
                  )}
                </dd>
              </div>
            </dl>
          )}

          {status?.lastErrorMessage && (
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
              <strong>{status.lastErrorCode ?? 'Error'}</strong>: {status.lastErrorMessage}
              {status.lastErrorAt && (
                <span className="block mt-1 opacity-80">{new Date(status.lastErrorAt).toLocaleString()}</span>
              )}
            </div>
          )}
        </section>

        {conn && oauth && (
          <section
            className="rounded-2xl border p-6 space-y-4"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Sync</h2>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              Pulls chart of accounts, vendors, customers, and recent Purchase/Deposit activity into Supabase. Run this before mapping accounts per client.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={syncing}
                onClick={() => void runSync()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#2CA01C' }}
              >
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                type="button"
                disabled={syncing}
                onClick={() => void runSync(true)}
                className="px-4 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
              >
                Sync &amp; enable auto (4h)
              </button>
              <button
                type="button"
                disabled={syncing}
                onClick={() => void runSync(false)}
                className="px-4 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              >
                Sync &amp; disable auto
              </button>
            </div>
            <p className="text-xs" style={{ color: '#a09a94' }}>
              Auto-sync uses a Vercel cron job (configure <code className="font-mono">CRON_SECRET</code> and schedule{' '}
              <code className="font-mono">/api/cron/qbo-sync</code> every 4 hours). Toggle stores next run on the connection row.
              {status?.autoSyncEnabled && status.nextSyncAt && (
                <span className="block mt-1">
                  Auto on — next scheduled: {new Date(status.nextSyncAt).toLocaleString()}
                </span>
              )}
            </p>
          </section>
        )}

        {conn && (
          <section
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: '#f0ece4' }}>
              <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Sync history</h2>
              <button type="button" onClick={() => void load()} className="text-xs underline" style={{ color: '#b8734a' }}>
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#faf8f4' }}>
                    <th className="text-left px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Started</th>
                    <th className="text-left px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Status</th>
                    <th className="text-right px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Accounts</th>
                    <th className="text-right px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Vendors</th>
                    <th className="text-right px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Customers</th>
                    <th className="text-right px-4 py-2 font-medium" style={{ color: '#6b6560' }}>Bank*</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center" style={{ color: '#a09a94' }}>
                        No sync runs yet.
                      </td>
                    </tr>
                  ) : (
                    runs.map((r) => (
                      <tr key={r.id} className="border-t" style={{ borderColor: '#f0ece4' }}>
                        <td className="px-4 py-2 whitespace-nowrap" style={{ color: '#1a1714' }}>
                          {new Date(r.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: r.status === 'success' ? '#dcfce7' : r.status === 'error' ? '#fee2e2' : '#f3f4f6',
                              color: r.status === 'success' ? '#166534' : r.status === 'error' ? '#991b1b' : '#4b5563',
                            }}
                          >
                            {r.status}
                          </span>
                          {r.error_message && (
                            <span className="block text-xs mt-1" style={{ color: '#6b6560' }} title={r.error_message}>
                              {r.error_message.slice(0, 80)}
                              {r.error_message.length > 80 ? '…' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.pulled_accounts ?? 0}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.pulled_vendors ?? 0}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.pulled_customers ?? 0}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.pulled_bank ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs px-4 py-3" style={{ color: '#a09a94' }}>
              *Bank column counts Purchase and Deposit transactions from QuickBooks (approximation of banking activity when Banking API isn&apos;t wired).
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
