# Engineering Governance — CloseBooks Design System

**Status:** Active policy  
**Owner:** Design Systems Architecture  
**Last updated:** 2026-07-09  
**Audience:** Engineers, reviewers, agents

> This document is the **operational contract** for all design-system work. It complements [Master Roadmap](./master-roadmap.md) (architecture and inventory) and [Design Token Strategy](./design-token-strategy.md) (token structure). Every design-system PR must satisfy the checklists and rules here.

---

## 1. Scope & authority

### What this governs

- CSS design tokens in `src/app/globals.css`
- UI primitives in `src/components/ui/` (interim) and future `src/design-system/primitives/`
- The internal playground at `/dashboard/design-system`
- Documentation in `docs/design-system/`
- Page and shell migrations that adopt primitives or tokens

### What this does not govern

- Business logic, API routes, database schema
- Firm white-label color *values* (product sets them; engineering consumes them via tokens)
- Final brand-color unification (`#00C853` vs `#2d5a27`) — product/design decision documented in [color-architecture.md](./color-architecture.md)

### Enforcement today vs. target

| Rule | Today | Target (Phase 4) |
|---|---|---|
| No new hex in edited files | Policy + review | ESLint error |
| Gallery before consumers | Policy + review | CI check |
| One concern per PR | Policy + review | Required PR template |
| Token-only primitives | Policy + review | Lint on primitive folder |

Until lint is enforced, **human review** is the gate. Reviewers treat unchecked items as blockers.

---

## 2. PR checklist

Copy into every design-system PR description. All boxes must be checked or explicitly marked N/A with rationale.

### 2.1 Classification (required)

```markdown
## CBDS Reference
- Layer: [Token | Primitive | Composite | Business | Shell | Page | Docs]
- Item: [e.g. Button, --space-*, login page]
- Wave: [A–G from master-roadmap.md]
- Depends on: [PR # or "none"]
```

### 2.2 Build & scope

- [ ] **Single logical concern** — no mixing tokens + primitives + page migrations in one PR
- [ ] **`npm run build` passes** — primary correctness gate (no test suite in repo)
- [ ] **`npm run lint` run** — no *new* errors introduced (pre-existing warnings OK)
- [ ] **Diff scope matches PR title** — unrelated refactors removed or split out
- [ ] **No production behavior regressions** — features work as before unless migration is the goal

### 2.3 Design system compliance

- [ ] **No new hardcoded hex / rgb / hsl** in edited `src/` files (use `var(--*)` or primitives)
- [ ] **No new ad-hoc z-index** literals (use `--z-dropdown` … `--z-max`)
- [ ] **No new modal / button / badge implementations** when a primitive exists
- [ ] **Spacing uses `--space-*`**; radius uses `--radius-*`; shadows use `--shadow-*`
- [ ] **Gallery updated** if adding or changing a primitive API (see §8 Definition of Done)
- [ ] **`docs/design-system/<topic>.md` updated** if API, tokens, or adoption rules change
- [ ] **`migration-roadmap.md` log updated** if metrics or PR sequence change

### 2.4 Verification evidence

- [ ] **Manual browser check** on affected route(s) — desktop minimum; mobile if layout touched
- [ ] **Playground check** — new/changed primitive visible at `/dashboard/design-system` with variants, states, code, a11y notes
- [ ] **Screenshot or parity note** for any migrated surface ("pixel-identical to before" or "intentional delta: …")
- [ ] **Keyboard smoke test** — Tab, Enter/Space, Escape on overlays

### 2.5 Rollback & risk

- [ ] **Rollback plan stated** for migrations touching high-traffic routes (dashboard, review, login)
- [ ] **Feature flag / opt-in** noted if primitive is additive-only with zero callers yet

---

## 3. Migration checklist

Use when moving an existing page, modal, or component to primitives/tokens. One surface per PR unless explicitly approved as a batch.

### 3.1 Before you start

- [ ] Primitive exists and is marked **gallery-complete** on `/dashboard/design-system`
- [ ] [Adoption audit](./adoption-audit.md) or file search confirms this is the right conversion target (not a duplicate pattern)
- [ ] Baseline screenshot or computed-style note captured for parity comparison
- [ ] Identify **all states**: empty, loading, error, disabled, mobile, dark (if applicable)

