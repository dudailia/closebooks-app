'use client'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import PageActions from '@/components/ui/PageActions'
import PageContainer from '@/components/ui/PageContainer'
import PageGrid from '@/components/ui/PageGrid'
import PageHeader from '@/components/ui/PageHeader'
import PageSection from '@/components/ui/PageSection'
import StatCard from '@/components/ui/StatCard'
import type { PageWidth } from '@/components/ui/layoutStyles'

const WIDTHS: PageWidth[] = ['sm', 'md', 'lg', 'xl', 'wide']

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

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 19c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8.5a2.5 2.5 0 010 5M18 19c0-1.8-1.3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GridTile({ label }: { label: string }) {
  return (
    <Card variant="outlined" padding="sm">
      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{label}</p>
    </Card>
  )
}

export default function LayoutGallery() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Showcase>
        <SectionTitle>PageContainer widths</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {WIDTHS.map((width) => (
            <PageContainer key={width} as="div" width={width} padded={false} style={{ padding: 0 }}>
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                width=&quot;{width}&quot;
              </div>
            </PageContainer>
          ))}
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Composed page shell</SectionTitle>
        <PageContainer as="div" width="lg" padded={false} style={{ paddingTop: 0, paddingBottom: 0 }}>
          <PageHeader
            eyebrow="Dashboard"
            title="Clients"
            description="Manage your client portfolio, health scores, and close status."
            actions={
              <PageActions>
                <Button variant="secondary" size="sm">
                  Export
                </Button>
                <Button size="sm">Add client</Button>
              </PageActions>
            }
          />

          <PageSection title="Overview" description="Key metrics for this period.">
            <PageGrid gap="md" minColumnWidth="200px">
              <StatCard label="Active clients" value="24" sub="3 added this month" />
              <StatCard label="Closes due" value="6" tone="positive" sub="next 7 days" />
              <StatCard label="At risk" value="2" tone="muted" sub="health below 60" />
            </PageGrid>
          </PageSection>

          <PageSection title="Recent activity" divider actions={<Badge variant="info">Live</Badge>}>
            <Card variant="default" padding="md">
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                PageSection with divider stacks below the header block.
              </p>
            </Card>
          </PageSection>
        </PageContainer>
      </Showcase>

      <Showcase>
        <SectionTitle>PageGrid</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div>
            <GalleryLabel>Auto-fit (minColumnWidth 220px)</GalleryLabel>
            <PageGrid gap="md" minColumnWidth="220px">
              <GridTile label="Tile 1" />
              <GridTile label="Tile 2" />
              <GridTile label="Tile 3" />
              <GridTile label="Tile 4" />
            </PageGrid>
          </div>
          <div>
            <GalleryLabel>Fixed columns=3 (responsive breakpoints)</GalleryLabel>
            <PageGrid gap="md" columns={3}>
              <GridTile label="A" />
              <GridTile label="B" />
              <GridTile label="C" />
            </PageGrid>
          </div>
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>EmptyState</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <EmptyState
            icon={<UsersIcon />}
            title="No team members yet"
            description="Invite your first team member to start collaborating on closes."
            actionLabel="Invite member"
            onAction={() => undefined}
          />
          <EmptyState
            variant="card"
            title="No documents"
            description="Uploaded files will appear here."
            action={<Button variant="secondary">Upload document</Button>}
          />
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>PageActions alignment</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {(['start', 'end', 'between', 'center'] as const).map((align) => (
            <div key={align}>
              <GalleryLabel>{align}</GalleryLabel>
              <PageActions align={align}>
                <Button variant="ghost" size="sm">
                  Secondary
                </Button>
                <Button size="sm">Primary</Button>
              </PageActions>
            </div>
          ))}
        </div>
      </Showcase>
    </div>
  )
}
