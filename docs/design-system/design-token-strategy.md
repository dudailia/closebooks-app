# Design Token Strategy

How CloseBooks will move from scattered inline styles to a single, enforceable token layer — without breaking the product.

---

## Current state

Tokens are **partially defined** in `src/app/globals.css` but **rarely consumed**. The codebase uses two parallel naming schemes and three styling runtimes:

| Layer | Location | Adoption |
|---|---|---|
| Legacy palette | `--color-accent`, `--color-paper`, `--color-ink`, … | Referenced in base CSS and a few utilities |
| Semantic surfaces | `--surface-*`, `--text-*`, `--accent`, `--danger`, … | Review surface + ~15 files |
| Public type scale | `.t-display` … `.t-caption` under `[data-surface="public"]` | **Defined, zero component usage** |
| Inline styles | `style={{ … }}` across 258 files | Dominant pattern |
| Tailwind 3.4 | Installed, sparse usage | Junk-drawer utility classes |

### Baseline metrics (2026-07-06, `src/`)

| Metric | Count |
|---|---|
| Hex color literals (`#rgb` / `#rrggbb` / `#rrggbbaa`) | **10,376** across **273** files |
| Inline `style={{` blocks | **7,639** across **258** files |
| `var(--*)` token references | **687** across **138** files |
| Hardcoded `backgroundColor: '#…'` | **1,478** occurrences |
| Modal implementations (`.tsx` files matching `Modal`) | **49** files |

**Token adoption rate:** ~6.2% of color usage is tokenized (`687` var refs vs `10,376` hex literals). The gap is the primary craft problem.

---

## Token architecture (target)

### Namespace consolidation

Migrate toward a single semantic namespace. Legacy `--color-*` vars become aliases during transition, then are removed.

```
Brand & action
  --color-brand          # marketing / chrome accent (see color-architecture.md)
  --color-action         # dashboard CTA on cream surfaces
  --color-brand-soft     # tinted backgrounds
  --color-brand-contrast # text on brand fills

Surfaces
  --surface-canvas       # page background
  --surface-raised       # cards, panels
  --surface-elevated     # popovers, dropdowns
  --surface-overlay      # modal scrim

Text
  --text-primary
  --text-secondary
  --text-tertiary
  --text-inverse

Border
  --border-default
  --border-subtle
  --border-strong

Feedback
  --color-success-{bg,fg}
  --color-warning-{bg,fg}
  --color-danger-{bg,fg}
  --color-info-{bg,fg}

Layout
  --space-1 … --space-16     # 4px grid
  --radius-sm/md/lg/full
  --shadow-sm/md/lg/overlay
  --z-dropdown/sticky/overlay/modal/toast

Typography
  --font-family-sans|display|mono
  --font-size-xs … --font-size-display
  --line-height-tight|normal|relaxed

Motion
  --ease-out
  --duration-fast|base|slow
  --transition-enter|exit
```

### Theme contract

| Theme | Scope | Trigger |
|---|---|---|
| `light` | Dashboard content (cream) | Default `:root` |
| `dark` | Marketing, review surface | `[data-theme="dark"]` (existing) |
| `firm` | Portal client UI | Firm `primaryColor` from `firm_settings` (future) |

`[data-surface="public"]` remains for landing type-scale scoping until type tokens replace `.t-*` classes.

---

## Adoption rules

### Phase 1 — Additive only

- New CSS variables **alias existing computed values** — no visual change.
- Hex → `var()` swaps allowed only when the resolved color is identical.
- No component rewrites.

### Phase 2 — Primitives read tokens

- New primitives in `src/design-system/primitives/` consume `var(--*)` from day one.
- Primitives render pixel-identical to the dominant existing pattern before any caller migration.
- Legacy components remain until callers migrate.

### Phase 3 — Page-by-page migration

- One page or one modal per PR.
- Touch a file → replace inline values with primitives or tokens.
- No new hardcoded hex in migrated files.

### Phase 4 — Enforcement

- ESLint: warn on new hex in `src/**` (Phase 3 late), error (Phase 4).
- Delete orphaned CSS (`.badge-*` if unused), adapters, and legacy aliases.
- Delete `StatusBadge.tsx` and similar dead components only when zero imports remain.

---

## What we are not doing

| Anti-pattern | Why |
|---|---|
| Big-bang rewrite of `TransactionTable` | Highest regression risk; deferred to Phase 4 |
| Mass Tailwind conversion | Two runtimes already; adding a third enforcement layer creates churn |
| Deleting `DarkFormPrimitives` early | Auth + landing depend on it; adapter until primitives proven |
| Changing computed colors during token PRs | Violates no-visual-regression rule |
| Finalizing brand color in token PRs | Product/design decision — documented, not decided (see color-architecture.md) |

---

## PR checklist (every migration PR)

- [ ] `npm run build` passes
- [ ] Single logical concern
- [ ] No unintended visual change (screenshot or manual check)
- [ ] Accessibility preserved (focus, contrast, ARIA, keyboard)
- [ ] Responsiveness preserved
- [ ] Animations preserved (or replaced at equivalent timing)
- [ ] `migration-roadmap.md` log updated

---

## Success metrics

Track in `migration-roadmap.md` after each PR:

| Metric | Baseline (2026-07-06) | Target (Phase 3 end) |
|---|---|---|
| Hex literals in `src/` | 10,376 | < 4,000 |
| Files with hex | 273 | < 100 |
| `var(--*)` references | 687 | > 3,000 |
| Inline `style={{` blocks | 7,639 | Declining (not zero — inline layout OK) |
| Modal files | 49 | ≤ 12 (via `Dialog` primitive) |
| Orphaned components | ≥ 1 (`StatusBadge.tsx`) | 0 |
