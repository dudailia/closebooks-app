# Design System Health Audit

**Audit date:** 2026-07-11  
**Baseline:** [Adoption Audit](./adoption-audit.md) (2026-07-06) + [Migration Roadmap](./migration-roadmap.md) metrics  
**Scope:** `src/` static analysis via ripgrep; primitive inventory; playground state  
**Method:** Reproduced baseline commands + extended duplication scans. No code modified.

---

## Executive summary

CloseBooks has moved from **"no primitives"** to **"primitives exist, adoption barely started."** PRs 2–11 added tokens, six primitive galleries, layout primitives, and a 16-section playground — but **production debt is essentially unchanged**.

| Signal | Baseline (Jul 6) | Current (Jul 11) | Δ | Verdict |
|---|---|---|---|---|
| Hex literals | 10,376 | **10,398** | +22 (+0.2%) | No reduction |
| `var(--*)` adoption | 687 | **1,562** | +875 (+127%) | Playground + primitives helped |
| Forest green files | 146 | **156** | +10 | Worse |
| Button primitive consumers | 0 | **1 route** (login) | +1 | Proof only |
| Modal → Dialog migrations | 0 | **0** | — | 15 independent modals remain |
| Badge → Badge migrations | 0 | **1** (playground) | — | 9+ local status implementations |
| Maturity score | **3.0 / 10** | **4.2 / 10** | +1.2 | Infrastructure up; debt flat |

**Headline:** Phase 1 (tokens) and Phase 2 (primitive galleries) are **~75% complete**. Phase 3 (consumer migration) is **~2% complete**. The signup → dashboard visual break remains the highest-impact unresolved conversion gap.

**CBDS maturity level:** **Level 2 — Foundations built, adoption not started**

---

## 1. Comparison to original audit

### 1.1 What the original audit found (2026-07-06)

| Finding | Original state |
|---|---|
| No shared Button primitive | 146 files with `#2d5a27`; 47 with `#00C853` |
| Conversion break at signup → dashboard | Auth coherent (`DarkFormPrimitives`); dashboard 31+ inline forest CTAs |
| 49 modal implementations | Independent shells, z-index 50–9999 |
| 8+ badge systems | Orphaned `StatusBadge.tsx`; per-page copies |
| 6+ page max-widths | No `PageContainer` |
| Token adoption ~6.2% | 687 `var(--*)` vs 10,376 hex |
| Highest-ROI target | Button → auth → pricing → dashboard |

### 1.2 What changed (Jul 6 → Jul 11)

| Deliverable | Status |
|---|---|
| Semantic tokens in `globals.css` | ✓ PRs 2–4 |
| Global `prefers-reduced-motion` | ✓ PR 4 |
| `Button`, Input system, Card, Dialog, Badge, Layout primitives | ✓ PRs 5–11 (gallery only) |
| Login → `Button` migration | ✓ PR 6 (1 consumer) |
| Design System Playground (16 sections) | ✓ PR 27 |
| Engineering governance doc | ✓ PR 28 |
| Signup → `Button` | ✗ Still `DarkButton` |
| Dashboard → primitives | ✗ Unchanged |
| Modal consolidation | ✗ Unchanged |
| Hex reduction | ✗ Net +22 (new playground/primitive code) |

### 1.3 Top button-duplication files — then vs now

Scoring: `(buttons × 2) + #2d5a27 + #00C853 + (DarkButton × 3) + (MagneticButton × 3)`

| Rank | Jul 6 score | Jul 11 score | File | Change |
|---|---|---|---|---|
| 1 | 71 | **71** | `review/[jobId]/page.tsx` | Unchanged |
| 2 | 56 | **56** | `dashboard/connect/page.tsx` | Unchanged |
| 3 | 46 | **44** | `demo/page.tsx` | −2 (minor) |
| 4 | 43 | **42** | `dashboard/agent/new/page.tsx` | −1 |
| 5 | 41 | **41** | `dashboard/page.tsx` | Unchanged (still 31 forest refs) |
| 6 | 41 | **40** | `dashboard/1099/page.tsx` | −1 |
| — | 40 | **39** | `dashboard/billing/page.tsx` | New in top 10 |
| — | 39 | **38** | `AdvisoryGenerateModal.tsx` | −1 |

**Conclusion:** Duplication hotspots are stable. No production file in the top 15 has been migrated except `login/page.tsx` (not in top 20).

---

## 2. Metric dashboard

### 2.1 Color debt

