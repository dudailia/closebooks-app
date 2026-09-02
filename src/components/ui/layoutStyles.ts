import type { CSSProperties } from 'react'

export type PageWidth = 'sm' | 'md' | 'lg' | 'xl' | 'wide'
export type LayoutGap = 'sm' | 'md' | 'lg' | 'xl'
export type PageActionsAlign = 'start' | 'end' | 'between' | 'center'

export const PAGE_CONTAINER_CLASS = 'cb-page-container'

export const pageWidthStyles: Record<PageWidth, CSSProperties> = {
  sm: { maxWidth: '640px' },
  md: { maxWidth: '960px' },
  lg: { maxWidth: '1100px' },
  xl: { maxWidth: '1200px' },
  wide: { maxWidth: '1400px' },
}

export const gapStyles: Record<LayoutGap, string> = {
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
  xl: 'var(--space-8)',
}

export function pageActionsAlignStyle(align: PageActionsAlign): CSSProperties {
  const map: Record<PageActionsAlign, CSSProperties['justifyContent']> = {
    start: 'flex-start',
    end: 'flex-end',
    between: 'space-between',
    center: 'center',
  }
  return { justifyContent: map[align] }
}
