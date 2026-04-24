# Public Pages Dark Consistency + 3-Tier Pricing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the 3-tier Starter/Professional/Enterprise pricing on the landing, and dark-theme the critical public pages (`/pricing`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/install`) so clicking any landing CTA stays visually continuous.

**Architecture:** Introduce a shared `PublicShell` wrapper (dark bg + landing Nav + landing Footer), a shared `PricingTiers` component used by both the landing and `/pricing`, a shared `tiers.ts` source of truth, and a small dark form primitives file. Rebuild the six public pages on these.

**Tech Stack:** Next.js 14, inline React styles, Framer Motion (only on landing), existing Supabase auth flows, existing Stripe checkout flow.

**Gate:** `npm run build` after each phase. No new tests.

**Spec:** `docs/superpowers/specs/2026-04-23-public-pages-dark-consistency.md`

---

## Phase A — Foundations

### Task 1: Tier data module

**Files:** Create `src/lib/landing/tiers.ts`

- [ ] Export `TierId`, `Tier`, `TIERS`, `priceEnvKey`, `annualTotal`.

```ts
export type TierId = 'starter' | 'professional' | 'enterprise'

export interface Tier {
  id: TierId
  name: string
  tagline: string
  monthly: number
  clients: string
  users: string
  features: string[]
  popular?: boolean
}

export const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo CPAs testing the waters',
    monthly: 49,
    clients: '10 clients',
    users: '1 seat',
    features: ['10 clients', '1 seat', 'AI categorization', 'CSV export', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing firms running multiple closes',
    monthly: 149,
    clients: '50 clients',
    users: '5 seats',
    popular: true,
    features: ['50 clients', '5 seats', 'Full AI + rules engine', 'Autonomous close agent', 'Narrative insights', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For established firms with custom needs',
    monthly: 349,
    clients: 'Unlimited clients',
    users: 'Unlimited seats',
    features: ['Unlimited clients', 'Unlimited seats', 'White-label portal', 'API access', 'Dedicated support', 'Custom onboarding'],
  },
]

export function priceEnvKey(tier: TierId, annual: boolean): string {
  const a = annual ? 'YEAR' : 'MONTH'
  const map: Record<TierId, string> = {
    starter: `NEXT_PUBLIC_STRIPE_PRICE_STARTER_${a}`,
    professional: `NEXT_PUBLIC_STRIPE_PRICE_PRO_${a}`,
    enterprise: `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_${a}`,
  }
  return map[tier]
}

export function resolvePriceId(tier: TierId, annual: boolean): string | undefined {
  const v = process.env[priceEnvKey(tier, annual) as keyof NodeJS.ProcessEnv]
  return typeof v === 'string' && v && !v.startsWith('your_') ? v : undefined
}

export function annualTotal(monthly: number): number {
  return Math.round(monthly * 0.8 * 12)
}
```

- [ ] Commit.

### Task 2: Dark form primitives

**Files:** Create `src/components/landing/DarkFormPrimitives.tsx`

- [ ] Export `DarkCard`, `DarkInput`, `DarkLabel`, `DarkButton` (primary | ghost variants), `DarkDivider`, `DarkError`.

```tsx
'use client'
import { forwardRef, InputHTMLAttributes, ReactNode, ButtonHTMLAttributes } from 'react'

export function DarkCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: '#111118',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function DarkLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#6E6E85',
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  )
}

export const DarkInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function DarkInput(props, ref) {
    return (
      <input
        ref={ref}
        {...props}
        style={{
          width: '100%',
          padding: '12px 14px',
          fontSize: 14,
          color: '#F0F0F5',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          outline: 'none',
          transition: 'border-color 160ms, box-shadow 160ms',
          boxSizing: 'border-box',
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#00D97E'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.18)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      />
    )
  }
)

interface DarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  block?: boolean
}

export function DarkButton({ variant = 'primary', block, children, style, ...rest }: DarkButtonProps) {
  const base: React.CSSProperties = {
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.55 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: block ? '100%' : undefined,
    transition: 'transform 160ms, box-shadow 160ms, background 160ms, border-color 160ms',
  }
  const primary: React.CSSProperties = {
    color: '#00110A',
    background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,217,126,0.22)',
  }
  const ghost: React.CSSProperties = {
    color: '#F0F0F5',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
  }
  return (
    <button
      {...rest}
      style={{ ...base, ...(variant === 'primary' ? primary : ghost), ...style }}
      onMouseEnter={(e) => {
        if (rest.disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,217,126,0.36)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        }
        rest.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (rest.disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,126,0.22)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }
        rest.onMouseLeave?.(e)
      }}
    >
      {children}
    </button>
  )
}

export function DarkDivider({ label }: { label?: string }) {
  if (!label) return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E6E85' }}>{label}</span>
      <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

export function DarkError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div
      role="alert"
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: 'rgba(255,93,115,0.1)',
        border: '1px solid rgba(255,93,115,0.3)',
        color: '#FF8FA0',
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 3: PublicShell

**Files:** Create `src/components/landing/PublicShell.tsx`

- [ ] Wraps children in the landing's dark nav + footer.

```tsx
import Nav from './Nav'
import Footer from './Footer'

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        color: '#F0F0F5',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Nav />
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 4: PricingTiers component

