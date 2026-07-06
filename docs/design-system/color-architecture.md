# Color Architecture

Documents the **current** color system as it exists in the codebase. This is descriptive, not prescriptive — **final brand color selection is a future product/design decision** and is intentionally not locked here.

---

## Executive summary

CloseBooks today uses **two distinct primary greens** plus a warm cream palette. They were not assigned semantic roles in code — they simply coexist. This reads as two products stitched together, especially on the marketing → dashboard transition.

| Hex | Name (informal) | Tokenized? | Occurrences |
|---|---|---|---|
| `#00C853` | Neon / marketing green | Yes — `--color-accent`, `--accent`, `--ring-focus` | **280** refs, **~48** files |
| `#2d5a27` | Forest / dashboard green | **No dedicated token** | **837** refs, **~120** files |

The forest green is **3× more prevalent** in the codebase but **less represented in the token layer**.

---

## `#00C853` — Neon green

### Token mapping (today)

```css
/* globals.css */
--color-accent:  #00C853;
--accent:        #00C853;
--ring-focus:    #00C853;
--color-accent-dark: #009640;
```

Dark theme (`[data-theme="dark"]`) keeps `--accent: #00C853`. Selection highlight on dark surfaces also uses `#00C853`.

### Where it is used

| Surface | Files / areas | Role |
|---|---|---|
| **Marketing landing** | `components/landing/*` (19 files) — Hero, Nav, StatBand, PricingTiers, TrustSection, DarkFormPrimitives, etc. | Primary CTA fills, accent text, focus rings, badge shimmer |
| **Auth** | `(auth)/login`, `signup`, `forgot-password` | Via `DarkFormPrimitives` focus border and primary buttons |
| **Demo / funnel** | `app/demo/*`, `app/get-started/page.tsx` | Accent in local `COLORS` object and inline styles |
| **Dashboard chrome** | `Sidebar.tsx`, `TopBar.tsx` | Active nav indicator, accent highlights on dark chrome |
| **Public pages** | `pricing`, `pilot`, `directory`, `connect`, `cpa-council`, legal pages | Scattered accent usage |
| **Global** | `globals.css`, `layout.tsx`, `manifest.ts` | Theme-color meta, focus-visible outline |

### Character

- High saturation, fintech/SaaS marketing energy
- Pairs with dark backgrounds (`#080808`, `#0f0f0f`)
- Used with Instrument Serif display type on landing

---

## `#2d5a27` — Forest green

### Token mapping (today)

**None.** This value is hardcoded inline across the dashboard. The closest semantic token is `--color-accent` (`#00C853`), which is a **different color**.

### Where it is used

| Surface | Files / areas | Role |
|---|---|---|
| **Dashboard pages** | `app/dashboard/**` (**76** file paths) | Primary buttons, links, progress bars, chart series, active states |
| **Dashboard components** | `OnboardingModal`, `InvoiceGenerateModal`, `DocumentRequestModal`, `TrialBanner`, `VerifiedBadge`, charts, copilot cards | CTA and status emphasis |
| **Connect / docs** | `app/connect/page.tsx`, `connect/docs/page.tsx` | Developer-facing CTAs on cream backgrounds |
| **Portal (partial)** | `portal/ActionChecklist.tsx`, `portal/[token]/page.tsx` | Action buttons |
| **API / email** | `api/report/route.ts`, `api/client-email/route.ts`, `lib/portal/notify.ts` | HTML email and report templates |
| **Firm defaults** | `lib/firmSettings.ts` | Default `primaryColor` when firm has not customized |

### Character

- Muted, professional, accounting-trust tone
- Pairs with cream background (`#faf8f4`) and ink text (`#1a1714`)
- Dominant action color for day-to-day product work

---

## Supporting palette (shared)

These colors are more consistently tokenized and cross both surfaces:

| Token | Hex | Usage |
|---|---|---|
| `--color-paper` / `--surface-base` | `#faf8f4` | Dashboard canvas, body background |
| `--color-ink` / `--text-primary` | `#1a1714` | Primary text |
| `--color-ink-muted` / `--text-secondary` | `#6b6560` | Secondary text |
| `--color-border` | `#e0dbd4` | Borders (but `#e8e0d4` also used — see below) |
| `--color-copper` / `--warning` | `#b8734a` | Warnings; dark theme flips to `#F59E0B` |
| `--color-sand` | `#f0ece4` | Scrollbar track, elevated surfaces |
| Dark surfaces | `#080808`, `#0f0f0f`, `#141414`, `#1f1f1f` | Marketing, get-started, `[data-theme="dark"]` |