### 3.2 During migration

- [ ] Replace inline colors with semantic tokens (`--text-primary`, `--surface-raised`, `--color-action-primary`, etc.)
- [ ] Replace custom buttons with `Button`; modals with `Dialog` / `Drawer`; badges with `Badge`
- [ ] Replace scattered max-width/padding with `PageContainer` / layout primitives where applicable
- [ ] Preserve existing **data flow** — migration is presentational only unless PR scope says otherwise
- [ ] Preserve **analytics, audit, and undo** behavior (especially review surface)
- [ ] Do not delete legacy component until **zero imports** remain (strangler fig)

### 3.3 After migration

- [ ] Visual parity confirmed (or approved intentional improvement documented)
- [ ] All interactive states still reachable
- [ ] No new hex introduced in migrated file(s)
- [ ] Orphaned CSS/classes removed only if grep shows zero usage
- [ ] `migration-roadmap.md` PR log entry added with files touched and metric delta if measured

### 3.4 Migration anti-patterns (reject in review)

| Anti-pattern | Why |
|---|---|
| Mass Tailwind conversion alongside DS migration | Two styling runtimes; scope explosion |
| Rewriting `TransactionTable` in a token PR | Highest regression risk; dedicated PR |
| Changing computed token values "while we're here" | Violates additive-only token policy |
| Deleting `DarkFormPrimitives` before auth uses new Input | Breaks login/signup |
| Mixing portal firm-branding changes with dashboard migration | Different theme contracts |

---

## 4. Review checklist

For reviewers (human or agent). Block merge if any **Blocker** fails.

### 4.1 Architecture

| Check | Blocker? |
|---|---|
| PR maps to a layer in [master-roadmap.md](./master-roadmap.md) | Yes |
| One concern per PR | Yes |
| No domain logic leaked into primitives | Yes |
| Composites use primitives only; business components use composites + primitives | Yes |
| Shell changes respect theme contracts (cream dashboard vs dark marketing) | Yes |

### 4.2 Code quality

