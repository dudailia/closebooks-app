# CloseBooks Design System — Master Roadmap

**Status:** Living document — single source of truth for every design-system PR  
**Owner:** Design Systems Architecture  
**Last updated:** 2026-07-07  
**Audience:** Engineering, design, product

> Every design-system pull request must reference this document. If work is not traceable to a layer, primitive, shell, or migration wave defined here, it does not ship.

---

## 1. Executive Vision

### What CloseBooks Design System (CBDS) is

CBDS is the **shared engineering and visual contract** for all CloseBooks surfaces — marketing, auth, dashboard, review, portal, and developer tools. It is not a Figma file, not a Tailwind config, and not a loose collection of CSS variables. It is a **layered product architecture** where:

- **Tokens** encode brand, semantics, and accessibility.
- **Primitives** are the smallest interactive UI units.
- **Composites** assemble primitives into reusable patterns.
- **Business components** encode accounting-domain semantics once.
- **Shells** own layout, navigation, and cross-cutting chrome.
- **Pages** compose shells + patterns; they do not invent UI.

CBDS is optimized for **accounting SaaS**: dense data tables, financial numerals, audit trails, approval workflows, firm white-labeling, and dual user modes (firm staff vs. client portal). It borrows the **engineering discipline** of Stripe, Linear, Vercel, Notion, Shopify Polaris, and GitHub Primer — without copying their visual identity.

### Long-term principles

| Principle | Meaning |
|---|---|
| **One concern per PR** | Token, primitive, composite, shell, or page migration — never mixed. |
| **Strangler fig** | New system lives alongside old; delete only at zero callers. |
| **Pixel parity during migration** | Adoption must not change computed styles unless explicitly approved. |
| **Semantic over literal** | Components read roles (`--color-action-primary`), not hex. |
| **Accessibility is not optional** | WCAG 2.2 AA is the floor; keyboard and screen reader support ship with v1 of every primitive. |
| **Accounting-grade density** | Data surfaces prioritize scannability, monospace amounts, and compact controls — not marketing whitespace. |
| **Firm-aware theming** | Portal and emails consume `firm_settings`; chrome respects white-label contracts. |
| **Dark where intentional** | Marketing/auth/review use dark tokens; dashboard content stays cream unless product approves otherwise. |
| **No orphan craft** | If it is not in the gallery, it is not a primitive. |

### Success criteria

| Metric | Baseline (2026-07) | Target (complete) |
|---|---|---|
| Hex literals in `src/` | 10,376 | < 500 (documented exceptions only) |
| Files with hardcoded hex | 273 | < 30 |
| `var(--*)` token adoption | 687 refs | > 8,000 refs |
| Independent modal implementations | 49 | 0 (all via `Dialog`/`Drawer`) |
| Independent button implementations | 150+ files | 0 (all via `Button`) |
| Primitive gallery coverage | 1 / 28 | 28 / 28 |
| Conversion path on primitives | Login partial | `/` → pricing → signup → dashboard → review |
| Design system maturity | 3 / 10 | 8 / 10 |
| New feature UI from primitives only | 0% | 100% (enforced by lint) |

---

## 2. Architecture

### Layer hierarchy

```
Design Tokens          ← globals.css + firm theme overrides
        ↓
Primitives             ← Button, Input, Dialog, Badge…
        ↓
Composite Components   ← StatCard, FilterBar, CommandPalette…
        ↓
Business Components    ← TransactionRow, CloseProgress, AuditTrail…
        ↓
Page Patterns          ← ListPage, DetailPage, ReviewLayout, WizardStep…
        ↓
Application Shells     ← DashboardShell, PortalShell, MarketingShell…
        ↓
Pages                  ← route files; composition only
        ↓
Flows                  ← multi-page journeys (signup → onboard → first close)
```

### Layer responsibilities

#### Design Tokens

