'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CodeBlock from '@/components/CodeBlock'

// ---------------------------------------------------------------------------
// Nav (reused from connect/page)
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

function DocsNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'rgba(250,248,244,0.95)', backdropFilter: 'blur(12px)', borderColor: '#e8e0d4' }}
    >
      <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <LedgerIcon />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-mono ml-1"
            style={{ backgroundColor: '#eef5ed', color: '#2d5a27', border: '1px solid #c8dfc6' }}
          >
            API Docs
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f0ece4' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
          >
            Get API Key
          </Link>
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Sidebar sections
// ---------------------------------------------------------------------------

const SIDEBAR_SECTIONS = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'endpoints',      label: 'Endpoints' },
  { id: 'get-financials', label: '  GET /financials',    indent: true },
  { id: 'get-transactions','label': '  GET /transactions', indent: true },
  { id: 'post-transactions','label': '  POST /transactions',indent: true },
  { id: 'get-health-score','label': '  GET /health-score', indent: true },
  { id: 'webhooks',       label: 'Webhooks' },
  { id: 'sdks',           label: 'SDKs' },
  { id: 'rate-limits',    label: 'Rate Limits' },
  { id: 'changelog',      label: 'Changelog' },
]

// ---------------------------------------------------------------------------
// Param table
// ---------------------------------------------------------------------------

interface Param {
  name: string
  type: string
  required: boolean
  description: string
}

