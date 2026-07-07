'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { gapStyles, type LayoutGap } from '@/components/ui/layoutStyles'

export interface PageGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gap?: LayoutGap
  minColumnWidth?: string
  columns?: number
}

export function PageGrid({
  children,
  gap = 'md',
  minColumnWidth = '260px',
  columns,
  className,
  style,
  ...rest
}: PageGridProps) {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gap: gapStyles[gap],
    width: '100%',
    ...(columns
      ? {}
      : { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}), 1fr))` }),
    ...style,
  }

  return (
    <div
      className={['cb-page-grid', className].filter(Boolean).join(' ')}
      data-columns={columns ?? 'auto'}
      style={gridStyle}
      {...rest}
    >
      {children}
    </div>
  )
}

export default PageGrid
