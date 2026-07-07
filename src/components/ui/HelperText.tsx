'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface HelperTextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export function HelperText({ children, style, id, ...rest }: HelperTextProps) {
  return (
    <p
      id={id}
      style={{
        margin: 'var(--space-2) 0 0',
        fontSize: 'var(--font-size-xs)',
        lineHeight: 'var(--line-height-normal)',
        color: 'var(--text-muted)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  )
}

export default HelperText
