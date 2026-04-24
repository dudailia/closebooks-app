# Monthly Report Email + Client Health Score + Extended Branding

**Date:** 2026-04-23
**Status:** Approved
**Goal:** Ship three lock-in features that materially change what CPAs get out of CloseBooks: agency-grade monthly-close email to clients, an extended firm-branding system powering it, and a portfolio-level client health score on the dashboard.

Features intentionally deferred to future rounds: subdomain routing (path-based portal tokens already work), rebuilding the existing working portal UI (polish only), parallel "document request link" flows (existing portal token is this).

---

## 1. Extended firm branding

### 1.1 Schema additions

Extend the existing `firm_settings` payload-row JSON (no migration needed — Supabase JSONB tolerates new keys). Add these fields to `FirmSettings` in `src/lib/firmSettings.ts`:

```ts
interface FirmSettings {
  // existing fields unchanged
  firmName: string
  firmTagline?: string
  accentColor?: string          // existing
  preparedBy?: string
  inboxSlug?: string
  onboardingComplete?: boolean

  // NEW
  logoUrl?: string              // Supabase-storage public URL
  primaryColor?: string         // headings, primary CTAs; default '#2d5a27'
  emailFromName?: string        // e.g. "Sarah at Hansen & Co"
  emailReplyTo?: string         // reply-to override; defaults to firm email
  clientFacingName?: string     // override for portal/email display if different from legal firmName
}
```

### 1.2 Settings page

Extend `src/app/dashboard/settings/page.tsx` (or wherever the existing branding block lives) with a new "Client-facing branding" card containing:

- **Logo upload** — file input (PNG/SVG ≤ 512 KB), uploads to `brand-assets` Supabase storage bucket (new), stores public URL in `logoUrl`.
- **Primary color** picker — hex text + color swatch; defaults to `#2d5a27`.
- **Accent color** picker — hex text + color swatch; defaults to `#b8734a`.
- **"From" name** text input.
- **Reply-to email** text input (optional; validates as email).
- **Client-facing firm name** text input (shows below legal name as "Clients will see this name").
- **Live preview** pane on the right: a mini mock email header + portal pill rendered with the chosen logo + colors in real time.

### 1.3 Supabase storage bucket

New migration `supabase/migrations/20260423200000_brand_assets_bucket.sql`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 524288, ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
on conflict (id) do nothing;

create policy "firm_members_upload_brand_assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-assets');
create policy "public_read_brand_assets" on storage.objects
  for select using (bucket_id = 'brand-assets');
