'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface ErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export function ErrorMessage({ children, style, id, ...rest }: ErrorMessageProps) {
  if (!children) return null

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      style={{
        margin: 'var(--space-2) 0 0',
        fontSize: 'var(--font-size-xs)',
        lineHeight: 'var(--line-height-normal)',
        color: 'var(--color-danger-fg)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  )
}

export default ErrorMessage