**Owns:** Color, typography, spacing, radius, shadow, elevation, z-index, motion, breakpoints.  
**Does not own:** Component structure, business logic, layout grids.  
**Source of truth:** `src/app/globals.css` (`:root`, `[data-theme="dark"]`, future `[data-firm]`).  
**Rule:** Tokens are additive aliases first; never change computed values during alias PRs.

#### Primitives

**Owns:** Single UI element API, all visual states, accessibility, keyboard interaction.  
**Does not own:** Domain copy, data fetching, routing, firm-specific business rules.  
**Location:** `src/design-system/primitives/` (target); interim `src/components/ui/`.  
**Rule:** A primitive must render identically whether on cream, dark, or firm-branded surfaces via tokens + variants.

#### Composite Components

**Owns:** Reusable multi-primitive patterns with **no accounting domain knowledge**.  
**Does not own:** Transaction status semantics, GL codes, client health scoring.  
**Location:** `src/design-system/composites/`.  
**Example:** `StatCard` shows a label + value + delta — not *whose* revenue it is.

#### Business Components

**Owns:** Accounting-domain UI reused across 2+ pages.  
**Does not own:** Page layout, routing, API calls (receive data via props).  
**Location:** `src/design-system/business/` or migrated `src/components/<domain>/`.  
**Example:** `TransactionRow` knows `approved | pending | flagged`; `StatCard` does not.

#### Page Patterns

**Owns:** Recurring page skeletons — header + toolbar + body + empty/loading/error states.  
**Does not own:** Shell chrome (sidebar), global modals, auth guards.  
**Examples:** `ListPage`, `DetailPage`, `SplitPanePage`, `WizardPage`.

#### Application Shells

**Owns:** Persistent chrome, nav, theme context, max-width contracts, skip links.  
**Does not own:** Page content, feature modals.  
**Examples:** `DashboardShell`, `PortalShell`.

#### Pages

**Owns:** Route-level data loading, feature composition, URL state.  
**Does not own:** Inline hex, custom buttons, one-off modals.  
**Rule:** A migrated page imports primitives/composites/business components only.

#### Flows

**Owns:** Cross-page continuity — visual and interaction consistency across a user journey.  
**Examples:** Conversion (`/` → signup → dashboard), first close (upload → review → complete), client portal onboarding.

---

## 3. Primitive Inventory

**Status key:** `—` Not started · `◐` In progress · `✓` Complete  
**Priority key:** P0 (blocking) · P1 (high) · P2 (medium) · P3 (low)

### Form & input

| Primitive | Purpose | Dependencies | Status | Priority |
|---|---|---|---|---|
| **Button** | All clickable actions and submit controls | Tokens, motion | ◐ PR5–6: `primary/secondary/ghost/danger/brand/brand-ghost`; login migrated | P0 |
| **Input** | Single-line text, email, password, number | Label, Field, tokens | ✓ PR 7 — gallery only | P0 |
| **Textarea** | Multi-line text entry | Label, Field, tokens | — inline only | P1 |
| **Select** | Native and custom single-select | Label, Field, Popover, tokens | — `DarkSelect` exists, not extracted | P1 |
| **Checkbox** | Boolean multi-select in forms and tables | Label, Field, tokens | — native `accent-color` only | P1 |
| **Radio** | Exclusive selection in small sets | Label, Field, tokens | — not implemented | P2 |
| **Switch** | Boolean toggle (settings, feature flags) | Label, tokens | — not implemented | P2 |
| **Label** | Accessible form labels, eyebrows | Typography tokens | ✓ PR 7 — gallery only | P0 |
| **Field** | Label + control + hint + error wrapper | Label, Input, tokens | ✓ PR 7 — gallery only | P0 |

### Display & feedback

| Primitive | Purpose | Dependencies | Status | Priority |
|---|---|---|---|---|
| **Badge** | Status pills, counts, tags | Color status tokens | ✓ PR 10 — gallery only | P0 |
| **Avatar** | User/client/firm initials or image | Tokens | — not implemented | P2 |
| **Icon** | Consistent SVG icon set (replace emoji) | Tokens | — emoji throughout portal/demo | P1 |
| **Card** | Grouped content surface | Surface, shadow, radius tokens | ✓ PR 8 — gallery only | P0 |
| **Spinner** | Inline loading indicator | Motion tokens | — `animate-spin` ad hoc | P1 |
| **Skeleton** | Placeholder loading shapes | Motion tokens | ◐ `Skeleton.tsx` + `.cb-skeleton` dual system | P1 |
| **Toast** | Ephemeral notifications | Dialog z-index, motion | — 3 independent implementations | P1 |