```

Public bucket is OK — logos are intentionally public. Writes gated by RLS.

### 1.4 Upload API

`src/app/api/firm/logo/route.ts` — POST accepts multipart form, authenticates via firm membership, uploads to `brand-assets/<firmId>/logo-<timestamp>.<ext>`, returns public URL. Then updates `firm_settings.logoUrl`.

---

## 2. Monthly-close report email

### 2.1 React Email

Install `@react-email/components` and `@react-email/render`. Create `src/emails/` directory holding email React components.

### 2.2 Template: `src/emails/MonthlyCloseReport.tsx`

Exported component with props:

```ts
interface MonthlyCloseReportProps {
  firmName: string
  firmLogoUrl?: string
  primaryColor: string
  accentColor: string
  clientName: string
  periodLabel: string                // "April 2026"
  narrative: NarrativeParagraph[]    // from existing /api/ai/narrative
  forwardLookingLine: string
  pnl: {
    revenue: number
    expenses: number
    netIncome: number
    revenueDeltaPct?: number         // vs prior month
  }
  topExpenseCategories: Array<{ category: string; amount: number; pct: number }>
  portalUrl: string                  // existing portal token URL
  preparedBy?: string
}
```

### 2.3 Layout

Standard single-column email, 600px max-width. Sections top to bottom:

1. **Firm header** — logo (or firm name in serif if no logo) centered above a hairline.
2. **Period stamp** — "Your books are closed for April 2026 ✓" in the firm's primary color.
3. **P&L summary** — three huge numbers in a grid: Revenue / Expenses / Net Income. Revenue row carries a little green/red "+12%" pill if delta is present.
4. **Narrative paragraphs** — pulls the "owner" tone from the narrative result (warm but clear). Rendered as HTML.
5. **Forward-looking line** — bordered callout with accent color.
6. **Top 5 expense categories** — horizontal bar chart built from CSS divs (no images): label on left, width-encoded bar on right, amount + percentage.
7. **CTA button** — "View full report in portal" → links to portal URL, uses primary color.
8. **Footer** — "Prepared by {preparedBy} at {firmName}", small print about questions.

Zero CloseBooks branding. Even the footer is firm-only. Colors all driven by `firm_settings`.

### 2.4 Send route

`src/app/api/reports/send-monthly/route.ts` — POST:

```ts
interface RequestBody {
  jobId: string
  preview?: boolean          // if true, return HTML instead of sending
  clientEmailOverride?: string
}
```

Pipeline:

1. Load job, client, firm settings, prior-month job.
2. Compute `pnl` via existing `calculatePnL()` + a small delta helper.
3. Compute `topExpenseCategories` (sum by category, pick top 5 by absolute amount).
4. Fetch narrative from existing `/api/ai/narrative` OR reuse the cached narrative stored on the job (if we persist it there — Phase C below).
5. Render HTML via `render(<MonthlyCloseReport {...props} />)`.
6. If `preview === true` or `RESEND_API_KEY` is missing: return `{ html, plainText }`.
7. Otherwise send via Resend, from `{emailFromName} <reports@mail.closebooks.app>` (or the firm's custom domain if we add it later), reply-to `emailReplyTo`, record `sent_at` on the job.

### 2.5 Send button + preview modal

On the review page, add `<SendMonthlyReportButton>` next to the existing "Email Client" button. Opens `<MonthlyReportPreviewModal>`:

- Left pane: email recipient editable (defaults to client email from client record).
- Right pane: rendered HTML preview in an iframe (sandbox).
- Footer: "Cancel" + "Send to {client email}" (disabled until email looks valid). If `RESEND_API_KEY` missing, the Send button is replaced by "Copy HTML" + "Resend is not configured in this environment — preview only."

### 2.6 Narrative caching (small addition)

Add `narrative?: NarrativeResult` + `monthlyReportSentAt?: string` to `CategorizationJob` type. `NarrativeInsight` component's existing `onNarrativeGenerated` callback already exists — wire it up in the review page to persist the narrative onto the job (`dbSaveJob`). This avoids re-running Claude when sending the email.

---

## 3. Client health score

### 3.1 Scoring module — `src/lib/health/scoreClient.ts`

Exports:

```ts
export interface HealthInputs {
  jobs: CategorizationJob[]       // all jobs for this client
  anomalies: Anomaly[]            // current outstanding
  documents: { requested: number; uploaded: number; reviewed: number }
  reconciliation: { matched: number; unmatched: number } | null
  today?: Date                    // defaults to new Date()
}

export interface HealthBreakdown {
  score: number                   // 0-100
  bucket: 'excellent' | 'good' | 'attention' | 'critical'
  signals: {
    onTime:   { points: number; max: 30; note: string }
    anomalies:{ points: number; max: 20; note: string }
    docs:     { points: number; max: 20; note: string }
    recon:    { points: number; max: 30; note: string }
  }
  topReasons: string[]            // top 2 human-readable issues if score < 85
}

