# Design System Adoption Audit

**Date:** 2026-07-06  
**Scope:** Button duplication, component migration ROI, conversion-path analysis, ranked migration order  
**Method:** Static analysis of `src/` via ripgrep + composite scoring. No code modified.

---

## Executive summary

CloseBooks has **no shared Button primitive**. CTA styling is duplicated across **146 files** with forest green (`#2d5a27`) and **47 files** with neon green (`#00C853`). The conversion path breaks at **signup → dashboard**: auth uses `DarkFormPrimitives` (coherent dark kit); dashboard uses 31+ inline forest CTAs on `dashboard/page.tsx` alone.

**Highest-ROI primitive:** `Button` (dark + cream variants) extracted from `DarkFormPrimitives`, unlocking 150+ file migrations.

**Highest-ROI conversion surfaces:** `PricingTiers` → auth pages → `dashboard/page.tsx` → `OnboardingModal` (via layout).

**Defer:** `review/[jobId]/page.tsx` chrome and `TransactionTable` until Phase 4.

---

## 1. Top 20 files — highest button duplication

**Scoring formula:** `(button count × 2) + #2d5a27 refs + #00C853 refs + (DarkButton × 3) + Link-as-CTA count`

Higher score = more inline CTA/button patterns to consolidate.

| Rank | Score | `<button>` | `#2d5a27` | `#00C853` | File | Surface |
|---|---|---|---|---|---|---|
| 1 | 71 | 27 | 17 | 0 | `src/app/dashboard/review/[jobId]/page.tsx` | Review |
| 2 | 56 | 16 | 24 | 0 | `src/app/dashboard/connect/page.tsx` | Dashboard |
| 3 | 46 | 9 | 0 | 28 | `src/app/demo/page.tsx` | Funnel outlier |
| 4 | 43 | 11 | 20 | 0 | `src/app/dashboard/agent/new/page.tsx` | Dashboard |
| 5 | 41 | 13 | 14 | 0 | `src/app/dashboard/1099/page.tsx` | Dashboard |
| 6 | 41 | 5 | 31 | 0 | `src/app/dashboard/page.tsx` | **Conversion** |
| 7 | 40 | 14 | 12 | 0 | `src/app/dashboard/billing/page.tsx` | Dashboard |
| 8 | 39 | 12 | 15 | 0 | `src/components/AdvisoryGenerateModal.tsx` | Modal |
| 9 | 37 | 11 | 15 | 0 | `src/app/dashboard/consolidation/[groupId]/page.tsx` | Dashboard |
| 10 | 36 | 11 | 14 | 0 | `src/app/dashboard/calendar/page.tsx` | Dashboard |
| 11 | 31 | 12 | 7 | 0 | `src/app/dashboard/advisory/page.tsx` | Dashboard |
| 12 | 31 | 7 | 17 | 0 | `src/app/dashboard/tax-strategy/[clientId]/page.tsx` | Dashboard |
| 13 | 31 | 7 | 16 | 0 | `src/app/dashboard/upload/page.tsx` | Dashboard |
| 14 | 30 | 7 | 16 | 0 | `src/app/dashboard/team/page.tsx` | Dashboard |
| 15 | 29 | 9 | 0 | 11 | `src/app/get-started/page.tsx` | Funnel outlier |
| 16 | 29 | 8 | 13 | 0 | `src/components/ChartOfAccountsUpload.tsx` | Component |
| 17 | 29 | 6 | 16 | 0 | `src/app/dashboard/certification/[moduleId]/page.tsx` | Dashboard |
| 18 | 27 | 5 | 0 | 15 | `src/app/directory/[slug]/page.tsx` | Public |
| 19 | 26 | 10 | 6 | 0 | `src/app/dashboard/developers/page.tsx` | Dashboard |
| 20 | 26 | 9 | 8 | 0 | `src/app/dashboard/tax-draft/new/page.tsx` | Dashboard |

### Landing `/` decomposition (page file has 0 buttons)

`src/app/page.tsx` is a composition shell. Button duplication lives in child components:

