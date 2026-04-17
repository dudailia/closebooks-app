'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ChartOfAccounts } from '@/types'

type QboAcc = { qbo_id: string; name: string; account_type: string }

function QboMappingContent() {
  const search = useSearchParams()
  const clientNameFromUrl = search.get('client')?.trim() ?? ''

  const [clientName, setClientName] = useState(clientNameFromUrl || '')
  const [clientKey, setClientKey] = useState('')
  const [ourAccounts, setOurAccounts] = useState<ChartOfAccounts[]>([])
  const [qboAccounts, setQboAccounts] = useState<QboAcc[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const slug = useCallback((name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 120)
  }, [])

  const loadChartFromJobs = useCallback(async () => {
    try {
      const { memoryGetJobs } = await import('@/lib/memoryData')
      const jobs = memoryGetJobs()
      const name = clientName.trim()
      if (!name) return
      const match = jobs.find((j) => j.client_name === name)
      if (match?.chart_of_accounts?.length) {
        setOurAccounts(match.chart_of_accounts)
      }
    } catch {
      /* ignore */
    }
  }, [clientName])

  const loadMapping = useCallback(async () => {
    if (!clientName.trim()) return
    const key = slug(clientName)
    setClientKey(key)
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`/api/integrations/quickbooks/mapping?clientKey=${encodeURIComponent(key)}`)
      const data = (await res.json()) as {
        mapping?: Record<string, string>
        qboAccounts?: QboAcc[]
        error?: string
      }
      if (!res.ok) {
        setMessage(data.error ?? 'Failed to load mapping.')
        return
      }
      setQboAccounts(data.qboAccounts ?? [])
      setMapping(data.mapping ?? {})
      await loadChartFromJobs()
    } catch {
      setMessage('Network error loading mapping.')
    } finally {
      setLoading(false)
    }
  }, [clientName, slug, loadChartFromJobs])

  useEffect(() => {
    if (clientNameFromUrl) setClientName(clientNameFromUrl)
  }, [clientNameFromUrl])

  useEffect(() => {
    if (clientName.trim()) void loadMapping()
  }, [clientName, loadMapping])

  async function suggest() {
    if (!ourAccounts.length) {
      setMessage('No chart of accounts found in memory for this client. Open a close for this client first, or paste JSON below is not implemented—use the review page for that client.')
      return
    }
    try {
      const res = await fetch('/api/integrations/quickbooks/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartOfAccounts: ourAccounts, clientName }),
      })
      const data = (await res.json()) as { suggested?: Record<string, string>; error?: string }
      if (!res.ok) {
        setMessage(data.error ?? 'Suggest failed.')
        return
      }
      setMapping((prev) => ({ ...data.suggested, ...prev }))
      setMessage('Applied name-based suggestions. Review and save.')
    } catch {
      setMessage('Suggest failed.')
    }
  }

  async function save() {
    if (!clientKey) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/integrations/quickbooks/mapping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey,
          clientName: clientName.trim(),
          mapping,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setMessage(data.error ?? 'Save failed.')
        return
      }
      setMessage('Saved.')
    } catch {
      setMessage('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const qboOptions = useMemo(
    () => qboAccounts.map((a) => ({ value: a.qbo_id, label: `${a.name} (${a.account_type || 'Account'})` })),
    [qboAccounts]
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 space-y-10">
        <div>
          <Link href="/dashboard/integrations" className="text-xs" style={{ color: '#b8734a' }}>
            ← Integrations
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            QuickBooks account mapping
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Map each CloseBooks account code to a QuickBooks account. Required before posting journal entries for that client.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: '#6b6560' }}>
              Client name
            </label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4' }}
            />
          </div>
          <button
            type="button"
            onClick={() => void loadMapping()}
            className="px-4 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
          >
            Load
          </button>
        </div>

        {message && (
          <p className="text-sm" style={{ color: message.startsWith('Saved') ? '#166534' : '#b45309' }}>
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: '#6b6560' }}>Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void suggest()}
                className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
              >
                Auto-suggest by name
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#2CA01C' }}
              >
                {saving ? 'Saving…' : 'Save mapping'}
              </button>
              <Link
                href="/dashboard/integrations/quickbooks"
                className="px-4 py-2 rounded-xl text-sm border inline-block"
                style={{ borderColor: '#e8e0d4', color: '#166534' }}
              >
                Sync QBO data first
              </Link>
            </div>

            {ourAccounts.length === 0 && (
              <p className="text-sm" style={{ color: '#b45309' }}>
                No chart of accounts loaded for this client in this browser session. Open the review page for a close for this client, then return here—or ensure you ran a sync from QuickBooks so QBO accounts appear on the right.
              </p>
            )}

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <div className="grid grid-cols-2 gap-0 text-xs font-semibold px-4 py-3 border-b" style={{ borderColor: '#f0ece4', color: '#6b6560' }}>
                <span>CloseBooks (code + name)</span>
                <span>QuickBooks account</span>
              </div>
              <div className="divide-y max-h-[480px] overflow-y-auto" style={{ borderColor: '#f0ece4' }}>
                {ourAccounts.length === 0 && (
                  <p className="p-4 text-sm" style={{ color: '#a09a94' }}>
                    Add accounts from your client&apos;s close or type codes manually in future—currently mapping rows come from the job&apos;s chart.
                  </p>
                )}
                {ourAccounts.map((a) => (
                  <div key={a.code} className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-3 items-center">
                    <div>
                      <span className="font-mono text-xs" style={{ color: '#1a1714' }}>{a.code}</span>
                      <span className="text-sm block" style={{ color: '#1a1714' }}>{a.name}</span>
                      <span className="text-xs capitalize" style={{ color: '#a09a94' }}>{a.type}</span>
                    </div>
                    <div>
                      <select
                        value={mapping[a.code] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setMapping((prev) => ({ ...prev, [a.code]: v }))
                        }}
                        className="w-full rounded-xl border px-2 py-2 text-sm"
                        style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4' }}
                      >
                        <option value="">— Select QBO account —</option>
                        {qboOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function QboMappingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
          <p className="text-sm" style={{ color: '#6b6560' }}>Loading…</p>
        </div>
      }
    >
      <QboMappingContent />
    </Suspense>
  )
}
