'use client'

import { useCallback, useState, useEffect } from 'react'
import { usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link'

interface PlaidAccount {
  account_id: string
  name: string
  mask: string | null
  type: string
  subtype: string | null
  current_balance: number | null
  currency: string
  available_balance: number | null
  official_name: string | null
}

interface Props {
  clientId: string
  onConnected: (accounts: PlaidAccount[]) => void
  updateMode?: boolean
  children?: React.ReactNode
  style?: React.CSSProperties
}

export default function PlaidLinkButton({ clientId, onConnected, updateMode = false, children, style }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken, metadata) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/plaid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          clientId,
          institutionId: metadata.institution?.institution_id ?? null,
          institutionName: metadata.institution?.name ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Connection failed'); return }
      onConnected(data.connection?.accounts ?? [])
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
      setLinkToken(null)
    }
  }, [clientId, onConnected])

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess,
  })

  // Auto-open Link modal once token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  const handleClick = async () => {
    if (linkToken && ready) { open(); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/plaid/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, updateMode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to start connection'); setLoading(false); return }
      setLinkToken(data.link_token)
      // useEffect above will open Link once ready
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: '#2d5a27',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          ...style,
        }}
      >
        {loading ? (
          <>
            <SpinnerIcon />
            Connecting…
          </>
        ) : (
          <>
            <BankIcon />
            {children ?? (updateMode ? 'Reconnect Bank' : 'Connect Bank Account')}
          </>
        )}
      </button>
      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{error}</p>
      )}
      <style>{`@keyframes plaid-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'plaid-spin 1s linear infinite' }}>
      <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" strokeDasharray="20 15" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1.5 6h12M7.5 2l6 4H1.5l6-4zM3 6v5M6 6v5M9 6v5M12 6v5M1.5 11h12" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
