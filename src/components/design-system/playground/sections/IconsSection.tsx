'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'icons')!

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3l6 10H2L8 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const SIZES = [12, 16, 20, 24] as const

export default function IconsSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Inline SVG icons"
        description="Icons are inline SVG with currentColor. Decorative icons use aria-hidden."
        code={`<button type="button" aria-label="Search transactions">
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    …
  </svg>
</button>

/* Decorative — hide from AT */
<svg aria-hidden="true" … />

/* Meaningful — expose label on parent */
<span role="img" aria-label="Warning">…</span>`}
        variants={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
            {SIZES.map((size) => (
              <div key={size} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  <SearchIcon size={size} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{size}px</span>
              </div>
            ))}
          </div>
        }
        states={
          <div style={{ display: 'flex', gap: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--color-brand-product)' }}>
              <CheckIcon /> Success
            </span>
            <span style={{ color: 'var(--danger)' }}>
              <AlertIcon /> Danger
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              <SearchIcon /> Muted
            </span>
          </div>
        }
        a11y={[
          'Decorative icons: aria-hidden="true" on SVG; label on interactive parent.',
          'Icon-only buttons require aria-label (or visible text).',
          'Stroke width 1.5 at 16×16 viewBox matches input/button affix icons.',
        ]}
      >
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', color: 'var(--text-primary)' }}>
          <SearchIcon />
          <CheckIcon />
          <AlertIcon />
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
