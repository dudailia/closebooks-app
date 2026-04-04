'use client'

import { useState } from 'react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

const PLANS = [
  {
    name:        'Starter',
    price:       99,
    period:      'mo',
    description: 'For solo bookkeepers handling a handful of clients.',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_STARTER',
    color:       '#6b6560',
    popular:     false,
    features: [
      'Up to 5 clients',
      '500 transactions / month',
      'AI categorization',
      'QuickBooks CSV export',
      'Email support',
    ],
    missing: [
      'Priority support',
      'Team members',
      'API access',
    ],
  },
  {
    name:        'Growth',
    price:       249,
    period:      'mo',
    description: 'For growing practices with multiple clients and staff.',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_GROWTH',
    color:       '#2d5a27',
    popular:     true,
    features: [
      'Up to 25 clients',
      '5,000 transactions / month',
      'AI categorization',
      'QuickBooks CSV export',
      'Priority email & chat support',
      '3 team members',
      'Confidence review dashboard',
    ],
    missing: [
      'API access',
    ],
  },
  {
    name:        'Scale',
    price:       499,
    period:      'mo',
    description: 'For established firms running high-volume closes.',
    priceEnvKey: null, // no env key — contact sales
    color:       '#b8734a',
    popular:     false,
    features: [
      'Unlimited clients',
      'Unlimited transactions',
      'AI categorization',
      'QuickBooks CSV export',
      'Dedicated account manager',
      'Unlimited team members',
      'API access',
      'Custom integrations',
    ],
    missing: [],
  },
] as const

// ---------------------------------------------------------------------------
// Checkout helper
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
// PricingCard
// ---------------------------------------------------------------------------

function PricingCard({ plan }: { plan: typeof PLANS[number] }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const isContactSales = plan.priceEnvKey === null

  // Determine at render time whether Stripe is configured for this plan
  const resolvedPriceId = plan.priceEnvKey === 'NEXT_PUBLIC_STRIPE_PRICE_STARTER'
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
      className="relative flex flex-col rounded-2xl border p-8 transition-shadow"
      style={{
        borderColor:     plan.popular ? plan.color : '#e8e0d4',
        backgroundColor: plan.popular ? '#faf8f4' : '#ffffff',
        boxShadow:       plan.popular ? '0 4px 24px rgba(45,90,39,0.10)' : 'none',
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: plan.color }}
        >
          Most Popular
        </div>
      )}

      {/* Plan header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: plan.color }}>
          {plan.name}
        </p>
        <div className="flex items-end gap-1.5">
          <span
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '2.8rem',
              lineHeight: 1,
              color: '#1a1714',
            }}
          >
            ${plan.price}
          </span>
          <span className="text-sm mb-1.5" style={{ color: '#a09a94' }}>/ {plan.period}</span>
        </div>
        <p className="text-sm mt-2" style={{ color: '#6b6560' }}>{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#1a1714' }}>
            <CheckIcon color={plan.color} />
            {f}
          </li>
        ))}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#c4bdb8' }}>
            <DashIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* Email input — only for paid plans */}
      {!isContactSales && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com (optional)"
          className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
          style={{
            borderColor: '#e8e0d4',
            backgroundColor: '#faf8f4',
            color: '#1a1714',
          }}
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
          <button
            disabled
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all opacity-50 cursor-not-allowed"
            style={{ backgroundColor: plan.color, color: '#ffffff' }}
          >
            Coming soon
          </button>
          <p className="text-xs text-center mt-2" style={{ color: '#a09a94' }}>
            Billing not yet configured
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
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>

      {/* Minimal nav */}
      <nav className="border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 select-none">
            <LedgerIcon />
            <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 18, lineHeight: 1 }}>
              <span style={{ color: '#1a1714' }}>Close</span>
              <span style={{ color: '#b8734a' }}>Books</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm transition-colors"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}
          >
            ← Back to app
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#b8734a' }}>
            Pricing
          </p>
          <h1
            className="text-4xl sm:text-5xl"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Simple, honest pricing.
          </h1>
          <p className="text-lg mt-4 mx-auto max-w-xl" style={{ color: '#6b6560' }}>
            Built for CPAs and bookkeepers. Start free for 14 days, cancel any time.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        {/* FAQ strip */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          {[
            { q: 'What counts as a transaction?', a: 'Every row in your uploaded bank statement CSV counts as one transaction.' },
            { q: 'Can I switch plans?', a: 'Yes — upgrade or downgrade at any time. Changes take effect at the next billing cycle.' },
            { q: 'How does the free trial work?', a: '14 days, full access, no credit card required. You\'ll only be charged if you choose to continue.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium mb-1" style={{ color: '#1a1714' }}>{q}</p>
              <p style={{ color: '#6b6560' }}>{a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="7" fill={color} opacity="0.12" />
      <path d="M5 8l2.5 2.5L11 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
      <path d="M5 8h6" stroke="#c4bdb8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LedgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
    </svg>
  )
}
