'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CardBody from '@/components/ui/CardBody'
import CardFooter from '@/components/ui/CardFooter'
import CardHeader from '@/components/ui/CardHeader'
import SectionCard from '@/components/ui/SectionCard'
import StatCard from '@/components/ui/StatCard'
import type { CardVariant } from '@/components/ui/cardStyles'

const VARIANTS: CardVariant[] = ['default', 'raised', 'outlined', 'ghost', 'interactive']

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

function Showcase({ children }: { children: React.ReactNode }) {
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M7.5 10.5l3-3M8.5 6.5l2-2a2.12 2.12 0 013 3l-2 2M9.5 11.5l-2 2a2.12 2.12 0 01-3-3l2-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'var(--space-9)',
        height: 'var(--space-9)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-brand-muted)',
        color: 'var(--color-brand-product)',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

export default function CardGallery() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Showcase>
        <SectionTitle>Variants</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {VARIANTS.map((variant) => (
            <div key={variant}>
              <GalleryLabel>{variant}</GalleryLabel>
              <Card
                variant={variant}
                {...(variant === 'interactive'
                  ? { onClick: () => undefined, 'aria-label': `Interactive ${variant} card` }
                  : {})}
              >
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)} card content
                </p>
                <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  Token-driven surface, border, and shadow.
                </p>
              </Card>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Compound layout</SectionTitle>
        <Card variant="raised" padding="none" style={{ maxWidth: 480 }}>
          <CardHeader
            eyebrow="Billing"
            title="March close summary"
            description="Sent to 12 clients last week."
            divider
            action={<Button variant="ghost" size="sm">Export</Button>}
          />
          <CardBody>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              CardHeader, CardBody, and CardFooter compose inside a padding-none Card shell.
            </p>
          </CardBody>
          <CardFooter muted>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Updated 2h ago</span>
              <Button size="sm">View report</Button>
            </div>
          </CardFooter>
        </Card>
      </Showcase>

      <Showcase>
        <SectionTitle>StatCard</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <StatCard label="Transactions" value="128" sub="this period" icon={<ClockIcon />} />
          <StatCard label="Time saved" value="4.2h" sub="est. at 2 min/tx" tone="positive" icon={<ClockIcon />} />
          <StatCard label="Pending review" value="0" sub="all caught up" tone="muted" trend="+12% vs last month" />
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>SectionCard</SectionTitle>
        <SectionCard
          variant="default"
          title="Client upload portal"
          description="Generate a secure link your clients can use to send bank statements — no login needed."
          icon={<IconTile><LinkIcon /></IconTile>}
          footer={
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button size="sm">Get link</Button>
            </div>
          }
        >
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            SectionCard wraps Card + header/body/footer for dashboard section panels.
          </p>
        </SectionCard>
      </Showcase>

      <Showcase>
        <SectionTitle>Interactive link card</SectionTitle>
        <Card variant="interactive" href="#" style={{ maxWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <IconTile><LinkIcon /></IconTile>
            <div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                New close
              </p>
              <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Upload a bank statement
              </p>
            </div>
          </div>
        </Card>
      </Showcase>

      <Showcase>
        <SectionTitle>Keyboard & focus-visible</SectionTitle>
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Tab through interactive cards to verify <code>.cb-card:focus-visible</code> rings.
        </p>
        <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 480 }}>
          <Card variant="interactive" onClick={() => undefined} aria-label="Tab stop 1">
            Interactive button card
          </Card>
          <Card variant="interactive" href="#" aria-label="Tab stop 2">
            Interactive link card
          </Card>
        </div>
      </Showcase>
    </div>
  )
}
