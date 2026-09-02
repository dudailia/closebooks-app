'use client'

import { useEffect } from 'react'
import { isTopModal, lockBodyScroll, unlockBodyScroll } from '@/components/ui/modalStack'

export interface UseModalEffectsOptions {
  open: boolean
  modalId: symbol
  onOpenChange?: (open: boolean) => void
  dismissOnEscape?: boolean
}

export function useModalEffects({
  open,
  modalId,
  onOpenChange,
  dismissOnEscape = true,
}: UseModalEffectsOptions) {
  useEffect(() => {
    if (!open) return

    lockBodyScroll()
    return () => {
      unlockBodyScroll()
    }
  }, [open])

  useEffect(() => {
    if (!open || !dismissOnEscape || !onOpenChange) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (!isTopModal(modalId)) return
      event.preventDefault()
      event.stopPropagation()
      onOpenChange?.(false)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [open, dismissOnEscape, onOpenChange, modalId])
}
