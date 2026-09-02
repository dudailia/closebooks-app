'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import BadgeGallery from '@/components/ui/BadgeGallery'
import Badge from '@/components/ui/Badge'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'badges')!

export default function BadgesSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Status chips"
        description="Semantic variants for workflow state — not for primary actions."
        code={`import Badge from '@/components/ui/Badge'

<Badge variant="success">Approved</Badge>
<Badge variant="warning" appearance="outline">Pending</Badge>
<Badge variant="danger" compact>Overdue</Badge>`}
        variants={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {(['success', 'warning', 'danger', 'info', 'neutral'] as const).map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
        }
        states={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Badge variant="info" appearance="filled">
              Filled
            </Badge>
            <Badge variant="info" appearance="outline">
              Outline
            </Badge>
            <Badge variant="success" compact>
              Compact
            </Badge>
          </div>
        }
        a11y={[
          'Badges are static spans — do not use as buttons.',
          'Status should not rely on color alone; include text label.',
          'Leading icons are aria-hidden when decorative.',
        ]}
      >
        <Badge variant="success">Reconciled</Badge>
      </PlaygroundBlock>

      <PlaygroundBlock title="Badge gallery" description="Full variant × appearance matrix with optional icons.">
        <BadgeGallery />
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
