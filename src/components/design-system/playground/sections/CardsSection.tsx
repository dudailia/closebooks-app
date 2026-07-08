'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import CardGallery from '@/components/ui/CardGallery'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'cards')!

export default function CardsSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Surface variants"
        description="Card, StatCard, and SectionCard for grouped content."
        code={`import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'

<Card variant="raised" padding="md">
  <h3>Reconciliation</h3>
  <p>12 items need review</p>
</Card>

<StatCard label="Open items" value="24" trend="+3" />`}
        variants={
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            <Card variant="outlined" padding="md">
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Outlined</p>
            </Card>
            <Card variant="raised" padding="md">
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Raised</p>
            </Card>
          </div>
        }
        states={
          <StatCard label="Transactions reviewed" value="847" sub="This period" />
        }
        a11y={[
          'Use heading levels inside cards for document outline.',
          'StatCard value should be plain text or aria-label if abbreviated.',
        ]}
      >
        <Card variant="default" padding="lg" style={{ maxWidth: 320 }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Client health</p>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Good — 2 anomalies flagged
          </p>
        </Card>
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Card system gallery"
        description="All padding steps, header/body/footer composition, and SectionCard."
        code={`import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'`}
        a11y={['Interactive cards need a single focusable element or button role.', 'Do not nest clickable cards.']}
      >
        <CardGallery />
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