**Files:** Create `src/components/landing/PricingTiers.tsx`

- [ ] Shared 3-tier grid with monthly/annual toggle, two variants (`landing` / `pricing`). In `pricing` variant, port the existing `/pricing` Stripe checkout flow.

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TIERS, annualTotal, resolvePriceId, priceEnvKey, type TierId } from '@/lib/landing/tiers'

interface Props {
  variant?: 'landing' | 'pricing'
  annualDefault?: boolean
}

export default function PricingTiers({ variant = 'landing', annualDefault = false }: Props) {
  const [annual, setAnnual] = useState(annualDefault)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {(['Monthly', 'Annual'] as const).map((label, i) => {
            const isActive = i === 0 ? !annual : annual
            return (
              <button
                key={label}
                onClick={() => setAnnual(i === 1)}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#00110A' : '#A8A8BC',
                  background: isActive
                    ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)'
                    : 'transparent',
                  transition: 'all 160ms',
                }}
              >
                {label}
                {i === 1 && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: isActive ? 0.7 : 0.6 }}>−20%</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} annual={annual} variant={variant} />
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#6E6E85' }}>
        14-day trial on every plan. Cancel anytime. Annual saves 20%.
      </p>
    </div>
  )
}

function TierCard({ tier, annual, variant }: { tier: (typeof TIERS)[number]; annual: boolean; variant: 'landing' | 'pricing' }) {
  const display = annual ? annualTotal(tier.monthly) : tier.monthly
  const suffix = annual ? '/yr' : '/mo'

  return (
    <div
      style={{
        position: 'relative',
        padding: 28,
        borderRadius: 20,
        backgroundColor: '#111118',
        border: tier.popular ? '1px solid rgba(0,217,126,0.5)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: tier.popular ? '0 24px 60px rgba(0,217,126,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {tier.popular && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#00110A',
            background: 'linear-gradient(135deg, #00D97E, #00B368)',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          Most popular
        </div>
      )}

      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#00D97E',
          margin: 0,
          marginBottom: 12,
        }}
      >
        {tier.name}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 56,
            lineHeight: 1,
            color: '#F0F0F5',
            letterSpacing: '-0.035em',
            fontWeight: 400,
          }}
        >
          ${display}
        </span>
        <span style={{ fontSize: 14, color: '#A8A8BC' }}>{suffix}</span>
      </div>
      {annual && (
        <p style={{ fontSize: 11, color: '#00D97E', margin: '4px 0 0' }}>
          20% off vs ${tier.monthly * 12}/yr
        </p>
      )}
      <p style={{ fontSize: 13, color: '#A8A8BC', margin: '12px 0 4px' }}>
        {tier.clients} · {tier.users}
      </p>
      <p style={{ fontSize: 13, color: '#6E6E85', margin: 0, marginBottom: 20 }}>{tier.tagline}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
        {tier.features.map((f) => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '6px 0',
              fontSize: 13,
              color: '#D5D5E0',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" fill="rgba(0,217,126,0.1)" />
              <path d="M5 8l2 2 4-4" stroke="#00D97E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {variant === 'landing' ? (
        <LandingCta tier={tier} annual={annual} />
      ) : (
        <PricingCta tier={tier} annual={annual} />
      )}
    </div>
  )
}

function LandingCta({ tier, annual }: { tier: (typeof TIERS)[number]; annual: boolean }) {
  const href = `/signup?plan=${tier.id}&billing=${annual ? 'annual' : 'monthly'}`
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '12px 16px',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 10,
        textDecoration: 'none',
        color: tier.popular ? '#00110A' : '#F0F0F5',
        background: tier.popular ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)' : 'rgba(255,255,255,0.04)',
        border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: tier.popular ? '0 8px 24px rgba(0,217,126,0.28)' : 'none',
      }}
    >
      Start 14-day trial
    </Link>
  )
}

