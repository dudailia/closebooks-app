import type { CSSProperties } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeAppearance = 'filled' | 'outline'

export const BADGE_CLASS = 'cb-badge'

interface ToneColors {
  bg: string
  fg: string
  border: string
}

const toneColors: Record<BadgeVariant, ToneColors> = {
  success: {
    bg: 'var(--color-success-bg)',
    fg: 'var(--color-success-fg)',
    border: 'var(--color-success-fg)',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    fg: 'var(--color-warning-fg)',
    border: 'var(--color-warning-fg)',
  },
  danger: {
    bg: 'var(--color-danger-bg)',
    fg: 'var(--color-danger-fg)',
    border: 'var(--color-danger-fg)',
  },
  info: {
    bg: 'var(--color-info-bg)',
    fg: 'var(--color-info-fg)',
    border: 'var(--color-info-fg)',
  },
  neutral: {
    bg: 'var(--color-neutral-bg)',
    fg: 'var(--color-neutral-fg)',
    border: 'var(--border-default)',
  },
}

export function badgeToneStyle(
  variant: BadgeVariant,
  appearance: BadgeAppearance,
): Pick<CSSProperties, 'color' | 'backgroundColor' | 'border'> {
  const colors = toneColors[variant]

  if (appearance === 'outline') {
    return {
      color: colors.fg,
      backgroundColor: 'transparent',
      border: `1px solid ${colors.border}`,
    }
  }

  return {
    color: colors.fg,
    backgroundColor: colors.bg,
    border: '1px solid transparent',
  }
}

export function badgeSizeStyle(compact: boolean): CSSProperties {
  if (compact) {
    return {
      padding: '0 var(--space-2)',
      fontSize: 'var(--font-size-xs)',
      gap: 'var(--space-1)',
      minHeight: 'var(--space-5)',
    }
  }

  return {
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--font-size-xs)',
    gap: 'var(--space-1)',
    minHeight: 'var(--space-6)',
  }
}

export function badgeIconSize(compact: boolean): number {
  return compact ? 10 : 12
}
