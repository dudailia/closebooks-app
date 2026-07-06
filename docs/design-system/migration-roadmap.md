# Migration Roadmap

Incremental design-system migration plan. One PR at a time, one logical concern per PR, zero visual regressions unless explicitly approved.

---

## Baseline metrics

Captured **2026-07-06** from `src/` via ripgrep. Re-run commands below to refresh.

```bash
# Hex literals
rg -o '#[0-9a-fA-F]{3,8}\b' src --no-heading | wc -l

# Files containing hex
rg -l '#[0-9a-fA-F]{3,8}\b' src | wc -l

# Inline style blocks
rg -c 'style=\{\{' src --no-heading | awk -F: '{s+=$2} END {print s}'

# Token usage
rg -o 'var\(--[a-zA-Z0-9_-]+\)' src --no-heading | wc -l

# Brand greens
rg -o '#00C853' src -i --no-heading | wc -l
rg -o '#2d5a27' src -i --no-heading | wc -l
```

| Metric | Baseline |
|---|---|
| Hex color literals | **10,376** |
| Files with hex literals | **273** |
| Inline `style={{` blocks | **7,639** |
| Files with inline styles | **258** |
| `var(--*)` token references | **687** |
| Files using CSS variables | **138** |
| `#00C853` (neon green) occurrences | **280** |
| `#2d5a27` (forest green) occurrences | **837** |
| Hardcoded `backgroundColor: '#…'` | **1,478** |
| Modal-related `.tsx` files | **49** |

### Component duplication examples (baseline)

| Pattern | Copies | Representative files |
|---|---|---|
| **Modals** | 15+ independent shells | `OnboardingModal`, `UpgradeModal`, `SplitModal`, `InvoiceGenerateModal`, `VoiceDemoModal` (z-index 9999), inline modals in `1099/page.tsx`, `tax-strategy/page.tsx` |
| **Badges / status pills** | 8+ systems | `StatusBadge.tsx` (**orphaned, 0 imports**), `TransactionRow` StatusPill, local `StatusBadge` in `calendar/page.tsx`, `agent/page.tsx`, `globals.css` `.badge-*` (**unused in components**) |
| **Toast / notifications** | 3+ patterns | `ActionToast`, `SaveRuleToast`, fixed inline toasts in `portal/page.tsx`, `ConnectedAccounts.tsx` |
| **Buttons** | No shared primitive | `DarkButton` (landing/auth), inline `#2d5a27` buttons (dashboard), `MagneticButton` (landing only) |
| **Form inputs** | 2+ systems | `DarkFormPrimitives`, `formFieldStyle` in `settings/page.tsx`, per-page inline inputs |
| **AI chat UIs** | 3 implementations | `copilot/*`, `ai/AppChatPanel.tsx`, `portal/MessageThread.tsx` |
| **Loading / skeleton** | 2 systems | `Skeleton.tsx` + `.cb-skeleton`, Tailwind `animate-pulse` on same pages |
| **Data tables** | 2+ implementations | `TransactionTable.tsx`, `copilot/DataTable.tsx`, inline tables on billing/clients |
| **Z-index stacks** | 14+ values (50–9999) | Review stack 800–1100, `VoiceDemoModal` 9999, dashboard modals at 50 |
| **Page layout** | 6+ max-widths | 700, 800, 900, 1100, 1200, 1220px — no `PageContainer` |

---

## Phase overview

| Phase | Goal | Est. PRs | Est. files | Rollback risk |
|---|---|---|---|---|
| **0** | Documentation foundation | 1 | 4 docs | None |
| **1** | Foundation tokens (additive, no visual change) | 8–12 | 15–25 | Low |
| **2** | Primitive components (pixel-identical, opt-in) | 18–28 | 45–70 | Low–medium |
| **3** | Application migration (surface by surface) | 55–85 | 120–180 | Medium |
| **4** | Polish, enforcement, deferred rewrites | 20–35 | 60–100 | Medium–high |

---