| Rank | Score | CTAs | File | Notes |
|---|---|---|---|---|
| L1 | 35 | 4× MagneticButton, 18× #00C853 | `components/landing/Hero.tsx` | Primary marketing CTA |
| L2 | 34 | 4× MagneticButton, 2× `<button>` | `components/landing/PricingTiers.tsx` | Shared with `/pricing` |
| L3 | 30 | 4× MagneticButton | `components/landing/Nav.tsx` | Sticky nav CTAs |
| L4 | 22 | 4× MagneticButton | `components/landing/CtaBand.tsx` | Bottom funnel CTA |
| L5 | 17 | 17× #00C853 (no buttons) | `components/landing/HowItWorks.tsx` | Link-styled CTAs |

**Landing `/` aggregate CTA duplication score: 191** across 15 section components.

### Patterns observed

| Pattern | Prevalence | Primitive target |
|---|---|---|
| Inline `<button>` + `backgroundColor: '#2d5a27'` | 146 files | `Button variant="primary"` (cream) |
| Inline `<button>` / Link + `#00C853` | 47 files | `Button variant="brand"` (dark) |
| `DarkButton` | 4 auth files | `Button variant="brand"` |
| `MagneticButton` | 5 files (Hero, PricingTiers, etc.) | `Button` + optional motion wrapper |
| `onMouseEnter` hover color mutation | 30+ files | `Button` CSS `:hover` via tokens |
| Link with inline padding/radius/fill | 40+ files | `Button asChild` + Link |

---

## 2. Highest-ROI components to migrate first

Ranked by **files unlocked ÷ implementation risk ÷ conversion-path impact**.

| Rank | Primitive | Source template | Files unlocked | Risk | ROI rationale |
|---|---|---|---|---|---|
| **1** | `Button` | `DarkFormPrimitives.DarkButton` + dominant `#2d5a27` inline | **150+** | Low | Single highest-volume duplication; unblocks auth, pricing, dashboard |
| **2** | `Input` / `Field` / `Label` | `DarkFormPrimitives` + `settings/page.tsx` `formFieldStyle` | **80+** | Low | Auth already coherent; settings proves cream variant |
| **3** | `PageContainer` | `maxWidth: 1200; padding: 32px 24px` pattern | **60+** | Low | Pure layout; zero behavior risk |
| **4** | `PageHeader` | Dashboard title + action bar | **50+** | Low | Repeated on every dashboard page |
| **5** | `Dialog` | `OnboardingModal.tsx` | **49 modals** | Medium | Shell only first; one modal per PR after |
| **6** | `Badge` | `TransactionRow` StatusPill + `.badge-*` | **39** | Low | Delete orphaned `StatusBadge.tsx` after |
| **7** | `Card` | `.surface-raised` + inline `#fff` cards | **40+** | Low | Visual containment for dashboard |
| **8** | `Toast` | `ActionToast` + `SaveRuleToast` | **10+** | Low | Small file count but high daily-use on review |
| **9** | `Skeleton` | `Skeleton.tsx` + `.cb-skeleton` | **15+** | Low | Unify dual loading patterns |
| **10** | `LinkButton` / `Button asChild` | `MagneticButton`, landing Links | **5 landing + pricing** | Medium | Conversion-path CTAs; preserve MagneticButton motion as opt-in |

### Do not migrate first (negative ROI until primitives exist)

| Component / file | Why defer |
|---|---|
| `TransactionTable.tsx` | Best token adoption; 1,600+ lines; Phase 4 only |
| `review/[jobId]/page.tsx` (full) | 1,995 lines; migrate chrome only in late Phase 3 |
| `Hero.tsx` / `StatBand.tsx` | AAA craft + Framer Motion; Button swap only after dark variant proven |
| `get-started/page.tsx` | 1,200+ lines; conversion-critical; after tokens + Button |
| `connect/page.tsx` | 142 inline styles; developer surface; Wave 3E |

---

## 3. Conversion path analysis

### Path: `/` → `/pricing` → `/signup` → `/dashboard` → `/review`

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  /          │───▶│  /pricing    │───▶│  /signup    │───▶│  /dashboard  │───▶│  /review    │
│  dark neon  │    │  dark neon   │    │  dark neon  │    │  cream forest│    │  dark tokens│
│  MagneticBtn│    │  PricingTiers│    │  DarkButton │    │  inline btns │    │  27 buttons │
│  score: 191*│    │  score: 34   │    │  score: 5** │    │  score: 41   │    │  score: 71  │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘    └─────────────┘
  *child components   **already best    BREAK POINT        first value        power-user