function PricingCta({ tier, annual }: { tier: (typeof TIERS)[number]; annual: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const priceId = resolvePriceId(tier.id, annual)
  const configured = !!priceId

  async function handleClick() {
    if (!configured) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerEmail: email || undefined,
          planSlug: tier.id,
          billingInterval: annual ? 'year' : 'month',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 13,
          color: '#F0F0F5',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          outline: 'none',
          marginBottom: 10,
          boxSizing: 'border-box',
        }}
      />
      {configured ? (
        <button
          onClick={handleClick}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            cursor: loading ? 'wait' : 'pointer',
            color: tier.popular ? '#00110A' : '#F0F0F5',
            background: tier.popular ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)' : 'rgba(255,255,255,0.04)',
            border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.12)',
            boxShadow: tier.popular ? '0 8px 24px rgba(0,217,126,0.28)' : 'none',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Redirecting to Stripe…' : 'Subscribe'}
        </button>
      ) : (
        <p style={{ fontSize: 11, textAlign: 'center', color: '#6E6E85', marginTop: 4 }}>
          Set {priceEnvKey(tier.id, annual)} in env.
        </p>
      )}
      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#FF8FA0' }}>{error}</p>
      )}
    </>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 5: Landing swap PricingTeaser → PricingTiers

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/landing/PricingTeaser.tsx`

- [ ] In `page.tsx`: remove `import PricingTeaser from '@/components/landing/PricingTeaser'` and its JSX; add `PricingTiersSection` wrapper.

Since the landing's pricing section needs section chrome (heading + container), add a small wrapper component inline or create `src/components/landing/PricingSection.tsx`:

```tsx
'use client'
import PricingTiers from './PricingTiers'

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '40px 0 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00D97E', margin: 0, marginBottom: 14 }}>
            Pricing
          </p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(38px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Pick the plan that matches your firm.
          </h2>
        </div>
        <PricingTiers variant="landing" />
      </div>
    </section>
  )
}
```

- [ ] In `src/app/page.tsx`, replace `<PricingTeaser />` with `<PricingSection />`.
- [ ] Delete `src/components/landing/PricingTeaser.tsx`.
- [ ] `npm run build`. Commit.

---

## Phase B — Rebuild `/pricing`

### Task 6: `/pricing` page

**Files:** Rewrite `src/app/pricing/page.tsx`

- [ ] Replace with a thin page that uses `PublicShell` + `PricingTiers`.

```tsx
import PublicShell from '@/components/landing/PublicShell'
import PricingTiers from '@/components/landing/PricingTiers'

