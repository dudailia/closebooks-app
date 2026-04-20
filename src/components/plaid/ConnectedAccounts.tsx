'use client'

import { useState, useEffect, useCallback } from 'react'
import PlaidLinkButton from './PlaidLinkButton'

interface Account {
  account_id: string
  name: string
  mask: string | null
  type: string
  subtype: string | null
  current_balance: number | null
  available_balance: number | null
  currency: string
  official_name: string | null
}

interface ConnectionStatus {
  connected: boolean
  status?: 'active' | 'error' | 'login_required'
  institutionName?: string
  accounts?: Account[]
  lastSyncedAt?: string | null
  errorCode?: string | null
}

interface Props {
  clientId: string
}

export default function ConnectedAccounts({ clientId }: Props) {
  const [conn, setConn] = useState<ConnectionStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/integrations/plaid/status?clientId=${encodeURIComponent(clientId)}`)
    const data = await res.json()
    setConn(data)
  }, [clientId])

  useEffect(() => { loadStatus() }, [loadStatus])

  const syncNow = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/integrations/plaid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Synced: ${data.added} new, ${data.modified} updated transactions`)
        await loadStatus()
      } else {
        showToast(data.error ?? 'Sync failed')
      }
    } finally {
      setSyncing(false)
    }
  }

  const disconnect = async () => {
    if (!confirm('Disconnect this bank account? Existing transactions will remain.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/integrations/plaid/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      setConn({ connected: false })
      showToast('Bank account disconnected')
    } finally {
      setDisconnecting(false)
    }
  }

  if (!conn) {
    return <div style={{ padding: '16px 0', color: '#9ca3af', fontSize: 14 }}>Loading…</div>
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1714', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 100 }}>
          {toast}
        </div>
      )}

      {!conn.connected ? (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 6 }}>Bank Account</div>
          <p style={{ fontSize: 13, color: '#6b6560', marginBottom: 16 }}>
            Connect this client&apos;s bank to pull transactions automatically instead of uploading CSVs.
          </p>
          <PlaidLinkButton clientId={clientId} onConnected={() => loadStatus()} />
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e8e0d4', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714' }}>
                {conn.institutionName ?? 'Connected Bank'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {conn.lastSyncedAt
                  ? `Last synced ${new Date(conn.lastSyncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'Never synced'}
              </div>
            </div>
            <StatusBadge status={conn.status ?? 'active'} />
          </div>

          {conn.status === 'login_required' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
              ⚠️ Bank requires re-authentication.{' '}
              <PlaidLinkButton
                clientId={clientId}
                onConnected={() => loadStatus()}
                updateMode
                style={{ display: 'inline-flex', padding: '4px 10px', fontSize: 12, borderRadius: 6, marginTop: 8 }}
              >
                Fix Now
              </PlaidLinkButton>
            </div>
          )}

          {conn.accounts && conn.accounts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {conn.accounts.map(acc => (
                <div
                  key={acc.account_id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#faf8f4', borderRadius: 8, border: '1px solid #f0ece4' }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1714' }}>
                      {acc.name}{acc.mask ? ` ••••${acc.mask}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, textTransform: 'capitalize' }}>
                      {acc.subtype ?? acc.type}
                    </div>
                  </div>
                  {acc.current_balance !== null && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: acc.current_balance >= 0 ? '#1a1714' : '#dc2626' }}>
                      {acc.current_balance < 0 ? '-' : ''}${Math.abs(acc.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={syncNow}
              disabled={syncing}
              style={{ background: '#2d5a27', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: syncing ? 'default' : 'pointer', opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              style={{ background: 'none', color: '#9ca3af', border: '1px solid #e8e0d4', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active:         { bg: '#f0fdf4', text: '#15803d', label: 'Active' },
    login_required: { bg: '#fef2f2', text: '#991b1b', label: 'Needs Auth' },
    error:          { bg: '#fef2f2', text: '#991b1b', label: 'Error' },
  }
  const s = map[status] ?? map.active
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
      {s.label}
    </span>
  )
}
