'use client'

import { useId, type ReactNode } from 'react'
import FocusTrap from '@/components/ui/FocusTrap'
import Overlay from '@/components/ui/Overlay'
import Portal from '@/components/ui/Portal'
import {
  DRAWER_PANEL_CLASS,
  drawerShellStyle,
  drawerSizeStyles,
  type DrawerSide,
  type DrawerSize,
} from '@/components/ui/dialogStyles'
import { modalZIndex, useModalRegistration, isTopModal } from '@/components/ui/modalStack'
import { useModalEffects } from '@/components/ui/useModalEffects'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  side?: DrawerSide
  size?: DrawerSize
  dismissOnEscape?: boolean
  dismissOnOverlayClick?: boolean
  labelledBy?: string
  describedBy?: string
  label?: string
}

export function Drawer({
  open,
  onOpenChange,
  children,
  side = 'right',
  size = 'md',
  dismissOnEscape = true,
  dismissOnOverlayClick = true,
  labelledBy,
  describedBy,
  label = 'Drawer',
}: DrawerProps) {
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

  const overlayLayout =
    side === 'bottom'
      ? { alignItems: 'flex-end' as const, justifyContent: 'center' as const }
      : side === 'left'
        ? { alignItems: 'stretch' as const, justifyContent: 'flex-start' as const }
        : { alignItems: 'stretch' as const, justifyContent: 'flex-end' as const }

  return (
    <Portal>
      <Overlay
        layer={layer}
        style={{
          ...overlayLayout,
          padding: side === 'bottom' ? 0 : undefined,
        }}
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
            className={DRAWER_PANEL_CLASS}
            data-side={side}
            data-size={size}
            onClick={(event) => event.stopPropagation()}
            style={{
              ...drawerShellStyle(side),
              ...drawerSizeStyles[side][size],
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

export default Drawer