export function scoreClient(inputs: HealthInputs): HealthBreakdown
```

### 3.2 Scoring logic

**On-time (30 pts):**
- Look at the most recent completed job for the current and prior month.
- Full 30 if closed within 10 days of month end.
- Linear decay to 0 over the next 20 days.
- No completed job for last month at all → 0.

**Anomalies (20 pts):**
- 20 − (2 × outstanding anomalies), floor 0.

**Documents (20 pts):**
- If no docs requested → 20 (neutral).
- Otherwise `20 × (uploaded + reviewed) / requested`, floor 0.

**Reconciliation (30 pts):**
- If no recon data → 15 (neutral).
- Otherwise `30 × matched / (matched + unmatched)`, floor 0.

**Buckets:**
- ≥ 90 excellent, ≥ 75 good, ≥ 60 attention, < 60 critical.

### 3.3 `topReasons`

Generated by picking the two signals with the largest gaps from their max (excluding `docs` if neutral). Human-readable strings like "Last close was 14 days late" or "6 outstanding anomalies".

### 3.4 Dashboard integration

- **Column on the clients list** (`src/app/dashboard/clients/page.tsx`): pill showing score + colored dot. Clicking the pill opens a small popover with the `topReasons` list and a link to the client detail.
- **Header on the client detail** (`src/app/dashboard/clients/[clientId]/page.tsx`): score badge next to the client name.
- **Health column sort** on the clients list — CPAs can sort low-first to triage.

### 3.5 API — `src/app/api/clients/health/route.ts`

- POST accepts `{clientIds: string[]}`, returns a map `{clientId: HealthBreakdown}`. Each client's health is computed from data already hydrated via existing helpers (jobs from storage/db, anomalies from detectAnomalies, docs from portal_documents, recon from bank-rec results if present).
- Used once per dashboard load; results cached in React state for the session.

---

## 4. CloseBooks-branding audit

Quick pass on the portal pages to make sure no CloseBooks branding leaks:

- `src/app/portal/[token]/*` — check for hardcoded "CloseBooks" strings, CloseBooks logos, default green color.
- `src/lib/portal/notify.ts` email templates — confirm `emailHtml()` branded wrapper uses firm settings, not CloseBooks.
- Meta tags (`<title>`) in portal pages — should use firm name, not "CloseBooks".

Any leaks replaced with firm-settings-driven values. Not a full redesign — just a cleanup pass.

---

## 5. File map

### New files

```
src/emails/
  MonthlyCloseReport.tsx

src/lib/email/
  sendMonthlyReport.ts      (renders + sends via Resend or returns preview)

src/lib/health/
  scoreClient.ts
  inputs.ts                 (helpers to hydrate HealthInputs from existing data)

src/components/reports/
  SendMonthlyReportButton.tsx
  MonthlyReportPreviewModal.tsx

src/components/health/
  HealthPill.tsx
  HealthBadge.tsx
  HealthBreakdownPopover.tsx

src/components/settings/
  BrandingSettings.tsx      (logo upload + color pickers + preview)

src/app/api/reports/send-monthly/route.ts
src/app/api/clients/health/route.ts
src/app/api/firm/logo/route.ts

supabase/migrations/20260423200000_brand_assets_bucket.sql
```

### Modified files

```
src/lib/firmSettings.ts                        — extend FirmSettings interface
src/app/dashboard/settings/page.tsx            — mount BrandingSettings card
src/app/dashboard/review/[jobId]/page.tsx      — Send Monthly Report button + narrative caching
src/app/dashboard/clients/page.tsx             — health pill column
src/app/dashboard/clients/[clientId]/page.tsx  — health badge in header
src/types/index.ts                             — add narrative + monthlyReportSentAt to CategorizationJob
src/lib/portal/notify.ts                       — verify firm branding (audit pass)
package.json                                   — add @react-email/components, @react-email/render
```

### Deletions

None — purely additive.

---

## 6. Environment

- Optional: `RESEND_API_KEY` — if unset, preview-only mode with a clear banner.
- Optional: `NEXT_PUBLIC_PORTAL_BASE_URL` — used for building the portal link in emails. Defaults to `${origin}/portal/${token}`.

---

## 7. Testing strategy

`npm run build` + `npm run lint` after each phase. Manual verification:

- **Branding**: upload a logo on settings, change primary color, see live preview update. Check Supabase storage bucket for the file.
- **Email preview**: complete a job, click "Send Monthly Report", see rendered email in the preview iframe. Confirm no CloseBooks branding visible.
- **Email send**: with Resend key set, send to your own inbox; verify rendering in Gmail (desktop + mobile) and Apple Mail.
- **Health score**: open clients list, sort by health, see scores distributed sensibly across your demo clients. Hover the pill, see top reasons.

---

## 8. Rollout

Single branch → main → Vercel. Brand-assets bucket migration applies on next `supabase db push` or via SQL editor.