| Check | Blocker? |
|---|---|
| Matches surrounding style (inline styles vs Tailwind — don't mass-convert) | Yes |
| `forwardRef` on form primitives and `Button` | Yes for primitives |
| Props types exported; sensible defaults | Yes for primitives |
| No unnecessary abstractions or drive-by refactors | Yes |
| Client/server boundaries preserved (`db.ts` not imported server-side, etc.) | Yes |

### 4.3 Design system rules

| Check | Blocker? |
|---|---|
| No new hex/rgb in edited files | Yes |
| Token namespaces used correctly (semantic, not legacy literals) | Yes |
| Z-index from contract | Yes |
| Primitive gallery entry exists before route consumers | Yes for new primitives |
| Docs updated when API changes | Yes |

### 4.4 Product & design escalation

Escalate to product/design **before merge** if PR:

- Changes computed color values for existing tokens
- Unifies `#00C853` and `#2d5a27` without approval
- Changes dashboard from cream to dark (or vice versa)
- Alters portal client-facing branding behavior
- Changes motion/animation timing in marketing hero sections

### 4.5 Reviewer sign-off template

```markdown
## Design System Review
- [ ] Architecture / scope OK
- [ ] Token & primitive rules OK
- [ ] Accessibility checklist (§5) OK
- [ ] Visual consistency checklist (§6) OK
- [ ] Definition of Done met (§8) — if primitive PR

Reviewer notes:
```

---

## 5. Accessibility checklist

**Floor:** WCAG 2.2 Level AA. Accessibility ships with v1 of every primitive — not a follow-up PR.

### 5.1 Per-primitive requirements

- [ ] **Color contrast** — text ≥ 4.5:1 (normal), ≥ 3:1 (large text); UI components ≥ 3:1
- [ ] **Focus visible** — `:focus-visible` indicator on all interactive elements; never `outline: none` without replacement
- [ ] **Keyboard operable** — Tab order logical; Enter/Space activate; Escape closes overlays
- [ ] **Touch targets** — minimum 44×44px OR documented dense-mode exception (e.g. data tables)
- [ ] **Name, role, value** — native semantics or correct ARIA roles/states/properties
- [ ] **Labels** — every input has associated `<Label>` or `aria-label`; errors linked via `aria-describedby`
- [ ] **Loading / busy** — `aria-busy` where content is updating; disabled controls not focusable
- [ ] **Decorative icons** — `aria-hidden="true"` on SVG; meaning conveyed in visible text or parent label
- [ ] **Live regions** — toasts/status use `role="status"` or `aria-live="polite"` without stealing focus
- [ ] **Reduced motion** — animations respect `prefers-reduced-motion` (global policy in `globals.css`)

### 5.2 Overlay-specific (Dialog, Drawer, Popover)

- [ ] `role="dialog"` + `aria-modal="true"` where appropriate
- [ ] Focus trapped inside modal; focus restored on close
- [ ] Visible close control in addition to Escape / overlay click
- [ ] Scroll lock on body; scrollable regions inside panel
- [ ] Stacking uses `--z-overlay` / `--z-modal` — not ad-hoc 9999

### 5.3 Form-specific

- [ ] `Field` wires `id`, `aria-describedby`, `aria-invalid`, `aria-required`
- [ ] Error messages programmatically associated; not color-only
- [ ] Required fields indicated in label (not placeholder alone)

### 5.4 Page / shell requirements

- [ ] Single `<h1>` per route
- [ ] Landmark regions: `main`, `nav`, `aside` where appropriate
- [ ] Skip link on authenticated shells (target state per master roadmap)
- [ ] Page `<title>` reflects primary heading intent

### 5.5 Manual test script (minimum)

1. Tab through all interactive elements — focus ring visible at each stop  
2. Activate primary action with Enter/Space  
3. Open and close modal with keyboard only  
4. Run VoiceOver (macOS) or NVDA (Windows) spot-check on new primitive  
5. Zoom browser to 200% — layout usable, no clipped controls  

Document results in PR: "Keyboard + focus verified" or note gaps.

---

## 6. Visual consistency checklist

CloseBooks should feel like **one product** across marketing, auth, dashboard, review, and portal — with intentional theme boundaries.

### 6.1 Token fidelity

- [ ] Backgrounds use surface tokens (`--surface-canvas`, `--surface-raised`, `--surface-elevated`)
- [ ] Text uses hierarchy tokens (`--text-primary`, `--text-secondary`, `--text-muted`)
- [ ] Actions on cream use `--color-action-primary` (forest); marketing chrome may use `--color-brand-primary` (neon)
- [ ] Status uses paired tokens (`--color-success-bg` / `--color-success-fg`, etc.)
- [ ] Borders use `--border-default` or `--border-strong` — not one-off grays

### 6.2 Typography

- [ ] Body text `15px` / `--font-size-base` on dashboard
- [ ] Financial amounts use `--font-mono` + `tabular-nums`
- [ ] Headings use weight 600 + negative tracking per base reset
- [ ] Public/marketing pages use `[data-surface="public"]` type scale when on dark surfaces

### 6.3 Spacing & layout

- [ ] Vertical rhythm: `--space-4` between related fields, `--space-6`–`--space-8` between sections
- [ ] Page width via `PageContainer` widths (`sm`–`wide`) — not scattered 960/1100/1200px literals
- [ ] Card padding via `Card` `padding` prop — not arbitrary 20px/24px mix

### 6.4 Shape & elevation

- [ ] Controls: `--radius-md`; cards/modals: `--radius-lg`; pills: `--radius-full`
- [ ] Cards: `--shadow-sm`; modals: `--shadow-overlay` + `--z-modal`
- [ ] No new shadow strings

### 6.5 Motion

- [ ] UI feedback: `--duration-fast` (180ms)
- [ ] Panel enter: `--duration-base` (300ms) + `--ease-emphasized`
- [ ] No animation as sole indicator of state change

### 6.6 Theme boundaries (do not blur without approval)

| Surface | Theme | Action color |
|---|---|---|
| Dashboard content | Cream `:root` | Forest `--color-action-primary` |
| Marketing / auth | `[data-theme="dark"]` | Neon `--color-brand-primary` |
| Review content | Dark island | Token-unified review palette |
| Portal | Firm-branded light | Firm `primaryColor` (future token) |

### 6.7 Visual review questions

Ask before approving:

1. Would this look at home next to the playground example for the same primitive?  
2. Are we introducing a third button/modal/badge style?  
3. Does dark content appear inside cream chrome (or vice versa) without an explicit `data-theme` wrapper?  
4. Are emoji used where SVG icons are the standard (portal/client surfaces)?  

---

## 7. Rules for introducing new primitives

A **primitive** is the smallest reusable interactive or structural UI unit. If it appears in the playground, it is a primitive.

### 7.1 When to create a primitive

Create a new primitive when **all** are true:

1. Pattern appears in **≥2 places** OR is on the P0/P1 inventory in [master-roadmap.md](./master-roadmap.md)  
2. Pattern has a **stable API** (variants, sizes, states are identifiable)  
3. Pattern is **not domain-specific** (no GL codes, transaction status enums, etc.)  
4. Existing primitive cannot be extended with a variant without breaking callers  

Do **not** create a primitive for a one-off page layout or a single modal's bespoke chrome.

### 7.2 Required deliverables (same PR or stacked PR sequence)

| Deliverable | Location |
|---|---|
| Component implementation | `src/components/ui/<Name>.tsx` (interim) |
| Style module if non-trivial | `src/components/ui/<name>Styles.ts` |
| Gallery section | `/dashboard/design-system` playground section |
| API documentation | `docs/design-system/<name>.md` |
| Master roadmap inventory update | `master-roadmap.md` status column |

### 7.3 API design rules

- **Variants** encode visual intent (`primary`, `danger`, `outline`) — not page names  
- **Sizes** use a shared scale (`sm`, `md`, `lg`) aligned across Button/Input  
- **Composition** — prefer `CardHeader`/`CardBody`/`Field` wrappers over monolithic props  
- **`forwardRef`** required for inputs, buttons, links-as-buttons  
- **No data fetching** inside primitives  
- **No routing** inside primitives  
- **Token-only styles** inside the primitive file — zero hex literals  

### 7.4 Gallery requirements (before any consumer migration)

Every new primitive must appear in the playground with:

- Interactive example  
- Copy-ready code snippet  
- All variants  
- All states (default, hover/focus, disabled, loading, error, invalid as applicable)  
- Accessibility notes  

**Gallery before consumers** is mandatory. A primitive with zero gallery entry must not be imported from production routes.

### 7.5 Stacking PRs (allowed sequence)

When a primitive is large (e.g. Dialog system), split only along this order:

1. Tokens (if new semantics needed) — additive only  
2. Primitive + styles + gallery  
3. Documentation  
4. Consumer migrations (one surface per PR)  

Never ship step 4 in the same PR as step 2.

---

## 8. Rules for deprecating old components

Strangler-fig migration: **add new, migrate callers, delete old**. Never delete first.

### 8.1 Deprecation phases

| Phase | State | Caller rule |
|---|---|---|
| **Active** | Default | Use for all new work |
| **Deprecated** | Documented in component file + `migration-roadmap.md` | No new imports; migrate on touch |
| **Frozen** | No API changes except bugfixes | Migrate only in dedicated PRs |
| **Removed** | File deleted | Zero imports confirmed by grep/CI |

### 8.2 Before marking deprecated

- [ ] Replacement primitive is gallery-complete and documented  
- [ ] Migration path documented with before/after code sample  
- [ ] All P0 call sites identified in adoption audit or grep  

### 8.3 Before deleting

- [ ] `rg` / IDE find references returns **zero imports**  
- [ ] No dynamic imports or string-based paths  
- [ ] Related orphaned CSS removed (e.g. unused `.badge-*`)  
- [ ] `migration-roadmap.md` notes deletion and metric impact  
- [ ] One PR = deletion only (or deletion + last caller migration)  

### 8.4 Deprecation comment template

Add to the top of the legacy file:

```tsx
/**
 * @deprecated Use `Button` from `@/components/ui/Button`.
 * Migration guide: docs/design-system/button.md
 * Tracked: migration-roadmap.md — Wave C
 * Do not add new imports.
 */
```

### 8.5 Known legacy components (non-exhaustive)

| Legacy | Replacement | Status |
|---|---|---|
| Inline `#2d5a27` buttons | `Button variant="primary"` | Migrating |
| `DarkButton` / `DarkFormPrimitives` | `Button` / Input system | Adapter until auth migrated |
| Independent modals (49 files) | `Dialog` / `Drawer` | Primitive exists; callers not migrated |
| `StatusBadge.tsx` | `Badge` | Orphaned — delete when confirmed |
| Per-page `StatusBadge` copies | `Badge` | Per-file migration |
| `.badge-*` in globals.css | `Badge` component | Delete when unused |

---

## 9. Rules for token usage

**Source of truth:** `src/app/globals.css` (`:root`, `[data-theme="dark"]`, future firm scope).

### 9.1 Golden rules

1. **Read semantics, not literals** — `var(--text-primary)`, not `#1a1714`  
2. **Additive first** — new tokens alias existing computed values; no visual change in token-only PRs  
3. **No hex in component files** — primitives and migrated pages use `var(--*)` only  
4. **One concern per token PR** — spacing PR does not add color tokens  
5. **Document every new token** in [design-token-strategy.md](./design-token-strategy.md) or [semantic-color-tokens.md](./semantic-color-tokens.md)  

### 9.2 Which token when

| Need | Token |
|---|---|
| Page background (dashboard) | `--surface-canvas` / `--surface-base` |
| Card/panel background | `--surface-raised` |
| Inset wells, table headers | `--surface-elevated` |
| Primary body text | `--text-primary` |
| Secondary copy | `--text-secondary` |
| Hints, captions | `--text-muted` / `--text-tertiary` |
| Text on filled buttons | `--text-inverse` / `--accent-contrast` |
| Dashboard CTA fill | `--color-action-primary` |
| Marketing/chrome accent | `--color-brand-primary` |
| Focus ring | `--ring-focus` |
| Standard border | `--border-default` |
| Gap/padding | `--space-1` … `--space-16` |
| Corner radius | `--radius-sm|md|lg|full` |
| Elevation | `--shadow-sm|md|lg|overlay` |
| Layering | `--z-dropdown|sticky|overlay|modal|toast|max` |
| Animation duration | `--duration-fast|base|slow` |

### 9.3 Legacy aliases

Legacy `--color-paper`, `--color-ink`, `--color-accent` coexist during migration. **New code** should prefer semantic names (`--surface-canvas`, `--text-primary`, `--color-brand-primary`). Do not introduce new references to legacy names.

### 9.4 Theme scopes

| Scope | Mechanism | Rule |
|---|---|---|
| Cream dashboard | Default `:root` | Do not set `[data-theme="dark"]` on dashboard chrome |
| Dark marketing/review | `[data-theme="dark"]` on subtree | Use semantic tokens inside — never hardcode dark hex |
| Public type scale | `[data-surface="public"]` | Marketing headings only |
| Firm portal (future) | `[data-firm]` or inline CSS vars from settings | Never show CloseBooks branding to clients |

### 9.5 Inline styles

Inline `style={{}}` is **allowed** for layout (flex, grid, positioning). Inline styles are **not allowed** for:

- `color`, `backgroundColor`, `borderColor` with hex/rgb  
- `boxShadow` with ad-hoc strings  
- `zIndex` with number literals  
- `borderRadius` with px literals outside token values  

Prefer: `style={{ color: 'var(--text-primary)', gap: 'var(--space-4)' }}`.

### 9.6 Tailwind

Tailwind is installed but not the primary styling system. Do not:

- Add Tailwind color classes (`bg-green-500`) in migrated files  
- Mass-convert inline styles to Tailwind in design-system PRs  
- Introduce a third token namespace via `tailwind.config` without governance review  

### 9.7 Token change approval matrix

| Change type | Approval |
|---|---|
| Add alias, same computed value | Engineering only |
| Add new semantic token (unused) | Engineering only |
| Change computed value of existing token | Product + design |
| Remove token | Engineering + grep proving zero usage |
| Brand color unification | Product + design + executive sign-off |

---

## 10. Definition of Done

An item is **done** only when every criterion in its tier is met. Partial work stays `◐ In progress` in [master-roadmap.md](./master-roadmap.md).

### 10.1 Token PR — Done when

- [ ] New variables added to `globals.css` under documented namespace  
- [ ] Aliases preserve computed values (screenshot or computed-style proof for any swap)  
- [ ] Documented in `design-token-strategy.md` or color docs  
- [ ] `npm run build` passes  
- [ ] Playground foundation section updated if user-facing reference exists  
- [ ] No component callers changed unless PR is explicitly a swap PR  

### 10.2 Primitive — Done when

| Criterion | Requirement |
|---|---|
| **Accessibility** | §5 checklist complete |
| **Themes** | Renders on cream `:root` and `[data-theme="dark"]` (if applicable to primitive) |
| **States** | loading, disabled, invalid/error (or documented N/A) |
| **Keyboard** | Tab, Enter/Space, Escape per §5 |
| **Reduced motion** | Respects global policy |
| **Documentation** | `docs/design-system/<primitive>.md` with API table + token mapping |
| **Gallery** | Playground section: interactive demo, code, variants, states, a11y notes |
| **Token-only styles** | Zero hex in primitive implementation files |
| **forwardRef** | On Button, inputs, interactive controls |
| **Types exported** | Props interface + variant/size unions |
| **Build** | `npm run build` passes |

### 10.3 Composite — Done when

All primitive Done criteria, plus:

- [ ] Composes ≥2 primitives  
- [ ] Zero domain-specific copy or accounting semantics  
- [ ] Props are data-driven — no `fetch` inside  
- [ ] Gallery entry under playground (or documented under parent primitive)  

### 10.4 Business component — Done when

All composite Done criteria, plus:

- [ ] Domain meaning of variants documented  
- [ ] Used by ≥2 pages OR explicitly registered as shared widget in master roadmap  
- [ ] Token-only styles — no hex  

### 10.5 Page migration — Done when

- [ ] All UI controls on page use primitives (or documented exceptions)  
- [ ] No new hex in migrated file(s)  
- [ ] §3 Migration checklist complete  
- [ ] Visual parity verified  
- [ ] `migration-roadmap.md` updated  

### 10.6 Shell — Done when

- [ ] Layout contracts from master roadmap §6 implemented  
- [ ] Skip link present (authenticated shells)  
- [ ] Theme scope documented and correct  
- [ ] Z-index and modal hosting follow contract  
- [ ] At least one child route migrated as reference (if new shell)  

### 10.7 Documentation-only PR — Done when

- [ ] Factually consistent with codebase and other docs  
- [ ] Linked from `docs/design-system/README.md`  
- [ ] No contradictions with master roadmap (update roadmap if policy changes)  
- [ ] `npm run build` not required if zero code — but run if any code touched  

---

## 11. Quick reference — mandatory rules (effective now)

| Rule | Details |
|---|---|
| No new inline colors | `var(--*)` or primitives only |
| No new radius values | `--radius-sm\|md\|lg\|full` |
| No new spacing values | `--space-*` (1px borders excepted) |
| No new modals | `Dialog` / `Drawer` |
| No new buttons | `Button` |
| No new badges | `Badge` |
| No new z-index literals | `--z-dropdown` … `--z-max` |
| One PR = one concern | Token OR primitive OR consumer OR shell |
| Gallery before consumers | Playground complete first |
| Strangler fig | Zero imports before delete |
| Build gate | `npm run build` must pass |

---

## 12. Related documents

| Document | Role |
|---|---|
| [Master Roadmap](./master-roadmap.md) | Architecture, inventory, waves, high-level governance |
| [Migration Roadmap](./migration-roadmap.md) | PR log, metrics, phase tracking |
| [Design Token Strategy](./design-token-strategy.md) | Token namespaces, adoption phases |
| [Color Architecture](./color-architecture.md) | Dual-green state, brand decisions |
| [Adoption Audit](./adoption-audit.md) | Duplication analysis, conversion priority |
| Playground `/dashboard/design-system` | Live primitive catalog |

---

## 13. Revision history

| Date | Change |
|---|---|
| 2026-07-09 | Initial engineering governance document — checklists, rules, Definition of Done |
