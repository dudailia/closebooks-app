'use client'

import type { ReactNode } from 'react'
import PlaygroundA11y from '@/components/design-system/playground/PlaygroundA11y'
import PlaygroundCode from '@/components/design-system/playground/PlaygroundCode'
import { labelCaps, showcase } from '@/components/design-system/playground/styles'

type PlaygroundBlockProps = {
  title: string
  description?: string
  children: ReactNode
  code?: string
  variants?: ReactNode
  states?: ReactNode
  a11y?: string | string[]
}

export default function PlaygroundBlock({
  title,
  description,
  children,
  code,
  variants,
  states,
  a11y,
}: PlaygroundBlockProps) {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-raised)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <header>
        <h3
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h3>
        {description ? (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--line-height-normal)',
              maxWidth: 720,
            }}
          >
            {description}
          </p>
        ) : null}
      </header>

      <div>
        <p style={{ ...labelCaps, marginBottom: 'var(--space-2)' }}>Interactive example</p>
        <div style={showcase}>{children}</div>
      </div>

      {variants ? (
        <div>
          <p style={{ ...labelCaps, marginBottom: 'var(--space-2)' }}>Variants</p>
          <div style={showcase}>{variants}</div>
        </div>
      ) : null}

      {states ? (
        <div>
          <p style={{ ...labelCaps, marginBottom: 'var(--space-2)' }}>States</p>
          <div style={showcase}>{states}</div>
        </div>
      ) : null}

      {code ? <PlaygroundCode code={code} /> : null}
      {a11y ? <PlaygroundA11y notes={a11y} /> : null}
    </article>
  )
}