### Overlay & navigation

| Primitive | Purpose | Dependencies | Status | Priority |
|---|---|---|---|---|
| **Dialog** | Modal: focus trap, scrim, close | Z-index tokens, motion | ✓ PR 9 — gallery only | P0 |
| **Drawer** | Side panel overlay | Dialog, z-index | — `HistoryDrawer` is reference | P1 |
| **Popover** | Anchored floating content | Z-index, Button | — `InlineCategoryPicker`, `HealthPill` | P1 |
| **Tooltip** | Hover/focus supplementary text | Popover, a11y | — not implemented | P2 |
| **DropdownMenu** | Action menu from trigger | Popover, Button | — `NotificationBell`, ad hoc menus | P1 |
| **Tabs** | Section switching within a page | Tokens, keyboard roving | — inline tab bars per page | P2 |
| **Breadcrumb** | Hierarchy navigation | Typography tokens | — not implemented | P3 |
| **Pagination** | Table/list page navigation | Button, tokens | — inline per table | P2 |

### Data & layout

| Primitive | Purpose | Dependencies | Status | Priority |
|---|---|---|---|---|
| **Table** | Accessible data table primitives | Typography, Badge, tokens | — `TransactionTable` is reference (Phase 4) | P0 |
| **PageHeader** | Title + description + actions row | Typography, Button | ✓ PR 11 — gallery only | P0 |
| **PageContainer** | Max-width + horizontal padding contract | Spacing tokens | ✓ PR 11 — gallery only | P0 |

---

## 4. Composite Components

Business-neutral assemblies. Built **only** from primitives. Each ships with gallery entry.

| Component | Purpose | Primitives used | Status | Priority |
|---|---|---|---|---|
| **StatCard** | KPI label + value + optional delta | Card, Badge, typography | — `dashboard/page.tsx` inline tiles | P1 |
| **MetricCard** | Compact metric with sparkline slot | Card, Skeleton | — radar/analytics inline | P2 |
| **ClientCard** | Firm client summary in lists | Card, Badge, Avatar | — `FirmCard` partial overlap | P1 |
| **DocumentCard** | File metadata + status + actions | Card, Badge, Button | — `VaultDocumentCard`, `InboxDocumentCard` | P1 |
| **ActivityFeed** | Chronological event list | Card, Badge, Icon | — `ActivityFeed.tsx` monolith | P2 |
| **Timeline** | Step/progress vertical timeline | Card, Badge | — upload wizard, certification inline | P2 |
| **SearchBar** | Search input + clear + shortcut hint | Input, Button, Icon | — `VaultSearchBar` | P2 |
| **CommandPalette** | Keyboard command surface | Dialog, Input, List | ◐ `review/CommandPalette.tsx` not primitive-backed | P1 |
| **SectionHeader** | In-page section title + optional action | Typography, Button | — duplicated per dashboard section | P1 |
| **FilterBar** | Filter chips + search + sort | Button, Badge, DropdownMenu | — clients, vault, inbox inline | P1 |
| **DataGridToolbar** | Bulk actions + selection count + filters | Button, Badge, FilterBar | — `BulkActionBar` partial | P1 |
| **ReviewPanel** | Side panel for detail inspection | Drawer, Card, Field | — review history drawer pattern | P2 |
| **EmptyState** | Zero-data illustration + CTA | Card, Button, Icon | ✓ PR 11 — gallery only | P1 |
| **ErrorState** | Recoverable error display | Card, Button | — `ErrorBoundary` partial | P2 |
| **ConfirmDialog** | Delete/destructive confirmation | Dialog, Button | — inline in `TransactionTable` | P1 |

