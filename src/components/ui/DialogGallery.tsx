'use client'

import { useId, useState } from 'react'
import Button from '@/components/ui/Button'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'
import Dialog from '@/components/ui/Dialog'
import Drawer from '@/components/ui/Drawer'
import ModalBody from '@/components/ui/ModalBody'
import ModalFooter from '@/components/ui/ModalFooter'
import ModalHeader from '@/components/ui/ModalHeader'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 var(--space-4)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h2>
  )
}

function GalleryLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-2)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </p>
  )
}

function Showcase({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}

export default function DialogGallery() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stackedOpen, setStackedOpen] = useState(false)
  const [nestedOpen, setNestedOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dangerOpen, setDangerOpen] = useState(false)

  const dialogTitleId = useId().replace(/:/g, '')
  const dialogDescriptionId = `${dialogTitleId}-description`
  const drawerTitleId = useId().replace(/:/g, '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Showcase>
        <SectionTitle>Dialog</SectionTitle>
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Centered modal with focus trap, scroll lock, ESC dismiss, and overlay click. Tab stays inside
          the panel; focus returns on close.
        </p>
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          labelledBy={dialogTitleId}
          describedBy={dialogDescriptionId}
        >
          <ModalHeader
            title="Export close package"
            description="Choose a format for the March 2026 close summary."
            titleId={dialogTitleId}
            descriptionId={dialogDescriptionId}
            onClose={() => setDialogOpen(false)}
          />
          <ModalBody>
            <p style={{ margin: 0 }}>
              Dialog composes Portal, Overlay, FocusTrap, ModalHeader, ModalBody, and ModalFooter.
              Press <kbd>Esc</kbd> or click the overlay to dismiss.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Export PDF</Button>
          </ModalFooter>
        </Dialog>
      </Showcase>

      <Showcase>
        <SectionTitle>Drawer</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open right drawer
          </Button>
        </div>

        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          side="right"
          labelledBy={drawerTitleId}
        >
          <ModalHeader
            title="Transaction details"
            description="Review metadata before approving."
            titleId={drawerTitleId}
            onClose={() => setDrawerOpen(false)}
          />
          <ModalBody>
            <p style={{ margin: 0 }}>
              Drawer uses the same stack, scroll lock, and ESC handling as Dialog. Side panels animate
              with token durations.
            </p>
          </ModalBody>
          <ModalFooter align="between">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              Dismiss
            </Button>
            <Button onClick={() => setDrawerOpen(false)}>Approve</Button>
          </ModalFooter>
        </Drawer>
      </Showcase>

      <Showcase>
        <SectionTitle>ConfirmationDialog</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Confirm action
          </Button>
          <Button variant="danger" onClick={() => setDangerOpen(true)}>
            Destructive confirm
          </Button>
        </div>

        <ConfirmationDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Send monthly report?"
          description="Clients will receive the branded close summary by email."
          confirmLabel="Send now"
          onConfirm={() => setConfirmOpen(false)}
        />

        <ConfirmationDialog
          open={dangerOpen}
          onOpenChange={setDangerOpen}
          title="Delete saved rule?"
          description="This cannot be undone. Future transactions will no longer auto-categorize with this rule."
          confirmLabel="Delete rule"
          confirmVariant="danger"
          onConfirm={() => setDangerOpen(false)}
        />
      </Showcase>

      <Showcase>
        <SectionTitle>Stacking</SectionTitle>
        <GalleryLabel>Only the top dialog receives ESC and overlay dismiss</GalleryLabel>
        <Button onClick={() => setStackedOpen(true)}>Open stacked dialogs</Button>

        <Dialog open={stackedOpen} onOpenChange={setStackedOpen} label="Parent dialog">
          <ModalHeader title="Parent dialog" onClose={() => setStackedOpen(false)} />
          <ModalBody>
            <p style={{ margin: '0 0 var(--space-4)' }}>
              Open a nested dialog to verify z-index stacking and topmost focus trap.
            </p>
            <Button onClick={() => setNestedOpen(true)}>Open nested dialog</Button>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setStackedOpen(false)}>
              Close parent
            </Button>
          </ModalFooter>
        </Dialog>

        <Dialog open={nestedOpen} onOpenChange={setNestedOpen} size="sm" label="Nested dialog">
          <ModalHeader title="Nested dialog" onClose={() => setNestedOpen(false)} />
          <ModalBody>
            <p style={{ margin: 0 }}>ESC closes this dialog first, then the parent.</p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setNestedOpen(false)}>Done</Button>
          </ModalFooter>
        </Dialog>
      </Showcase>

      <Showcase>
        <SectionTitle>Accessibility checklist</SectionTitle>
        <ul
          style={{
            margin: 0,
            paddingLeft: 'var(--space-5)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          <li>
            <code>role=&quot;dialog&quot;</code> + <code>aria-modal=&quot;true&quot;</code>
          </li>
          <li>
            <code>aria-labelledby</code> / <code>aria-describedby</code> wired via ModalHeader ids
          </li>
          <li>Focus trap with Tab cycle and focus restore</li>
          <li>Body scroll lock with scrollbar compensation</li>
          <li>ESC dismiss (topmost only) and labeled close button</li>
          <li>Animations use <code>--duration-*</code> and <code>--ease-*</code> tokens</li>
        </ul>
      </Showcase>
    </div>
  )
}