function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: '#e8e0d4' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
            <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#6b6560' }}>Parameter</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#6b6560' }}>Type</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#6b6560' }}>Required</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#6b6560' }}>Description</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: '#ffffff' }}>
          {params.map((p, i) => (
            <tr key={p.name} style={{ borderTop: i > 0 ? '1px solid #f0ece4' : 'none' }}>
              <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#b8734a' }}>{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#7ab8f5' }}>{p.type}</td>
              <td className="px-4 py-2.5 text-xs">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: p.required ? '#fdf5ef' : '#f0ece4',
                    color: p.required ? '#b8734a' : '#6b6560',
                  }}
                >
                  {p.required ? 'Required' : 'Optional'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs" style={{ color: '#6b6560' }}>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Method badge
// ---------------------------------------------------------------------------

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'DELETE' | 'PATCH' }) {
  const colors: Record<string, { bg: string; text: string }> = {
    GET:    { bg: '#eef5ed', text: '#2d5a27' },
    POST:   { bg: '#fdf5ef', text: '#b8734a' },
    DELETE: { bg: '#fef2f2', text: '#dc2626' },
    PATCH:  { bg: '#eff6ff', text: '#1d4ed8' },
  }
  const c = colors[method] ?? { bg: '#f0ece4', text: '#6b6560' }
  return (
    <span
      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.bg}` }}
    >
      {method}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const AUTH_EXAMPLE = `curl -X GET https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/financials \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p" \\
  -H "Content-Type: application/json"`

const AUTH_TS_EXAMPLE = `import CloseBooksClient from '@closebooks/sdk'

const client = new CloseBooksClient({
  apiKey: process.env.CLOSEBOOKS_API_KEY,
})

const financials = await client.companies.getFinancials('cmp_4xT9mK2p', {
  period: '2026-03',
})`

// GET /financials
const GET_FINANCIALS_REQ = `curl -X GET https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/financials?period=2026-03 \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p"`

const GET_FINANCIALS_RES = `{
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

// GET /transactions
const GET_TXN_REQ = `curl -X GET "https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/transactions?limit=3&start_date=2026-03-01&end_date=2026-03-31" \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p"`

const GET_TXN_RES = `{
  "data": [
    {
      "id": "txn_9kR3pQ7wX2mN",
      "date": "2026-03-31",
      "amount": -14200.00,
      "description": "Stripe Payout",
      "category": "Revenue",
      "account": "acc_operating_checking",
      "status": "posted"
    },
    {
      "id": "txn_2wP8mK4nV9qL",
      "date": "2026-03-28",
      "amount": -4250.00,
      "description": "AWS Infrastructure",
      "category": "Software & Subscriptions",
      "account": "acc_operating_checking",
      "status": "posted"
    },
    {
      "id": "txn_5tN1xB6hQ3rW",
      "date": "2026-03-25",
      "amount": -28000.00,
      "description": "Payroll — March",
      "category": "Payroll",
      "account": "acc_payroll",
      "status": "posted"
    }
  ],
  "pagination": {
    "total": 248,
    "page": 1,
    "limit": 3,
    "next_cursor": "cur_5tN1xB6hQ3rW"
  }
}`

// POST /transactions
const POST_TXN_REQ = `curl -X POST https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/transactions \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2026-04-05",
    "amount": -4250.00,
    "description": "AWS Infrastructure — March",
    "category": "Software & Subscriptions",
    "account": "acc_operating_checking",
    "memo": "Invoice #INV-2026-0312",
    "tags": ["infrastructure", "recurring"]
  }'`

const POST_TXN_RES = `{
  "id": "txn_9kR3pQ7wX2mN",
  "company_id": "cmp_4xT9mK2p",
  "date": "2026-04-05",
  "amount": -4250.00,
  "description": "AWS Infrastructure — March",
  "category": "Software & Subscriptions",
  "account": "acc_operating_checking",
  "memo": "Invoice #INV-2026-0312",
  "tags": ["infrastructure", "recurring"],
  "status": "pending_review",
  "created_at": "2026-04-05T14:32:10Z",
  "created_by": "api_key:key_01"
}`

// GET /health-score
const GET_HEALTH_REQ = `curl -X GET https://api.closebooks.io/v1/companies/cmp_4xT9mK2p/health-score \\
  -H "Authorization: Bearer sk_live_4xT9ABCDEFGHJKLMNmK2p"`

const GET_HEALTH_RES = `{
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
      "message": "A/R days trending up — 28 vs 22 last quarter",
      "severity": "medium"
    }
  ],
  "benchmark_percentile": 71,
  "industry": "SaaS"
}`

// Webhook payload example
const WEBHOOK_PAYLOAD = `{
  "id": "evt_4kT9pQ7wX2mN",
  "type": "transaction.created",
  "created": "2026-04-05T14:32:10Z",
  "data": {
    "object": {
      "id": "txn_9kR3pQ7wX2mN",
      "company_id": "cmp_4xT9mK2p",
      "date": "2026-04-05",
      "amount": -4250.00,
      "description": "AWS Infrastructure — March",
      "category": "Software & Subscriptions",
      "status": "pending_review"
    }
  },
  "livemode": true,
  "api_version": "2026-01-01"
}`

// Webhook verification
const WEBHOOK_VERIFY = `import crypto from 'crypto'

export function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  )
}`

// SDK TS example
const SDK_TS = `npm install @closebooks/sdk`

const SDK_TS_USAGE = `import CloseBooksClient from '@closebooks/sdk'

const cb = new CloseBooksClient({ apiKey: process.env.CLOSEBOOKS_API_KEY })

// Get financials for a company
const financials = await cb.companies.getFinancials('cmp_4xT9mK2p')
console.log(financials.gross_margin) // 0.679

// List transactions with filters
const txns = await cb.companies.listTransactions('cmp_4xT9mK2p', {
  startDate: '2026-03-01',
  endDate:   '2026-03-31',
  category:  'Software & Subscriptions',
  limit:     50,
})

// Compute health score
const health = await cb.companies.getHealthScore('cmp_4xT9mK2p')
console.log(\`Score: \${health.score} (\${health.grade})\`)`

const SDK_PYTHON = `pip install closebooks-python`

const SDK_PYTHON_USAGE = `import closebooks

cb = closebooks.Client(api_key=os.environ["CLOSEBOOKS_API_KEY"])

# Get financials
financials = cb.companies.get_financials("cmp_4xT9mK2p", period="2026-03")
print(financials["gross_margin"])  # 0.679

# List transactions
txns = cb.companies.list_transactions(
    "cmp_4xT9mK2p",
    start_date="2026-03-01",
    end_date="2026-03-31",
)`

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      {children}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl font-bold mb-2"
      style={{ color: '#1a1714', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}
    >
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-lg font-semibold mb-3 mt-8"
      style={{ color: '#1a1714' }}
    >
      {children}
    </h3>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b6560' }}>
      {children}
    </p>
  )
}