---

## 5. Business Components

Accounting-domain components. Built from primitives + composites. **Never** contain hardcoded hex.

| Component | Purpose | Current location | Status | Priority |
|---|---|---|---|---|
| **TransactionRow** | Single transaction in review queue | `TransactionRow.tsx` | ◐ Token-migrated; not primitive-backed | P0 |
| **ConfidenceBadge** | AI confidence % display | Inline in `TransactionRow` | ◐ Partial | P1 |
| **ReviewQueue** | Filterable transaction list container | `TransactionTable.tsx` | — monolith | P0 |
| **CloseProgress** | Period close completion indicator | `dashboard/page.tsx`, portal | — duplicated | P1 |
| **BankFeed** | Bank transaction import list | `bank-rec/*` | — domain-specific | P2 |
| **ExceptionCard** | Autopilot exception with actions | `autopilot/ExceptionCard.tsx` | — standalone | P2 |
| **AuditTrail** | Immutable action history | settings/audit-log, review history | — duplicated | P2 |
| **AIReasoningCard** | AI explanation for categorization | `ai/NarrativeInsight.tsx` | — standalone | P2 |
| **ApprovalBanner** | Bulk approval summary / undo | `review/BulkActionBar`, toasts | — fragmented | P1 |
| **ClientHealthCard** | Health score + signals | `health/HealthPill`, radar cards | — fragmented | P2 |
| **DocumentPreview** | PDF/image preview panel | vault, inbox pages | — duplicated | P2 |
| **InvoiceCard** | Invoice summary tile | `InvoiceCard.tsx` | — standalone | P2 |
| **ReconciliationPair** | Matched bank/book pair row | `bank-rec/MatchedPairs.tsx` | — standalone | P3 |
| **CategoryPicker** | Inline GL category selection | `review/InlineCategoryPicker.tsx` | — standalone | P1 |
| **FirmBrandingPreview** | White-label settings preview | `BrandingSettings.tsx` | — standalone | P2 |

---

## 6. Shell Architecture

### Shell inventory

| Shell | Routes | Theme | Responsibility |
|---|---|---|---|
| **MarketingShell** | `/`, `/pricing`, `/pilot`, legal pages | `[data-theme="dark"]`, `[data-surface="public"]` | Nav, footer, public type scale, SEO meta, conversion CTAs |
| **AuthShell** | `/login`, `/signup`, `/forgot-password` | Dark via `PublicShell` today | Centered card layout, minimal chrome, OAuth + form |
| **DashboardShell** | `/dashboard/**` | Cream content + dark sidebar/topbar | Sidebar, TopBar, trial banners, upgrade modal host, `page-content` motion |
| **PortalShell** | `/portal/[token]/**` | Firm-branded light | Client nav, firm logo/colors, no CloseBooks branding |
| **ReviewShell** | `/dashboard/review/[jobId]` | Dark content island on dashboard chrome | Full-height review layout, keyboard shortcut context, review z-index stack |
| **DemoShell** | `/demo/**`, `/get-started` | Custom dark (outlier) | **Migrate to MarketingShell or dedicated contract** — today breaks continuity |
| **DeveloperShell** | `/dashboard/developers`, `/dashboard/design-system` | Cream / docs | API keys, docs, primitive gallery, internal tools |

### Shared layout contracts

Every shell must expose:

| Contract | Token / value |
|---|---|
| Canvas background | `--surface-canvas` |
| Content max-width | `--page-max-width` (to be tokenized; today 960–1200px scatter) |
| Horizontal padding | `--page-padding-x` (to be tokenized; today 16–40px scatter) |
| Vertical section gap | `--space-8` default between major sections |
| Sticky header z-index | `--z-sticky` |
| Modal z-index | `--z-modal` |
| Toast z-index | `--z-toast` |
| Skip to content link | Required on all authenticated shells |
| `prefers-reduced-motion` | Global policy (PR 4) — shells must not override |

### Shell migration notes

