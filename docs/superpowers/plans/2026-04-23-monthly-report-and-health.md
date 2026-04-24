# Monthly Report + Health Score + Branding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship extended firm branding, an agency-grade React-Email monthly-close report, and a 0–100 client health score with dashboard integration.

**Architecture:** Three features share one dependency (extended `FirmSettings` with logo + colors). React Email + Resend powers the email template and send pipeline with a preview-only fallback. Health score is a pure function of already-hydrated client data.

**Tech Stack:** Next.js 14, Supabase JSON payload rows (`firm_settings`, `jobs`), Resend, `@react-email/components`, `@react-email/render`.

**Gate:** `npm run build` after each phase.

**Spec:** `docs/superpowers/specs/2026-04-23-monthly-report-and-health.md`

---

## Phase A — Foundations

### Task 1: Install React Email

- [ ] Run `npm install @react-email/components @react-email/render`
- [ ] Confirm no peer-dep errors. Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add @react-email/components and render"
```

### Task 2: Brand-assets storage bucket migration

**Files:** Create `supabase/migrations/20260423200000_brand_assets_bucket.sql`

- [ ] Write migration:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 524288,
        ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
on conflict (id) do nothing;

drop policy if exists "firm_members_upload_brand_assets" on storage.objects;
create policy "firm_members_upload_brand_assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-assets');

drop policy if exists "public_read_brand_assets" on storage.objects;
create policy "public_read_brand_assets" on storage.objects
  for select using (bucket_id = 'brand-assets');
```

- [ ] `npm run build`. Commit.

### Task 3: Extend `FirmSettings`

**Files:** Modify `src/lib/firmSettings.ts`

- [ ] Read the current interface; add new optional fields. Rough shape:

```ts
export interface FirmSettings {
  firmName: string
  firmTagline?: string
  accentColor?: string
  preparedBy?: string
  inboxSlug?: string
  onboardingComplete?: boolean

  // NEW
  logoUrl?: string
  primaryColor?: string
  emailFromName?: string
  emailReplyTo?: string
  clientFacingName?: string
}
```

Keep existing defaults intact. No migration required — JSON payload tolerates new keys.

- [ ] `npm run build`. Commit.

### Task 4: Logo upload API

**Files:** Create `src/app/api/firm/logo/route.ts`

- [ ] Implement:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUser } from '@/lib/supabase/firmScope'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = await getFirmIdForUser()
  if (!firmId) return NextResponse.json({ error: 'No firm' }, { status: 400 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })
  if (file.size > 512 * 1024) return NextResponse.json({ error: 'File too large (512 KB max)' }, { status: 413 })

  const ext = (file.name.match(/\.(\w+)$/)?.[1] ?? 'png').toLowerCase()
  const supabase = createRouteHandlerClient(req)
  if (!supabase) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })

  const path = `${firmId}/logo-${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabase.storage.from('brand-assets').upload(path, buf, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: pub } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl, path })
}
```

- [ ] `npm run build`. Commit.

### Task 5: BrandingSettings component

**Files:** Create `src/components/settings/BrandingSettings.tsx`

- [ ] Implement the client-facing branding card with logo upload (POSTs to `/api/firm/logo`), color pickers (primary, accent), from-name, reply-to, client-facing name. Include a live preview pane.

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { loadFirmSettings, saveFirmSettings, type FirmSettings } from '@/lib/firmSettings'