| Metric | Baseline | Current | Δ | Target (complete) |
|---|---|---|---|---|
| Hex color literals | 10,376 | **10,398** | +22 | < 500 |
| Files with hex | 273 | **275** | +2 | < 30 |
| `var(--*)` references | 687 | **1,562** | +875 | > 8,000 |
| Files using CSS variables | 138 | **190** | +52 | — |
| `#00C853` (neon) | 280 | **281** | +1 | Documented dual-brand |
| `#2d5a27` (forest) | 837 | **840** | +3 | → `--color-action-primary` |
| `backgroundColor: '#…'` | 1,478 | **1,480** | +2 | 0 |
| Token adoption rate | ~6.2% | **13.1%** | +6.9pp | > 80% |

**Token adoption rate** = `var(--*)` / (`var(--*)` + hex literals) = 1,562 / 11,960.

**Hex in new DS code (expected, not debt):**

| Location | Hex count |
|---|---|
| `src/components/ui/` (primitives) | 4 |
| `src/components/design-system/playground/` | 2 |
| `src/app/globals.css` (token definitions) | 72 |

### 2.2 Inline spacing debt

| Metric | Current | Notes |
|---|---|---|
| `padding`/`margin`/`gap` px literals in styles | **1,703** | e.g. `padding: '24px'` |
| Numeric padding/margin in style objects | **1,492** | e.g. `padding: 24` |
| `var(--space-*)` usage | **284** | +197% vs baseline (not tracked Jul 6) |
| Files using `--space-*` | **49** | Mostly playground + ui primitives |

**Spacing token adoption rate:** 284 / (284 + 1,703) ≈ **14.3%** when counting px literals only.

### 2.3 Duplicate buttons

| Pattern | Baseline | Current | Δ |
|---|---|---|---|
| Files with `#2d5a27` | 146 | **156** | +10 |
| Files with `#00C853` | 47 | **49** | +2 |
| `DarkButton` files | 4 auth | **5** (auth + primitives dep) | +1 |
| `MagneticButton` files | 5 landing | **5** | 0 |
| Raw `<button>` elements | — | **658** across **173** files | — |
| `Button` primitive imports (production) | 0 | **1** (`login/page.tsx`) | +1 |
| `onMouseEnter` hover mutations | 30+ | **103** files | Worse (full scan) |

**Primitive exists; adoption does not.** `Button` is imported in galleries, playground, `EmptyState`, `ConfirmationDialog`, and login only.

### 2.4 Duplicate cards

| Pattern | Current | Primitive target |
|---|---|---|
| `backgroundColor: '#fff'` / `#ffffff` | **468** | `Card variant="raised"` |
| `border: '1px solid #e8…'` (warm border) | **379** | `var(--border-default)` |
| `borderRadius: 12` (legacy card) | **153** | `var(--radius-lg)` |
| `var(--surface-raised)` / `--surface-card` | **48** | Preferred |
| `.surface-raised` class | **19** files | CSS utility |
| `Card` primitive imports (non-gallery) | **2** (`LayoutGallery`, `StatCard` internals) | — |
| `GlowCard` usage | **4** files | Landing-specific |

### 2.5 Duplicate dialogs / modals

| Pattern | Baseline | Current | Δ |
|---|---|---|---|
| `*Modal*.tsx` files | 15+ | **15** | 0 |
| Import `Dialog` / `Drawer` / `ConfirmationDialog` | 0 | **4** (gallery + ConfirmationDialog only) | Gallery only |
| `role="dialog"` implementations | — | **3** | Dialog primitive + legacy |
| `zIndex: 9999` | — | **3** | VoiceDemoModal, etc. |
| Ad-hoc `zIndex: <number>` | 14+ values | **81** occurrences | Still no contract |
| `var(--z-*)` usage | — | **2** | Token defined, not adopted |

**Independent modal files (all unmigrated):**

`OnboardingModal`, `UpgradeModal`, `SplitModal`, `AdvisoryGenerateModal`, `VoiceDemoModal`, `InvoiceGenerateModal`, `EngagementLetterModal`, `RegulatoryLetterModal`, `DocumentRequestModal`, `AutoCloseModal`, `ExportModal`, `MonthlyReportPreviewModal`, plus inline modals in `1099/page.tsx`, `tax-strategy/page.tsx`.

### 2.6 Duplicate badges