| Shell | Current file | Gap |
|---|---|---|
| MarketingShell | `PublicShell.tsx` + inline on `/` | `/` page does not use `PublicShell`; demo/get-started bypass entirely |
| AuthShell | `PublicShell` + centered `<main>` | No dedicated shell; duplicated padding `120px 24px 60px` |
| DashboardShell | `dashboard/layout.tsx` + `Sidebar` + `TopBar` | Hardcoded `#faf8f4`; sidebar/content theme split undocumented |
| PortalShell | `portal/PortalShell.tsx` | Partial firm branding; cool grays leak in |
| ReviewShell | Wrapper in `review/[jobId]/page.tsx` | Not extracted; dark island inside dashboard shell |

---

## 7. Migration Strategy

### Phase map

| Phase | Name | Scope | Exit criteria |
|---|---|---|---|
| **0** | Foundation docs | Audits, roadmaps, color architecture | `master-roadmap.md` approved |
| **1** | Tokens | `globals.css` aliases, motion, a11y | All token scales defined; hex→var opportunistic |
| **2** | Primitives | 28 primitives + gallery | Gallery 100%; zero production consumers required to merge primitive PR |
| **3** | Composites | 15 composite components | EmptyState, PageHeader, StatCard, FilterBar live |
| **4** | Shells | 7 shells unified | Conversion path uses ≤2 visual dialects |
| **5** | Business | Domain components on primitives | `TransactionRow`, `ReviewQueue` primitive-backed |
| **6** | Pages | Route-by-route migration | <10% hex in `src/` |
| **7** | Enforcement | Lint, CI, governance | New hex/modal/button lint errors block merge |

### Exact migration order

#### Wave A — Foundation (complete / in flight)

| PR | Work | Status |
|---|---|---|
| A1 | Docs foundation | ✓ |
| A2 | Semantic tokens (spacing, radius, z-index, typography, motion) | ✓ |
| A3 | Semantic color tokens | ✓ |
| A4 | Global `prefers-reduced-motion` | ✓ |
| A5 | Button primitive + gallery | ✓ |
| A6 | Login → Button | ✓ / in flight |
| A7 | Input system primitives + gallery | ✓ / in flight |
| A8 | Card system primitives + gallery | ✓ / in flight |
| A9 | Dialog system primitives + gallery | ✓ / in flight |
| A10 | Badge primitive + gallery | ✓ / in flight |
| A11 | Layout primitives + gallery | ✓ / in flight |

#### Wave B — Primitives P0 (blocking everything else)

One primitive per PR. Gallery entry required before any consumer PR.

1. ~~`Input` + `Label` + `Field`~~ ✓ PR 7
2. ~~`Badge`~~ ✓ PR 10
3. ~~`Card`~~ ✓ PR 8
4. ~~`Dialog`~~ ✓ PR 9
5. ~~`PageContainer` + `PageHeader` + layout helpers~~ ✓ PR 11
7. `Toast` (from `ActionToast`)
8. `Table` primitives only (`Table`, `TableHead`, `TableRow`, `TableCell`) — not full DataTable

#### Wave C — Conversion flow

One page per PR. Pixel parity required.

1. `(auth)/signup` → Button + Input
2. `(auth)/forgot-password` → Button + Input
3. `PricingTiers` → Button (`brand`)
4. `Nav` + `CtaBand` → Button
5. `dashboard/layout` → shell tokens
6. `OnboardingModal` → Dialog
7. `UpgradeModal` → Dialog
8. `dashboard/page` — PageContainer + PageHeader + primary CTAs (section PRs)
9. `clients/page` → pattern adoption

#### Wave D — Core product

1. `settings/page` → Field + Input
2. `upload/page`
3. `billing/page`
4. `Sidebar` + `TopBar` → token chrome
5. Review toasts/modals → Toast + Dialog
6. `review/[jobId]/page` — **chrome only**
7. Portal shell + firm branding depth

#### Wave E — Composites

