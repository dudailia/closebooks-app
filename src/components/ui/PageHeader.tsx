'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
  style,
  ...rest
}: PageHeaderProps) {
  return (
    <header
      className="cb-page-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          {children ?? (
            <>
              {eyebrow ? (
                <p
                  style={{
                    margin: '0 0 var(--space-2)',
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
              <h1
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em',
                  lineHeight: 'var(--line-height-tight)',
                }}
              >
                {title}
              </h1>
              {description ? (
                <p
                  style={{
                    margin: 'var(--space-2) 0 0',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--line-height-normal)',
                    maxWidth: '56ch',
                  }}
                >
                  {description}
                </p>
              ) : null}
            </>
          )}
        </div>
        {actions ? (
          <div style={{ flex: '0 1 auto' }}>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default PageHeader