| Pattern | Baseline | Current | Δ |
|---|---|---|---|
| Badge systems | 8+ | **9+** | Unchanged |
| `StatusBadge` / `StatusPill` local implementations | 8+ | **9 files** | See list below |
| `StatusBadge.tsx` (orphaned) | 0 imports | **Still orphaned** | Delete candidate |
| `Badge` primitive imports (production) | 0 | **1** (TablesSection playground only) | — |
| `.badge-*` CSS class usage | unused | **4** files | Still legacy |

**Local status badge copies:**

`TransactionRow.tsx`, `StatusBadge.tsx`, `ConnectedAccounts.tsx`, `InboxDocumentCard.tsx`, `1099/page.tsx`, `requests/page.tsx`, `autopilot/page.tsx`, `agent/page.tsx`, `calendar/page.tsx`

### 2.7 Duplicated layouts

| Pattern | Baseline | Current | Δ |
|---|---|---|---|
| Distinct `maxWidth` values | 6+ (700–1220) | **236 unique literals** | Worse (full scan) |
| Top max-width: `1200` | dominant | **41** occurrences | Still dominant |
| `PageContainer` production usage | 0 | **1** (`LayoutGallery` only) | 0 routes |
| `maxWidth` literals total | — | **270** | — |

**Top max-width values:**

| Value | Count |
|---|---|
| 1200 | 41 |
| 480 | 15 |
| 420 | 14 |
| 1100 | 14 |
| 960 | 11 |

`PageContainer` supports `sm|md|lg|xl|wide` but **zero dashboard routes** use it.

### 2.8 Remaining design debt (extended)

| Signal | Current | Severity |
|---|---|---|
| Inline `style={{` blocks | **7,950** (+311 vs baseline) | High |
| Files with inline styles | **309** (+51) | High |
| `borderRadius` px literals | **1,013** | Medium |
| `var(--radius-*)` usage | **54** | Low adoption |
| Ad-hoc `boxShadow` strings | **118** | Medium |
| `var(--shadow-*)` usage | **18** | Low adoption |
| `animate-pulse` (Tailwind) | **13** files | Dual loading system |
| `.cb-skeleton` usage | **8** files | Dual loading system |
| `DarkFormPrimitives` dependents | **7** files | Auth still split |
| `formFieldStyle` (settings) | **0** (removed or renamed) | — |
| Emoji in `.tsx` | **125** occurrences | Portal/client surfaces |
| Toast implementations | **3+** (`ActionToast`, `SaveRuleToast`, inline) | Medium |
| AI chat UIs | **3** (copilot, AppChatPanel, portal) | Low priority |
| Data table implementations | **2+** | Phase 4 |

---

## 3. Primitive & playground inventory

### 3.1 Primitives shipped (gallery-complete)

| Primitive | Gallery | Playground section | Production consumers |
|---|---|---|---|
| Button | ✓ | ✓ | **login** only |
| Input, Textarea, Select, Label, Field | ✓ InputGallery | ✓ | 0 routes |
| Card, StatCard, SectionCard | ✓ | ✓ | 0 routes |
| Dialog, Drawer, ConfirmationDialog | ✓ | ✓ | 0 routes |
| Badge | ✓ | ✓ | 0 routes |
| PageContainer, PageHeader, PageSection, PageActions, PageGrid, EmptyState | ✓ LayoutGallery | — (layout not in playground catalog) | 0 routes |

**34** files in `src/components/ui/` (excl. 6 legacy galleries). **15** playground sections.

### 3.2 P0 primitives still missing (from master roadmap)

| Primitive | Priority | Blocker for |
|---|---|---|
| **Toast** | P1 | Review, portal, dashboard notifications |
| **Spinner** (unified) | P1 | Loading consistency |
| **Table** | P0 | TransactionTable migration (Phase 4) |
| **Checkbox** | P1 | Forms, bulk select |
| **Popover / DropdownMenu** | P1 | CategoryPicker, NotificationBell |
| **Icon** (system) | P1 | Portal emoji replacement |

### 3.3 Conversion path status (re-audit)

```
/  →  /pricing  →  /signup  →  /dashboard  →  /review
dark     dark        dark         cream          dark
neon     PricingTiers DarkButton   31× forest     27 buttons
MagneticBtn          NOT migrated  NOT migrated   NOT migrated
```

| Step | DS maturity (Jul 6) | DS maturity (Jul 11) | Notes |
|---|---|---|---|
| `/` | 6/10 | **6/10** | No change |
| `/pricing` | 7/10 | **7/10** | No change |
| `/signup` | 8/10 | **7/10** | Login migrated; signup still legacy |
| `/dashboard` | 3/10 | **3/10** | No change |
| `/review` | 5/10 | **5/10** | Table tokenized; chrome not |

