'use client'

import { useId, type ReactNode } from 'react'
import FocusTrap from '@/components/ui/FocusTrap'
import Overlay from '@/components/ui/Overlay'
import Portal from '@/components/ui/Portal'
import {
  DIALOG_PANEL_CLASS,
  dialogSizeStyles,
  panelShellStyle,
  type DialogSize,
} from '@/components/ui/dialogStyles'
import { modalZIndex, useModalRegistration, isTopModal } from '@/components/ui/modalStack'
import { useModalEffects } from '@/components/ui/useModalEffects'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  size?: DialogSize
  dismissOnEscape?: boolean
  dismissOnOverlayClick?: boolean
  labelledBy?: string
  describedBy?: string
  label?: string
}

export function Dialog({
  open,
  onOpenChange,
  children,
  size = 'md',
  dismissOnEscape = true,
  dismissOnOverlayClick = true,
  labelledBy,
  describedBy,
  label = 'Dialog',
}: DialogProps) {
  const autoId = useId().replace(/:/g, '')
  const titleId = labelledBy ?? `${autoId}-title`
  const descriptionId = describedBy ?? `${autoId}-description`
  const { modalId, layer, isTop } = useModalRegistration(open)

  useModalEffects({
    open,
    modalId,
    onOpenChange,
    dismissOnEscape,
  })

  if (!open) return null

  return (
    <Portal>
      <Overlay
        layer={layer}
        onClick={
          dismissOnOverlayClick
            ? (event) => {
                if (event.target === event.currentTarget && isTopModal(modalId)) {
                  onOpenChange(false)
                }
              }
            : undefined
        }
      >
        <FocusTrap active={isTop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy ? titleId : undefined}
            aria-describedby={describedBy ? descriptionId : undefined}
            className={DIALOG_PANEL_CLASS}
            data-size={size}
            onClick={(event) => event.stopPropagation()}
            style={{
              ...panelShellStyle(),
              ...dialogSizeStyles[size],
              zIndex: modalZIndex(layer, 'panel'),
              position: 'relative',
            }}
          >
            {children}
          </div>
        </FocusTrap>
      </Overlay>
    </Portal>
  )
}

export default Dialog
