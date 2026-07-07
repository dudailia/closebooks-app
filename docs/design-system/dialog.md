# Dialog system primitives

**Files:** `src/components/ui/Dialog.tsx`, `Drawer.tsx`, `ConfirmationDialog.tsx`, `ModalHeader.tsx`, `ModalBody.tsx`, `ModalFooter.tsx`, `Overlay.tsx`, `FocusTrap.tsx`, `Portal.tsx`  
**Gallery:** `/dashboard/design-system` (Dialog system section)  
**Status:** PR 9 — zero production consumers

---

## Components

| Component | Purpose |
|---|---|
| `Portal` | Renders children into `document.body` via `createPortal` |
| `Overlay` | Full-screen backdrop using `--surface-overlay` |
| `FocusTrap` | Traps Tab focus inside a container; restores on unmount |
| `ModalHeader` | Title, description, optional close button |
| `ModalBody` | Scrollable content region |
| `ModalFooter` | Action strip with muted background |
| `Dialog` | Centered modal — composes Portal + Overlay + FocusTrap |
| `Drawer` | Edge panel (`left` / `right` / `bottom`) |
| `ConfirmationDialog` | Preset confirm/cancel dialog |

Supporting modules: `modalStack.ts` (z-index stacking, scroll lock), `useModalEffects.ts` (ESC + scroll lock), `dialogStyles.ts`.

---

## Dialog API

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | — | Controls visibility |
| `onOpenChange` | `(open: boolean) => void` | — | Called on dismiss |
| `size` | `sm` \| `md` \| `lg` \| `xl` | `md` | Max width |
| `dismissOnEscape` | `boolean` | `true` | ESC closes when topmost |
| `dismissOnOverlayClick` | `boolean` | `true` | Backdrop click closes when topmost |
| `labelledBy` | `string` | auto | `aria-labelledby` — match `ModalHeader` `titleId` |
| `describedBy` | `string` | auto | `aria-describedby` — match `ModalHeader` `descriptionId` |
| `label` | `string` | `Dialog` | `aria-label` fallback when no title id |

---

## Drawer API

| Prop | Type | Default | Description |
|---|---|---|---|
| `side` | `left` \| `right` \| `bottom` | `right` | Panel edge |
| `size` | `sm` \| `md` \| `lg` | `md` | Panel width / height |

All Dialog props except `size` mapping apply (`dismissOnEscape`, `labelledBy`, etc.).

---

## ConfirmationDialog API

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — | Dialog heading |
| `description` | `ReactNode` | — | Supporting copy |
| `confirmLabel` | `string` | `Confirm` | Primary action label |
| `cancelLabel` | `string` | `Cancel` | Secondary action label |
| `confirmVariant` | `primary` \| `danger` | `primary` | Confirm button style |
| `loading` | `boolean` | `false` | Disables actions, shows spinner |
| `onConfirm` | `() => void \| Promise<void>` | — | Confirm handler |
| `onCancel` | `() => void` | — | Optional cancel side-effect |

---

## Example

```tsx
const titleId = 'export-dialog-title'

<Dialog open={open} onOpenChange={setOpen} labelledBy={titleId}>
  <ModalHeader title="Export report" titleId={titleId} onClose={() => setOpen(false)} />
  <ModalBody>Select a format…</ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    <Button onClick={handleExport}>Export</Button>
  </ModalFooter>
</Dialog>
```

---

## Tokens

| Concern | Tokens |
|---|---|
| Panel surface | `--surface-raised`, `--border-default`, `--radius-lg`, `--shadow-overlay` |
| Overlay | `--surface-overlay` |
| Z-index | `--z-overlay` (300) + `--z-modal` (400) + `layer * 10` |
| Spacing | `--space-*` in header/body/footer |
| Animation | `--duration-fast`, `--duration-base`, `--ease-standard`, `--ease-emphasized` |

---

## Stacking

Multiple open dialogs register in a global stack (`modalStack.ts`):

- Each layer increments z-index by 10
- Only the **topmost** dialog receives ESC and overlay dismiss
- Only the topmost `FocusTrap` is active
- Body scroll lock uses a ref count (nested modals safe)

---

## Accessibility (WCAG)

- `role="dialog"` + `aria-modal="true"` on panel
- `aria-labelledby` / `aria-describedby` via `ModalHeader` ids
- Focus moves to first focusable element on open; restored on close
- Tab / Shift+Tab cycle inside `FocusTrap`
- Close button has `aria-label`
- ESC key dismiss (topmost only)
- `prefers-reduced-motion` respected via global CSS policy

---

## CSS animations

| Class | Animation |
|---|---|
| `.cb-modal-overlay` | `cbModalFadeIn` |
| `.cb-modal-panel` | `cbModalEnter` |
| `.cb-drawer-panel[data-side="right"]` | `cbDrawerEnterRight` |
| `.cb-drawer-panel[data-side="left"]` | `cbDrawerEnterLeft` |
| `.cb-drawer-panel[data-side="bottom"]` | `cbDrawerEnterBottom` |

---

## Migration notes

| Legacy | Target |
|---|---|
| `OnboardingModal` inline backdrop | `Dialog` + compound slots |
| `UpgradeModal` | `ConfirmationDialog` |
| Review `SplitModal`, `CommandPalette` drawer | `Drawer` |
| Ad-hoc `z-50` / `z-[300]` / `z-[9999]` | Stack-managed `--z-modal` layers |

First consumer migration (planned): `UpgradeModal` → `ConfirmationDialog`.