**Signup → dashboard break: still severe.**

---

## 4. Maturity score

### 4.1 Scoring model (CBDS Maturity v1)

Five pillars, weighted. Each pillar scored 0–10.

| Pillar | Weight | Score | Rationale |
|---|---|---|---|
| **Token layer** | 20% | **7.0** | Full semantic namespace in `globals.css`; global reduced-motion; 13% adoption |
| **Primitive layer** | 25% | **6.5** | 18/~28 P0–P1 primitives; galleries + playground; missing Toast/Table/Checkbox |
| **Adoption layer** | 30% | **1.5** | 1 production route on Button; 0 modals/badges/cards migrated; hex flat |
| **Consistency layer** | 15% | **2.0** | Top-15 duplication files unchanged; z-index chaos; 236 max-widths |
| **Operations layer** | 10% | **8.0** | Governance doc, playground, per-primitive docs, migration log |

**Weighted total:**

`(7.0 × 0.20) + (6.5 × 0.25) + (1.5 × 0.30) + (2.0 × 0.15) + (8.0 × 0.10)`  
= `1.40 + 1.625 + 0.45 + 0.30 + 0.80`  
= **4.18 → 4.2 / 10**

### 4.2 Maturity levels

| Level | Score | Description | CloseBooks status |
|---|---|---|---|
| 0 | 0–1 | Ad hoc craft | — |
| 1 | 1–3 | Tokens documented | Jul 6 baseline (**3.0**) |
| **2** | **3–5** | **Primitives exist; adoption starting** | **Now (4.2)** |
| 3 | 5–6 | Conversion path on primitives | Target Q3 |
| 4 | 6–8 | Dashboard majority migrated | Target |
| 5 | 8–10 | Lint-enforced; debt < 500 hex | Complete |

### 4.3 Progress vs master roadmap targets

| Metric | Baseline | Current | Target | Progress |
|---|---|---|---|---|
| Hex literals | 10,376 | 10,398 | < 500 | **0%** |
| `var(--*)` refs | 687 | 1,562 | > 8,000 | **12%** |
| Modal files | 49 | ~15 named + inline | 0 independent | **0%** |
| Button duplication files | 150+ | 156 | 0 | **0%** |
| Gallery coverage | 1/28 | ~18/28 | 28/28 | **64%** |
| New feature UI from primitives | 0% | ~1% | 100% | **1%** |

---

## 5. Phase 2 recommendations

Phase 2 in [migration-roadmap.md](./migration-roadmap.md) is **Primitive components**. Phase 2 is **~75% complete** (galleries shipped). These recommendations finish Phase 2 gaps and **open Phase 3 (consumer migration)** without mixing concerns.

### 5.1 Finish Phase 2 primitives (gallery before consumers)

| Priority | PR | Deliverable | Unlocks | Est. risk |
|---|---|---|---|---|
| **P0** | 12 | `signup` + `forgot-password` → `Button` + `Input` | Auth cluster 100%; conversion proof | Low |
| **P0** | 13 | `PricingTiers` + `Nav` + `CtaBand` → `Button` | `/pricing` + landing CTAs | Low |
| **P1** | 14 | `Toast` primitive + provider | Review toasts, portal, dashboard | Medium |
| **P1** | 15 | `Spinner` — unify `InputSpinner` + Button spinner | Loading consistency | Low |
| **P1** | 16 | Add **Layout** section to playground | Layout primitive visibility | None |
| **P2** | 17 | `Checkbox` + `Switch` primitives | Forms, settings, bulk select | Low |
| **P2** | 18 | `Table` reference primitive (not TransactionTable port) | Document pattern; playground Tables upgrade | Medium |

**Do not start** until gallery-complete: Popover, DropdownMenu, DataTable port.

### 5.2 Phase 3 kickoff — highest ROI migrations (one surface per PR)

Aligned with [adoption-audit.md](./adoption-audit.md) Tier 1:

| Order | Target | Business impact | Duplication score |
|---|---|---|---|
| 1 | `(auth)/signup/page.tsx` | Conversion gate | DarkButton × 5 |
| 2 | `components/landing/PricingTiers.tsx` | Pricing + landing | 34 |
| 3 | `dashboard/layout.tsx` | Cream canvas token | Layout contract |
| 4 | `components/OnboardingModal.tsx` → `Dialog` | First dashboard load | Modal template |
| 5 | `app/dashboard/page.tsx` — **header + primary CTAs only** | Signup→value break | 41 |
| 6 | `components/UpgradeModal.tsx` → `Dialog` | Pairs with onboarding | — |
| 7 | `app/dashboard/clients/page.tsx` | Post-dashboard traffic | Medium |
| 8 | `app/dashboard/settings/page.tsx` | Cream form reference | Medium |