export default function PricingPage() {
  return (
    <PublicShell>
      <main style={{ padding: '120px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00D97E', margin: 0, marginBottom: 14 }}>
            Pricing
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(44px, 6vw, 68px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Simple, scalable pricing.
          </h1>
          <p style={{ fontSize: 18, color: '#A8A8BC', margin: '18px auto 0', maxWidth: 560, lineHeight: 1.55 }}>
            Starter for solo CPAs, Professional for growing firms, Enterprise when you need the full suite. 14-day trial on every plan.
          </p>
        </div>
        <PricingTiers variant="pricing" />
      </main>
    </PublicShell>
  )
}
```

- [ ] `npm run build`. Commit.

---

## Phase C — Auth pages

### Task 7: `/login`

**Files:** Rewrite `src/app/(auth)/login/page.tsx`

- [ ] Read the existing file to extract Supabase sign-in logic (keep verbatim); rewrap presentation in `PublicShell` + dark form primitives.
- [ ] Provide email + password form, magic link option if present, OAuth providers (Google) if present, link to `/signup` and `/forgot-password`.
- [ ] Keep all URL redirects and error messages intact.

Skeleton (actual auth handlers copied from existing file):

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicShell from '@/components/landing/PublicShell'
import { DarkCard, DarkInput, DarkLabel, DarkButton, DarkDivider, DarkError } from '@/components/landing/DarkFormPrimitives'
// [KEEP the existing supabase client import]
// [KEEP the existing form state + handleSubmit + handleOAuth handlers]

export default function LoginPage() {
  // …state and handlers copied from existing file…
  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 60px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40, letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#A8A8BC', margin: '8px 0 0' }}>Sign in to continue closing books.</p>
        </div>
        <DarkCard>
          {/* Error banner */}
          {errorMsg && <div style={{ marginBottom: 16 }}><DarkError>{errorMsg}</DarkError></div>}

          {/* OAuth */}
          <DarkButton variant="ghost" block onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </DarkButton>
          <DarkDivider label="or" />

          {/* Email + password */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <DarkLabel htmlFor="email">Email</DarkLabel>
              <DarkInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@firm.com" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <DarkLabel htmlFor="password">Password</DarkLabel>
              <DarkInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <DarkButton type="submit" block disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </DarkButton>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 13 }}>
            <Link href="/forgot-password" style={{ color: '#A8A8BC', textDecoration: 'none' }}>Forgot password?</Link>
            <Link href="/signup" style={{ color: '#00D97E', textDecoration: 'none', fontWeight: 600 }}>Create account →</Link>
          </div>
        </DarkCard>
      </main>
    </PublicShell>
  )
}
```

The actual implementation of `handleSubmit`, `handleGoogle`, state initializers, and the `errorMsg` variable **must be copied verbatim from the existing file**. Only presentation changes.

- [ ] `npm run build`. Commit.

### Task 8: `/signup`

**Files:** Rewrite `src/app/(auth)/signup/page.tsx`

- [ ] Keep all Supabase signup logic. Add plan/billing query-param handling.
- [ ] Render plan context pill when `?plan=` is present.

Additional logic on top of the login template:

```tsx
import { useSearchParams } from 'next/navigation'
import { TIERS } from '@/lib/landing/tiers'

const params = useSearchParams()
const planSlug = params.get('plan')
const billing  = params.get('billing')
const selectedTier = TIERS.find((t) => t.id === planSlug) ?? null

// Render above the form (inside DarkCard, before the OAuth button):
{selectedTier && (
  <div
    style={{
      padding: '10px 14px',
      borderRadius: 10,
      backgroundColor: 'rgba(0,217,126,0.08)',
      border: '1px solid rgba(0,217,126,0.24)',
      marginBottom: 18,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}
  >
    <p style={{ margin: 0, fontSize: 13, color: '#F0F0F5' }}>
      Starting <strong>{selectedTier.name}</strong>
      {billing === 'annual' ? ' · Annual (20% off)' : ' · Monthly'}
    </p>
    <Link href="/pricing" style={{ fontSize: 12, color: '#00D97E', textDecoration: 'none' }}>Change plan</Link>
  </div>
)}
```

Keep all signup Supabase calls unchanged. If the existing page handles a post-signup redirect to `/pricing`, keep that wired — the context pill is purely UX sugar.

- [ ] `npm run build`. Commit.

### Task 9: `/forgot-password`

**Files:** Rewrite `src/app/(auth)/forgot-password/page.tsx`

- [ ] Single-field email form wrapped in `PublicShell` + `DarkCard`. Keep Supabase `resetPasswordForEmail` call verbatim.

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import PublicShell from '@/components/landing/PublicShell'
import { DarkCard, DarkInput, DarkLabel, DarkButton, DarkError } from '@/components/landing/DarkFormPrimitives'
// keep existing supabase import

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // keep the existing handleSubmit logic verbatim, wiring setSent(true) on success

  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 60px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Reset your password
          </h1>
          <p style={{ fontSize: 14, color: '#A8A8BC', margin: '8px 0 0' }}>We&apos;ll send you a reset link.</p>
        </div>
        <DarkCard>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ fontSize: 14, color: '#F0F0F5', margin: 0, marginBottom: 8 }}>Check your inbox.</p>
              <p style={{ fontSize: 13, color: '#A8A8BC', margin: 0 }}>We sent a reset link to {email}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ marginBottom: 14 }}><DarkError>{error}</DarkError></div>}
              <div style={{ marginBottom: 18 }}>
                <DarkLabel htmlFor="email">Email</DarkLabel>
                <DarkInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@firm.com" />
              </div>
              <DarkButton type="submit" block disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </DarkButton>
            </form>
          )}
          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13 }}>
            <Link href="/login" style={{ color: '#A8A8BC', textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        </DarkCard>
      </main>
    </PublicShell>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 10: `/reset-password`

**Files:** Rewrite `src/app/(auth)/reset-password/page.tsx`

- [ ] Password + confirm-password form wrapped in `PublicShell` + `DarkCard`. Keep Supabase `updateUser({ password })` call unchanged.

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PublicShell from '@/components/landing/PublicShell'
import { DarkCard, DarkInput, DarkLabel, DarkButton, DarkError } from '@/components/landing/DarkFormPrimitives'
// keep existing supabase import

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // keep handleSubmit verbatim — route to /dashboard on success

  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 60px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Set a new password
          </h1>
        </div>
        <DarkCard>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ marginBottom: 14 }}><DarkError>{error}</DarkError></div>}
            <div style={{ marginBottom: 14 }}>
              <DarkLabel htmlFor="password">New password</DarkLabel>
              <DarkInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <DarkLabel htmlFor="confirm">Confirm password</DarkLabel>
              <DarkInput id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <DarkButton type="submit" block disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </DarkButton>
          </form>
          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13 }}>
            <Link href="/login" style={{ color: '#A8A8BC', textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        </DarkCard>
      </main>
    </PublicShell>
  )
}
```

- [ ] `npm run build`. Commit.

---

## Phase D — `/install`

### Task 11: `/install` page

**Files:** Rewrite `src/app/install/page.tsx`

- [ ] This page explains how to install the mobile/web app to the home screen. Keep the step content; rewrap in `PublicShell` with dark presentation.

```tsx
import PublicShell from '@/components/landing/PublicShell'

