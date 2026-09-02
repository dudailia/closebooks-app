'use client'

import type { CSSProperties, ReactNode } from 'react'
import Card from '@/components/ui/Card'
import type { CardVariant } from '@/components/ui/cardStyles'

export type StatCardTone = 'default' | 'positive' | 'muted'

export interface StatCardProps {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  trend?: ReactNode
  tone?: StatCardTone
  variant?: CardVariant
  className?: string
  style?: CSSProperties
}

const valueToneStyles: Record<StatCardTone, CSSProperties> = {
  default: { color: 'var(--text-primary)' },
  positive: { color: 'var(--color-brand-product)' },
  muted: { color: 'var(--text-muted)' },
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  tone = 'default',
  variant = 'default',
  className,
  style,
}: StatCardProps) {
  return (
    <Card variant={variant} padding="sm" className={className} style={style}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {icon ? (
          <span aria-hidden="true" style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
            {icon}
          </span>
        ) : null}
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-semibold)',
              lineHeight: 'var(--line-height-tight)',
              ...valueToneStyles[tone],
            }}
          >
            {value}
          </p>
          <p
            style={{
              margin: 'var(--space-1) 0 0',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </p>
          {sub ? (
            <p
              style={{
                margin: 'var(--space-1) 0 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {sub}
            </p>
          ) : null}
          {trend ? (
            <p
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-brand-product)',
              }}
            >
              {trend}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export default StatCard