export default function BrandingSettings() {
  const [s, setS] = useState<FirmSettings | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setS(loadFirmSettings()) }, [])
  if (!s) return null

  function update(patch: Partial<FirmSettings>) {
    const next = { ...s!, ...patch }
    setS(next)
    void saveFirmSettings(next)
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/firm/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      update({ logoUrl: data.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const primary = s.primaryColor ?? '#2d5a27'
  const accent  = s.accentColor  ?? '#b8734a'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
      <div style={{ padding: 24, backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1714' }}>Client-facing branding</h2>
        <p style={{ margin: '4px 0 18px', fontSize: 13, color: '#6b6560' }}>
          These colors and your logo appear on client emails and portal pages. Nothing from CloseBooks is shown to clients.
        </p>

        <Row label="Logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {s.logoUrl && <img src={s.logoUrl} alt="Firm logo" style={{ height: 40, maxWidth: 160, objectFit: 'contain', border: '1px solid #e0dbd4', borderRadius: 6, padding: 4, backgroundColor: '#faf8f4' }} />}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={onLogoChange} disabled={uploading}
              style={{ fontSize: 13 }} />
            {uploading && <span style={{ fontSize: 12, color: '#6b6560' }}>Uploading…</span>}
          </div>
          {error && <p style={{ marginTop: 6, fontSize: 12, color: '#991b1b' }}>{error}</p>}
        </Row>

        <Row label="Primary color">
          <ColorPicker value={primary} onChange={(v) => update({ primaryColor: v })} />
        </Row>
        <Row label="Accent color">
          <ColorPicker value={accent} onChange={(v) => update({ accentColor: v })} />
        </Row>
        <Row label="Client-facing firm name">
          <Txt value={s.clientFacingName ?? ''} placeholder={s.firmName} onChange={(v) => update({ clientFacingName: v || undefined })} />
        </Row>
        <Row label="Email &ldquo;from&rdquo; name">
          <Txt value={s.emailFromName ?? ''} placeholder={`Reports from ${s.firmName}`} onChange={(v) => update({ emailFromName: v || undefined })} />
        </Row>
        <Row label="Reply-to email">
          <Txt value={s.emailReplyTo ?? ''} placeholder="hello@yourfirm.com" onChange={(v) => update({ emailReplyTo: v || undefined })} />
        </Row>
      </div>

      <aside style={{ padding: 20, backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 14, position: 'sticky', top: 88 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6560', margin: 0, marginBottom: 12 }}>Preview</p>

        <div style={{ border: `1px solid ${primary}20`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', backgroundColor: primary, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.logoUrl ? <img src={s.logoUrl} alt="" style={{ height: 24, maxWidth: 120, objectFit: 'contain' }} /> : <span style={{ fontWeight: 700, fontSize: 14 }}>{s.clientFacingName ?? s.firmName}</span>}
          </div>
          <div style={{ padding: 16, fontSize: 13, color: '#1a1714' }}>
            <p style={{ margin: 0, marginBottom: 10, color: primary, fontWeight: 600 }}>Your books are closed ✓</p>
            <p style={{ margin: 0, color: '#6b6560', lineHeight: 1.55 }}>Revenue was up 12% this month. Net position improved.</p>
            <button style={{ marginTop: 14, padding: '8px 14px', fontSize: 12, fontWeight: 600, backgroundColor: primary, color: '#fff', border: 'none', borderRadius: 6 }}>View in portal</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b6560', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

function Txt({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 10px', border: '1px solid #e0dbd4', borderRadius: 8, fontSize: 13, color: '#1a1714', backgroundColor: '#faf8f4', boxSizing: 'border-box' }} />
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 40, height: 32, border: '1px solid #e0dbd4', borderRadius: 6, cursor: 'pointer', padding: 0, backgroundColor: 'transparent' }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 110, padding: '6px 10px', border: '1px solid #e0dbd4', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', color: '#1a1714', backgroundColor: '#faf8f4' }} />
    </div>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 6: Mount BrandingSettings in settings page

**Files:** Modify `src/app/dashboard/settings/page.tsx`

- [ ] Read current settings page; add `<BrandingSettings />` inside a new section (or as the first card if there is no branding block yet). If an existing "branding" block exists that only handles the legacy `accentColor`, keep it but render `<BrandingSettings />` immediately after — do not delete existing working settings.

- [ ] `npm run build`. Commit.

---

## Phase B — Monthly report email

### Task 7: Pricing `topExpenseCategories` helper

**Files:** Create `src/lib/reports/summarize.ts`

- [ ] Implement a pure-function summarizer that consumes job transactions and returns `{pnl, topExpenseCategories, priorPnl}` using existing `calculatePnL` + a reduce for top categories.

```ts
import type { Transaction, CategorizationJob } from '@/types'
import { calculatePnL } from '@/lib/autopilot/pnlCalculator'

export interface ExpenseCategory { category: string; amount: number; pct: number }

export function topExpenseCategories(txs: Transaction[], n = 5): ExpenseCategory[] {
  const buckets = new Map<string, number>()
  let total = 0
  for (const t of txs) {
    if (t.type !== 'debit') continue
    const cat = (t.final_category ?? t.suggested_category ?? 'Uncategorized').trim() || 'Uncategorized'
    buckets.set(cat, (buckets.get(cat) ?? 0) + t.amount)
    total += t.amount
  }
  const sorted = Array.from(buckets.entries())
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n)
  return sorted
}

export interface MonthlyReportData {
  revenue: number
  expenses: number
  netIncome: number
  revenueDeltaPct?: number
  topExpenseCategories: ExpenseCategory[]
}

export function buildMonthlyReport(job: CategorizationJob, priorJob: CategorizationJob | null): MonthlyReportData {
  const pnl = calculatePnL(job.transactions, job.created_at)
  const prior = priorJob ? calculatePnL(priorJob.transactions, priorJob.created_at) : null
  const deltaPct = prior && prior.revenue > 0 ? ((pnl.revenue - prior.revenue) / prior.revenue) * 100 : undefined
  return {
    revenue: pnl.revenue,
    expenses: pnl.operatingExpenses + pnl.cogs,
    netIncome: pnl.netIncome,
    revenueDeltaPct: deltaPct,
    topExpenseCategories: topExpenseCategories(job.transactions, 5),
  }
}
```

- [ ] `npm run build`. Commit.

### Task 8: React Email template

**Files:** Create `src/emails/MonthlyCloseReport.tsx`

- [ ] Implement:

```tsx
import { Html, Head, Preview, Body, Container, Section, Row, Column, Text, Heading, Img, Button, Hr } from '@react-email/components'

export interface MonthlyCloseReportProps {
  firmName: string
  firmLogoUrl?: string
  primaryColor: string
  accentColor: string
  clientName: string
  periodLabel: string
  narrativeHtml: string
  forwardLookingLine: string
  pnl: { revenue: number; expenses: number; netIncome: number; revenueDeltaPct?: number }
  topExpenseCategories: Array<{ category: string; amount: number; pct: number }>
  portalUrl: string
  preparedBy?: string
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function MonthlyCloseReport(props: MonthlyCloseReportProps) {
  const p = props.primaryColor
  const a = props.accentColor
  const bars = props.topExpenseCategories
  const maxBar = Math.max(...bars.map(b => b.amount), 1)

  return (
    <Html>
      <Head />
      <Preview>Your books are closed for {props.periodLabel} — summary inside</Preview>
      <Body style={{ backgroundColor: '#f5f1ea', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ backgroundColor: '#ffffff', maxWidth: 600, margin: '24px auto', borderRadius: 12, overflow: 'hidden', border: '1px solid #e4ddd0' }}>
          <Section style={{ padding: '28px 32px 16px', textAlign: 'center' as const }}>
            {props.firmLogoUrl
              ? <Img src={props.firmLogoUrl} alt={props.firmName} height={40} style={{ margin: '0 auto', maxWidth: 200 }} />
              : <Text style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em', color: '#1a1714', margin: 0 }}>{props.firmName}</Text>}
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <Hr style={{ borderColor: '#e4ddd0', margin: '0 0 24px' }} />
            <Text style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8a847d', margin: 0, marginBottom: 8 }}>{props.periodLabel}</Text>
            <Heading as="h1" style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: p, margin: 0, marginBottom: 6 }}>
              Your books are closed ✓
            </Heading>
            <Text style={{ fontSize: 15, color: '#55514c', margin: 0, marginBottom: 24 }}>
              Hi {props.clientName}, here&apos;s a summary of the month.
            </Text>
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <Row>
              <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Revenue</Text>
                <Text style={statValue}>${fmt(props.pnl.revenue)}</Text>
                {typeof props.pnl.revenueDeltaPct === 'number' && (
                  <Text style={{ ...statDelta, color: props.pnl.revenueDeltaPct >= 0 ? '#0a7a3f' : '#b13939' }}>
                    {props.pnl.revenueDeltaPct >= 0 ? '+' : ''}{props.pnl.revenueDeltaPct.toFixed(1)}% vs last
                  </Text>
                )}
              </Column>
              <Column style={{ width: '33%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Expenses</Text>
                <Text style={statValue}>${fmt(props.pnl.expenses)}</Text>
              </Column>
              <Column style={{ width: '34%', verticalAlign: 'top' as const }}>
                <Text style={statLabel}>Net income</Text>
                <Text style={{ ...statValue, color: props.pnl.netIncome >= 0 ? p : '#b13939' }}>${fmt(props.pnl.netIncome)}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: '#eee5d5', margin: '28px 0' }} />
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <div style={{ fontSize: 15, lineHeight: '1.65', color: '#2b2925' }}
                 dangerouslySetInnerHTML={{ __html: props.narrativeHtml }} />
          </Section>

          <Section style={{ padding: '4px 32px 24px' }}>
            <div style={{ borderLeft: `3px solid ${p}`, padding: '10px 14px', backgroundColor: `${p}0d`, borderRadius: 4 }}>
              <Text style={{ fontSize: 14, color: p, margin: 0, fontStyle: 'italic' as const }}>
                ➜ {props.forwardLookingLine}
              </Text>
            </div>
          </Section>

          <Section style={{ padding: '0 32px' }}>
            <Text style={statLabel}>Top expense categories</Text>
            {bars.map((b, i) => (
              <Row key={i} style={{ marginBottom: 10 }}>
                <Column style={{ width: '40%', paddingRight: 8, verticalAlign: 'middle' as const }}>
                  <Text style={{ fontSize: 13, color: '#2b2925', margin: 0 }}>{b.category}</Text>
                </Column>
                <Column style={{ width: '44%', verticalAlign: 'middle' as const }}>
                  <div style={{ height: 8, backgroundColor: '#f0ebe3', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, (b.amount / maxBar) * 100)}%`, height: '100%', backgroundColor: a, borderRadius: 4 }} />
                  </div>
                </Column>
                <Column style={{ width: '16%', verticalAlign: 'middle' as const, textAlign: 'right' as const }}>
                  <Text style={{ fontSize: 13, color: '#55514c', fontFamily: 'Menlo, monospace', margin: 0 }}>${fmt(b.amount)}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={{ borderColor: '#eee5d5', margin: '28px 0' }} />
          </Section>

          <Section style={{ padding: '0 32px 32px', textAlign: 'center' as const }}>
            <Button href={props.portalUrl} style={{
              backgroundColor: p, color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '12px 28px', borderRadius: 8, textDecoration: 'none', display: 'inline-block',
            }}>
              View full report in portal →
            </Button>
          </Section>

          <Section style={{ padding: '18px 32px 24px', backgroundColor: '#faf7f1', borderTop: '1px solid #e4ddd0' }}>
            <Text style={{ fontSize: 12, color: '#8a847d', margin: 0, textAlign: 'center' as const, lineHeight: 1.55 }}>
              Prepared by {props.preparedBy ?? 'your accounting team'} at {props.firmName}.<br />
              Reply to this email with any questions.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const statLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a847d', margin: 0, marginBottom: 4 }
const statValue: React.CSSProperties = { fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: '#1a1714', margin: 0, lineHeight: 1 }
const statDelta: React.CSSProperties = { fontSize: 12, margin: '4px 0 0', fontWeight: 600 }
```

- [ ] `npm run build`. Commit.

### Task 9: Send-monthly-report API

**Files:** Create `src/app/api/reports/send-monthly/route.ts`

- [ ] Implement:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import MonthlyCloseReport from '@/emails/MonthlyCloseReport'
import { buildMonthlyReport } from '@/lib/reports/summarize'
import { loadFirmSettings } from '@/lib/firmSettings'
import { dbGetJob, dbGetJobsForClient } from '@/lib/db'
import { getJob, getJobs } from '@/lib/storage'

export const dynamic = 'force-dynamic'

interface Body {
  jobId: string
  preview?: boolean
  clientEmailOverride?: string
  portalUrlOverride?: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const job = (await dbGetJob(body.jobId).catch(() => null)) ?? getJob(body.jobId)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const allClientJobs = (await dbGetJobsForClient(job.client_name).catch(() => null)) ?? getJobs().filter(j => j.client_name === job.client_name)
  const priorJob = allClientJobs
    .filter(j => j.id !== job.id && j.created_at < job.created_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null

  const settings = loadFirmSettings()
  const report = buildMonthlyReport(job, priorJob)

  const periodLabel = new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const ownerNarrative = (job as any).narrative?.paragraphs?.find((p: any) => p.tone === 'owner')?.html as string | undefined
  const forwardLine = (job as any).narrative?.forwardLookingLine as string | undefined

  const portalUrl = body.portalUrlOverride
    ?? `${process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://closebooks-app.vercel.app/portal'}`

  const html = await render(MonthlyCloseReport({
    firmName: settings.clientFacingName ?? settings.firmName,
    firmLogoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor ?? '#2d5a27',
    accentColor:  settings.accentColor  ?? '#b8734a',
    clientName: job.client_name,
    periodLabel,
    narrativeHtml: ownerNarrative ?? `<p>Your books for ${periodLabel} are closed. The full report is in your portal.</p>`,
    forwardLookingLine: forwardLine ?? 'See the portal for detailed insights.',
    pnl: { revenue: report.revenue, expenses: report.expenses, netIncome: report.netIncome, revenueDeltaPct: report.revenueDeltaPct },
    topExpenseCategories: report.topExpenseCategories,
    portalUrl,
    preparedBy: settings.preparedBy,
  }))

  if (body.preview || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ html, previewOnly: true })
  }

  const to = body.clientEmailOverride
  if (!to) return NextResponse.json({ error: 'client email required to send' }, { status: 400 })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromName = settings.emailFromName ?? `${settings.firmName} Reports`
  const fromAddr = process.env.RESEND_FROM_ADDRESS ?? 'reports@mail.closebooks.app'
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromAddr}>`,
    to,
    subject: `Your books are closed for ${periodLabel}`,
    html,
    replyTo: settings.emailReplyTo ?? undefined,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sent: true, id: data?.id, html })
}
```

- [ ] `npm run build`. If `dbGetJobsForClient` doesn't exist, use existing similar helper or inline the query. Commit.

### Task 10: Send button + preview modal

**Files:**
- Create: `src/components/reports/SendMonthlyReportButton.tsx`
- Create: `src/components/reports/MonthlyReportPreviewModal.tsx`

- [ ] Implement button + modal. Modal shows an iframe with `srcDoc={html}` and a send control.

```tsx
// SendMonthlyReportButton.tsx
'use client'
import { useState } from 'react'
import MonthlyReportPreviewModal from './MonthlyReportPreviewModal'

export default function SendMonthlyReportButton({ jobId, clientEmail }: { jobId: string; clientEmail?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#1a1714', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ✦ Send monthly report
      </button>
      {open && <MonthlyReportPreviewModal jobId={jobId} initialEmail={clientEmail} onClose={() => setOpen(false)} />}
    </>
  )
}
```

```tsx
// MonthlyReportPreviewModal.tsx
'use client'
import { useEffect, useState } from 'react'

export default function MonthlyReportPreviewModal({ jobId, initialEmail, onClose }: { jobId: string; initialEmail?: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/reports/send-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, preview: true }),
      })
      const data = await res.json()
      setHtml(data.html ?? null)
      setPreviewOnly(!!data.previewOnly)
      setLoading(false)
    })()
  }, [jobId])

  async function send() {
    setSending(true); setStatus(null)
    try {
      const res = await fetch('/api/reports/send-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, clientEmailOverride: email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setStatus(`Sent to ${email}`)
      setTimeout(onClose, 900)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Send failed')
    } finally { setSending(false) }
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: 960, maxWidth: '95vw', height: '85vh', backgroundColor: '#fff', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e0dbd4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1714' }}>Monthly report preview</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, color: '#6b6560', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f1ea' }}>
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#6b6560' }}>Rendering preview…</p>
            : html ? <iframe title="Email preview" srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} />
            : <p style={{ textAlign: 'center', padding: 40, color: '#991b1b' }}>Could not render preview.</p>}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #e0dbd4', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com"
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #e0dbd4', borderRadius: 8, fontSize: 13, color: '#1a1714', backgroundColor: '#faf8f4' }} />
          {previewOnly ? (
            <span style={{ fontSize: 12, color: '#6b6560' }}>Resend not configured · preview only</span>
          ) : (
            <button onClick={send} disabled={sending || !email.includes('@')}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, cursor: sending ? 'wait' : 'pointer', opacity: sending || !email.includes('@') ? 0.55 : 1 }}>
              {sending ? 'Sending…' : `Send to ${email || 'client'}`}
            </button>
          )}
        </div>
        {status && <p style={{ margin: 0, padding: '6px 18px', fontSize: 12, color: status.startsWith('Sent') ? '#166534' : '#991b1b', borderTop: '1px solid #f0ece4', textAlign: 'center' }}>{status}</p>}
      </div>
    </div>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 11: Wire Send button into review page + narrative caching

**Files:** Modify `src/app/dashboard/review/[jobId]/page.tsx`

- [ ] Import and render `<SendMonthlyReportButton>` next to the existing "Email Client" button.
- [ ] Add narrative caching: pass `onNarrativeGenerated` to `<NarrativeInsight>` that persists the narrative into `job` via `handleTransactionsChange` OR a dedicated `setJob(prev => ({...prev, narrative: n}))` + `dbSaveJob`.

```tsx
// inside ReviewPage, near existing buttons:
<SendMonthlyReportButton jobId={job.id} clientEmail={/* client.contact_email if available */ undefined} />

// and inside <NarrativeInsight />:
onNarrativeGenerated={(n) => {
  if (!job) return
  const next = { ...job, narrative: n }
  setJob(next)
  dbSaveJob(next).catch(() => {})
}}
```

Add `narrative?: any` to `CategorizationJob` in `src/types/index.ts` (Task 12 below).

- [ ] `npm run build`. Commit.

### Task 12: Extend `CategorizationJob` type

**Files:** Modify `src/types/index.ts`

- [ ] Add:

```ts
export type CategorizationJob = {
  // existing fields unchanged
  id: string
  client_name: string
  created_at: string
  status: 'processing' | 'review' | 'completed'
  total_transactions: number
  auto_categorized: number
  approved: number
  flagged: number
  transactions: Transaction[]
  chart_of_accounts: ChartOfAccounts[]

  // NEW
  narrative?: {
    paragraphs: Array<{ tone: 'formal'|'conversational'|'owner'; html: string; citations: Array<{ phrase: string; txIds: string[] }> }>
    forwardLookingLine: string
  }
  monthlyReportSentAt?: string
}
```

- [ ] `npm run build`. Commit.

---

## Phase C — Health score

### Task 13: Scoring module

**Files:** Create `src/lib/health/scoreClient.ts`

- [ ] Implement per spec §3.1–§3.3:

```ts
import type { CategorizationJob } from '@/types'
import type { Anomaly } from '@/lib/anomalyDetection'

export interface HealthInputs {
  jobs: CategorizationJob[]
  anomalies: Anomaly[]
  documents: { requested: number; uploaded: number; reviewed: number }
  reconciliation: { matched: number; unmatched: number } | null
  today?: Date
}

export interface HealthBreakdown {
  score: number
  bucket: 'excellent' | 'good' | 'attention' | 'critical'
  signals: {
    onTime:   { points: number; max: 30; note: string }
    anomalies:{ points: number; max: 20; note: string }
    docs:     { points: number; max: 20; note: string }
    recon:    { points: number; max: 30; note: string }
  }
  topReasons: string[]
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

export function scoreClient(inputs: HealthInputs): HealthBreakdown {
  const today = inputs.today ?? new Date()

  // ─ On-time (30 pts) ─
  const completed = inputs.jobs.filter(j => j.status === 'completed')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const lastCompleted = completed[0]
  let onTimePoints = 0
  let onTimeNote = 'No completed close yet'
  if (lastCompleted) {
    const closedAt = new Date(lastCompleted.created_at)
    const eom = endOfMonth(closedAt)
    const daysLate = Math.max(0, daysBetween(closedAt, eom))
    if (daysLate <= 10) { onTimePoints = 30; onTimeNote = 'Closed on time' }
    else if (daysLate >= 30) { onTimePoints = 0; onTimeNote = `Last close was ${daysLate} days late` }
    else { onTimePoints = Math.round(30 * (1 - (daysLate - 10) / 20)); onTimeNote = `Last close was ${daysLate} days late` }
  }

  // ─ Anomalies (20 pts) ─
  const aCount = inputs.anomalies.length
  const anomaliesPoints = Math.max(0, 20 - 2 * aCount)
  const anomaliesNote = aCount === 0 ? 'No open anomalies' : `${aCount} outstanding anomal${aCount === 1 ? 'y' : 'ies'}`

  // ─ Docs (20 pts) ─
  const { requested, uploaded, reviewed } = inputs.documents
  let docsPoints: number, docsNote: string
  if (requested === 0) { docsPoints = 20; docsNote = 'No pending document requests' }
  else {
    docsPoints = Math.round(20 * Math.min(1, (uploaded + reviewed) / requested))
    const missing = requested - uploaded - reviewed
    docsNote = missing === 0 ? 'All requested docs received' : `${missing} document${missing === 1 ? '' : 's'} still requested`
  }

  // ─ Recon (30 pts) ─
  let reconPoints: number, reconNote: string
  if (!inputs.reconciliation) { reconPoints = 15; reconNote = 'No recon data yet' }
  else {
    const { matched, unmatched } = inputs.reconciliation
    const total = matched + unmatched
    reconPoints = total === 0 ? 15 : Math.round(30 * (matched / total))
    reconNote = unmatched === 0 ? 'Fully reconciled' : `${unmatched} unmatched transaction${unmatched === 1 ? '' : 's'}`
  }

  const score = onTimePoints + anomaliesPoints + docsPoints + reconPoints
  const bucket = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'attention' : 'critical'

  const signals = {
    onTime:    { points: onTimePoints,    max: 30 as const, note: onTimeNote },
    anomalies: { points: anomaliesPoints, max: 20 as const, note: anomaliesNote },
    docs:      { points: docsPoints,      max: 20 as const, note: docsNote },
    recon:     { points: reconPoints,     max: 30 as const, note: reconNote },
  }

  // Top two reasons (gaps from max), excluding neutral docs
  const gaps: Array<{ label: string; gap: number; note: string }> = [
    { label: 'on-time',   gap: 30 - onTimePoints,    note: onTimeNote },
    { label: 'anomalies', gap: 20 - anomaliesPoints, note: anomaliesNote },
    { label: 'docs',      gap: requested === 0 ? 0 : 20 - docsPoints, note: docsNote },
    { label: 'recon',     gap: !inputs.reconciliation ? 0 : 30 - reconPoints, note: reconNote },
  ]
  const topReasons = gaps.filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 2).map(g => g.note)

  return { score, bucket, signals, topReasons }
}
```

- [ ] `npm run build`. Commit.

### Task 14: HealthPill component

**Files:** Create `src/components/health/HealthPill.tsx`

- [ ] Implement:

```tsx
'use client'
import { useState } from 'react'
import type { HealthBreakdown } from '@/lib/health/scoreClient'

const BUCKET_COLORS: Record<HealthBreakdown['bucket'], { bg: string; text: string; dot: string }> = {
  excellent: { bg: '#e8f0e6', text: '#166534', dot: '#059669' },
  good:      { bg: '#fffbeb', text: '#92400e', dot: '#d97706' },
  attention: { bg: '#fed7aa', text: '#9a3412', dot: '#ea580c' },
  critical:  { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
}

export default function HealthPill({ breakdown }: { breakdown: HealthBreakdown }) {
  const [open, setOpen] = useState(false)
  const c = BUCKET_COLORS[breakdown.bucket]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 999,
          backgroundColor: c.bg, color: c.text,
          fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
        aria-label={`Health score ${breakdown.score}`}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c.dot }} />
        {breakdown.score}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            width: 280, padding: 14, backgroundColor: '#fff',
            border: '1px solid #e0dbd4', borderRadius: 10,
            boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1a1714', textTransform: 'capitalize' }}>
              {breakdown.bucket} — {breakdown.score}/100
            </p>
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              {([['onTime', 'On-time close'], ['anomalies', 'Anomalies'], ['docs', 'Documents'], ['recon', 'Reconciliation']] as const).map(([k, label]) => {
                const s = breakdown.signals[k]
                const pct = Math.round((s.points / s.max) * 100)
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b6560', marginBottom: 2 }}>
                      <span>{label}</span>
                      <span style={{ fontFamily: 'monospace' }}>{s.points}/{s.max}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#f0ebe3', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: c.dot, borderRadius: 4 }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#6b6560', margin: '3px 0 0' }}>{s.note}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] `npm run build`. Commit.

### Task 15: Health API

**Files:** Create `src/app/api/clients/health/route.ts`

- [ ] Implement (keeps logic light; computes from existing hydrated data):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { scoreClient, type HealthBreakdown } from '@/lib/health/scoreClient'
import { getJobs } from '@/lib/storage'
import { detectAnomalies } from '@/lib/anomalyDetection'

export const dynamic = 'force-dynamic'

interface Body { clientNames: string[] }

export async function POST(req: NextRequest) {
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const all = getJobs()
  const out: Record<string, HealthBreakdown> = {}

  for (const name of body.clientNames) {
    const jobs = all.filter(j => j.client_name === name)
    const latest = jobs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    const prevJob = jobs.filter(j => j.id !== latest?.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    const anomalies = latest ? detectAnomalies(latest.transactions, prevJob?.transactions ?? null) : []

    out[name] = scoreClient({
      jobs,
      anomalies,
      documents: { requested: 0, uploaded: 0, reviewed: 0 },   // client-side hydrated later if needed
      reconciliation: null,
    })
  }

  return NextResponse.json({ scores: out })
}
```

(Health can be enhanced later with real document + recon counts from Supabase. This version works today from localStorage + derived anomalies.)

- [ ] `npm run build`. Commit.

### Task 16: Dashboard — Health pill column on clients list

**Files:** Modify `src/app/dashboard/clients/page.tsx`

- [ ] Read the current clients page; add a `healthByName` state + a one-shot fetch to `/api/clients/health` on mount. Render a `<HealthPill>` in an existing column or add a new column.

Concrete additions:

```tsx
import HealthPill from '@/components/health/HealthPill'
import type { HealthBreakdown } from '@/lib/health/scoreClient'

// state
const [healthByName, setHealthByName] = useState<Record<string, HealthBreakdown>>({})

// effect after clients hydrate
useEffect(() => {
  if (clients.length === 0) return
  void (async () => {
    const res = await fetch('/api/clients/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientNames: clients.map(c => c.business_name) }),
    })
    const data = await res.json()
    if (data?.scores) setHealthByName(data.scores)
  })()
}, [clients.length])

// in each client row:
{healthByName[client.business_name]
  ? <HealthPill breakdown={healthByName[client.business_name]} />
  : <span style={{ fontSize: 11, color: '#a09a94' }}>—</span>}
```

- [ ] `npm run build`. Commit.

### Task 17: Dashboard — Health badge on client detail header

**Files:** Modify `src/app/dashboard/clients/[clientId]/page.tsx`

- [ ] Add the same one-shot health fetch and render `<HealthPill>` next to the client name in the header.

- [ ] `npm run build`. Commit.

---

## Phase D — Portal branding audit

### Task 18: Scan and patch

- [ ] Grep for hardcoded "CloseBooks" text in `src/app/portal/`:

```bash
grep -rn "CloseBooks" src/app/portal src/lib/portal
```

- [ ] Replace any visible-to-client "CloseBooks" string with `settings.clientFacingName ?? settings.firmName`. Leave internal comments alone.
- [ ] Ensure the portal pages' `<title>` uses firm name.
- [ ] Ensure `emailHtml()` in `src/lib/portal/notify.ts` is firm-branded (already verified in survey; spot-check).
- [ ] `npm run build`. Commit.

---

## Phase E — Ship

### Task 19: Final build + push

- [ ] `npm run build && npm run lint`.
- [ ] `git push origin main`.
- [ ] Apply migration: run `supabase db push` or execute the SQL in the Supabase dashboard.

---

## Self-review

**Spec coverage:**
- §1 branding → Tasks 3–6 ✓
- §2 email → Tasks 7–12 ✓
- §3 health → Tasks 13–17 ✓
- §4 portal audit → Task 18 ✓

**Placeholder scan:** No TBDs. Task 9 has one fallback narrative message if narrative isn't cached — this is a graceful default, not a placeholder.

**Type consistency:** `HealthBreakdown`, `MonthlyCloseReportProps`, `MonthlyReportData`, `FirmSettings` new fields referenced consistently. `dbGetJobsForClient` may not exist — if not, use `getJobs().filter(...)` as Task 9 fallback already does.