```

### Step-by-step surface audit

#### `/` (landing)

| Metric | Value |
|---|---|
| Page file | Thin composer — 49 lines, 0 buttons |
| Shell | Inline dark wrapper (not `PublicShell`) |
| Primary green | `#00C853` via 15 child components |
| Button kit | `MagneticButton` (Hero, PricingTiers, Nav, CtaBand) + inline Link CTAs |
| Token usage | 0 on page; children use `var(--font-serif)` sporadically |
| DS maturity | **6/10** — polished but not primitive-backed |
| Break risk | Low for Button migration if `MagneticButton` preserved as wrapper |

**Migrate:** `Nav`, `CtaBand`, `PricingTiers` CTAs first. **Defer:** `Hero` full rewrite.

#### `/pricing`

| Metric | Value |
|---|---|
| Page file | 108 lines, 0 buttons — delegates to `PricingTiers` |
| Shell | `PublicShell` ✓ |
| Primary green | `#00C853` (2 refs on page, 10 in PricingTiers) |
| Button kit | `PricingTiers`: MagneticButton + billing toggle buttons |
| DS maturity | **7/10** — shell coherent; CTAs duplicated |
| Break risk | Low — contained in one component |

**Migrate:** `PricingTiers.tsx` single PR unlocks `/pricing` + landing `PricingSection`.

#### `/signup` (+ `/login`)

| Metric | Value |
|---|---|
| Page file | 366 / 216 lines |
| Shell | `PublicShell` ✓ |
| Button kit | `DarkButton` × 5, `DarkInput`, `DarkCard` ✓ |
| Primary green | `#00C853` via DarkFormPrimitives |
| Token usage | `var(--font-serif)` minimal |
| DS maturity | **8/10** — best adoption on conversion path |
| Break risk | Very low — swap import path only |

**Migrate:** First consumer after primitive gallery. Pixel-identical `Button` + `Input` re-export.

#### `/dashboard`

| Metric | Value |
|---|---|
| Page file | 1,138 lines — heaviest conversion landing |
| Shell | `dashboard/layout.tsx` — cream `#faf8f4`, `page-content` animation |
| Primary green | `#2d5a27` × 31 |
| Inline styles | 117 `style={{` blocks |
| Button kit | None — 5 raw `<button>` + Link-styled CTAs |
| Modals | `OnboardingModal` via layout (first visit) |
| DS maturity | **3/10** — largest visual discontinuity post-signup |
| Break risk | Medium — high traffic, many hover handlers |

**Migrate:** `PageContainer` + `PageHeader` first, then primary CTAs. One section per PR.

#### `/review` (`/dashboard/review/[jobId]`)

| Metric | Value |
|---|---|
| Page file | 1,995 lines |
| Shell | `data-theme="dark"` wrapper — token-forward |
| Buttons | 27 `<button>` elements |
| Forest green | 17 `#2d5a27` (chrome/CTAs outside table) |
| Token usage | 4 `var(--` on page; `TransactionTable`/`TransactionRow` heavily tokenized |
| DS maturity | **5/10** — bifurcated (table 8/10, page chrome 3/10) |
| Break risk | **High** — core product workflow |

**Migrate:** Page chrome and action bar only. **Do not touch** `TransactionTable` until `DataTable` primitive (Phase 4).

### Conversion-path continuity gaps

| Transition | Visual break | Root cause |
|---|---|---|
| `/` → `/pricing` | Minimal | Both dark neon; shared `PricingTiers` |
| `/pricing` → `/signup` | Minimal | Both `PublicShell` + dark forms |
| **`/signup` → `/dashboard`** | **Severe** | Neon dark → cream forest; different button kit |
| `/dashboard` → `/review` | Moderate | Cream → dark review theme (intentional but abrupt) |

---

## 4. Ranked migration order

### Tier 0 — Primitives (must ship before page migrations)

| Order | Deliverable | Unlocks |
|---|---|---|
| 0.1 | `Button` — `brand` (dark/neon) + `primary` (cream/forest) + `secondary` + `ghost` | Auth, pricing, landing CTAs, dashboard |
| 0.2 | `Input`, `Label`, `Field`, `FieldError` | Auth, settings |
| 0.3 | `PageContainer`, `PageHeader` | All dashboard pages |
| 0.4 | `Dialog` shell | OnboardingModal, UpgradeModal |
| 0.5 | `Badge` | Status pills across dashboard |
| 0.6 | Internal `/dashboard/developers` style gallery | QA parity |

### Tier 1 — Conversion path (highest business impact)

