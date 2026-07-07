'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import {
  BADGE_CLASS,
  badgeIconSize,
  badgeSizeStyle,
  badgeToneStyle,
  type BadgeAppearance,
  type BadgeVariant,
} from '@/components/ui/badgeStyles'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  appearance?: BadgeAppearance
  compact?: boolean
  icon?: ReactNode
  dot?: boolean
  children: ReactNode
}

function BadgeIcon({ children, compact }: { children: ReactNode; compact: boolean }) {
  const size = badgeIconSize(compact)
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

function BadgeDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: 'var(--radius-full)',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  )
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'neutral',
    appearance = 'filled',
    compact = false,
    icon,
    dot = false,
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const tone = badgeToneStyle(variant, appearance)
  const showDot = dot && !icon

  return (
    <span
      ref={ref}
      className={[BADGE_CLASS, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-appearance={appearance}
      data-compact={compact ? 'true' : 'false'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        maxWidth: '100%',
        borderRadius: 'var(--radius-full)',
        fontFamily: 'var(--font-family-sans)',
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: 'var(--line-height-tight)',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...badgeSizeStyle(compact),
        ...tone,
        ...style,
      }}
      {...rest}
    >
      {icon ? <BadgeIcon compact={compact}>{icon}</BadgeIcon> : null}
      {showDot ? <BadgeDot color={tone.color ?? 'currentColor'} /> : null}
      {children}
    </span>
  )
})

export default Badge
