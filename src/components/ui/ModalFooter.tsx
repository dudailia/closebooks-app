'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  align?: 'start' | 'end' | 'between'
}

export function ModalFooter({ children, align = 'end', style, ...rest }: ModalFooterProps) {
  const justifyContent =
    align === 'start' ? 'flex-start' : align === 'between' ? 'space-between' : 'flex-end'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent,
        gap: 'var(--space-2)',
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-elevated)',
        borderBottomLeftRadius: 'var(--radius-lg)',
        borderBottomRightRadius: 'var(--radius-lg)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default ModalFooter