const STEPS_IOS = [
  { n: '01', title: 'Open in Safari', body: 'iOS installs PWAs only from Safari. Other browsers won\'t show the install option.' },
  { n: '02', title: 'Tap Share', body: 'Tap the share icon in the Safari bottom bar.' },
  { n: '03', title: 'Add to Home Screen', body: 'Scroll down in the share sheet and tap "Add to Home Screen".' },
]

const STEPS_ANDROID = [
  { n: '01', title: 'Open in Chrome', body: 'Android\'s install prompt works in Chrome and Edge.' },
  { n: '02', title: 'Tap the menu', body: 'Open the three-dot menu top-right.' },
  { n: '03', title: 'Install app', body: 'Tap "Install app" or "Add to Home screen".' },
]

function StepGrid({ label, steps }: { label: string; steps: typeof STEPS_IOS }) {
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#00D97E', margin: 0, marginBottom: 16 }}>
        {label}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {steps.map((s) => (
          <div key={s.n} style={{ padding: 22, backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#00D97E', letterSpacing: '0.18em' }}>{s.n}</span>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#F0F0F5', margin: '10px 0 6px', letterSpacing: '-0.02em' }}>{s.title}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#A8A8BC', margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstallPage() {
  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 80px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '-0.03em', color: '#F0F0F5', margin: 0, fontWeight: 400 }}>
            Install CloseBooks
          </h1>
          <p style={{ fontSize: 17, color: '#A8A8BC', margin: '16px auto 0', maxWidth: 520, lineHeight: 1.55 }}>
            Add CloseBooks to your home screen for one-tap access on iOS and Android.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 40 }}>
          <StepGrid label="iPhone / iPad" steps={STEPS_IOS} />
          <StepGrid label="Android" steps={STEPS_ANDROID} />
        </div>
      </main>
    </PublicShell>
  )
}
```

- [ ] `npm run build`. Commit.

---

## Phase E — Ship

### Task 12: Final build + lint + push

- [ ] `npm run build` — every page compiles clean.
- [ ] `npm run lint` — no new errors.
- [ ] Manual smoke:
  - `/` → click Sign in → lands on dark `/login` with form.
  - `/` → click Start free → lands on dark `/signup` (context pill if query param present).
  - `/` → click Pricing anchor → sees 3-tier grid; click Monthly/Annual toggle.
  - `/pricing` → full 3-tier dark grid loads, Stripe env-var fallback message appears if not configured.
- [ ] `git push origin main` — Vercel auto-deploys.

---

## Self-review

**Spec coverage:**
- §1 (tiers module) → Task 1 ✓
- §2 (PublicShell) → Task 3 ✓
- §3 (PricingTiers) → Task 4 ✓
- §4 (dark form primitives) → Task 2 ✓
- §5 (pages converted) → Tasks 5–11 ✓
- §7 (signup deep-link handling) → Task 8 ✓
- §8 (deletion of PricingTeaser) → Task 5 ✓

**Placeholder scan:** Tasks 7–10 reference "keep handlers verbatim from existing file" — this is an explicit copy-through instruction, not a placeholder. The actual handlers are in the source files and will be preserved intact by the implementer (me).

**Type consistency:** `TierId`, `Tier`, `resolvePriceId` used consistently across tiers.ts, PricingTiers, and /pricing. `PublicShell` signature `{ children }` used identically in every consumer.
