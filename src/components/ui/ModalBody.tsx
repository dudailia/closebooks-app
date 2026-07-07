'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function ModalBody({ children, style, ...rest }: ModalBodyProps) {
  return (
    <div
      style={{
        padding: 'var(--space-5) var(--space-6)',
        overflowY: 'auto',
        maxHeight: 'min(70vh, 640px)',
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-normal)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default ModalBody
