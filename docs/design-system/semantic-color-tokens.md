# Semantic Color Tokens (PR 3)

Additive CSS custom properties in `src/app/globals.css`. **No components consume these yet.** Final brand color unification is a **future product/design decision** — this document describes current state, not a target palette.

---

## Brand

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--color-brand-primary` | `var(--color-accent)` → **#00C853** | Marketing/chrome accent: landing CTAs, sidebar active state, focus rings, dark-surface highlights | Replace inline `#00C853` on marketing/auth surfaces first. Already partially tokenized as `--accent`. |
| `--color-brand-product` | **#2d5a27** (literal) | Product/dashboard identity: forest green on cream backgrounds | **837** hardcoded refs today. Alias does not tokenize usage yet. Do not merge with `--color-brand-primary` without product approval. |
| `--color-brand-muted` | `var(--color-accent-light)` → **#e8f0e6** | Soft green tint backgrounds paired with forest text | Used with `#2d5a27` text in ref/certification pages. |

### Dual-green status

| Hex | Role (semantic, not final) | Tokenized? |
|---|---|---|
| #00C853 | Brand primary (marketing) | Yes (`--color-brand-primary`) |
| #2d5a27 | Brand product / action primary | Partial (`--color-brand-product`, `--color-action-primary`) |

**UNDECIDED:** Whether to unify to one green. Migration uses role-based aliases to preserve current pixels.

---

## Actions

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--color-action-primary` | **#2d5a27** | Primary button/link fill on cream dashboard surfaces | Dominant CTA color in `app/dashboard/**`. Map before `--color-brand-product` in button primitives. |
| `--color-action-hover` | **#245020** | Hover state for forest action buttons | From `connect/page.tsx` `onMouseEnter` pattern. Not universal — audit per surface before migration. |
| `--color-action-disabled` | `var(--color-warm)` → **#e8e0d4** | Disabled primary button fill | `DarkFormPrimitives` uses `opacity: 0.55` instead of a fill swap — preserve both patterns until Button primitive unifies. |

---

## Surfaces

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--surface-canvas` | `var(--surface-base)` → **#faf8f4** | Page-level background (dashboard cream) | Replace `#faf8f4` and `var(--color-paper)` inline refs. |
| `--surface-raised` | `var(--surface-card)` → **#ffffff** | Cards, panels, modals on canvas | Replace inline `#fff` / `#ffffff` card backgrounds. |
| `--surface-overlay` | *(pre-defined)* `rgba(26,23,20,0.45)` | Modal/drawer scrim on light theme | **Already exists** in `:root` (line 25). Dark theme: `rgba(0,0,0,0.75)`. Do not redefine — use existing var. |

Also pre-defined (not duplicated in PR 3):

| Token | Light value |
|---|---|
| `--surface-base` | #faf8f4 |
| `--surface-card` | #ffffff |
| `--surface-elevated` | #f5f0ea |

---

## Text

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--text-primary` | *(pre-defined)* **#1a1714** | Body copy, headings | Already in `:root`. Dark: `#FAFAFA`. |
| `--text-secondary` | *(pre-defined)* **#6b6560** | Secondary labels, descriptions | Already in `:root`. Dark: `#888888`. |
| `--text-muted` | `var(--text-tertiary)` → **#a09a94** | Captions, hints, de-emphasized | Alias for `--text-tertiary`. Prefer `--text-muted` in new code. |
| `--text-inverse` | **#ffffff** | Text on filled brand/action buttons | Pair with `--color-action-primary` or `--color-brand-primary` fills. |

Legacy aliases still present: `--color-ink`, `--color-ink-muted`, `--color-ink-faint`.

---

## Borders

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--border-default` | `var(--color-border)` → **#e0dbd4** | Standard card/input borders | Consolidate `#e8e0d4` (`--color-warm`) usage — document per context before merging. |
| `--border-strong` | *(pre-defined)* `rgba(26,23,20,0.14)` | Emphasized dividers | Already in `:root`. Dark: `#1f1f1f`. |

Known duplication: `#e8e0d4` used interchangeably with `#e0dbd4` — border consolidation is a future PR.

---

## Status

Matches `.badge-approved`, `.badge-pending`, `.badge-flagged` in `globals.css` `@layer components` (currently **unused** in components).

| Token | Source value | Intended meaning | Migration notes |
|---|---|---|---|
| `--color-success-bg` | **#dcfce7** | Success badge/alert background | Wire to `Badge` primitive `variant="success"`. |
| `--color-success-fg` | **#166534** | Success text | Used in portal close-status, `AdvisoryMemoViewer`. |
| `--color-warning-bg` | **#fef9c3** | Warning/pending background | Matches `.badge-pending`. |
| `--color-warning-fg` | **#854d0e** | Warning/pending text | Dark theme `--warning` flips to `#F59E0B` — status tokens are light-theme values only for now. |
| `--color-danger-bg` | **#fee2e2** | Error/flagged background | Matches `.badge-flagged`. |
| `--color-danger-fg` | `var(--danger)` → **#991b1b** | Error/flagged text | Dark: `#FF4444`. |

---

## Pre-existing tokens (not redefined in PR 3)

These were defined before PR 3 and remain the source of truth. PR 3 semantic tokens alias where noted.

| Category | Tokens |
|---|---|
| Legacy palette | `--color-accent`, `--color-paper`, `--color-ink`, … |
| Semantic (partial) | `--accent`, `--danger`, `--warning`, `--surface-*`, `--text-primary`, `--border-strong` |
| Dark theme | `[data-theme="dark"]` block — **not modified in PR 3** |

---

## Migration priority (future PRs)

1. `--color-action-primary` / `--color-action-hover` — dashboard buttons (highest volume)
2. `--surface-canvas` / `--surface-raised` — layout shells
3. `--text-muted` / `--border-default` — form fields
4. `--color-brand-primary` — marketing (partially done via `--accent`)
5. Status tokens — badge primitive consolidation
6. `--color-brand-product` — only after product/design rules on dual-green strategy

---

## References

- [Color architecture](./color-architecture.md) — dual-green audit
- [Design token strategy](./design-token-strategy.md) — adoption rules
- [Migration roadmap](./migration-roadmap.md) — PR log
