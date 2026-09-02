'use client'

import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { modalZIndex } from '@/components/ui/modalStack'

export interface OverlayProps {
  layer?: number
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Overlay({ layer = 0, onClick, className, style, children }: OverlayProps) {
  return (
    <div
      className={['cb-modal-overlay', className].filter(Boolean).join(' ')}
      data-layer={layer}
      onClick={onClick}
      aria-hidden={children ? undefined : true}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: modalZIndex(layer, 'overlay'),
        backgroundColor: 'var(--surface-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default Overlay
