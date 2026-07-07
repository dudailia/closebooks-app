# Badge primitive

**File:** `src/components/ui/Badge.tsx`  
**Gallery:** `/dashboard/design-system` (Badge section)  
**Status:** PR 10 — zero production consumers

---

## API

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `success` \| `warning` \| `danger` \| `info` \| `neutral` | `neutral` | Semantic tone |
| `appearance` | `filled` \| `outline` | `filled` | Filled background vs bordered |
| `compact` | `boolean` | `false` | Tighter padding for counts and tabs |
| `icon` | `ReactNode` | — | Leading icon (`aria-hidden`) |
| `dot` | `boolean` | `false` | Status dot before label (hidden when `icon` set) |
| `children` | `ReactNode` | — | Badge label |

Extends native `<span>` attributes. Supports `forwardRef`.

---

## Variants → tokens

| Variant | Filled background | Filled / outline text | Outline border |
|---|---|---|---|
| `success` | `--color-success-bg` | `--color-success-fg` | `--color-success-fg` |
| `warning` | `--color-warning-bg` | `--color-warning-fg` | `--color-warning-fg` |
| `danger` | `--color-danger-bg` | `--color-danger-fg` | `--color-danger-fg` |
| `info` | `--color-info-bg` | `--color-info-fg` | `--color-info-fg` |
| `neutral` | `--color-neutral-bg` | `--color-neutral-fg` | `--border-default` |

`info` and `neutral` tokens added in PR 10 (`globals.css`).

---

## Sizes

| Mode | Padding | Font | Min height | Icon |
|---|---|---|---|---|
| Default | `--space-1` `--space-2` | `--font-size-xs` | `--space-6` | 12px |
| `compact` | `0` `--space-2` | `--font-size-xs` | `--space-5` | 10px |

Radius: `--radius-full` (pill).

---

## Example

```tsx
<Badge variant="success" dot>Approved</Badge>
<Badge variant="warning" appearance="outline" icon={<ClockIcon />}>Pending</Badge>
<Badge variant="danger" compact>3</Badge>
```

---

## Accessibility

- Renders a `<span>` — decorative when adjacent to descriptive text
- Icons and dots are `aria-hidden`
- For live status updates, set `role="status"` and `aria-live="polite"` on the parent or pass via `...rest`
- Sufficient contrast on filled variants (matches existing `.badge-*` palette)

---

## Migration notes

| Legacy | Target |
|---|---|
| `TransactionRow` StatusPill | `Badge` with `dot` + variant mapping |
| `.badge-approved` / `.badge-pending` CSS | `success` / `warning` filled |
| `.badge-edited` | `info` filled |
| `.badge-flagged` | `danger` filled |
| Inline status badges across dashboard | `variant` + `appearance` |

| Transaction status | Badge variant |
|---|---|
| `approved` | `success` |
| `pending` | `warning` |
| `flagged` | `danger` |
| `edited` | `info` |

First consumer migration (planned): `TransactionRow` StatusPill → `Badge`.
