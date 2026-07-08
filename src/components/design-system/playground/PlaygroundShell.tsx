'use client'

import type { ReactNode } from 'react'
import {
  CATALOG_SECTIONS,
  COMPONENT_SECTIONS,
  FOUNDATION_SECTIONS,
} from '@/components/design-system/playground/catalog'

type PlaygroundShellProps = {
  children: ReactNode
}

function NavGroup({ title, ids }: { title: string; ids: typeof CATALOG_SECTIONS }) {
  return (
    <div style={{ marginBottom: 'var(--space-5)' }}>
      <p
        style={{
          margin: '0 0 var(--space-2)',
          padding: '0 var(--space-3)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-bold)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {title}
      </p>
      <nav aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ids.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            style={{
              display: 'block',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function PlaygroundShell({ children }: PlaygroundShellProps) {
  return (
    <div
      className="page-enter"
      style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr)',
        gap: 'var(--space-8)',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-6)',
        alignItems: 'start',
      }}
    >
      <aside
        aria-label="Design system catalog"
        style={{
          position: 'sticky',
          top: 'var(--space-6)',
          maxHeight: 'calc(100vh - var(--space-12))',
          overflowY: 'auto',
          paddingRight: 'var(--space-2)',
        }}
      >
        <p
          style={{
            margin: '0 0 var(--space-1)',
            padding: '0 var(--space-3)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Internal only
        </p>
        <p
          style={{
            margin: '0 0 var(--space-5)',
            padding: '0 var(--space-3)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Playground
        </p>
        <NavGroup title="Foundation" ids={FOUNDATION_SECTIONS} />
        <NavGroup title="Components" ids={COMPONENT_SECTIONS} />
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', minWidth: 0 }}>
        <header>
          <h1
            style={{
              margin: '0 0 var(--space-3)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            Design System Playground
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-base)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--line-height-normal)',
              maxWidth: 720,
            }}
          >
            Complete internal catalog for manual QA. Every section includes interactive examples, copy-ready
            snippets, variants, states, and accessibility notes. Tokens live in{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92em' }}>globals.css</code>; primitives
            in <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92em' }}>src/components/ui/</code>.
            No production pages are migrated from this route.
          </p>
        </header>
        {children}
      </main>
    </div>
  )
}
