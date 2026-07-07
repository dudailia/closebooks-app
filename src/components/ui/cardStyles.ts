import type { CSSProperties } from 'react'

export type CardVariant = 'default' | 'raised' | 'outlined' | 'ghost' | 'interactive'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export const CARD_CLASS = 'cb-card'

export const paddingStyles: Record<CardPadding, CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: 'var(--space-4)' },
  md: { padding: 'var(--space-5)' },
  lg: { padding: 'var(--space-6)' },
}

export const variantStyles: Record<CardVariant, CSSProperties> = {
  default: {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--color-warm)',
    boxShadow: 'none',
  },
  raised: {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-sm)',
  },
  outlined: {
    backgroundColor: 'var(--surface-canvas)',
    border: '1px solid var(--border-default)',
    boxShadow: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    boxShadow: 'none',
  },
  interactive: {
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--color-warm)',
    boxShadow: 'none',
  },
}

export function cardShellStyle(variant: CardVariant, padding: CardPadding): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    borderRadius: 'var(--radius-lg)',
    boxSizing: 'border-box',
    transition: [
      `border-color var(--duration-fast) var(--ease-standard)`,
      `box-shadow var(--duration-fast) var(--ease-standard)`,
      `background-color var(--duration-fast) var(--ease-standard)`,
      `transform var(--duration-fast) var(--ease-standard)`,
    ].join(', '),
    ...variantStyles[variant],
    ...paddingStyles[padding],
  }
}

export function interactiveHoverStyle(el: HTMLElement) {
  el.style.borderColor = 'var(--warning)'
  el.style.boxShadow = 'var(--shadow-md)'
}

export function resetInteractiveStyle(el: HTMLElement, variant: CardVariant) {
  if (variant === 'raised') {
    el.style.borderColor = 'var(--border-default)'
    el.style.boxShadow = 'var(--shadow-sm)'
    return
  }
  if (variant === 'outlined') {
    el.style.borderColor = 'var(--border-default)'
    el.style.boxShadow = 'none'
    return
  }
  if (variant === 'ghost') {
    el.style.borderColor = 'transparent'
    el.style.boxShadow = 'none'
    return
  }
  el.style.borderColor = 'var(--color-warm)'
  el.style.boxShadow = 'none'
}

export function isInteractiveVariant(variant: CardVariant) {
  return variant === 'interactive'
}
