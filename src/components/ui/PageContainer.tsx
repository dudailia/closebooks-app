'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import {
  PAGE_CONTAINER_CLASS,
  pageWidthStyles,
  type PageWidth,
} from '@/components/ui/layoutStyles'

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  as?: 'main' | 'div' | 'section'
  width?: PageWidth
  padded?: boolean
  children: ReactNode
}

export const PageContainer = forwardRef<HTMLElement, PageContainerProps>(function PageContainer(
  { as: Tag = 'main', width = 'lg', padded = true, children, className, style, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={[PAGE_CONTAINER_CLASS, className].filter(Boolean).join(' ')}
      data-width={width}
      style={{
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        ...(padded
          ? {
              paddingTop: 'var(--space-8)',
              paddingBottom: 'var(--space-8)',
            }
          : {}),
        ...pageWidthStyles[width],
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
})

export default PageContainer
