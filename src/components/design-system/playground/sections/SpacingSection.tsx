'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'spacing')!

const STEPS = Array.from({ length: 16 }, (_, i) => i + 1)

export default function SpacingSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="4px spacing grid"
        description="All layout gaps and padding should use --space-* tokens."
        code={`<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
}}>
  …
</div>`}
        variants={
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {STEPS.map((n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <code style={{ width: 96, fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>
                  --space-{n}
                </code>
                <div
                  style={{
                    width: `var(--space-${n})`,
                    height: 20,
                    backgroundColor: 'var(--color-brand-product)',
                    borderRadius: 'var(--radius-sm)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{n * 4}px</span>
              </div>
            ))}
          </div>
        }
        states={
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {['var(--space-2)', 'var(--space-4)', 'var(--space-8)'].map((gap) => (
              <div key={gap}>
                <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  gap: {gap}
                </p>
                <div style={{ display: 'flex', gap }}>
                  <div style={{ flex: 1, height: 32, backgroundColor: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1, height: 32, backgroundColor: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>
            ))}
          </div>
        }
        a11y={[
          'Touch targets need at least 44×44px — combine --space-* with min-height on controls.',
          'Consistent vertical rhythm (--space-4 between fields, --space-6 in cards) aids scanability.',
        ]}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          {[4, 8, 12, 16, 24, 32].map((px) => (
            <div key={px} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: px,
                  height: px,
                  backgroundColor: 'var(--accent-soft)',
                  border: '1px solid var(--ring-soft)',
                  borderRadius: 'var(--radius-sm)',
                  margin: '0 auto var(--space-1)',
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{px}</span>
            </div>
          ))}
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
