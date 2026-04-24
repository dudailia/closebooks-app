# Public Pages Dark Consistency + 3-Tier Pricing

**Date:** 2026-04-23
**Status:** Approved
**Goal:** Restore the 3-tier pricing that already exists in Stripe/env across the landing and `/pricing` page, and migrate the critical public-facing pages to the same dark design as the landing — so clicking Sign in / Start free / Pricing doesn't jump from dark to cream.

---

## 1. Shared tiers module

**New:** `src/lib/landing/tiers.ts`

Single source of truth for marketing pricing display. Mirrors (does not duplicate) the Stripe-integrated data in `src/app/pricing/page.tsx`.

```ts
export type TierId = 'starter' | 'professional' | 'enterprise'

export interface Tier {
  id: TierId
  name: string
  tagline: string
  monthly: number       // USD
  clients: string
  users: string
  features: string[]
  popular?: boolean
}

export const TIERS: Tier[] = [
  { id: 'starter',      name: 'Starter',      tagline: '…',  monthly: 49,  clients: '10 clients',        users: '1 seat',           features: [...] },
  { id: 'professional', name: 'Professional', tagline: '…',  monthly: 149, clients: '50 clients',        users: '5 seats',          features: [...], popular: true },
  { id: 'enterprise',   name: 'Enterprise',   tagline: '…',  monthly: 349, clients: 'Unlimited clients', users: 'Unlimited seats',  features: [...] },
]

export function priceEnvKey(tier: TierId, annual: boolean): string { … }
export function annualTotal(monthly: number): number { return Math.round(monthly * 0.8 * 12) }
```

Stripe env-var mapping + checkout logic remains in `/pricing` page.

---

## 2. `PublicShell` wrapper

**New:** `src/components/landing/PublicShell.tsx`

One element to wrap any public page with the landing's dark theme, Nav, and Footer.

```tsx
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#F0F0F5' }}>
      <Nav />
      {children}
      <Footer />
    </div>
  )
}
```

Every public page that wants the dark design wraps its content in `<PublicShell>`. The landing stays as-is (it already renders Nav/Footer directly — no need to refactor).

---

## 3. `PricingTiers` grid

**New:** `src/components/landing/PricingTiers.tsx`

Shared by the landing and `/pricing`. Props:

```ts
interface Props {
  variant?: 'landing' | 'pricing'   // 'landing' omits the Stripe checkout flow; just routes to /signup
  showToggle?: boolean              // default true
  annualDefault?: boolean           // default false
}
```

- Monthly/Annual segmented toggle at the top (same UI as current `/pricing` page but dark).
- 3-column card grid (1 column on mobile). Professional card gets electric-green accent ring and "Most popular" badge.
- Each card: name pill, huge serif price, `/yr` or `/mo` suffix, 20% off callout when annual, `clients · users` sub, tagline line, checkmark features list, CTA.
- Card CTA:
  - `landing` variant → link to `/signup?plan=<id>&billing=<monthly|annual>`.
  - `pricing` variant → inline email input + "Subscribe" button that calls `/api/stripe/checkout` (port existing logic from current `/pricing` page).

---

## 4. Dark form primitives

**New:** `src/components/landing/DarkFormPrimitives.tsx`

Exports the four primitives used by every form:

- `DarkCard` — `#111118` bg, 1px `rgba(255,255,255,0.07)` border, 24–28px padding, 16px radius.
- `DarkInput` — `rgba(255,255,255,0.04)` bg, `rgba(255,255,255,0.1)` border, on focus border → `var(--accent)`, shadow ring `rgba(0,217,126,0.18)`.
- `DarkLabel` — small uppercase 11px label in `var(--text-tertiary)`.
- `DarkButton` — `primary` (accent gradient, black text) and `ghost` (transparent with border).

Used across login, signup, forgot-password, reset-password, install, and the pricing checkout input.

---

## 5. Pages converted this round

All **rebuilt in place** (same file paths, same auth logic, new presentation):

| Page | What changes |
|---|---|
| `/` (landing) | Replace `PricingTeaser` with `PricingTiers variant="landing"` |
| `/pricing` | Wrap in `PublicShell`; render `PricingTiers variant="pricing"`; keep Stripe checkout logic but move it inside `PricingTiers` |
| `/login` | `PublicShell` + dark form primitives; keep every Supabase call unchanged |
| `/signup` | `PublicShell` + dark form + handling of `?plan=<id>&billing=<…>` from landing |
| `/forgot-password` | `PublicShell` + dark form |
| `/reset-password` | `PublicShell` + dark form |
| `/install` | `PublicShell`; rebuild the install-guide UI in dark |

## 6. Pages deliberately NOT touched this round (YAGNI / scope)

`/demo` (722 lines, heavy product-tour state), `/directory`, `/cpa-council`, `/get-started`, `/ref/[slug]`, `/tools/roi-calculator`, `/portal/*`, `/auth/*` (callback/reset-password handlers that never render UI), dashboard interior.

These can be converted in a future round by just wrapping them in `PublicShell` — the infrastructure is now in place.

## 7. Signup deep-link handling

When landing's pricing CTA routes to `/signup?plan=professional&billing=annual`:

- Signup reads both query params.
- Shows a small context pill above the form: "Starting **Professional** plan · Annual (20% off)".
- Passes those values into the post-signup checkout redirect so the user lands in Stripe for the right price.

---

## 8. Deletions

- `src/components/landing/PricingTeaser.tsx` — replaced by `PricingTiers`.

## 9. What stays unchanged

- Stripe backend (`/api/stripe/*`), env variable names, `lib/plans.ts`, `subscriptionTypes.ts`.
- Dashboard routes (except the review page, which already has dark treatment).
- The existing `DashboardNav` / `AppFooter` — still used by dashboard pages.

## 10. Testing strategy

- `npm run build` after each phase.
- Smoke: load `/`, click Sign in → land on `/login` (dark, form renders). Click Start free → land on `/signup?plan=` → see context pill. Click Pricing → 3-tier dark grid. Toggle monthly/annual.
- Verify no visual jump between landing ↔ auth ↔ pricing.

## 11. Rollout

Single branch → main → Vercel.