### Known border duplication

`#e0dbd4` (`--color-border`) and `#e8e0d4` (`--color-warm`) are used interchangeably as card borders. Not a brand issue, but a token hygiene issue.

---

## Visual discontinuity map

```
Marketing (/)          Auth (/login)         Dashboard (/dashboard)      Portal (/portal)
─────────────────────────────────────────────────────────────────────────────────────
bg: #080808            bg: #080808           bg: #faf8f4                 bg: #ffffff
accent: #00C853        accent: #00C853       action: #2d5a27             mixed / firm
type: Serif + Inter    type: Inter           type: Inter only            type: Inter
chrome: dark           chrome: dark          chrome: dark sidebar        light header
```

**Primary break:** User completes signup on dark neon → lands on cream forest. No shared components bridge the transition.

**Secondary break:** Portal uses cool grays (`#9ca3af`) in places, not the warm ink palette.

---

## Firm branding (partial)

`firm_settings` supports `primaryColor`, `accentColor`, `logoUrl`. `BrandingSettings.tsx` defaults `primaryColor` to `#2d5a27`.

| Consumer | Reads firm colors? |
|---|---|
| Portal shell / emails | Partial |
| Dashboard chrome | Hardcoded CloseBooks colors |
| Marketing | Hardcoded `#00C853` |

White-label promise is undermined by hardcoded chrome on firm-facing surfaces.

---

## Migration considerations

### Do not unify colors in early PRs

Token PRs must **alias current values**, not pick a winner. Introduce role-based names that map to today's reality:

```css
/* Future — illustrative only, not implemented */
--color-brand:  #00C853;  /* maps to current marketing token */
--color-action: #2d5a27;  /* maps to current dashboard CTA */
```

This documents roles without changing pixels. Final unification (if ever) is a **Phase 4 product decision** with explicit visual change approval.

### Hex → var swap priority

1. Forest green `#2d5a27` → `var(--color-action)` (dashboard CTAs) — highest volume
2. Neon green `#00C853` → `var(--color-brand)` (already partially tokenized as `--accent`)
3. Border dedup `#e8e0d4` / `#e0dbd4` → `var(--border-default)`
4. Overlay scrims → `var(--overlay-scrim)`

### Surfaces that must not change color during migration

| Surface | Reason |
|---|---|
| `TransactionTable` / review | Best token adoption; don't touch until DataTable primitive |
| Landing Hero / StatBand / TrustSection | AAA craft; color tied to motion |
| `get-started` | Conversion-critical; token-alias only, no rebrand |
| Portal with custom `firm_settings` | Must respect firm `primaryColor` |

### Options for future product/design decision

| Option | Tradeoff |
|---|---|
| **A. Single neon (`#00C853`)** | Unified fintech brand; all dashboard CTAs visually change |
| **B. Single forest (`#2d5a27`)** | Unified accounting trust; all marketing CTAs visually change |
| **C. Dual roles (brand + action)** | No visual change; requires documenting two primaries indefinitely |
| **D. Contextual theme** | Marketing = neon, product = forest, explicitly designed as intentional split |

**Status: UNDECIDED.** Migration proceeds with Option C-style aliasing (preserve both) until product leadership approves A, B, or D.

---

## Color-related component duplication

| Concern | Implementations | Colors used |
|---|---|---|
| Status badges | `StatusBadge.tsx` (orphaned), local badges in 8+ pages, `TransactionRow` StatusPill, `.badge-*` in CSS | Tailwind pastels, inline hex, CSS vars |
| Primary buttons | `DarkButton`, inline dashboard buttons, Tailwind sporadic | `#00C853` vs `#2d5a27` |
| Focus rings | `:focus-visible` in globals, `onFocus` mutation in DarkFormPrimitives | `#00C853` / `rgba(0,200,83,0.18)` |
| Charts | `SpendComparisonChart`, `TaxProjectionChart`, `PipelineViz`, `BenchmarkGauge` | Mixed `#2d5a27` and `#00C853` series |

---

## References

- Token definitions: `src/app/globals.css` lines 8–76
- Firm color defaults: `src/lib/firmSettings.ts`
- Branding UI: `src/components/settings/BrandingSettings.tsx`
- Dark form accent: `src/components/landing/DarkFormPrimitives.tsx`
- Get-started local palette: `src/app/get-started/page.tsx` (`COLORS` constant)