1. `EmptyState`
2. `StatCard`
3. `FilterBar` + `DataGridToolbar`
4. `CommandPalette` → composite
5. `DocumentCard` consolidation

#### Wave F — Business components

1. `CategoryPicker` → primitive-backed
2. `ApprovalBanner` / `BulkActionBar`
3. `CloseProgress`
4. `TransactionRow` badge integration
5. **`TransactionTable` → `ReviewQueue`** (single PR, Phase 7 — highest risk)

#### Wave G — Long tail + enforcement

1. Remaining dashboard pages by traffic
2. Modal consolidation (one modal per PR)
3. Icon system (emoji removal)
4. `DemoShell` alignment or deprecation
5. ESLint: no new hex, no new inline modals/buttons
6. Delete `DarkFormPrimitives`, `DarkButton`, orphaned `StatusBadge.tsx`

### Explicit defer list (do not migrate until Wave F/G)

- `TransactionTable.tsx` full rewrite
- `Hero.tsx`, `StatBand.tsx`, `TrustSection.tsx` (AAA landing craft)
- `get-started/page.tsx` until Button + Input + shell ready
- `demo/*` until MarketingShell/DemoShell decision
- `api/report/route.ts` print HTML (parallel print design system)

---

## 8. Governance

### Mandatory rules (effective immediately for new code)

| Rule | Enforcement |
|---|---|
| **No new inline colors** | No `#hex` or `rgb()` in new/edited `src/` files. Use `var(--*)` or primitives. |
| **No new radius values** | Use `--radius-sm|md|lg|full` only. |
| **No new spacing values** | Use `--space-*` only. Exceptions: 1px borders. |
| **No new modal implementations** | Use `Dialog` or `Drawer`. |
| **No new button implementations** | Use `Button` (including `brand` on dark surfaces). |
| **No new badge implementations** | Use `Badge` with semantic variants. |
| **No new toast implementations** | Use `Toast` provider. |
| **No new z-index literals** | Use `--z-dropdown` through `--z-max`. |
| **One PR = one concern** | Token OR primitive OR consumer OR shell — never combined. |
| **Gallery before consumers** | Primitive must appear in `/dashboard/design-system` before route migration. |
| **Definition of Done met** | See §9 before marking primitive `✓`. |

### PR template (required)

Every design-system PR description must include:

```markdown
## CBDS Reference
- Layer: [Token | Primitive | Composite | Business | Shell | Page]
- Item: [e.g. Button, Dialog, login page]
- Wave: [A–G from master-roadmap.md]

## Checklist
- [ ] npm run build passes
- [ ] No visual regression (screenshot or pixel parity note)
- [ ] Accessibility preserved
- [ ] migration-roadmap.md updated
- [ ] Gallery updated (if primitive)
```

### Review authority

- **Token/color changes** that alter computed values require product + design approval.
- **Brand color unification** (`#00C853` vs `#2d5a27`) is a product decision — not an engineering drive-by.
- **Shell theme changes** (e.g. dark dashboard) require explicit approval.

### Folder conventions (target state)

```
src/design-system/
  tokens/           # index.ts re-exports
  primitives/       # Button, Input, Dialog…
  composites/       # StatCard, FilterBar…
  business/         # TransactionRow, CloseProgress…
  patterns/         # ListPage, WizardPage…
  shells/           # DashboardShell, PortalShell…
  gallery/          # Story components per primitive

src/app/dashboard/design-system/   # gallery routes
docs/design-system/                # all documentation
```

---

## 9. Definition of Done

A primitive is **complete** (`✓`) only when all criteria are met:

| Criterion | Requirement |
|---|---|
| **Accessibility** | WCAG 2.2 AA: contrast, focus visible, ARIA roles/states, 44px touch target (or documented dense exception) |
| **Dark mode** | Renders correctly under `[data-theme="dark"]` and cream `:root` |
| **Loading state** | `loading` prop or documented N/A with rationale |
| **Disabled state** | Native `disabled`, `aria-disabled`, visual distinction |
| **Keyboard support** | Tab focus, Enter/Space activation, Escape for overlays |
| **Reduced motion** | Respects global `prefers-reduced-motion` policy |
| **Documentation** | `docs/design-system/<primitive>.md` with API table + token mapping |
| **Gallery** | All variants × sizes × states on `/dashboard/design-system` |
| **Token-only styles** | Zero hardcoded hex in primitive file |
| **forwardRef** | Required for form primitives and Button |
| **Types exported** | Props interface + variant/size unions |