## Phase 0 — Documentation foundation

**Status:** PR 1 (this PR)

| Item | Detail |
|---|---|
| Goal | Establish token strategy, color architecture, migration roadmap, baseline metrics |
| Files | `docs/design-system/*` (4 files) |
| Code changes | None |
| Risk | None |

---

## Phase 1 — Foundation tokens

| Item | Detail |
|---|---|
| Goal | Add spacing, radius, z-index, shadow, and role-based color aliases without changing computed styles |
| PR examples | (1) spacing/radius/z/shadow tokens in `globals.css`, (2) `--color-brand` / `--color-action` aliases, (3) border dedup, (4) global reduced-motion, (5) `src/design-system/tokens/index.ts`, (6–12) hex→var swaps 3–5 files each |
| Dependencies | Phase 0 docs approved |
| Testing | `npm run build`; screenshot `/`, `/dashboard`, review job |
| Rollback | Revert per-PR; CSS additions are additive |

**Explicitly not in Phase 1:** brand color unification, component creation, page migrations.

---

## Phase 2 — Primitive components

| Item | Detail |
|---|---|
| Goal | Ship Button, Input, Card, Badge, Dialog, Toast, Popover, Skeleton, PageHeader, PageContainer — pixel-identical to dominant existing patterns |
| PR pattern | PR 1 = primitive + gallery page entry (zero consumers). PR 2+ = migrate 2–4 call sites. |
| Reference files | `DarkFormPrimitives` → Input, `OnboardingModal` → Dialog, `TransactionRow` → Badge, `ActionToast` → Toast |
| Dependencies | Phase 1 tokens |
| Testing | Primitive gallery on `/dashboard/developers` or dedicated route; focus trap, keyboard nav |
| Rollback | Revert consumer PR; primitive remains unused |

---

## Phase 3 — Application migration

Waves (each wave = multiple small PRs):

| Wave | Scope | Priority |
|---|---|---|
| **3A** | Shells: `dashboard/layout`, `PublicShell`, `PortalShell`, `Sidebar`, `TopBar` | P0 |
| **3B** | Conversion: auth pages, pricing, `get-started`, demo pages, `OnboardingModal`/`UpgradeModal` → Dialog | P0 |
| **3C** | Core workflows: clients, upload, billing, settings, team (one page per PR) | P1 |
| **3D** | Modals: one modal per PR (`DocumentRequestModal`, `InvoiceGenerateModal`, …) | P1 |
| **3E** | Long tail: network, radar, autopilot, tax, whitelabel, certification | P2 |

**Deferred to Phase 4:** `TransactionTable.tsx`, `review/[jobId]/page.tsx`, landing Hero/StatBand motion sections.

---

## Phase 4 — Visual polish & enforcement

| Item | Detail |
|---|---|
| Goal | Motion unification, icon system (replace emoji), DataTable migration, firm branding depth, lint enforcement, dead code removal |
| Brand color decision | If product approves unification (see color-architecture.md), dedicated PR with explicit visual-change sign-off |
| Dependencies | Phase 3 ≥ 80% complete |
| Testing | Full review workflow regression; portal UAT; reduced-motion audit |

---

## Migration log

| PR | Date | Branch | Concern | Files | Build | Status | Notes |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-06 | `cursor/design-system-foundation-docs-5b0e` | Docs foundation | 4 | n/a | **Open** | Baseline metrics captured; no code changes |
| 2 | 2026-07-06 | `cursor/design-system-semantic-tokens-5b0e` | Semantic foundation tokens | 2 | pass | **Open** | Additive tokens in globals.css; no consumers |
| 3 | 2026-07-06 | `cursor/design-system-color-tokens-5b0e` | Semantic color tokens | 3 | pass | **Open** | Brand/action/surface/text/border/status aliases; no consumers |

---

## Token inventory (PR 2)

Added to `:root` in `src/app/globals.css`. **Zero consumers** — values documented for future adoption.

