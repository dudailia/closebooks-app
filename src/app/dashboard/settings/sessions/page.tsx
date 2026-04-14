'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface SessionRow {
  id: string
  last_seen_at: string
  ip_address: string | null
  user_agent: string | null
  session_label: string | null
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/auth/sessions')
    const j = (await res.json()) as { sessions?: SessionRow[] }
    setSessions(j.sessions ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function clearHistory() {
    setBusy(true)
    try {
      await fetch('/api/auth/sessions', { method: 'DELETE' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 page-enter">
        <Link href="/dashboard/settings" className="text-xs" style={{ color: '#b8734a' }}>
          ← Settings
        </Link>
        <h1
          className="text-3xl mt-2 mb-2"
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            color: '#1a1714',
          }}
        >
          Active sessions
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
          Recent browser heartbeats recorded by the app. Clear history removes stored records; sign out from every device in
          Supabase Auth admin if you need full refresh-token revocation.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void clearHistory()}
          className="mb-6 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#b8734a' }}
        >
          {busy ? '…' : 'Clear session history'}
        </button>
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}
            >
              <p className="font-medium">{s.session_label ?? 'Session'}</p>
              <p style={{ color: '#6b6560' }}>{s.user_agent?.slice(0, 120) ?? '—'}</p>
              <p className="text-xs mt-1" style={{ color: '#a09a94' }}>
                Last seen {new Date(s.last_seen_at).toLocaleString()} · {s.ip_address ?? 'IP unknown'}
              </p>
            </li>
          ))}
        </ul>
        {sessions.length === 0 && (
          <p className="text-sm" style={{ color: '#6b6560' }}>
            No session rows yet. Open other dashboards after we add a heartbeat from the client.
          </p>
        )}
      </main>
    </div>
  )
}
