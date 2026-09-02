'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  variant?: 'card' | 'dashed'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  variant = 'dashed',
  style,
  ...rest
}: EmptyStateProps) {
  const content = (
    <>
      {icon ? (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--space-14)',
            height: 'var(--space-14)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-brand-muted)',
            color: 'var(--color-brand-product)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {icon}
        </span>
      ) : null}
      <h3
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--font-size-md)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            margin: '0 0 var(--space-5)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
            maxWidth: '36ch',
          }}
        >
          {description}
        </p>
      ) : null}
      {action ?? (actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null)}
    </>
  )

  const shellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 'var(--space-12) var(--space-6)',
    ...style,
  }

  if (variant === 'card') {
    return (
      <Card variant="outlined" padding="none" style={shellStyle} {...rest}>
        {content}
      </Card>
    )
  }

  return (
    <div
      role="status"
      style={{
        ...shellStyle,
        border: '1px dashed var(--color-warm)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-raised)',
      }}
      {...rest}
    >
      {content}
    </div>
  )
}

export default EmptyState