| Category | Tokens |
|---|---|
| Spacing | `--space-1` (4px) … `--space-16` (64px) |
| Radius | `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (16px), `--radius-full` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-overlay` |
| Z-index | `--z-dropdown` (100), `--z-sticky` (200), `--z-overlay` (300), `--z-modal` (400), `--z-toast` (500), `--z-max` (600) |
| Typography | `--font-family-*`, `--font-size-xs` … `--font-size-4xl`, `--line-height-*`, `--font-weight-*` |
| Motion | `--duration-fast` (180ms), `--duration-base` (300ms), `--duration-slow` (500ms), `--ease-standard`, `--ease-emphasized` |

### PR 3 — Semantic color tokens

See [semantic-color-tokens.md](./semantic-color-tokens.md) for full reference.

| Category | Tokens added |
|---|---|
| Brand | `--color-brand-primary`, `--color-brand-product`, `--color-brand-muted` |
| Actions | `--color-action-primary`, `--color-action-hover`, `--color-action-disabled` |
| Surfaces | `--surface-canvas`, `--surface-raised` (+ `--surface-overlay` pre-existing) |
| Text | `--text-muted`, `--text-inverse` (+ `--text-primary`, `--text-secondary` pre-existing) |
| Borders | `--border-default` (+ `--border-strong` pre-existing) |
| Status | `--color-success-bg/fg`, `--color-warning-bg/fg`, `--color-danger-bg/fg` |

---

## Top 20 — migrate first

Highest leverage, lowest regression risk:

1. `src/app/globals.css`
2. `src/design-system/tokens/index.ts` (new, Phase 1)
3. `src/components/landing/DarkFormPrimitives.tsx`
4. `src/app/(auth)/login/page.tsx`
5. `src/app/(auth)/signup/page.tsx`
6. `src/app/(auth)/forgot-password/page.tsx`
7. `src/components/OnboardingModal.tsx`
8. `src/components/UpgradeModal.tsx`
9. `src/app/dashboard/layout.tsx`
10. `src/components/landing/PublicShell.tsx`
11. `src/components/Sidebar.tsx`
12. `src/components/TopBar.tsx`
13. `src/app/dashboard/settings/page.tsx`
14. `src/components/TransactionRow.tsx`
15. `src/components/review/ActionToast.tsx`
16. `src/components/review/SaveRuleToast.tsx`
17. `src/components/Skeleton.tsx`
18. `src/app/pricing/page.tsx`
19. `src/components/portal/PortalShell.tsx`
20. `src/app/dashboard/page.tsx`

---

## Top 20 — do not touch until end

Highest complexity or already best-in-class:

1. `src/components/TransactionTable.tsx`
2. `src/app/dashboard/review/[jobId]/page.tsx`
3. `src/components/landing/Hero.tsx`
4. `src/components/landing/StatBand.tsx`
5. `src/components/landing/TrustSection.tsx`
6. `src/components/landing/AutomationTheater.tsx`
7. `src/components/landing/BentoGrid.tsx`
8. `src/components/landing/AgentOrchestra.tsx`
9. `src/components/landing/HowItWorks.tsx`
10. `src/app/get-started/page.tsx` (until token prep complete)
11. `src/components/bank-rec/ReconciliationWorkspace.tsx`
12. `src/app/dashboard/agent/new/page.tsx`
13. `src/app/dashboard/connect/page.tsx`
14. `src/app/dashboard/analytics/page.tsx`
15. `src/components/InvoiceGenerateModal.tsx`
16. `src/components/EngagementLetterModal.tsx`
17. `src/components/ai/AppChatPanel.tsx`
18. `src/components/copilot/*` (cluster)
19. `src/components/ReceiptAnimation.tsx`
20. `src/app/api/report/route.ts` (print HTML — separate pipeline)

---

## Next PR (after PR 3 merges)

**PR 4 proposal:** Expand global `prefers-reduced-motion` beyond `[data-surface="public"]`. `globals.css` only. Awaiting approval.
