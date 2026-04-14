'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireRole } from '@/components/RequireRole'

interface Row {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details_json: unknown
  ip_address: string | null
  created_at: string
  user_id: string | null
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/settings/audit-log')
      if (!res.ok) {
        setError(res.status === 403 ? 'Admins only.' : 'Could not load audit log.')
        return
      }
      const j = (await res.json()) as { rows?: Row[] }
      setRows(j.rows ?? [])
    })()
  }, [])

  return (
    <RequireRole minRole="admin">
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 page-enter">
          <Link href="/dashboard/settings" className="text-xs" style={{ color: '#b8734a' }}>
            ← Settings
          </Link>
          <h1
            className="text-3xl mt-2 mb-2"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Audit log
          </h1>
          <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
            Security-relevant events (append-only). Owner and admin roles only.
          </p>

          {error && <p className="text-sm mb-4" style={{ color: '#b91c1c' }}>{error}</p>}

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f5f0ea' }}>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Resource</th>
                  <th className="text-left p-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: '#f0ece4' }}>
                    <td className="p-3 whitespace-nowrap text-xs" style={{ color: '#6b6560' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">{r.action}</td>
                    <td className="p-3 text-xs font-mono" style={{ color: '#6b6560' }}>
                      {r.resource_type ?? '—'}
                      {r.resource_id ? ` · ${r.resource_id}` : ''}
                    </td>
                    <td className="p-3 text-xs">{r.ip_address ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !error && (
              <p className="p-6 text-sm" style={{ color: '#6b6560' }}>
                No audit entries yet. Events are logged when the app calls the audit API.
              </p>
            )}
          </div>
        </main>
      </div>
    </RequireRole>
  )
}
