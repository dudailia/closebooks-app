'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import ButtonGallery from '@/components/ui/ButtonGallery'
import Button from '@/components/ui/Button'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'buttons')!

export default function ButtonsSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Primary actions"
        description="Forest green product fill for dashboard CTAs; ghost/secondary for de-emphasized actions."
        code={`import Button from '@/components/ui/Button'

<Button variant="primary" size="md">
  Save changes
</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger" loading>Deleting…</Button>`}
        variants={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        }
        states={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" fullWidth>
              Full width
            </Button>
          </div>
        }
        a11y={[
          'Native <button> with aria-busy when loading.',
          'Disabled and loading states are not focusable; provide alternative feedback for async work.',
          'Tab order: primary actions before destructive in the same toolbar.',
        ]}
      >
        <Button variant="primary">Approve selected</Button>
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Full variant matrix"
        description="Exhaustive gallery for QA — sizes sm/md/lg and keyboard focus checks."
        a11y={[
          ':focus-visible ring uses global --ring-focus token.',
          'Spinner SVG is aria-hidden; button text remains for screen readers.',
        ]}
      >
        <ButtonGallery />
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