### Composite Definition of Done

All primitive DoD criteria, plus:

- Composes ≥2 primitives
- Zero domain-specific copy or accounting semantics
- Props are data-driven (no `fetch` inside)

### Business component Definition of Done

All composite DoD criteria, plus:

- Documents domain meaning of variants
- Used by ≥2 pages or explicitly marked as shared widget

---

## 10. Future Vision

### What complete migration looks like

**For engineers:** Import `Button`, `Field`, `Dialog` from `@/design-system/primitives`. Build a new dashboard page in under 30 minutes using `DashboardShell` + `PageContainer` + `PageHeader` + composites. No inline `style={{ backgroundColor: '#…' }}`. ESLint blocks regressions.

**For designers:** Figma variables map 1:1 to CSS tokens. Brand color roles are documented. Firm white-label preview in settings matches portal exactly.

**For users:** The product feels like **one company** — not three stitched together. Signup → dashboard transition is intentional (cream workspace after dark marketing). Review surface, portal, and dashboard share interaction language (same button hover, same modal animation, same toast position).

### Visual target

| Surface | Character |
|---|---|
| Marketing | Dark, neon brand accent, Instrument Serif display, cinematic motion (conducted, reduced-motion safe) |
| Dashboard | Cream canvas, forest action green, Inter, data-dense tables, calm motion |
| Review | Dark island, token-unified with review-specific density, keyboard-first |
| Portal | Firm-branded, client-appropriate, professional (no emoji, SVG icons) |

### Architecture target

```
globals.css (tokens)
    └── 28 primitives (gallery-backed)
            └── 15 composites
                    └── 15 business components
                            └── 6 shells
                                    └── 120 pages (composition only)
```

### Metrics at completion

| Metric | Target |
|---|---|
| Design system maturity | 8 / 10 |
| Hex literals | < 500 |
| Primitive gallery | 28 / 28 |
| Modal implementations | 1 (`Dialog` + `Drawer`) |
| Button implementations | 1 (`Button`) |
| New feature primitive adoption | 100% |
| Client portal firm branding fidelity | Settings preview = live portal |

### What we will not build

- A second Tailwind theme competing with tokens
- Per-page design overrides outside firm branding
- Animation systems outside `motion.ts` + CSS motion tokens
- Accounting-domain logic inside primitives

---

## Appendix: Document map

| Document | Role |
|---|---|
| **master-roadmap.md** (this file) | Single source of truth — architecture, inventory, governance |
| [migration-roadmap.md](./migration-roadmap.md) | PR log, baseline metrics, wave tracking |
| [design-token-strategy.md](./design-token-strategy.md) | Token adoption rules |
| [color-architecture.md](./color-architecture.md) | Dual-green state, brand decision |
| [semantic-color-tokens.md](./semantic-color-tokens.md) | Color token reference |
| [button.md](./button.md) | Button primitive reference |
| [adoption-audit.md](./adoption-audit.md) | Duplication analysis, conversion path |

---

## Appendix: Current program status (2026-07-07)

| Layer | Progress |
|---|---|
| Tokens | ◐ Spacing, color, motion, z-index defined; hex migration not started |
| Primitives | ◐ Button only (`brand` variants for auth) |
| Composites | — |
| Business | — (legacy monoliths remain) |
| Shells | — (documented, not extracted) |
| Pages | ◐ Login buttons only |
| Governance | ◐ Documented; lint not enforced |
| Maturity | **3.5 / 10** |

**Next PR per this roadmap:** Wave B — `Input` + `Label` + `Field` primitive (extract from `DarkFormPrimitives`).