**Explicit defer:** `review/[jobId]/page.tsx` body, `TransactionTable`, `Hero.tsx`, `get-started/page.tsx`.

### 5.3 Consolidation passes (medium batches)

| System | Action | Files affected |
|---|---|---|
| **Badges** | Migrate `TransactionRow` StatusPill → `Badge`; delete `StatusBadge.tsx` | 9 |
| **Cards** | Extract dashboard stat tiles → `StatCard` on `dashboard/page.tsx` | 1 (sectioned) |
| **Layouts** | `PageContainer` + `PageHeader` on top 5 dashboard routes by traffic | 5 |
| **Z-index** | Modal migrations must use `--z-overlay` / `--z-modal`; ban 9999 in new code | 15 modals |
| **Skeleton** | Replace `animate-pulse` on pages that already use `Skeleton.tsx` | 13 |

### 5.4 Operations & metrics (parallel, low risk)

| Action | Owner | Output |
|---|---|---|
| Add `scripts/ds-metrics.sh` | Engineering | Reproducible audit commands |
| Update `migration-roadmap.md` after each PR | PR author | Metric deltas |
| Track conversion-path % in PR template | Reviewer | Auth/pricing/dashboard primitive % |
| Wire ESLint `no-restricted-syntax` for hex in `src/` (warn) | Phase 3 late | Prevent new debt |

### 5.5 Recommended next 5 PRs (concrete)

| PR | Layer | Scope | Success criterion |
|---|---|---|---|
| **#29** | Consumer | `signup` → Button + Input | 0 `DarkButton` in signup |
| **#30** | Consumer | `forgot-password` → Button + Input | Auth cluster 100% |
| **#31** | Consumer | `PricingTiers` → Button | `/pricing` CTAs primitive-backed |
| **#32** | Consumer | `OnboardingModal` → Dialog | First modal migration; z-index contract |
| **#33** | Consumer | `dashboard/page.tsx` header section only | Forest hex on page < 20 |

### 5.6 Anti-recommendations (do not do in Phase 2)

| Action | Why |
|---|---|
| Mass hex → token swap across `src/` | No visual regression proof per file |
| `TransactionTable` rewrite | Phase 4; needs Table primitive |
| Full `review/[jobId]/page.tsx` migration | 1,995 lines; high regression risk |
| Tailwind migration | Third styling runtime |
| Brand color unification PR | Product decision |
| Dark dashboard theme | Product decision |

---

## 6. Success metrics — track after Phase 2 completion

Re-run audit commands after PRs #29–#33:

```bash
# Quick health check
rg -o '#[0-9a-fA-F]{3,8}\b' src --no-heading | wc -l
rg -o 'var\(--[a-zA-Z0-9_-]+\)' src --no-heading | wc -l
rg -l "from '@/components/ui/Button'" src --glob '*.tsx' | rg -v Gallery | wc -l
rg -l 'DarkButton' src/app/\(auth\) | wc -l
rg -c '#2d5a27' src/app/dashboard/page.tsx -i
```

| Metric | Jul 11 | Phase 2 target | Phase 3 target |
|---|---|---|---|
| Maturity score | 4.2 | **5.0** | 6.0 |
| Auth on primitives | 33% (login only) | **100%** | 100% |
| `/pricing` on Button | 0% | **100%** | 100% |
| `dashboard/page.tsx` forest refs | 31 | **< 20** | < 5 |
| Dialog consumer migrations | 0 | **1** (Onboarding) | 3 |
| `var(--*)` refs | 1,562 | **2,000** | 3,000 |
| Hex literals | 10,398 | ≤ 10,300 | < 9,000 |

---

## 7. References

- [Adoption Audit (2026-07-06)](./adoption-audit.md) — original duplication analysis
- [Migration Roadmap](./migration-roadmap.md) — PR log and baseline commands
- [Master Roadmap](./master-roadmap.md) — inventory and success criteria
- [Engineering Governance](./engineering-governance.md) — checklists and Definition of Done
- Playground: `/dashboard/design-system`

---

## 8. Revision history

| Date | Change |
|---|---|
| 2026-07-11 | Initial health audit — baseline comparison, maturity 4.2/10, Phase 2 recommendations |
