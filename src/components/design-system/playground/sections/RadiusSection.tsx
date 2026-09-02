'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'radius')!

const RADII = [
  { token: '--radius-sm', label: 'Small (6px)', use: 'Tags, compact chips' },
  { token: '--radius-md', label: 'Medium (10px)', use: 'Inputs, buttons' },
  { token: '--radius-lg', label: 'Large (16px)', use: 'Cards, modals' },
  { token: '--radius-full', label: 'Full (pill)', use: 'Avatars, pills' },
]

export default function RadiusSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Corner radii"
        description="Match control type to radius token — do not mix arbitrary px values."
        code={`<button style={{ borderRadius: 'var(--radius-md)' }}>Save</button>
<div style={{ borderRadius: 'var(--radius-lg)' }}>Card</div>
<span style={{ borderRadius: 'var(--radius-full)' }}>Badge</span>`}
        variants={
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            {RADII.map((r) => (
              <div key={r.token}>
                <div
                  style={{
                    height: 72,
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: `var(${r.token})`,
                    marginBottom: 'var(--space-2)',
                  }}
                />
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{r.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {r.use} · {r.token}
                </p>
              </div>
            ))}
          </div>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Global <code>:focus-visible</code> uses 4px outline radius — input primitives override with field ring
            styles (<code>.cb-input:focus-visible</code>).
          </p>
        }
        a11y={[
          'Nested radii: inner radius should be ≤ outer radius minus padding for visual harmony.',
          'Pill shapes (--radius-full) work well for toggle chips; avoid for large text blocks.',
        ]}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {RADII.map((r) => (
            <div
              key={r.token}
              style={{
                width: 80,
                height: 80,
                backgroundColor: 'var(--color-brand-product)',
                borderRadius: `var(${r.token})`,
              }}
              title={r.token}
            />
          ))}
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
