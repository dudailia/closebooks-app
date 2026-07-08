'use client'

import type { ReactNode } from 'react'
import type { CatalogEntry } from '@/components/design-system/playground/catalog'
import { sectionGap } from '@/components/design-system/playground/styles'

type PlaygroundSectionProps = {
  entry: CatalogEntry
  children: ReactNode
}

export default function PlaygroundSection({ entry, children }: PlaygroundSectionProps) {
  return (
    <section
      id={entry.id}
      aria-labelledby={`${entry.id}-heading`}
      style={{
        scrollMarginTop: 'var(--space-8)',
        ...sectionGap,
      }}
    >
      <header
        style={{
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <h2
          id={`${entry.id}-heading`}
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          {entry.label}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
            maxWidth: 720,
          }}
        >
          {entry.description}
        </p>
      </header>
      {children}
    </section>
  )
}
