'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import Field from '@/components/ui/Field'
import { HelperText } from '@/components/ui/HelperText'
import Input, { InputIcon } from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import type { InputSize, InputTone } from '@/components/ui/inputStyles'

const TONES: InputTone[] = ['default', 'brand']
const SIZES: InputSize[] = ['sm', 'md', 'lg']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 var(--space-4)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h2>
  )
}

function GalleryLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-2)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}

function SearchIcon() {
  return (
    <InputIcon>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </InputIcon>
  )
}

function MailIcon() {
  return (
    <InputIcon>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 5.5L8 9l5.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </InputIcon>
  )
}

export default function InputGallery() {
  const [showError, setShowError] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Card>
        <SectionTitle>Tones (md)</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 420 }}>
          <Field label="Default (dashboard)" tone="default" helperText="Cream surface — matches settings inputs.">
            <Input placeholder="Firm name" />
          </Field>
          <div
            data-theme="dark"
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <Field label="Brand (auth)" tone="brand" helperText="Dark auth surface — matches DarkInput.">
              <Input tone="brand" placeholder="you@example.com" />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Sizes (default tone)</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 420 }}>
          {SIZES.map((size) => (
            <div key={size}>
              <GalleryLabel>{size}</GalleryLabel>
              <Input size={size} placeholder={`Size ${size}`} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>States</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 420 }}>
          <Field label="Default">
            <Input placeholder="Editable" />
          </Field>
          <Field label="Disabled">
            <Input placeholder="Disabled" disabled defaultValue="Cannot edit" />
          </Field>
          <Field label="Read only">
            <Input readOnly defaultValue="Read-only value" />
          </Field>
          <Field label="Required" required helperText="Required fields show an asterisk on the label.">
            <Input placeholder="Required" required />
          </Field>
          <Field
            label="Invalid"
            error={showError ? 'Please enter a valid email address.' : undefined}
            helperText="Toggle error state below."
          >
            <Input placeholder="you@example.com" invalid={showError} defaultValue="not-an-email" />
          </Field>
          <Field label="Loading">
            <Input placeholder="Saving…" loading defaultValue="Syncing" />
          </Field>
          <Button variant="secondary" size="sm" onClick={() => setShowError((v) => !v)}>
            Toggle invalid state
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Icons</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 420 }}>
          <Input leftIcon={<SearchIcon />} placeholder="Search clients" aria-label="Search clients" />
          <Input rightIcon={<MailIcon />} placeholder="Email" type="email" />
          <Input leftIcon={<SearchIcon />} rightIcon={<MailIcon />} placeholder="Left and right icons" />
        </div>
      </Card>

      <Card>
        <SectionTitle>Textarea</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 480 }}>
          <Field label="Notes" helperText="Resizes vertically.">
            <Textarea placeholder="Add a note for your team…" />
          </Field>
          <Field label="Invalid textarea" error="Message is too short.">
            <Textarea invalid defaultValue="Hi" />
          </Field>
          <Textarea tone="brand" placeholder="Brand tone on dark" rows={3} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Select</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 420 }}>
          <Field label="Entity type" helperText="Native select with chevron affordance.">
            <Select defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              <option value="llc">LLC</option>
              <option value="s-corp">S-Corp</option>
              <option value="c-corp">C-Corp</option>
            </Select>
          </Field>
          <Select invalid defaultValue="bad">
            <option value="bad">Invalid selection</option>
          </Select>
        </div>
      </Card>

      <Card>
        <SectionTitle>Standalone label & messages</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 420 }}>
          <Label htmlFor="standalone-input" required>
            Standalone label
          </Label>
          <Input id="standalone-input" placeholder="Associated via htmlFor" />
          <HelperText>Helper text without Field wrapper.</HelperText>
          <ErrorMessage>Standalone error message with role=&quot;alert&quot;.</ErrorMessage>
        </div>
      </Card>

      <Card>
        <SectionTitle>Keyboard & focus-visible</SectionTitle>
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Tab through controls to verify <code>.cb-input:focus-visible</code> rings (
          <code>--color-brand-product</code> on default tone, <code>--ring-focus</code> on brand).
        </p>
        <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 420 }}>
          <Input placeholder="Tab stop 1" />
          <Input placeholder="Tab stop 2" />
          <Select defaultValue="">
            <option value="">Tab stop 3 — select</option>
          </Select>
          <Textarea placeholder="Tab stop 4 — textarea" rows={2} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Matrix — tone × size</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {TONES.map((tone) => (
            <div key={tone}>
              <GalleryLabel>{tone}</GalleryLabel>
              <div
                {...(tone === 'brand' ? { 'data-theme': 'dark' as const } : {})}
                style={{
                  display: 'grid',
                  gap: 'var(--space-3)',
                  maxWidth: 420,
                  ...(tone === 'brand'
                    ? {
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-strong)',
                      }
                    : {}),
                }}
              >
                {SIZES.map((size) => (
                  <Input key={`${tone}-${size}`} tone={tone} size={size} placeholder={`${tone} / ${size}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
