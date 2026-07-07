'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import Button from '@/components/ui/Button'

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  showClose?: boolean
  onClose?: () => void
  closeLabel?: string
  titleId?: string
  descriptionId?: string
  children?: ReactNode
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ModalHeader({
  title,
  description,
  eyebrow,
  showClose = true,
  onClose,
  closeLabel = 'Close dialog',
  titleId,
  descriptionId,
  children,
  style,
  ...rest
}: ModalHeaderProps) {
  const hasSlots = title || description || eyebrow

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-5) var(--space-6)',
        borderBottom: '1px solid var(--border-default)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {children ?? (hasSlots ? (
          <>
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
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  lineHeight: 'var(--line-height-snug)',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id={descriptionId}
                style={{
                  margin: 'var(--space-2) 0 0',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {description}
              </p>
            ) : null}
          </>
        ) : null)}
      </div>
      {showClose && onClose ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={closeLabel}
          style={{ marginTop: 'calc(-1 * var(--space-1))', marginRight: 'calc(-1 * var(--space-1))' }}
        >
          <CloseIcon />
        </Button>
      ) : null}
    </div>
  )
}

export default ModalHeader
