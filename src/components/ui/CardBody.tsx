'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  compact?: boolean
}

export function CardBody({ children, compact = false, style, ...rest }: CardBodyProps) {
  return (
    <div
      style={{
        padding: compact
          ? '0 var(--space-6) var(--space-5)'
          : '0 var(--space-6) var(--space-6)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default CardBody
