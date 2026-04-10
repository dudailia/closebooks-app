# CloseBooks — AI-Powered Month-End Close for CPA Firms

**CloseBooks** is the fastest way for CPA firms to close their clients' books. Upload a bank statement CSV, let Claude AI categorize every transaction in seconds, review and approve, then export to QuickBooks or generate a branded client report.

## Features

| Area | What it does |
|------|-------------|
| **AI Categorize** | Upload CSV → Claude categorizes every transaction against your chart of accounts with confidence scores |
| **Close Copilot** | Configurable automation — auto-approves high-confidence items, flags anything uncertain |
| **Autopilot** | Fully automated close: categorize → journal entries → P&L → exceptions in one click |
| **Agent Mode** | Background close agent that runs on a schedule for all your clients |
| **Predict Close** | Forecasts next month's transactions from 18+ months of history |
| **TaxDraft** | AI-generated tax returns with opportunity identification |
| **Tax Strategy** | Claude-powered tax planning by entity type and industry |
| **1099 Filing** | Automated vendor 1099 identification and filing |
| **Audit Defense** | Build IRS response packages with AI |
| **Radar** | Client health monitoring — cash position, burn rate, runway |
| **Advisory Memos** | AI-written client advisory letters in three tones |
| **Client Portal** | Branded portal where clients view their financials |
| **Vault & Inbox** | Document storage + inbound email parsing (Postmark) |
| **Compliance** | Regulatory alert monitoring |
| **Analytics** | Firm-wide performance metrics |
| **White-Label** | Rebrand CloseBooks under your firm |
| **Voice AI** | Voice command interface for hands-free operation |
| **Connect API** | API keys for integrating CloseBooks with your stack |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS 3.4, DM Sans / DM Serif fonts
- **AI:** Anthropic Claude (`claude-sonnet-4-6` for complex tasks, `claude-haiku-4-5` for fast extraction)
- **Auth & Database:** Supabase (Postgres + Auth) — optional, falls back to localStorage
- **Payments:** Stripe
- **Parsing:** PapaParse (CSV), pdf-parse (PDF)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/dudailia/closebooks-app.git
cd closebooks-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — at minimum you need:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Everything else is optional. The app runs in demo mode without Supabase or Stripe.

### 3. Set up Supabase (optional but recommended)

1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Run the SQL in `.env.example` to create all tables and RLS policies
3. Add your Supabase URL and keys to `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new), import your repo
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Deploy — `vercel.json` is pre-configured with proper function timeouts

**Important:** Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars (never expose it client-side). The Stripe webhook URL will be `https://your-app.vercel.app/api/stripe/webhook`.

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── api/             # 47 API route handlers
│   ├── dashboard/       # All dashboard pages (~30 routes)
│   ├── portal/          # Client-facing portal
│   └── page.tsx         # Marketing landing page
├── components/          # ~67 shared React components
├── lib/                 # Business logic, storage, AI helpers
│   ├── categorize.ts    # Core Claude categorization engine
│   ├── db.ts            # Supabase data layer with localStorage fallback
│   ├── storage.ts       # localStorage CRUD
│   └── autopilot/       # Journal entries, P&L, exception detection
└── types/               # TypeScript type definitions
```

**Key design pattern:** All data operations go through `lib/db.ts` on the client. It tries Supabase first; on any failure (no config, no session, network error) it falls back to localStorage transparently. The app never crashes due to database issues.

## Environment Variables

See `.env.example` for the complete list with descriptions and the full Supabase SQL schema.

## License

Private — all rights reserved.
