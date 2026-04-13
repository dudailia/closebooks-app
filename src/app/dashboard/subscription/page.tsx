'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { getClients } from '@/lib/storage'
import { getTeamMembers } from '@/lib/teamStore'

interface InvoiceRow {
  id: string
  number: string | null
  status: string | null
  amountPaid: number
  currency: string
  created: number
  hostedInvoiceUrl: string | null
}

export default function SubscriptionPage() {
  const { subscription, refresh } = useSubscription()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clients = getClients()
  const clientCount = clients.length
  const teamCount = getTeamMembers().length
  const maxC = subscription.maxClients
  const maxU = subscription.maxUsers

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/invoices')
      const j = (await res.json()) as { invoices?: InvoiceRow[] }
      setInvoices(j.invoices ?? [])
    } catch {
      setInvoices([])
    }
  }, [])

  useEffect(() => {
    void loadInvoices()
    void refresh()
  }, [loadInvoices, refresh])

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

  const tierLabel = subscription.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : 'Free / trial'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-8 page-enter">
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
            Your plan, usage, and Stripe invoices. Manage payment methods in the Stripe customer portal.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a09a94' }}>
                Current plan
              </p>
              <p className="text-xl font-semibold mt-1" style={{ color: '#1a1714' }}>
                {tierLabel}
              </p>
              <p className="text-sm" style={{ color: '#6b6560' }}>
                Status: <span className="font-mono">{subscription.status}</span>
                {subscription.billingInterval && ` · ${subscription.billingInterval}ly`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={portalLoading}
              className="py-2.5 px-5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#635BFF' }}
            >
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: '#f0ece4' }}>
            <div>
              <p className="text-xs" style={{ color: '#a09a94' }}>Clients</p>
              <p className="text-lg font-semibold" style={{ color: '#1a1714' }}>
                {clientCount} / {maxC >= 999999 ? '∞' : maxC}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#a09a94' }}>Team seats</p>
              <p className="text-lg font-semibold" style={{ color: '#1a1714' }}>
                {teamCount} / {maxU >= 999999 ? '∞' : maxU}
              </p>
            </div>
          </div>

          {subscription.tier && (
            <div className="text-xs space-y-1" style={{ color: '#6b6560' }}>
              <p>Full AI: {subscription.fullAi ? 'Yes' : 'Upgrade on Professional+'}</p>
              <p>API: {subscription.apiAccess ? 'Yes' : 'Enterprise'}</p>
              <p>White-label: {subscription.whiteLabel ? 'Yes' : 'Enterprise'}</p>
            </div>
          )}

          {error && <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>}
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>
            Billing history
          </h2>
          {invoices.length === 0 ? (
            <p className="text-sm" style={{ color: '#6b6560' }}>
              No invoices yet. After your first charge, invoices appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}
                >
                  <div>
                    <span className="font-mono text-xs" style={{ color: '#6b6560' }}>
                      {inv.number ?? inv.id.slice(0, 14)}
                    </span>
                    <span className="ml-2" style={{ color: '#1a1714' }}>
                      {(inv.amountPaid / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: inv.currency.toUpperCase(),
                      })}
                    </span>
                  </div>
                  {inv.hostedInvoiceUrl && (
                    <a
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium underline"
                      style={{ color: '#635BFF' }}
                    >
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border px-4 py-3 text-xs" style={{ borderColor: '#e8e0d4', backgroundColor: '#f6faf5', color: '#2d5a27' }}>
          Configure Stripe webhooks for <code className="font-mono">checkout.session.completed</code>,{' '}
          <code className="font-mono">customer.subscription.*</code>, and <code className="font-mono">invoice.*</code>.
        </div>
      </main>
    </div>
  )
}
