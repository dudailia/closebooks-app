'use client'

import { useState } from 'react'
import Link from 'next/link'
import CodeBlock from '@/components/CodeBlock'

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

function LedgerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#2d5a27" />
      <rect x="7" y="8" width="14" height="1.8" rx="0.9" fill="white" />
      <rect x="7" y="12.1" width="14" height="1.8" rx="0.9" fill="white" opacity="0.75" />
      <rect x="7" y="16.2" width="9" height="1.8" rx="0.9" fill="white" opacity="0.5" />
    </svg>
  )
}

function ConnectNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(12px)', borderColor: '#e8e0d4' }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <LedgerIcon />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 19, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/connect/docs" className="text-sm transition-colors" style={{ color: '#6b6560' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1714')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}
          >
            Docs
          </Link>
          <a href="#pricing" className="text-sm transition-colors" style={{ color: '#6b6560' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1714')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}
          >
            Pricing
          </a>
          <a href="#use-cases" className="text-sm transition-colors" style={{ color: '#6b6560' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1714')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}
          >
            Use Cases
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-lg transition-colors hidden sm:block"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f0ece4' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Code examples
// ---------------------------------------------------------------------------

const GET_FINANCIALS = `curl -X GET https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/financials \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p" \\
  -H "Content-Type: application/json"`

const GET_FINANCIALS_RESPONSE = `{
  "company_id": "cmp_4xT9mK2p",
  "period": "2026-03",
  "revenue": 284500.00,
  "cost_of_goods_sold": 91200.00,
  "gross_profit": 193300.00,
  "gross_margin": 0.679,
  "operating_expenses": 87400.00,
  "ebitda": 105900.00,
  "ebitda_margin": 0.372,
  "net_income": 98200.00,
  "cash_on_hand": 412800.00,
  "accounts_receivable": 67300.00,
  "accounts_payable": 22100.00,
  "close_status": "completed",
  "as_of": "2026-03-31T23:59:59Z"
}`

const POST_TRANSACTION = `curl -X POST https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/transactions \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2026-04-05",
    "amount": -4250.00,
    "description": "AWS Infrastructure — March",
    "category": "Software & Subscriptions",
    "account": "acc_operating_checking",
    "memo": "Invoice #INV-2026-0312"
  }'`

const POST_TRANSACTION_RESPONSE = `{
  "id": "txn_9kR3pQ7wX2mN",
  "company_id": "cmp_4xT9mK2p",
  "date": "2026-04-05",
  "amount": -4250.00,
  "description": "AWS Infrastructure — March",
  "category": "Software & Subscriptions",
  "account": "acc_operating_checking",
  "memo": "Invoice #INV-2026-0312",
  "status": "posted",
  "created_at": "2026-04-05T14:32:10Z"
}`

const GET_HEALTH_SCORE = `curl -X GET https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/health-score \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p"`

const GET_HEALTH_SCORE_RESPONSE = `{
  "company_id": "cmp_4xT9mK2p",
  "score": 82,
  "grade": "B+",
  "computed_at": "2026-04-05T00:00:00Z",
  "components": {
    "cash_runway_months": 14.5,
    "gross_margin": 67.9,
    "burn_rate_trend": "stable",
    "accounts_receivable_days": 28,
    "debt_to_equity": 0.31
  },
  "flags": [
    {
      "type": "warning",
      "message": "A/R days trending up — 28 vs 22 last quarter"
    }
  ],
  "benchmark_percentile": 71
}`

// ---------------------------------------------------------------------------
// Use cases
// ---------------------------------------------------------------------------

const USE_CASES = [
  {
    icon: '🏦',
    title: 'Lending Underwriting',
    description: 'Pull real-time P&L, cash flow, and health scores to make faster credit decisions without requesting documents.',
    color: '#eef5ed',
    border: '#c8dfc6',
  },
  {
    icon: '💳',
    title: 'Expense Management',
    description: 'Sync corporate card spend directly into the accounting layer with AI-powered categorization.',
    color: '#fdf5ef',
    border: '#e0c9b6',
  },
  {
    icon: '🧾',
    title: 'Payroll Integration',
    description: 'Push payroll journal entries automatically when runs complete — zero manual data entry.',
    color: '#eef5ed',
    border: '#c8dfc6',
  },
  {
    icon: '📊',
    title: 'Tax Automation',
    description: 'Access categorized transactions and financials to pre-populate tax returns and reduce prep time.',
    color: '#fdf5ef',
    border: '#e0c9b6',
  },
  {
    icon: '⚡',
    title: 'Real-time Reporting',
    description: 'Build live dashboards and investor portals backed by always-current bookkeeping data.',
    color: '#eef5ed',
    border: '#c8dfc6',
  },
  {
    icon: '🔧',
    title: 'Custom Workflows',
    description: 'Trigger automations on close events, exceptions, and document uploads via webhooks.',
    color: '#fdf5ef',
    border: '#e0c9b6',
  },
]

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const PRICING = [
  {
    name: 'Free',
    price: null,
    priceLabel: '$0',
    period: '/month',
    calls: '1,000 calls/day',
    features: ['All endpoints', 'Webhook events', 'Community support', '1 API key'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 499,
    priceLabel: '$499',
    period: '/month',
    calls: '10,000 calls/day',
    features: ['All endpoints', 'Webhook events', 'Email support', '10 API keys', 'Partner integrations', 'Usage analytics'],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    period: '',
    calls: 'Unlimited',
    features: ['All endpoints', 'Webhook events', 'Dedicated support', 'Unlimited API keys', 'SLA guarantee', 'SSO & audit log', 'Custom rate limits'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

// ---------------------------------------------------------------------------
// Trusted by
// ---------------------------------------------------------------------------

const TRUSTED = ['Bill.com', 'Ramp', 'Mercury', 'Brex']

// ---------------------------------------------------------------------------
// Code example tabs
// ---------------------------------------------------------------------------

type ExTab = 'financials' | 'transactions' | 'health'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConnectLandingPage() {
  const [exTab, setExTab] = useState<ExTab>('financials')

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <ConnectNav />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        className="text-center px-5 pt-24 pb-20"
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        <span
          className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
          style={{ backgroundColor: '#eef5ed', color: '#2d5a27', border: '1px solid #c8dfc6' }}
        >
          CloseBooks API
        </span>

        <h1
          className="text-5xl font-bold leading-tight mb-6"
          style={{
            color: '#1a1714',
            fontFamily: 'Georgia, "DM Serif Display", serif',
            letterSpacing: '-0.02em',
          }}
        >
          Build on the<br />
          <span style={{ color: '#2d5a27' }}>accounting data layer</span>
        </h1>

        <p className="text-lg mb-10 leading-relaxed" style={{ color: '#6b6560', maxWidth: 580, margin: '0 auto 2.5rem' }}>
          Real-time access to verified financial data — transactions, P&amp;L, cash flow, and health scores — for every company on CloseBooks.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/get-started"
            className="text-sm px-6 py-3 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
          >
            Get API Key — Free
          </Link>
          <Link
            href="/connect/docs"
            className="text-sm px-6 py-3 rounded-xl font-medium transition-colors border"
            style={{ backgroundColor: 'transparent', color: '#1a1714', borderColor: '#e8e0d4' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0ece4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Read Docs →
          </Link>
        </div>

        {/* Trusted by */}
        <div className="mt-16 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs mr-2" style={{ color: '#6b6560' }}>Trusted by teams at</span>
          {TRUSTED.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold px-3 py-1 rounded-lg"
              style={{ backgroundColor: '#ffffff', color: '#1a1714', border: '1px solid #e8e0d4' }}
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Code Examples ─────────────────────────────────────── */}
      <section className="px-5 pb-24" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#b8734a' }}>
            Developer Experience
          </p>
          <h2
            className="text-3xl font-bold"
            style={{ color: '#1a1714', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
          >
            Intuitive REST API
          </h2>
          <p className="text-sm mt-3" style={{ color: '#6b6560' }}>
            Clean endpoints, predictable responses, comprehensive documentation.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-5 w-fit mx-auto"
          style={{ backgroundColor: '#f0ece4', border: '1px solid #e8e0d4' }}
        >
          {([
            { id: 'financials',   label: 'GET /financials' },
            { id: 'transactions', label: 'POST /transactions' },
            { id: 'health',       label: 'GET /health-score' },
          ] as { id: ExTab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setExTab(t.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all font-mono"
              style={{
                backgroundColor: exTab === t.id ? '#ffffff' : 'transparent',
                color: exTab === t.id ? '#1a1714' : '#6b6560',
                boxShadow: exTab === t.id ? '0 1px 4px rgba(26,23,20,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {exTab === 'financials' && (
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <CodeBlock code={GET_FINANCIALS} language="bash" label="Request" />
            <CodeBlock code={GET_FINANCIALS_RESPONSE} language="json" label="Response" />
          </div>
        )}
        {exTab === 'transactions' && (
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <CodeBlock code={POST_TRANSACTION} language="bash" label="Request" />
            <CodeBlock code={POST_TRANSACTION_RESPONSE} language="json" label="Response" />
          </div>
        )}
        {exTab === 'health' && (
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <CodeBlock code={GET_HEALTH_SCORE} language="bash" label="Request" />
            <CodeBlock code={GET_HEALTH_SCORE_RESPONSE} language="json" label="Response" />
          </div>
        )}
      </section>

      {/* ── Use Cases ─────────────────────────────────────────── */}
      <section
        id="use-cases"
        className="px-5 py-24 border-t border-b"
        style={{ borderColor: '#e8e0d4' }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#b8734a' }}>
              Use Cases
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ color: '#1a1714', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
            >
              What you can build
            </h2>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="rounded-xl p-6 border"
                style={{ backgroundColor: uc.color, borderColor: uc.border }}
              >
                <div className="text-2xl mb-3">{uc.icon}</div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a1714' }}>{uc.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="px-5 py-24">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#b8734a' }}>
              Pricing
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ color: '#1a1714', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
            >
              Simple, usage-based pricing
            </h2>
            <p className="text-sm mt-3" style={{ color: '#6b6560' }}>
              Start free, scale when you grow. No hidden fees.
            </p>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className="rounded-2xl p-7 border flex flex-col relative"
                style={{
                  backgroundColor: tier.highlight ? '#2d5a27' : '#ffffff',
                  borderColor: tier.highlight ? '#2d5a27' : '#e8e0d4',
                  boxShadow: tier.highlight ? '0 8px 32px rgba(45,90,39,0.25)' : '0 1px 6px rgba(26,23,20,0.06)',
                }}
              >
                {tier.highlight && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: '#b8734a', color: '#ffffff' }}
                  >
                    Most Popular
                  </span>
                )}
                <p
                  className="text-xs font-semibold tracking-wider uppercase mb-3"
                  style={{ color: tier.highlight ? 'rgba(255,255,255,0.6)' : '#6b6560' }}
                >
                  {tier.name}
                </p>
                <div className="mb-1">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: tier.highlight ? '#ffffff' : '#1a1714', fontFamily: 'Georgia, serif' }}
                  >
                    {tier.priceLabel}
                  </span>
                  {tier.period && (
                    <span className="text-sm ml-1" style={{ color: tier.highlight ? 'rgba(255,255,255,0.6)' : '#6b6560' }}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm font-medium mb-6"
                  style={{ color: tier.highlight ? 'rgba(255,255,255,0.8)' : '#b8734a' }}
                >
                  {tier.calls}
                </p>
                <ul className="flex-1 space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span style={{ color: tier.highlight ? '#a8d4a4' : '#2d5a27' }}>✓</span>
                      <span style={{ color: tier.highlight ? 'rgba(255,255,255,0.8)' : '#6b6560' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/get-started"
                  className="text-sm py-2.5 rounded-xl text-center font-medium transition-colors block"
                  style={{
                    backgroundColor: tier.highlight ? '#ffffff' : '#2d5a27',
                    color: tier.highlight ? '#2d5a27' : '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = tier.highlight ? '#f0f9f0' : '#245020'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = tier.highlight ? '#ffffff' : '#2d5a27'
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section
        className="px-5 py-24 text-center border-t"
        style={{ borderColor: '#e8e0d4' }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: '#1a1714', fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            Start building in 5 minutes
          </h2>
          <p className="text-base mb-8" style={{ color: '#6b6560' }}>
            Generate your API key, read the docs, and make your first call before your coffee gets cold.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="text-sm px-8 py-3.5 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
            >
              Get API Key — Free
            </Link>
            <Link
              href="/connect/docs"
              className="text-sm px-8 py-3.5 rounded-xl font-medium border transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0ece4')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-5 py-8 border-t text-center text-xs"
        style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }} className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <LedgerIcon />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#1a1714' }}>
              Close<span style={{ color: '#b8734a' }}>Books</span>
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/connect/docs" style={{ color: '#6b6560' }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#6b6560' }}>Pricing</Link>
            <a href="mailto:api@closebooks.io" style={{ color: '#6b6560' }}>api@closebooks.io</a>
          </div>
          <p>© 2026 CloseBooks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
