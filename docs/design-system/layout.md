# Layout primitives

**Files:** `src/components/ui/PageContainer.tsx`, `PageHeader.tsx`, `PageSection.tsx`, `PageActions.tsx`, `PageGrid.tsx`, `EmptyState.tsx`  
**Gallery:** `/dashboard/design-system` (Layout system section)  
**Status:** PR 11 — zero production consumers

---

## Components

| Component | Purpose |
|---|---|
| `PageContainer` | Centered max-width shell with responsive horizontal padding |
| `PageHeader` | Page title block with eyebrow, description, actions |
| `PageSection` | Grouped section with optional header and divider |
| `PageActions` | Responsive action button row |
| `PageGrid` | Auto-fit or fixed-column responsive grid |
| `EmptyState` | Zero-data placeholder with icon + CTA |

---

## PageContainer

| Prop | Type | Default | Description |
|---|---|---|---|
| `as` | `main` \| `div` \| `section` | `main` | Root element |
| `width` | `sm` \| `md` \| `lg` \| `xl` \| `wide` | `lg` | Max width |
| `padded` | `boolean` | `true` | Vertical padding (`--space-8`) |

### Width → max-width

| Width | Value | Typical use |
|---|---|---|
| `sm` | 640px | Settings, narrow forms |
| `md` | 960px | Design system, connect docs |
| `lg` | 1100px | Default dashboard pages |
| `xl` | 1200px | Team, tax-draft, clients |
| `wide` | 1400px | Review surface |

Horizontal padding: `--space-4` mobile, `--space-6` ≥640px (`.cb-page-container`).

---

## PageHeader

| Prop | Type | Description |
|---|---|---|
| `title` | `ReactNode` | `<h1>` page title |
| `description` | `ReactNode` | Supporting copy |
| `eyebrow` | `ReactNode` | Uppercase label above title |
| `actions` | `ReactNode` | Trailing slot (wrap `PageActions`) |

Responsive: title and actions stack on narrow viewports via `flex-wrap`.

---

## PageSection

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — | `<h2>` section title |
| `description` | `ReactNode` | — | Section subcopy |
| `actions` | `ReactNode` | — | Trailing actions |
| `divider` | `boolean` | `false` | Top border before section |

---

## PageActions

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `start` \| `end` \| `between` \| `center` | `end` | Horizontal alignment |
| `gap` | `sm` \| `md` \| `lg` \| `xl` | `sm` | Gap between controls |
| `wrap` | `boolean` | `true` | Allow wrapping on narrow screens |

Renders `role="group"`.

---

## PageGrid

| Prop | Type | Default | Description |
|---|---|---|---|
| `gap` | `sm` \| `md` \| `lg` \| `xl` | `md` | Grid gap |
| `minColumnWidth` | `string` | `260px` | Auto-fit minimum (when `columns` omitted) |
| `columns` | `2` \| `3` \| `4` | — | Fixed columns with responsive breakpoints |

Auto-fit mode: `repeat(auto-fit, minmax(min(100%, N), 1fr))`.

Fixed columns: 1 col mobile → 2 cols tablet → 3/4 cols desktop (`.cb-page-grid` CSS).

---

## EmptyState

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | — | Leading illustration |
| `title` | `ReactNode` | — | Heading |
| `description` | `ReactNode` | — | Supporting text |
| `action` | `ReactNode` | — | Custom CTA |
| `actionLabel` + `onAction` | — | — | Shorthand `Button` CTA |
| `variant` | `card` \| `dashed` | `dashed` | Shell style |

`dashed` variant uses `role="status"` for screen readers.

---

## Example

```tsx
<PageContainer width="xl">
  <PageHeader
    title="Clients"
    description="Manage your portfolio."
    actions={
      <PageActions>
        <Button variant="secondary">Export</Button>
        <Button>Add client</Button>
      </PageActions>
    }
  />
  <PageSection title="Overview">
    <PageGrid gap="md">
      <StatCard label="Active" value="24" />
    </PageGrid>
  </PageSection>
</PageContainer>
```

---

## Migration notes

| Legacy pattern | Target |
|---|---|
| Inline `maxWidth: 1200, margin: '0 auto'` | `PageContainer width="xl"` |
| Per-page title + button rows | `PageHeader` + `PageActions` |
| `team/page.tsx` EmptyState | `EmptyState` dashed variant |
| Ad-hoc CSS grids | `PageGrid` |

First consumer migration (planned): `dashboard/team/page.tsx` → layout primitives.
