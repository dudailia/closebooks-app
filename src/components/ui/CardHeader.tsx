'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  divider?: boolean
  children?: ReactNode
}

export function CardHeader({
  title,
  description,
  eyebrow,
  icon,
  action,
  divider = false,
  children,
  style,
  ...rest
}: CardHeaderProps) {
  const hasSlots = title || description || eyebrow || icon || action

  return (
    <div
      style={{
        padding: 'var(--space-5) var(--space-6)',
        paddingBottom: divider ? 'var(--space-5)' : 'var(--space-4)',
        borderBottom: divider ? '1px solid var(--border-default)' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children ?? (hasSlots ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          {icon ? (
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-secondary)',
              }}
            >
              {icon}
            </span>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow ? (
              <p
                style={{
                  margin: '0 0 var(--space-1)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  lineHeight: 'var(--line-height-snug)',
                }}
              >
                {title}
              </h3>
            ) : null}
            {description ? (
              <p
                style={{
                  margin: title || eyebrow ? 'var(--space-1) 0 0' : 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div style={{ flexShrink: 0, marginLeft: 'var(--space-2)' }}>{action}</div>
          ) : null}
        </div>
      ) : null)}
    </div>
  )
}

export default CardHeader
