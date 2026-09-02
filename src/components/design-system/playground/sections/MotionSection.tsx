'use client'

import { useState } from 'react'
import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import Button from '@/components/ui/Button'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'motion')!

const DURATIONS = [
  { token: '--duration-fast', label: 'Fast (180ms)' },
  { token: '--duration-base', label: 'Base (300ms)' },
  { token: '--duration-slow', label: 'Slow (500ms)' },
]

export default function MotionSection() {
  const [pulse, setPulse] = useState(0)

  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Duration & easing"
        description="Modal and drawer entrances use utility classes in globals.css."
        code={`/* globals.css */
.cb-modal-enter {
  animation: cbModalEnter var(--duration-fast) var(--ease-emphasized) both;
}

@media (prefers-reduced-motion: reduce) {
  .cb-modal-enter { animation: none; }
}`}
        variants={
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {DURATIONS.map((d) => (
              <div key={d.token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <code style={{ width: 140, fontSize: 'var(--font-size-xs)' }}>{d.token}</code>
                <div
                  style={{
                    width: 48,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-brand-product)',
                    transition: `transform var(${d.token}) var(--ease-emphasized)`,
                    transform: pulse ? 'translateX(80px)' : 'translateX(0)',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{d.label}</span>
              </div>
            ))}
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Easing: <code>--ease-standard</code> (ease), <code>--ease-emphasized</code> (cubic-bezier out)
            </p>
          </div>
        }
        states={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div className="cb-modal-enter" style={{ padding: 'var(--space-4)', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              cb-modal-enter
            </div>
            <div className="page-enter" style={{ padding: 'var(--space-4)', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              page-enter
            </div>
          </div>
        }
        a11y={[
          'Respect prefers-reduced-motion — disable non-essential animations.',
          'Keep UI feedback under 300ms; use --duration-slow only for hero/marketing motion.',
          'Never use motion as the only indicator of success or error.',
        ]}
      >
        <Button variant="secondary" onClick={() => setPulse((p) => p + 1)}>
          Replay transitions
        </Button>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
