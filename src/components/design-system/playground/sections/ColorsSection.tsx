'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import { labelCaps } from '@/components/design-system/playground/styles'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'colors')!

type Swatch = { token: string; label: string; group: string }

const SWATCHES: Swatch[] = [
  { group: 'Brand', token: '--color-brand-primary', label: 'Brand primary' },
  { group: 'Brand', token: '--color-brand-product', label: 'Brand product' },
  { group: 'Brand', token: '--color-brand-muted', label: 'Brand muted' },
  { group: 'Actions', token: '--color-action-primary', label: 'Action primary' },
  { group: 'Actions', token: '--color-action-hover', label: 'Action hover' },
  { group: 'Actions', token: '--color-action-disabled', label: 'Action disabled' },
  { group: 'Surfaces', token: '--surface-canvas', label: 'Canvas' },
  { group: 'Surfaces', token: '--surface-raised', label: 'Raised' },
  { group: 'Surfaces', token: '--surface-elevated', label: 'Elevated' },
  { group: 'Text', token: '--text-primary', label: 'Primary' },
  { group: 'Text', token: '--text-secondary', label: 'Secondary' },
  { group: 'Text', token: '--text-muted', label: 'Muted' },
  { group: 'Text', token: '--text-inverse', label: 'Inverse' },
  { group: 'Borders', token: '--border-default', label: 'Default' },
  { group: 'Borders', token: '--border-strong', label: 'Strong' },
  { group: 'Status', token: '--color-success-bg', label: 'Success bg' },
  { group: 'Status', token: '--color-success-fg', label: 'Success fg' },
  { group: 'Status', token: '--color-warning-bg', label: 'Warning bg' },
  { group: 'Status', token: '--color-warning-fg', label: 'Warning fg' },
  { group: 'Status', token: '--color-danger-bg', label: 'Danger bg' },
  { group: 'Status', token: '--color-danger-fg', label: 'Danger fg' },
  { group: 'Status', token: '--color-info-bg', label: 'Info bg' },
  { group: 'Status', token: '--color-info-fg', label: 'Info fg' },
  { group: 'Status', token: '--color-neutral-bg', label: 'Neutral bg' },
  { group: 'Status', token: '--color-neutral-fg', label: 'Neutral fg' },
  { group: 'Legacy', token: '--color-paper', label: 'Paper' },
  { group: 'Legacy', token: '--color-ink', label: 'Ink' },
  { group: 'Legacy', token: '--color-accent', label: 'Accent' },
  { group: 'Legacy', token: '--color-copper', label: 'Copper' },
]

function ColorSwatch({ swatch }: { swatch: Swatch }) {
  const isText = swatch.token.includes('text-') || swatch.token.includes('-fg')
  const isBorder = swatch.token.includes('border')

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-raised)',
      }}
    >
      <div
        style={{
          height: 56,
          backgroundColor: isText || isBorder ? 'var(--surface-elevated)' : `var(${swatch.token})`,
          borderBottom: isBorder ? `3px solid var(${swatch.token})` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isText ? (
          <span style={{ color: `var(${swatch.token})`, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            Aa
          </span>
        ) : null}
      </div>
      <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {swatch.label}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}
        >
          {swatch.token}
        </p>
      </div>
    </div>
  )
}

const groups = [...new Set(SWATCHES.map((s) => s.group))]

export default function ColorsSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Semantic palette"
        description="Read colors via CSS custom properties — never hardcode hex in new components."
        code={`:root {
  --text-primary: #1a1714;
  --surface-raised: var(--surface-card);
  --color-action-primary: #2d5a27;
}

.my-panel {
  background: var(--surface-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}`}
        variants={
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            {groups.map((group) => (
              <div key={group}>
                <p style={{ ...labelCaps, marginBottom: 'var(--space-3)' }}>{group}</p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 'var(--space-3)',
                  }}
                >
                  {SWATCHES.filter((s) => s.group === group).map((swatch) => (
                    <ColorSwatch key={swatch.token} swatch={swatch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Dark theme flips cross-theme tokens under <code>[data-theme=&quot;dark&quot;]</code>. Scoped surfaces
            (public pages, transaction review) opt in per subtree — dashboard chrome stays cream.
          </p>
        }
        a11y={[
          'Pair --text-primary with --surface-raised for body copy (contrast ≥ 4.5:1 on cream).',
          'Use --text-inverse only on filled action or brand backgrounds.',
          'Status pairs (--color-success-bg / --color-success-fg) are pre-balanced for badges and alerts.',
        ]}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          {['--color-action-primary', '--surface-raised', '--text-primary', '--color-warning-bg'].map((token) => (
            <div
              key={token}
              style={{
                height: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: `var(${token})`,
                border: '1px solid var(--border-default)',
              }}
              title={token}
            />
          ))}
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
