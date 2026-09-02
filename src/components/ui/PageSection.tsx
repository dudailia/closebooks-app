'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  divider?: boolean
  children: ReactNode
}

export function PageSection({
  title,
  description,
  actions,
  divider = false,
  children,
  style,
  ...rest
}: PageSectionProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingTop: divider ? 'var(--space-6)' : undefined,
        borderTop: divider ? '1px solid var(--border-default)' : undefined,
        ...style,
      }}
      {...rest}
    >
      {hasHeader ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            {title ? (
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 'var(--line-height-snug)',
                }}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                style={{
                  margin: title ? 'var(--space-1) 0 0' : 0,
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div style={{ flex: '0 1 auto' }}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export default PageSection