| Order | Target | PRs est. | Rationale |
|---|---|---|---|
| 1.1 | `(auth)/login/page.tsx` | 1 | Lowest risk; proves dark Button + Input |
| 1.2 | `(auth)/signup/page.tsx` | 1 | Conversion gate; same kit as login |
| 1.3 | `(auth)/forgot-password/page.tsx` | 1 | Completes auth cluster |
| 1.4 | `components/landing/PricingTiers.tsx` | 1 | Unlocks `/pricing` + landing pricing section |
| 1.5 | `components/landing/Nav.tsx` + `CtaBand.tsx` | 2 | Top/bottom funnel CTAs on `/` |
| 1.6 | `app/pricing/page.tsx` | 1 | Token swap on shell padding only (thin) |
| 1.7 | `dashboard/layout.tsx` | 1 | `--surface-canvas` on cream background |
| 1.8 | `components/OnboardingModal.tsx` → `Dialog` | 1 | First dashboard load experience |
| 1.9 | `app/dashboard/page.tsx` — **header + primary CTAs only** | 2–3 | Biggest signup→value break; section splits |
| 1.10 | `components/UpgradeModal.tsx` → `Dialog` | 1 | Pairs with onboarding |

### Tier 2 — Core product workflows

| Order | Target | Rationale |
|---|---|---|
| 2.1 | `app/dashboard/clients/page.tsx` | High traffic post-dashboard |
| 2.2 | `app/dashboard/upload/page.tsx` | Onboarding adjacent |
| 2.3 | `app/dashboard/settings/page.tsx` | Cream form reference (`formFieldStyle`) |
| 2.4 | `components/Sidebar.tsx` + `TopBar.tsx` | Chrome token adoption |
| 2.5 | `app/dashboard/billing/page.tsx` | Revenue surface |
| 2.6 | `review/*` toasts + modals (`SplitModal`, `ActionToast`) | Isolated review components |
| 2.7 | `review/[jobId]/page.tsx` — **chrome only** | Not TransactionTable |

### Tier 3 — Long tail (by button duplication score)

| Order | Target |
|---|---|
| 3.1 | `dashboard/connect/page.tsx` (score 56) |
| 3.2 | `dashboard/billing/page.tsx` (score 40) |
| 3.3 | `dashboard/1099/page.tsx` (score 41) |
| 3.4 | `dashboard/agent/new/page.tsx` (score 43) |
| 3.5 | `AdvisoryGenerateModal.tsx` (score 39) |
| 3.6 | Remaining dashboard pages by traffic |

### Tier 4 — Deferred (explicit do-not-migrate-until-end)

| Target | Reason |
|---|---|
| `TransactionTable.tsx` | DataTable primitive; Phase 4 |
| `review/[jobId]/page.tsx` full rewrite | After table + Dialog proven |
| `Hero.tsx`, `StatBand.tsx`, `TrustSection.tsx` | AAA + motion |
| `get-started/page.tsx` | 1,200+ lines; after Button + tokens |
| `demo/page.tsx` | Funnel outlier; score 46 but not main path |

---

## 5. Recommended next 5 PRs (post token foundation PRs 1–4)

| PR | Concern | File(s) | Conversion impact |
|---|---|---|---|
| 5 | `src/design-system/tokens/index.ts` | 1 new file | Enables JS migrations |
| 6 | `Button` primitive + gallery | 2–3 new files | Foundation |
| 7 | `login/page.tsx` → Button | 1 consumer | Auth proof |
| 8 | `signup/page.tsx` → Button | 1 consumer | Conversion proof |
| 9 | `PricingTiers.tsx` → Button | 1 consumer | Pricing + landing proof |

---

## 6. Success metrics (conversion path)

Track after each Tier 1 migration:

| Metric | Current | Target after Tier 1 |
|---|---|---|
| Auth pages using primitives | 0% (DarkFormPrimitives) | 100% |
| `/pricing` CTA via Button | 0% | 100% |
| `dashboard/page.tsx` forest hex refs | 31 | < 10 |
| Conversion path visual dialects | 3 (dark neon, cream forest, review dark) | 2 (documented intentional) |
| Signup→dashboard button style continuity | Broken | Partial (shared radius/hover/focus) |

---

## References

- [Color architecture](./color-architecture.md)
- [Migration roadmap](./migration-roadmap.md)
- [Design token strategy](./design-token-strategy.md)
