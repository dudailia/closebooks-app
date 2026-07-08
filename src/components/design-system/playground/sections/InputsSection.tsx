'use client'

import { useState } from 'react'
import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import InputGallery from '@/components/ui/InputGallery'
import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'inputs')!

export default function InputsSection() {
  const [value, setValue] = useState('')

  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Field composition"
        description="Label + control + helper/error via Field primitive."
        code={`import Field from '@/components/ui/Field'
import Input from '@/components/ui/Input'

<Field label="Vendor" helperText="As it appears on the bank feed">
  <Input placeholder="Acme Corp" />
</Field>

<Field label="Email" error="Enter a valid email address">
  <Input invalid defaultValue="not-an-email" />
</Field>`}
        variants={
          <Field label="Amount" tone="brand" helperText="Brand tone for marketing surfaces">
            <Input tone="brand" placeholder="0.00" />
          </Field>
        }
        states={
          <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 360 }}>
            <Field label="Email" error="Enter a valid email address">
              <Input invalid defaultValue="not-an-email" />
            </Field>
            <Field label="Sync status">
              <Input loading defaultValue="Syncing…" />
            </Field>
          </div>
        }
        a11y={[
          'Field clones id and aria-describedby onto the child control.',
          'error prop sets aria-invalid on the input.',
          'loading sets aria-busy and disables interaction.',
        ]}
      >
        <div style={{ maxWidth: 360 }}>
          <Field label="Vendor" helperText={`${value.length} characters`}>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type to interact…" />
          </Field>
        </div>
      </PlaygroundBlock>

      <PlaygroundBlock
        title="Input system gallery"
        description="Input, Textarea, Select, sizes, tones, icons, and validation patterns."
        code={`import Input, { InputIcon } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'`}
        a11y={[
          'Keyboard focus uses .cb-input ring — distinct from global button outline.',
          'Select chevron is decorative; native semantics preserved.',
        ]}
      >
        <InputGallery />
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
