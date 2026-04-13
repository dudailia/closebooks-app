'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface BillingRow {
  hasSubscription: boolean
  status?: string
  stripeCustomerId?: string
  amountTotal?: number | null
  currency?: string | null
  updatedAt?: string
}

export default function SubscriptionPage() {
  const [data, setData] = useState<BillingRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/status')
      if (res.status === 401) {
        setData({ hasSubscription: false })
        return
      }
      const j = (await res.json()) as BillingRow & { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'Failed to load')
      setData(j)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setData({ hasSubscription: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function openPortal() {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const j = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !j.url) throw new Error(j.error ?? 'Could not open billing portal')
      window.location.href = j.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Portal error')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 space-y-8 page-enter">
        <div>
          <Link href="/dashboard" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Subscription &amp; billing
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
            Manage your CloseBooks plan through Stripe. The first five closes are free; paid plans unlock unlimited closes and priority support.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border p-8 animate-pulse" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
            <div className="h-4 w-1/3 rounded" style={{ backgroundColor: '#f0ece4' }} />
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
          >
            {data?.hasSubscription ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    Active subscription
                  </span>
                  {data.status && (
                    <span className="text-xs font-mono" style={{ color: '#6b6560' }}>
                      {data.status}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: '#6b6560' }}>
                  {data.amountTotal != null && data.currency
                    ? `Last checkout: ${(data.amountTotal / 100).toLocaleString('en-US', { style: 'currency', currency: data.currency.toUpperCase() })}`
                    : 'Your subscription is linked to this account.'}
                </p>
                {data.updatedAt && (
                  <p className="text-xs" style={{ color: '#a09a94' }}>
                    Updated {new Date(data.updatedAt).toLocaleString()}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void openPortal()}
                  disabled={portalLoading}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#635BFF' }}
                >
                  {portalLoading ? 'Opening Stripe…' : 'Manage subscription in Stripe'}
                </button>
                <p className="text-xs" style={{ color: '#a09a94' }}>
                  Update payment method, download invoices, or cancel — hosted securely by Stripe.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>No active subscription on this account</p>
                <p className="text-sm" style={{ color: '#6b6560' }}>
                  Subscribe from Pricing to unlock unlimited closes after your first five free closes, or continue in demo mode.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex py-2.5 px-5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#2d5a27' }}
                  >
                    View plans
                  </Link>
                  <button
                    type="button"
                    onClick={() => void openPortal()}
                    disabled={portalLoading}
                    className="inline-flex py-2.5 px-5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
                  >
                    {portalLoading ? '…' : 'I already subscribed — open billing portal'}
                  </button>
                </div>
              </>
            )}
            {error && (
              <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border px-4 py-3 text-xs" style={{ borderColor: '#e8e0d4', backgroundColor: '#fffbeb', color: '#92400e' }}>
          Configure <code className="font-mono">STRIPE_SECRET_KEY</code>, webhook, and Supabase{' '}
          <code className="font-mono">subscriptions</code> table so status syncs automatically after checkout.
        </div>
      </main>
    </div>
  )
}