function Divider() {
  return <hr className="my-8" style={{ borderColor: '#e8e0d4' }} />
}

function EndpointHeader({
  method,
  path,
  description,
}: {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  path: string
  description: string
}) {
  return (
    <div
      className="rounded-xl p-5 border mb-5"
      style={{ backgroundColor: '#faf8f4', borderColor: '#e8e0d4' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <MethodBadge method={method} />
        <code className="text-sm font-mono font-medium" style={{ color: '#1a1714' }}>{path}</code>
      </div>
      <p className="text-sm" style={{ color: '#6b6560' }}>{description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('authentication')

  // Track active section via scroll
  useEffect(() => {
    const ids = SIDEBAR_SECTIONS.map((s) => s.id)
    function onScroll() {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(ids[i])
          return
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <DocsNav />

      <div className="flex max-w-screen-xl mx-auto">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className="hidden lg:block flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r py-8 px-5"
          style={{ width: 220, borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#b8734a' }}>
            Contents
          </p>
          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className="text-left text-sm py-1.5 px-2 rounded-lg transition-colors"
                style={{
                  paddingLeft: sec.indent ? 16 : 8,
                  backgroundColor: activeSection === sec.id ? '#eef5ed' : 'transparent',
                  color: activeSection === sec.id ? '#2d5a27' : '#6b6560',
                  fontWeight: activeSection === sec.id ? 600 : 400,
                  fontSize: sec.indent ? 12 : 13,
                  fontFamily: sec.indent ? 'ui-monospace, monospace' : 'inherit',
                }}
              >
                {sec.label.trim()}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t" style={{ borderColor: '#e8e0d4' }}>
            <Link
              href="/connect"
              className="text-xs block mb-2 transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1714')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6560')}
            >
              ← Back to Connect
            </Link>
            <Link
              href="/get-started"
              className="text-xs block px-3 py-2 rounded-lg text-center font-medium transition-colors"
              style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
            >
              Get API Key
            </Link>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-8 py-10" style={{ maxWidth: 820 }}>

          {/* ── Authentication ──────────────────────────────── */}
          <Section id="authentication">
            <SectionTitle>Authentication</SectionTitle>
            <Prose>
              The CloseBooks API uses API keys to authenticate requests. All API calls must include your API key in the <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>Authorization</code> header as a Bearer token.
            </Prose>
            <Prose>
              You can manage your API keys from the <Link href="/dashboard/connect" className="underline" style={{ color: '#2d5a27' }}>CloseBooks Connect dashboard</Link>. Keys are prefixed with <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>sk_live_</code> for production and <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>sk_test_</code> for test environments. Test mode data is isolated from production.
            </Prose>
            <Prose>
              Keep your API keys secret. Do not share them in publicly accessible areas such as GitHub, client-side code, or build logs. Rotate keys immediately if you suspect they&apos;ve been compromised.
            </Prose>

            <SubTitle>Example request</SubTitle>
            <CodeBlock code={AUTH_EXAMPLE} language="bash" label="curl" />

            <SubTitle>TypeScript SDK</SubTitle>
            <CodeBlock code={AUTH_TS_EXAMPLE} language="typescript" label="TypeScript" />

            <SubTitle>HTTP response codes</SubTitle>
            <div
              className="rounded-xl border overflow-hidden mb-4"
              style={{ borderColor: '#e8e0d4' }}
            >
              {[
                { code: '200 OK',                  desc: 'Request succeeded.' },
                { code: '201 Created',             desc: 'Resource created successfully.' },
                { code: '400 Bad Request',         desc: 'Invalid request parameters.' },
                { code: '401 Unauthorized',        desc: 'Missing or invalid API key.' },
                { code: '403 Forbidden',           desc: 'Insufficient scope for this operation.' },
                { code: '404 Not Found',           desc: 'Resource does not exist.' },
                { code: '429 Too Many Requests',   desc: 'Rate limit exceeded. Retry after the duration in the Retry-After header.' },
                { code: '500 Internal Server Error', desc: 'Something went wrong on our side.' },
              ].map((r, i) => (
                <div
                  key={r.code}
                  className="flex items-start gap-4 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid #f0ece4' : 'none', backgroundColor: '#ffffff' }}
                >
                  <code className="text-xs font-mono font-medium flex-shrink-0 mt-0.5" style={{ color: '#b8734a', minWidth: 160 }}>{r.code}</code>
                  <span className="text-xs" style={{ color: '#6b6560' }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Divider />

          {/* ── Endpoints Overview ──────────────────────────── */}
          <Section id="endpoints">
            <SectionTitle>Endpoints</SectionTitle>
            <Prose>
              The base URL for all API requests is <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>https://api.closebooks.io/v1</code>. All requests and responses are JSON. Dates are ISO 8601 strings in UTC. Monetary values are floating-point numbers in USD.
            </Prose>
            <div
              className="rounded-xl p-4 border mb-6 flex items-start gap-3"
              style={{ backgroundColor: '#fffbf5', borderColor: '#f0d090' }}
            >
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <p className="text-xs leading-relaxed" style={{ color: '#6b6560' }}>
                All endpoints require a <strong style={{ color: '#1a1714' }}>company ID</strong> path parameter. You can find your company IDs on the CloseBooks dashboard under Settings → Integrations.
              </p>
            </div>
          </Section>

          {/* ── GET /financials ─────────────────────────────── */}
          <Section id="get-financials">
            <EndpointHeader
              method="GET"
              path="/v1/companies/{id}/financials"
              description="Retrieve aggregated financial metrics for a company for a given accounting period. Returns P&L data, balance sheet highlights, and close status."
            />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Path Parameters</h4>
            <ParamTable params={[
              { name: 'id', type: 'string', required: true, description: 'The company identifier (e.g. cmp_4xT9mK2p).' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Query Parameters</h4>
            <ParamTable params={[
              { name: 'period', type: 'string', required: false, description: 'Accounting period in YYYY-MM format. Defaults to the most recently closed month.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Request</h4>
            <CodeBlock code={GET_FINANCIALS_REQ} language="bash" label="curl" />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-5" style={{ color: '#6b6560' }}>Response</h4>
            <CodeBlock code={GET_FINANCIALS_RES} language="json" label="200 OK" />
          </Section>

          {/* ── GET /transactions ───────────────────────────── */}
          <Section id="get-transactions">
            <EndpointHeader
              method="GET"
              path="/v1/companies/{id}/transactions"
              description="List all transactions for a company with filtering, pagination, and cursor-based navigation. Returns up to 100 records per page."
            />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Path Parameters</h4>
            <ParamTable params={[
              { name: 'id', type: 'string', required: true, description: 'The company identifier.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Query Parameters</h4>
            <ParamTable params={[
              { name: 'start_date',  type: 'string',  required: false, description: 'Filter to transactions on or after this date (YYYY-MM-DD).' },
              { name: 'end_date',    type: 'string',  required: false, description: 'Filter to transactions on or before this date (YYYY-MM-DD).' },
              { name: 'category',    type: 'string',  required: false, description: 'Filter by category name (exact match).' },
              { name: 'account',     type: 'string',  required: false, description: 'Filter by account ID.' },
              { name: 'status',      type: 'string',  required: false, description: 'Filter by status: posted | pending_review | excluded.' },
              { name: 'limit',       type: 'integer', required: false, description: 'Number of results per page (1–100, default 20).' },
              { name: 'cursor',      type: 'string',  required: false, description: 'Pagination cursor from previous response.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Request</h4>
            <CodeBlock code={GET_TXN_REQ} language="bash" label="curl" />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-5" style={{ color: '#6b6560' }}>Response</h4>
            <CodeBlock code={GET_TXN_RES} language="json" label="200 OK" />
          </Section>

          {/* ── POST /transactions ──────────────────────────── */}
          <Section id="post-transactions">
            <EndpointHeader
              method="POST"
              path="/v1/companies/{id}/transactions"
              description="Create a new transaction. Requires the write:transactions scope. Transactions created via API are marked pending_review until confirmed by a bookkeeper."
            />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Path Parameters</h4>
            <ParamTable params={[
              { name: 'id', type: 'string', required: true, description: 'The company identifier.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Body Parameters</h4>
            <ParamTable params={[
              { name: 'date',        type: 'string',   required: true,  description: 'Transaction date in YYYY-MM-DD format.' },
              { name: 'amount',      type: 'number',   required: true,  description: 'Transaction amount in USD. Negative for expenses, positive for income.' },
              { name: 'description', type: 'string',   required: true,  description: 'Human-readable description (max 255 characters).' },
              { name: 'category',    type: 'string',   required: false, description: 'Category name. Defaults to Uncategorized.' },
              { name: 'account',     type: 'string',   required: false, description: 'Account ID. Defaults to the company\'s primary checking account.' },
              { name: 'memo',        type: 'string',   required: false, description: 'Additional notes or invoice reference (max 500 characters).' },
              { name: 'tags',        type: 'string[]', required: false, description: 'Array of string tags for custom classification.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Request</h4>
            <CodeBlock code={POST_TXN_REQ} language="bash" label="curl" />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-5" style={{ color: '#6b6560' }}>Response</h4>
            <CodeBlock code={POST_TXN_RES} language="json" label="201 Created" />
          </Section>

          {/* ── GET /health-score ───────────────────────────── */}
          <Section id="get-health-score">
            <EndpointHeader
              method="GET"
              path="/v1/companies/{id}/health-score"
              description="Retrieve the computed financial health score for a company. Scores are recalculated daily after close. Returns a 0–100 score, letter grade, component breakdown, and benchmark percentile."
            />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Path Parameters</h4>
            <ParamTable params={[
              { name: 'id', type: 'string', required: true, description: 'The company identifier.' },
            ]} />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>Request</h4>
            <CodeBlock code={GET_HEALTH_REQ} language="bash" label="curl" />
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-5" style={{ color: '#6b6560' }}>Response</h4>
            <CodeBlock code={GET_HEALTH_RES} language="json" label="200 OK" />
          </Section>

          <Divider />

          {/* ── Webhooks ────────────────────────────────────── */}
          <Section id="webhooks">
            <SectionTitle>Webhooks</SectionTitle>
            <Prose>
              Webhooks allow you to receive real-time HTTP notifications when events occur in CloseBooks. Configure webhook endpoints from the <Link href="/dashboard/connect" className="underline" style={{ color: '#2d5a27' }}>Connect dashboard</Link> or via the Webhooks API.
            </Prose>

            <SubTitle>Supported events</SubTitle>
            <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: '#e8e0d4' }}>
              {[
                { event: 'transaction.created', desc: 'A new transaction has been imported or created via API.' },
                { event: 'close.completed',     desc: 'A monthly bookkeeping close has been finalized.' },
                { event: 'exception.flagged',   desc: 'Radar has flagged an anomaly or exception requiring review.' },
                { event: 'document.received',   desc: 'A new document has been uploaded to Vault.' },
              ].map((e, i) => (
                <div
                  key={e.event}
                  className="flex items-start gap-4 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid #f0ece4' : 'none', backgroundColor: '#ffffff' }}
                >
                  <code className="text-xs font-mono font-medium flex-shrink-0 mt-0.5" style={{ color: '#b8734a', minWidth: 180 }}>{e.event}</code>
                  <span className="text-xs" style={{ color: '#6b6560' }}>{e.desc}</span>
                </div>
              ))}
            </div>

            <SubTitle>Payload structure</SubTitle>
            <CodeBlock code={WEBHOOK_PAYLOAD} language="json" label="Webhook payload" />

            <SubTitle>Verifying signatures</SubTitle>
            <Prose>
              CloseBooks signs all webhook payloads with your webhook secret using HMAC-SHA256. The signature is in the <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>X-CloseBooks-Signature</code> header. Always verify this before processing events.
            </Prose>
            <CodeBlock code={WEBHOOK_VERIFY} language="typescript" label="Verification" />
          </Section>

          <Divider />

          {/* ── SDKs ────────────────────────────────────────── */}
          <Section id="sdks">
            <SectionTitle>SDKs</SectionTitle>
            <Prose>
              Official SDKs are available for TypeScript/JavaScript and Python. They wrap all endpoints with full type safety and handle authentication, retries, and pagination automatically.
            </Prose>

            <SubTitle>TypeScript / Node.js</SubTitle>
            <CodeBlock code={SDK_TS} language="bash" label="npm" />
            <div className="mt-3">
              <CodeBlock code={SDK_TS_USAGE} language="typescript" label="Usage" />
            </div>

            <SubTitle>Python</SubTitle>
            <CodeBlock code={SDK_PYTHON} language="bash" label="pip" />
            <div className="mt-3">
              <CodeBlock code={SDK_PYTHON_USAGE} language="typescript" label="Usage" />
            </div>
          </Section>

          <Divider />

          {/* ── Rate Limits ─────────────────────────────────── */}
          <Section id="rate-limits">
            <SectionTitle>Rate Limits</SectionTitle>
            <Prose>
              API requests are rate-limited per API key. Limits reset at midnight UTC daily.
            </Prose>
            <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: '#e8e0d4' }}>
              {[
                { plan: 'Free',       limit: '1,000 requests/day',  burst: '10 req/sec'  },
                { plan: 'Growth',     limit: '10,000 requests/day', burst: '50 req/sec'  },
                { plan: 'Enterprise', limit: 'Unlimited',           burst: 'Custom'      },
              ].map((r, i) => (
                <div
                  key={r.plan}
                  className="grid px-4 py-3"
                  style={{
                    gridTemplateColumns: '100px 1fr 1fr',
                    borderTop: i > 0 ? '1px solid #f0ece4' : 'none',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: '#1a1714' }}>{r.plan}</span>
                  <span className="text-xs" style={{ color: '#6b6560' }}>{r.limit}</span>
                  <span className="text-xs" style={{ color: '#6b6560' }}>Burst: {r.burst}</span>
                </div>
              ))}
            </div>
            <Prose>
              When you exceed the rate limit, you receive a <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>429 Too Many Requests</code> response. The <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#f0ece4', color: '#b8734a' }}>Retry-After</code> header will indicate how many seconds to wait before retrying.
            </Prose>
          </Section>

          <Divider />

          {/* ── Changelog ───────────────────────────────────── */}
          <Section id="changelog">
            <SectionTitle>Changelog</SectionTitle>
            {[
              {
                date: '2026-04-01',
                version: 'v1.4',
                changes: [
                  'Added benchmark_percentile field to /health-score response.',
                  'POST /transactions now accepts tags array.',
                  'Improved latency for GET /financials by 40%.',
                ],
              },
              {
                date: '2026-02-15',
                version: 'v1.3',
                changes: [
                  'Added document.received webhook event.',
                  'GET /transactions now supports cursor pagination.',
                  'Deprecated offset-based pagination (removed in v1.4).',
                ],
              },
              {
                date: '2026-01-01',
                version: 'v1.2',
                changes: [
                  'Initial public release of CloseBooks Connect API.',
                  'Available endpoints: /financials, /transactions, /health-score.',
                  'Webhook support for transaction.created and close.completed.',
                ],
              },
            ].map((entry) => (
              <div key={entry.version} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: '#eef5ed', color: '#2d5a27', border: '1px solid #c8dfc6' }}
                  >
                    {entry.version}
                  </span>
                  <span className="text-xs" style={{ color: '#6b6560' }}>{entry.date}</span>
                </div>
                <ul className="space-y-1.5 ml-4">
                  {entry.changes.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm" style={{ color: '#6b6560' }}>
                      <span style={{ color: '#2d5a27', marginTop: 1 }}>•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>

          {/* Bottom CTA */}
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ backgroundColor: '#eef5ed', borderColor: '#c8dfc6' }}
          >
            <h3
              className="text-xl font-bold mb-2"
              style={{ color: '#1a1714', fontFamily: 'Georgia, serif' }}
            >
              Ready to start building?
            </h3>
            <p className="text-sm mb-5" style={{ color: '#6b6560' }}>
              Get your API key for free and make your first call in minutes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/get-started"
                className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-colors"
                style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#245020')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d5a27')}
              >
                Get API Key — Free
              </Link>
              <Link
                href="/connect"
                className="text-sm px-6 py-2.5 rounded-xl border transition-colors"
                style={{ borderColor: '#c8dfc6', color: '#2d5a27', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                View Pricing
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
