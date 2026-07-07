# Input system primitives

**Files:** `src/components/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Label.tsx`, `Field.tsx`, `HelperText.tsx`, `ErrorMessage.tsx`  
**Gallery:** `/dashboard/design-system` (Input system section)  
**Status:** PR 7 — zero production consumers

---

## Components

| Component | Element | Purpose |
|---|---|---|
| `Input` | `<input>` | Single-line text, email, password, number, etc. |
| `Textarea` | `<textarea>` | Multi-line text |
| `Select` | `<select>` | Native dropdown with chevron affordance |
| `Label` | `<label>` | Accessible field label |
| `Field` | wrapper | Composes label + control + helper + error with ARIA wiring |
| `HelperText` | `<p>` | Hint text below a control |
| `ErrorMessage` | `<p role="alert">` | Validation error below a control |

Barrel export: `src/components/ui/index.ts`

---

## Shared API (Input, Textarea, Select)

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `default` \| `brand` | `default` | Cream dashboard vs dark auth surface |
| `size` | `sm` \| `md` \| `lg` | `md` | Padding and type scale |
| `invalid` | `boolean` | `false` | Danger border + `aria-invalid` |
| `loading` | `boolean` | `false` | Spinner; disables interaction |
| `disabled` | `boolean` | `false` | Native disabled + reduced opacity |
| `readOnly` | `boolean` | `false` | Read-only with elevated background |
| `required` | `boolean` | `false` | Native required + `aria-required` |

`Input` and `Select` additionally support `leftIcon` / `rightIcon` (`ReactNode`). Icons are decorative (`aria-hidden`).

All controls extend native element attributes and support `forwardRef`.

---

## Field API

| Prop | Type | Description |
|---|---|---|
| `label` | `ReactNode` | Renders `Label` above control |
| `htmlFor` / `id` | `string` | Control id; auto-generated if omitted |
| `tone` | `default` \| `brand` | Passed to `Label` |
| `helperText` | `ReactNode` | Renders `HelperText` with `{id}-helper` |
| `error` | `ReactNode` | Renders `ErrorMessage` with `{id}-error`; sets `invalid` |
| `required` | `boolean` | Passed to label + control |
| `children` | single control | Cloned with `id`, `aria-describedby`, `aria-invalid` |

### Example

```tsx
<Field
  label="Email"
  required
  helperText="We never share your email."
  error={errors.email}
>
  <Input type="email" placeholder="you@example.com" />
</Field>
```

---

## Tones → tokens

| Tone | Background | Border | Focus border | Focus ring |
|---|---|---|---|---|
| `default` | `--surface-canvas` | `--color-warm` | `--color-brand-product` | `--ring-soft` |
| `brand` | `rgba(255,255,255,0.04)` | `--border-strong` | `--ring-focus` | `--ring-soft` |

Invalid (both tones): border `--color-danger-fg`, focus ring `--danger-soft`.

---

## Sizes → tokens

| Size | Padding | Font | Min height |
|---|---|---|---|
| `sm` | `--space-2` `--space-3` | `--font-size-sm` | `--space-9` |
| `md` | `--space-3` `--space-4` | `--font-size-sm` | `--space-11` |
| `lg` | `--space-4` `--space-5` | `--font-size-base` | `--space-12` |

Radius: `--radius-md` on all sizes.

---

## Label tones

| Tone | Style | Tokens |
|---|---|---|
| `default` | Sentence case, dashboard | `--font-size-sm`, `--font-weight-medium`, `--text-primary` |
| `brand` | Uppercase, auth | `--font-size-xs`, `--font-weight-semibold`, `--text-secondary`, `0.14em` tracking |

Required fields append a visual `*` (`aria-hidden`) on the label.

---

## Accessibility

- Native form elements with explicit `aria-invalid`, `aria-required`, `aria-busy`, `aria-disabled`
- `Field` wires `aria-describedby` to helper and error ids
- `ErrorMessage` uses `role="alert"` and `aria-live="polite"`
- Keyboard focus ring via `.cb-input:focus-visible` in `globals.css` (replaces global outline on inputs)
- Icon slots are `aria-hidden` and `pointer-events: none`
- `Select` uses native keyboard navigation (arrow keys, typeahead)
- Loading state disables the control and sets `aria-busy`

---

## CSS class

All controls carry class `cb-input` plus `data-tone` and `data-invalid` attributes for focus styling:

```css
.cb-input[data-tone="default"]:focus-visible { border-color: var(--color-brand-product); }
.cb-input[data-tone="brand"]:focus-visible { border-color: var(--ring-focus); }
```

---

## Migration notes

| Surface | Target tone | Reference |
|---|---|---|
| Dashboard forms (`settings/page.tsx`) | `default` | `#e8e0d4` border → `--color-warm`; focus `#2d5a27` → `--color-brand-product` |
| Auth dark forms (`DarkFormPrimitives`) | `brand` | `DarkInput`, `DarkSelect`, `DarkLabel` |
| Portal / client-facing | `default` + firm tokens (future) | — |

First consumer migration (planned PR 8): `(auth)/signup/page.tsx` → `Button` + `Input` with pixel parity.
