'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import DialogGallery from '@/components/ui/DialogGallery'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'dialogs')!

export default function DialogsSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Modal & drawer primitives"
        description="Dialog stacks with overlay, focus trap, scroll lock, and confirmation patterns."
        code={`import Dialog from '@/components/ui/Dialog'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

<Dialog open={open} onClose={() => setOpen(false)} title="Split transaction">
  …
</Dialog>

<ConfirmationDialog
  open={confirmOpen}
  title="Delete rule?"
  confirmLabel="Delete"
  variant="danger"
  onConfirm={handleDelete}
  onClose={() => setConfirmOpen(false)}
/>`}
        variants={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Variants: centered modal, edge drawer (left/right/bottom), confirmation with danger primary.
          </p>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Open/closed, long scrollable body, nested focus order, Escape to dismiss.
          </p>
        }
        a11y={[
          'role="dialog" + aria-modal="true" on Dialog.',
          'FocusTrap keeps tab cycle inside; restore focus on close.',
          'Overlay click and Escape call onClose — provide visible close control too.',
          'ConfirmationDialog: destructive confirm uses danger Button variant.',
        ]}
      >
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Use the gallery below to open live modals and drawers.
        </p>
      </PlaygroundBlock>

      <PlaygroundBlock title="Dialog system gallery" description="Interactive modal, drawer, and confirmation demos.">
        <DialogGallery />
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
