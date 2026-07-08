'use client'

import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { InputSpinner } from '@/components/ui/InputSpinner'
import { SkeletonBlock, SkeletonCard, SkeletonTable } from '@/components/Skeleton'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'loading')!

export default function LoadingSection() {
  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Skeleton shimmer"
        description="cb-skeleton class in globals.css — SSR-safe placeholders."
        code={`import { SkeletonBlock, SkeletonCard, SkeletonTable } from '@/components/Skeleton'

<SkeletonCard lines={3} />
<SkeletonTable rows={5} cols={4} />`}
        variants={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <SkeletonCard lines={3} />
            <SkeletonTable rows={4} cols={3} />
          </div>
        }
        states={
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <SkeletonBlock width={120} height={16} />
            <SkeletonBlock width={80} height={16} />
            <SkeletonBlock width={200} height={16} />
          </div>
        }
        a11y={[
          'Skeleton regions should have aria-busy="true" on the loading container.',
          'Replace skeleton with content without moving focus unexpectedly.',
          'Respect prefers-reduced-motion — shimmer animation should degrade gracefully.',
        ]}
      >
        <SkeletonCard lines={4} />
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Control spinners"
        description="Button and Input loading states share spinner semantics."
        code={`<Button loading>Saving…</Button>
<Input loading aria-busy value="Syncing" readOnly />`}
        variants={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <InputSpinner size="sm" />
            <InputSpinner size="md" />
            <InputSpinner size="lg" />
          </div>
        }
        states={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
            <Button variant="primary" loading>
              Saving
            </Button>
            <Input loading defaultValue="Loading field" style={{ maxWidth: 200 }} readOnly />
          </div>
        }
        a11y={[
          'aria-busy on loading buttons and inputs.',
          'Spinner SVGs are aria-hidden.',
          'Keep visible label text during load — do not swap to icon-only.',
        ]}
      >
        <Button variant="secondary" loading>
          Processing
        </Button>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
