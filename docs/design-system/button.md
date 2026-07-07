# Button primitive

**File:** `src/components/ui/Button.tsx`  
**Gallery:** `/dashboard/design-system`  
**Status:** PR 5 — zero production consumers

---

## API

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `danger` \| `brand` \| `brand-ghost` | `primary` | Visual style |
| `size` | `sm` \| `md` \| `lg` | `md` | Padding and type scale |
| `loading` | `boolean` | `false` | Shows spinner; disables interaction |
| `fullWidth` | `boolean` | `false` | `width: 100%` |
| `disabled` | `boolean` | `false` | Native disabled + reduced opacity |

Extends native `<button>` attributes. Supports `forwardRef`.

---

## Variants → tokens

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| `primary` | `--color-action-primary` | `--text-inverse` | transparent | `--color-action-hover` |
| `secondary` | `--surface-raised` | `--text-primary` | `--border-default` | `--surface-elevated` |
| `ghost` | transparent | `--text-secondary` | transparent | `--surface-elevated` |
| `danger` | `--color-danger-fg` | `--text-inverse` | transparent | `brightness(0.92)` |
| `brand` | gradient `--color-brand-primary` → `--color-accent-dark` | `#00110A` | none | lift + glow |
| `brand-ghost` | `rgba(255,255,255,0.04)` | `--text-primary` (dark) | `--border-strong` | brighter fill |

### Auth surfaces (`brand` / `brand-ghost`)

Match legacy `DarkButton` on `PublicShell` / `[data-theme="dark"]`. Use `style={{ padding: '12px 18px', fontSize: 14, borderRadius: 10 }}` for pixel parity until a dedicated `size="auth"` is added.

---

## Sizes → tokens

| Size | Padding | Font | Radius |
|---|---|---|---|
| `sm` | `--space-2` `--space-3` | `--font-size-sm` | `--radius-sm` |
| `md` | `--space-3` `--space-5` | `--font-size-base` | `--radius-md` |
| `lg` | `--space-4` `--space-6` | `--font-size-md` | `--radius-md` |

---

## Accessibility

- Native `<button>` with explicit `type="button"` default
- `disabled` + `aria-busy` when loading
- `aria-disabled` when disabled or loading
- Focus ring via global `:focus-visible` (`--ring-focus`)
- Loading spinner marked `aria-hidden`; label remains in button text
- Global `min-height: 44px` on buttons from `globals.css` base layer

---

## Migration notes

| Surface | Target variant | Notes |
|---|---|---|
| Dashboard CTAs | `primary` | Replaces inline `#2d5a27` |
| Outlined actions | `secondary` | Replaces white + border cards |
| Tertiary / cancel | `ghost` | |
| Delete / destructive | `danger` | |
| Auth dark forms | `brand` / `brand-ghost` | Migrated: `login/page.tsx` (PR 6) |

First consumer migration (PR 6): `(auth)/login/page.tsx` ✓  
Next: `(auth)/signup/page.tsx`.
