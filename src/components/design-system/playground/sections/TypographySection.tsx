'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'typography')!

const SIZES = [
  { token: '--font-size-xs', sample: 'Caption 11px', px: '11px' },
  { token: '--font-size-sm', sample: 'Small 13px', px: '13px' },
  { token: '--font-size-base', sample: 'Body 15px', px: '15px' },
  { token: '--font-size-md', sample: 'Medium 16px', px: '16px' },
  { token: '--font-size-lg', sample: 'Large 18px', px: '18px' },
  { token: '--font-size-xl', sample: 'Heading 22px', px: '22px' },
  { token: '--font-size-2xl', sample: 'Title 28px', px: '28px' },
  { token: '--font-size-3xl', sample: 'Display 36px', px: '36px' },
]

const FAMILIES = [
  { token: '--font-family-sans', label: 'Sans (Inter)', sample: 'Dashboard UI and forms' },
  { token: '--font-family-display', label: 'Display (Instrument Serif)', sample: 'Marketing headlines' },
  { token: '--font-family-mono', label: 'Mono (JetBrains)', sample: '1,234.56' },
]

export default function TypographySection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Type scale"
        description="Body default is 15px. Headings use tighter tracking via base reset."
        code={`<h1 style={{
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 'var(--font-weight-semibold)',
  lineHeight: 'var(--line-height-tight)',
  letterSpacing: '-0.025em',
}}>
  Month-end close
</h1>
<p style={{
  fontSize: 'var(--font-size-base)',
  lineHeight: 'var(--line-height-normal)',
  color: 'var(--text-secondary)',
}}>
  Supporting copy
</p>`}
        variants={
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {FAMILIES.map((f) => (
              <div key={f.token}>
                <p style={{ margin: '0 0 4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {f.label} · {f.token}
                </p>
                <p style={{ margin: 0, fontFamily: `var(${f.token})`, fontSize: 'var(--font-size-xl)' }}>
                  {f.sample}
                </p>
              </div>
            ))}
          </div>
        }
        states={
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {(['--font-weight-normal', '--font-weight-medium', '--font-weight-semibold', '--font-weight-bold'] as const).map(
              (w) => (
                <p
                  key={w}
                  style={{
                    margin: 0,
                    fontWeight: `var(${w})`,
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  {w.replace('--font-weight-', '').charAt(0).toUpperCase()}
                  {w.replace('--font-weight-', '').slice(1)} weight — CloseBooks
                </p>
              ),
            )}
          </div>
        }
        a11y={[
          'Prefer relative font sizes (rem via token px) so user zoom scales text.',
          'Line height --line-height-normal (1.6) for paragraphs; --line-height-tight for large headings.',
          'Do not use font size alone to convey state — pair with color, icon, or label.',
        ]}
      >
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {SIZES.map((row) => (
            <div
              key={row.token}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'baseline',
                gap: 'var(--space-4)',
                paddingBottom: 'var(--space-2)',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <span style={{ fontSize: `var(${row.token})`, color: 'var(--text-primary)' }}>{row.sample}</span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {row.token}
              </code>
            </div>
          ))}
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
