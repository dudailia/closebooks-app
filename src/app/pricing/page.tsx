'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

type TierId = 'starter' | 'professional' | 'enterprise'

const TIERS: {
  id: TierId
  name: string
  monthly: number
  clients: string
  users: string
  highlight: string
  features: string[]
  popular?: boolean
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 49,
    clients: '10 clients',
    users: '1 user',
    highlight: 'Basic AI categorization',
    features: [
      '10 clients',
      '1 seat',
      'Basic AI',
      'CSV export',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly: 149,
    clients: '50 clients',
    users: '5 users',
    highlight: 'Full AI + priority support',
    popular: true,
    features: [
      '50 clients',
      '5 seats',
      'Full AI',
      'Bulk tools',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 349,
    clients: 'Unlimited clients',
    users: 'Unlimited seats',
    highlight: 'White-label, API, dedicated support',
    features: [
      'Unlimited clients',
      'Unlimited seats',
      'Full AI',
      'White-label portal',
      'API access',
    ],
  },
]

function priceEnvKey(tier: TierId, annual: boolean): string {
  const a = annual ? 'YEAR' : 'MONTH'
  const map: Record<TierId, string> = {
    starter: `NEXT_PUBLIC_STRIPE_PRICE_STARTER_${a}`,
    professional: `NEXT_PUBLIC_STRIPE_PRICE_PRO_${a}`,
    enterprise: `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_${a}`,
  }
  return map[tier]
}

function resolvePriceId(tier: TierId, annual: boolean): string | undefined {
  const key = priceEnvKey(tier, annual)
  const v = process.env[key as keyof NodeJS.ProcessEnv]
  return typeof v === 'string' && v && !v.startsWith('your_') ? v : undefined
}

async function startCheckout(
  priceId: string,
  email: string,
  planSlug: TierId,
  billing: 'month' | 'year'
): Promise<string> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      customerEmail: email || undefined,
      planSlug,
      billingInterval: billing,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')
  return data.url as string
}

function PricingCard({
  tier,
  annual,
}: {
  tier: (typeof TIERS)[number]
  annual: boolean
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthlyEquiv = tier.monthly * (annual ? 0.8 : 1)
  const displayPrice = annual ? Math.round(monthlyEquiv * 12) : tier.monthly

  const priceId = resolvePriceId(tier.id, annual)
  const stripeConfigured = !!priceId

  async function handleClick() {
    if (!stripeConfigured) return
    setLoading(true)
    setError(null)
    try {
      const url = await startCheckout(priceId!, email, tier.id, annual ? 'year' : 'month')
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl border p-8 transition-all duration-200"
      style={{
        borderColor: tier.popular ? '#2d5a27' : '#e8e0d4',
        backgroundColor: '#ffffff',
        boxShadow: tier.popular ? '0 8px 32px rgba(45,90,39,0.12)' : 'none',
      }}
    >
      {tier.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
          style={{ backgroundColor: '#2d5a27' }}
        >
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#2d5a27' }}>
          {tier.name}
        </p>
        <div className="flex items-end gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '2.6rem',
              lineHeight: 1,
              color: '#1a1714',
            }}
          >
            ${displayPrice}
          </span>
          <span className="text-sm mb-1.5" style={{ color: '#a09a94' }}>
            {annual ? '/yr' : '/mo'}
          </span>
        </div>
        {annual && (
          <p className="text-xs mt-1" style={{ color: '#059669' }}>
            20% off vs monthly
          </p>
        )}
        <p className="text-sm mt-1.5" style={{ color: '#a09a94' }}>
          {tier.clients} · {tier.users}
        </p>
        <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
          {tier.highlight}
        </p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm" style={{ color: '#1a1714' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" fill="#2d5a27" opacity="0.12" />
              <path d="M5 8l2.5 2.5L11 5.5" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feat}
          </li>
        ))}
      </ul>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com (required at checkout)"
        className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
      />

      {stripeConfigured ? (
        <>
          <button
            onClick={handleClick}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: '#2d5a27' }}
          >
            {loading ? 'Redirecting to Stripe…' : 'Subscribe'}
          </button>
          {error && <p className="text-xs mt-2 text-center" style={{ color: '#ef4444' }}>{error}</p>}
        </>
      ) : (
        <p className="text-xs text-center" style={{ color: '#a09a94' }}>
          Set {priceEnvKey(tier.id, annual)} in your environment.
        </p>
      )}
    </div>
  )
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-5 py-10 sm:py-16 page-enter">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs mb-10 transition-colors"
          style={{ color: '#b8734a' }}
        >
          ← Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1
            className="text-4xl sm:text-5xl mb-4"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.03em',
            }}
          >
            Simple pricing
          </h1>
          <p className="text-lg mx-auto max-w-xl" style={{ color: '#6b6560' }}>
            14-day trial on every plan. Annual saves 20%.
          </p>

          <div className="mt-6 inline-flex rounded-full border p-1" style={{ borderColor: '#e8e0d4', backgroundColor: '#fff' }}>
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: !annual ? '#2d5a27' : 'transparent',
                color: !annual ? '#fff' : '#6b6560',
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: annual ? '#2d5a27' : 'transparent',
                color: annual ? '#fff' : '#6b6560',
              }}
            >
              Annual (−20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} annual={annual} />
          ))}
        </div>

        <p className="text-center text-xs mt-10" style={{ color: '#a09a94' }}>
          Sign in before checkout so we can link your firm. Prices use Stripe Price IDs from your dashboard.
        </p>
      </main>

      <AppFooter />
    </div>
  )
}
