'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { gapStyles, pageActionsAlignStyle, type LayoutGap, type PageActionsAlign } from '@/components/ui/layoutStyles'

export interface PageActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  align?: PageActionsAlign
  gap?: LayoutGap
  wrap?: boolean
}

export function PageActions({
  children,
  align = 'end',
  gap = 'sm',
  wrap = true,
  style,
  ...rest
}: PageActionsProps) {
  const actionStyle: CSSProperties = {
    display: 'flex',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: 'center',
    gap: gapStyles[gap],
    width: align === 'between' ? '100%' : undefined,
    ...pageActionsAlignStyle(align),
    ...style,
  }

  return (
    <div role="group" className="cb-page-actions" style={actionStyle} {...rest}>
      {children}
    </div>
  )
}

export default PageActions
