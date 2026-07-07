'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  divider?: boolean
  muted?: boolean
}

export function CardFooter({
  children,
  divider = true,
  muted = false,
  style,
  ...rest
}: CardFooterProps) {
  return (
    <div
      style={{
        padding: 'var(--space-4) var(--space-6)',
        borderTop: divider ? '1px solid var(--border-default)' : undefined,
        backgroundColor: muted ? 'var(--surface-elevated)' : undefined,
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

export default CardFooter
