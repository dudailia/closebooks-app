# Card system primitives

**Files:** `src/components/ui/Card.tsx`, `CardHeader.tsx`, `CardBody.tsx`, `CardFooter.tsx`, `StatCard.tsx`, `SectionCard.tsx`  
**Gallery:** `/dashboard/design-system` (Card system section)  
**Status:** PR 8 — zero production consumers

---

## Components

| Component | Purpose |
|---|---|
| `Card` | Base surface shell — polymorphic `div`, `button`, or `a` |
| `CardHeader` | Title block with optional eyebrow, icon, description, action |
| `CardBody` | Main content region |
| `CardFooter` | Footer strip with optional divider and muted background |
| `StatCard` | KPI tile — label, value, subtext, optional icon/trend |
| `SectionCard` | Dashboard section panel — composes Card + header/body/footer |

Barrel export: `src/components/ui/index.ts`

---

## Card API

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `default` \| `raised` \| `outlined` \| `ghost` \| `interactive` | `default` | Visual style |
| `padding` | `none` \| `sm` \| `md` \| `lg` | `md` | Inner padding on shell |
| `href` | `string` | — | Renders `<a>` with inherited color |
| `onClick` | `function` | — | Renders `<button type="button">` |

Extends native element attributes. Supports `forwardRef`.

Use `padding="none"` when composing `CardHeader` / `CardBody` / `CardFooter`.

---

## Variants → tokens

| Variant | Background | Border | Shadow | Interaction |
|---|---|---|---|---|
| `default` | `--surface-raised` | `--color-warm` | none | — |
| `raised` | `--surface-raised` | `--border-default` | `--shadow-sm` | — |
| `outlined` | `--surface-canvas` | `--border-default` | none | — |
| `ghost` | transparent | transparent | none | — |
| `interactive` | `--surface-raised` | `--color-warm` | none | hover border `--warning`, shadow `--shadow-md` |

Radius: `--radius-lg` on all variants.

Interactive / link / button cards use `.cb-card:focus-visible` for keyboard rings (`--color-brand-product`, `--ring-soft`).

---

## Padding → tokens

| Padding | Value |
|---|---|
| `none` | `0` |
| `sm` | `--space-4` |
| `md` | `--space-5` |
| `lg` | `--space-6` |

---

## CardHeader API

| Prop | Type | Description |
|---|---|---|
| `title` | `ReactNode` | Primary heading (`<h3>`) |
| `description` | `ReactNode` | Muted subcopy |
| `eyebrow` | `ReactNode` | Uppercase label above title |
| `icon` | `ReactNode` | Leading icon slot (`aria-hidden`) |
| `action` | `ReactNode` | Trailing action slot (e.g. button) |
| `divider` | `boolean` | Bottom border below header |
| `children` | `ReactNode` | Custom layout (overrides slots) |

---

## CardBody / CardFooter

| Component | Key props |
|---|---|
| `CardBody` | `compact` — reduces bottom padding when a footer follows |
| `CardFooter` | `divider` (default `true`), `muted` — `--surface-elevated` background |

---

## StatCard API

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `ReactNode` | — | Metric name |
| `value` | `ReactNode` | — | Primary figure (mono) |
| `sub` | `ReactNode` | — | Secondary caption |
| `icon` | `ReactNode` | — | Leading icon |
| `trend` | `ReactNode` | — | Delta / trend line |
| `tone` | `default` \| `positive` \| `muted` | `default` | Value color |
| `variant` | `CardVariant` | `default` | Passed to inner Card |

Matches `dashboard/page.tsx` stat tile layout.

---

## SectionCard API

| Prop | Type | Description |
|---|---|---|
| `title` | `ReactNode` | Section heading |
| `description` | `ReactNode` | Subcopy below title |
| `eyebrow` | `ReactNode` | Optional label above title |
| `icon` | `ReactNode` | Leading icon tile |
| `action` | `ReactNode` | Header action slot |
| `footer` | `ReactNode` | Renders `CardFooter` |
| `variant` | `CardVariant` | Card shell variant |
| `children` | `ReactNode` | Body content |

Matches dashboard section panels (e.g. Client Upload Portal block).

---

## Example

```tsx
<Card variant="raised" padding="none">
  <CardHeader title="March close" description="12 clients" divider action={<Button size="sm">Export</Button>} />
  <CardBody>…</CardBody>
  <CardFooter muted>Updated 2h ago</CardFooter>
</Card>
```

---

## Accessibility

- `Card` renders semantic `<button>` or `<a>` when `onClick` / `href` provided
- Interactive variant + hover/focus styles on keyboard tab
- Icons in header/stat slots marked `aria-hidden`
- Section titles use `<h3>` inside `CardHeader`
- `CardFooter` with actions should contain focusable controls

---

## Migration notes

| Surface | Target | Reference |
|---|---|---|
| Dashboard stat row | `StatCard` | `dashboard/page.tsx` inline tiles |
| Dashboard sections | `SectionCard` | Portal block, settings panels |
| Quick action links | `Card variant="interactive" href` | `QuickActions` hover cards |
| Legacy CSS | `Card variant="raised"` | `.surface-raised` in globals.css |

First consumer migration (planned): `dashboard/page.tsx` stat row → `StatCard`.
