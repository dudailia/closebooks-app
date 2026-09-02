'use client'

import { useId, type ReactNode } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ModalFooter from '@/components/ui/ModalFooter'
import ModalHeader from '@/components/ui/ModalHeader'

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const titleId = useId().replace(/:/g, '')
  const descriptionId = `${titleId}-description`

  function handleCancel() {
    onCancel?.()
    onOpenChange(false)
  }

  async function handleConfirm() {
    await onConfirm()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
    >
      <ModalHeader
        title={title}
        description={description}
        titleId={titleId}
        descriptionId={descriptionId}
        showClose
        onClose={handleCancel}
      />
      <ModalFooter>
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={handleConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Dialog>
  )
}

export default ConfirmationDialog
