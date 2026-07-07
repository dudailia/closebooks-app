import type { CSSProperties, ReactNode } from 'react'

export type InputTone = 'default' | 'brand'
export type InputSize = 'sm' | 'md' | 'lg'

export const INPUT_CLASS = 'cb-input'

export const sizeStyles: Record<InputSize, CSSProperties> = {
  sm: {
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-sm)',
    minHeight: 'var(--space-9)',
  },
  md: {
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
    minHeight: 'var(--space-11)',
  },
  lg: {
    padding: 'var(--space-4) var(--space-5)',
    fontSize: 'var(--font-size-base)',
    minHeight: 'var(--space-12)',
  },
}

export function toneFieldStyles(tone: InputTone, invalid: boolean): CSSProperties {
  if (invalid) {
    return {
      color: 'var(--text-primary)',
      backgroundColor: tone === 'brand' ? 'rgba(255,255,255,0.04)' : 'var(--surface-canvas)',
      border: '1px solid var(--color-danger-fg)',
    }
  }

  if (tone === 'brand') {
    return {
      color: 'var(--text-primary)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--border-strong)',
    }
  }

  return {
    color: 'var(--text-primary)',
    backgroundColor: 'var(--surface-canvas)',
    border: '1px solid var(--color-warm)',
  }
}

export function controlBaseStyle(size: InputSize, tone: InputTone, invalid: boolean): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-family-sans)',
    fontWeight: 'var(--font-weight-normal)',
    lineHeight: 'var(--line-height-snug)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: [
      `border-color var(--duration-fast) var(--ease-standard)`,
      `box-shadow var(--duration-fast) var(--ease-standard)`,
      `background-color var(--duration-fast) var(--ease-standard)`,
      `opacity var(--duration-fast) var(--ease-standard)`,
    ].join(', '),
    ...sizeStyles[size],
    ...toneFieldStyles(tone, invalid),
  }
}

export function iconPadding(side: 'left' | 'right', size: InputSize): string {
  const map: Record<InputSize, string> = {
    sm: 'var(--space-8)',
    md: 'var(--space-9)',
    lg: 'var(--space-10)',
  }
  return map[size]
}

export function disabledStyle(disabled: boolean, readOnly: boolean): CSSProperties {
  if (disabled) {
    return {
      opacity: 0.55,
      cursor: 'not-allowed',
    }
  }
  if (readOnly) {
    return {
      cursor: 'default',
      backgroundColor: 'var(--surface-elevated)',
    }
  }
  return {}
}

export function mergeDescribedBy(...ids: Array<string | undefined>): string | undefined {
  const merged = ids.filter(Boolean).join(' ')
  return merged || undefined
}

export interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  'aria-required'?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  loading?: boolean
}

export type IconSlot = ReactNode
