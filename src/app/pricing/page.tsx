'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

// ---------------------------------------------------------------------------
// Plans — kept in sync with homepage PLANS
// ---------------------------------------------------------------------------

const PLANS = [
  {
    name:    'Starter',
    price:   99,
    clients: '20 clients',
    color:   '#6b6560',
    popular: false,
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_STARTER' as const,
    features: [
      'Up to 20 clients',
      '1,000 transactions / mo',
      'AI categorization',
      'QuickBooks CSV export',
      'Client portal',
      'Email support',
    ],
  },
  {
    name:    'Growth',
    price:   249,
    clients: '75 clients',
    color:   '#2d5a27',
    popular: true,
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_GROWTH' as const,
    features: [
      'Up to 75 clients',
      '10,000 transactions / mo',
      'AI categorization',
      'QuickBooks & Xero export',
      'Client portal',
      'Priority support',
      '5 team members',
      'Confidence review dashboard',
    ],
  },
  {
    name:    'Scale',
    price:   499,
    clients: 'Unlimited',
    color:   '#b8734a',
    popular: false,
    priceEnvKey: null,
    features: [
      'Unlimited clients',
      'Unlimited transactions',
      'AI categorization',
      'All export formats',
      'Client portal',
      'Dedicated account manager',
      'Unlimited team members',
      'API access & custom integrations',
    ],
  },
] as const

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

async function startCheckout(priceId: string, email: string): Promise<string> {
  const res = await fetch('/api/stripe/checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ priceId, customerEmail: email || undefined }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')
  return data.url as string
}

// ---------------------------------------------------------------------------
// Pricing card
// ---------------------------------------------------------------------------

function PricingCard({ plan }: { plan: typeof PLANS[number] }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const isContactSales = plan.priceEnvKey === null

  const resolvedPriceId =
    plan.priceEnvKey === 'NEXT_PUBLIC_STRIPE_PRICE_STARTER'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER
      : plan.priceEnvKey === 'NEXT_PUBLIC_STRIPE_PRICE_GROWTH'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH
      : undefined
  const stripeConfigured = !isContactSales && !!resolvedPriceId && !resolvedPriceId.startsWith('your_')

  async function handleClick() {
    if (isContactSales || !stripeConfigured) return
    setLoading(true)
    setError(null)
    try {
      const url = await startCheckout(resolvedPriceId!, email)
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
        borderColor:     plan.popular ? plan.color : '#e8e0d4',
        backgroundColor: '#ffffff',
        boxShadow:       plan.popular ? '0 8px 32px rgba(45,90,39,0.12)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        if (!plan.popular) e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,23,20,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        if (!plan.popular) e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {plan.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
          style={{ backgroundColor: plan.color }}
        >
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: plan.color }}>
          {plan.name}
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
            ${plan.price}
          </span>
          <span className="text-sm mb-1.5" style={{ color: '#a09a94' }}>/mo</span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: '#a09a94' }}>{plan.clients}</p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm" style={{ color: '#1a1714' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" fill={plan.color} opacity="0.12" />
              <path d="M5 8l2.5 2.5L11 5.5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feat}
          </li>
        ))}
      </ul>

      {/* Email (paid plans) */}
      {!isContactSales && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com (optional)"
          className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = plan.color }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
        />
      )}

      {/* CTA */}
      {isContactSales ? (
        <a
          href="mailto:hello@closebooks.app"
          className="block text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: plan.color }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Contact Sales
        </a>
      ) : stripeConfigured ? (
        <>
          <button
            onClick={handleClick}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: plan.color }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {loading ? 'Redirecting to Stripe…' : 'Start Free Trial'}
          </button>
          {error && (
            <p className="text-xs mt-2 text-center" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <p className="text-xs text-center mt-2" style={{ color: '#a09a94' }}>
            14-day free trial · No credit card required to start
          </p>
        </>
      ) : (
        <>
          <Link
            href="/get-started"
            className="block text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ backgroundColor: plan.color }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Start Free Trial
          </Link>
          <p className="text-xs text-center mt-2" style={{ color: '#a09a94' }}>
            14-day free trial · No credit card required
          </p>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-16 page-enter">

        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs mb-10 transition-colors"
          style={{ color: '#b8734a' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#8a4f2e' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b8734a' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: '#b8734a' }}>
            Pricing
          </p>
          <h1
            className="text-4xl sm:text-5xl mb-4"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Simple, honest pricing
          </h1>
          <p className="text-lg mt-2 mx-auto max-w-xl" style={{ color: '#6b6560' }}>
            14-day free trial on every plan. Cancel any time.
          </p>

          {/* Early access callout */}
          <div className="mt-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#fdf2e9', color: '#b8734a', border: '1px solid #f0c8a8' }}
            >
              <span>🎉</span>
              Early access firms get <strong>50% off for life</strong> — limited to first 50 firms
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm border-t pt-12" style={{ borderColor: '#e8e0d4' }}>
          {[
            {
              q: 'What counts as a transaction?',
              a: 'Every row in your uploaded bank statement CSV counts as one transaction.',
            },
            {
              q: 'Can I switch plans?',
              a: 'Yes — upgrade or downgrade at any time. Changes take effect at the next billing cycle.',
            },
            {
              q: 'How does the free trial work?',
              a: '14 days, full access, no credit card required. You\'ll only be charged if you choose to continue.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium mb-1.5" style={{ color: '#1a1714' }}>{q}</p>
              <p style={{ color: '#6b6560', lineHeight: 1.6 }}>{a}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
            Not sure which plan is right for you?
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Try the live demo first — no signup needed
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
