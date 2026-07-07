'use client'

import type { CSSProperties, LabelHTMLAttributes, ReactNode } from 'react'

export type LabelTone = 'default' | 'brand'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  tone?: LabelTone
  required?: boolean
  children: ReactNode
}

const toneStyles: Record<LabelTone, CSSProperties> = {
  default: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: 'normal',
    textTransform: 'none',
    color: 'var(--text-primary)',
  },
  brand: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  },
}

export function Label({
  tone = 'default',
  required,
  children,
  style,
  ...rest
}: LabelProps) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: 'var(--space-2)',
        lineHeight: 'var(--line-height-snug)',
        ...toneStyles[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
      {required ? (
        <span aria-hidden="true" style={{ color: 'var(--color-danger-fg)', marginLeft: 'var(--space-1)' }}>
          *
        </span>
      ) : null}
    </label>
  )
}

export default Label
