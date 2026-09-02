'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'elevation')!

const SHADOWS = [
  { token: '--shadow-sm', label: 'Small' },
  { token: '--shadow-md', label: 'Medium' },
  { token: '--shadow-lg', label: 'Large' },
  { token: '--shadow-overlay', label: 'Overlay' },
]

const Z_LAYERS = [
  { token: '--z-dropdown', value: 100, label: 'Dropdown' },
  { token: '--z-sticky', value: 200, label: 'Sticky chrome' },
  { token: '--z-overlay', value: 300, label: 'Overlay scrim' },
  { token: '--z-modal', value: 400, label: 'Modal / drawer' },
  { token: '--z-toast', value: 500, label: 'Toast' },
  { token: '--z-max', value: 600, label: 'Max (debug)' },
]

export default function ElevationSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Shadows & stacking"
        description="Elevation communicates layering. Z-index contract replaces ad-hoc 9999 values."
        code={`<div style={{
  boxShadow: 'var(--shadow-md)',
  borderRadius: 'var(--radius-lg)',
}}>
  Raised card
</div>

/* Modal stack */
.overlay { z-index: var(--z-overlay); }
.dialog  { z-index: var(--z-modal); }`}
        variants={
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-5)' }}>
            {SHADOWS.map((s) => (
              <div
                key={s.token}
                style={{
                  padding: 'var(--space-5)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-raised)',
                  boxShadow: `var(${s.token})`,
                }}
              >
                <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{s.label}</p>
                <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{s.token}</code>
              </div>
            ))}
          </div>
        }
        states={
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {Z_LAYERS.map((z) => (
              <div
                key={z.token}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    width: 32,
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {z.value}
                </span>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{z.label}</span>
                <code style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>{z.token}</code>
              </div>
            ))}
          </div>
        }
        a11y={[
          'Modals must render above page content (--z-modal) with focus trapped inside.',
          'Do not rely on shadow alone for critical boundaries — pair with border when needed.',
        ]}
      >
        <div
          style={{
            position: 'relative',
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 80,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-raised)',
              boxShadow: 'var(--shadow-sm)',
              transform: 'translate(-24px, -12px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 80,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-raised)',
              boxShadow: 'var(--shadow-lg)',
            }}
          />
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
