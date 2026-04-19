# Client Collaboration Portal — Design Spec

**Goal:** Transform the existing demo portal at `/portal/[firmId]/[clientToken]/` into a fully functional, real-time collaboration hub that small-business clients of CPA firms genuinely love using — mobile-first, white-labeled with firm branding, with document exchange, real-time messaging, report delivery, and action items.

**Architecture:** Token-based access at `/portal/[token]` — no login required. A single opaque UUID token stored in `portal_tokens` maps to `firm_id + client_id + permissions`. All portal pages are Next.js Server Components that validate the token server-side, then render branded UI. Supabase realtime subscriptions handle live message updates on the client. Resend handles transactional email.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Realtime + Storage), Resend for email, inline styles matching existing `#faf8f4`/`#b8734a`/`#1a1714` palette with firm `accentColor` override.

**Target audience design note:** Small business owners (construction, retail, restaurants, professional services) checking their books on a phone between jobs. Design must be warm, trustworthy, extremely readable, fast to scan on mobile. No jargon. Action-oriented. Like having a great accountant in your pocket.

---

## 1. Database Schema

### New Tables (1 migration file)

#### `portal_tokens`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
token         UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
firm_id       TEXT NOT NULL
client_id     TEXT NOT NULL
permissions   TEXT[] NOT NULL DEFAULT '{view_reports,upload_documents,send_messages,view_transactions,approve_items}'
expires_at    TIMESTAMPTZ NOT NULL DEFAULT now() + interval '90 days'
created_by    TEXT NOT NULL  -- firm user id
last_accessed_at TIMESTAMPTZ
created_at    TIMESTAMPTZ DEFAULT now()
```

#### `portal_documents`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
firm_id         TEXT NOT NULL
client_id       TEXT NOT NULL
name            TEXT NOT NULL
category        TEXT CHECK (category IN ('receipt','invoice','statement','tax','other')) DEFAULT 'other'
status          TEXT CHECK (status IN ('requested','uploaded','reviewed')) DEFAULT 'requested'
storage_path    TEXT
requested_note  TEXT
uploaded_at     TIMESTAMPTZ
reviewed_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `portal_messages`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
firm_id         TEXT NOT NULL
client_id       TEXT NOT NULL
sender          TEXT CHECK (sender IN ('firm','client')) NOT NULL
content         TEXT NOT NULL
attachment_path TEXT
read_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `portal_action_items`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
firm_id         TEXT NOT NULL
client_id       TEXT NOT NULL
title           TEXT NOT NULL
description     TEXT
due_date        DATE
completed_at    TIMESTAMPTZ
attachment_path TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `portal_access_log`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
token_id     UUID REFERENCES portal_tokens(id) ON DELETE CASCADE
ip_address   TEXT
user_agent   TEXT
accessed_at  TIMESTAMPTZ DEFAULT now()
```

### RLS
All portal tables: `ENABLE ROW LEVEL SECURITY` with policy allowing only service-role key (portal API routes use service role, never anon key for portal reads). Firm dashboard routes continue to use user auth + `firm_id = auth.uid()::text`.

---

## 2. File Structure

### New files to create

```
supabase/migrations/
  20260419000000_client_portal.sql

src/lib/portal/
  auth.ts            — validateToken(token) → PortalSession | null
  types.ts           — PortalSession, PortalDocument, PortalMessage, PortalActionItem
  storage.ts         — DB helpers for portal tables (getDocuments, getMessages, etc.)
  notify.ts          — sendPortalEmail(template, payload) via Resend

src/app/portal/[token]/
  layout.tsx         — Server: validates token, loads firm branding, renders shell
  page.tsx           — Dashboard
  documents/page.tsx — Document Center
  messages/page.tsx  — Messages (client: realtime)
  reports/page.tsx   — Reports archive
  actions/page.tsx   — Action Items

src/app/portal/
  invalid/page.tsx   — Token invalid/expired page
  expired/page.tsx   — Token expired page

src/components/portal/
  PortalShell.tsx    — Branded header + mobile bottom nav
  DocumentUpload.tsx — Drag-drop + camera capture upload zone
  MessageThread.tsx  — Realtime message thread (client component)
  ActionChecklist.tsx — Action items list with completion

src/app/api/portal/
  validate/route.ts  — GET ?token= → validates and returns session
  documents/route.ts — GET (list), POST (upload), PATCH (mark reviewed)
  messages/route.ts  — GET (list), POST (send)
  actions/route.ts   — GET (list), PATCH (complete)
  notify/route.ts    — POST → sends Resend email

src/app/dashboard/portal/
  page.tsx           — UPGRADED: all active tokens with last-accessed
  [clientId]/setup/
    page.tsx         — UPGRADED: real token generation + permissions + rotate

src/middleware.ts    — UPGRADED: rate limiting on /portal/* routes
```

### Files to modify
- `src/app/portal/[firmId]/[clientToken]/layout.tsx` — redirect to new `/portal/[token]` URL (if token exists) or render legacy demo
- `src/app/portal/[firmId]/[clientToken]/page.tsx` — keep as demo fallback
- `src/app/dashboard/portal/[clientId]/setup/page.tsx` — full upgrade to real token management
- `src/middleware.ts` — add rate limiting (create if not exists)

---

## 3. Token Auth Flow

```
Portal page load (Server Component)
  → validateToken(token) in src/lib/portal/auth.ts
  → SELECT * FROM portal_tokens WHERE token = $1 AND expires_at > now()
  → if not found → redirect('/portal/invalid')
  → if found → INSERT portal_access_log (ip, user_agent)
  → UPDATE portal_tokens SET last_accessed_at = now()
  → return PortalSession { firmId, clientId, permissions, firmSettings }

PortalSession type:
  firmId: string
  clientId: string
  clientName: string
  permissions: string[]
  firmName: string
  accentColor: string
  firmLogoUrl?: string
  expiresAt: string
```

`validateToken` uses Supabase service role client (env var `SUPABASE_SERVICE_ROLE_KEY`) — never exposed to browser.

---

## 4. Portal Shell & Branding

`PortalShell` wraps every portal page. It receives `PortalSession` as props.

**Desktop header** (sticky, 56px):
- Left: Firm name in DM Serif, firm accent dot
- Center: Nav tabs (Dashboard | Documents | Messages | Reports | Actions) — hide tabs client doesn't have permission for
- Right: Client business name in muted text

**Mobile bottom nav** (fixed, safe-area-inset):
- 5 icon tabs matching the pages
- Active tab uses `accentColor`
- Badge on Messages tab when unread count > 0

**CSS custom property**: `--accent: {accentColor}` injected into layout inline style. All accent uses reference `var(--accent)`.

**Zero CloseBooks branding** — no logo, no "Powered by", no CloseBooks text anywhere in portal routes.

---

## 5. Dashboard Page

Server component. Sections:

### Close Status Card
Query `jobs` table for `client_id` where `period = current_month`. Show progress bar: `completed_jobs / total_jobs * 100%`. Status states: "In Progress", "Under Review", "Complete". Color: green when complete, amber when in progress.

### Financial Snapshot (if `view_transactions` permission)
3 cards: Revenue (sum of credit transactions this month), Expenses (sum of debit), Net. Numbers from `book_transactions` or equivalent table. If no permission → show locked card with "Ask your accountant to enable financial data."

### Outstanding Action Items
Count + first 3 from `portal_action_items` where `completed_at IS NULL`. "View all →" link to actions page.

### Recent Activity Feed
Last 10 events merged from: portal_messages (new messages), portal_documents (uploads/requests/reviews), portal_action_items (newly added). Each event has icon, description, timestamp. Newest first.

---

## 6. Document Center Page

Client component (for upload interaction).

### Requested Documents List
Table/cards with columns: Name | Category pill | Status pill (yellow=requested, blue=uploaded, green=reviewed) | Action button.

Status pills:
- `requested` → orange "Needed" pill + "Upload" button
- `uploaded` → blue "Uploaded" pill + "View" link
- `reviewed` → green "Reviewed" pill + checkmark

### Upload Zone
```
Drag files here or tap to browse
[Camera icon] Take a photo
```
`<input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" multiple>`
Mobile: also renders `<input type="file" accept="image/*" capture="environment">` for camera.

Upload flow: POST `/api/portal/documents` with `multipart/form-data`. Server uploads to Supabase Storage at `portal-docs/{firmId}/{clientId}/{timestamp}-{filename}`, updates `portal_documents` row status to `uploaded`, triggers Resend email to firm.

### Category Filter
Pill filter bar at top: All | Receipts | Invoices | Statements | Tax | Other

---

## 7. Messages Page

Client component with Supabase realtime.

### Layout
- Mobile: full-screen thread (no sidebar)
- Desktop (≥768px): left sidebar (recent messages list) + right thread panel

### Realtime
```typescript
supabase
  .channel(`portal-messages-${firmId}-${clientId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'portal_messages',
    filter: `firm_id=eq.${firmId}`,
  }, handleNewMessage)
  .subscribe()
```

### Message bubbles
- Firm messages: left-aligned, light background, firm name label
- Client messages: right-aligned, accent color background, "You" label
- File attachments: inline thumbnail for images, download link for PDFs

### Read receipts
On mount: PATCH `/api/portal/messages` to mark all firm messages as `read_at = now()`.
Firm dashboard shows "Seen" checkmark when `read_at` is set.

### Send box
Textarea + send button + paperclip for file attachment. POST `/api/portal/messages`. Triggers Resend email to firm.

---

## 8. Reports Page

Server component.

Query `jobs` table where `client_id = X AND status = 'complete'` ordered by period desc. Each job row shows:
- Period (formatted: "March 2026")
- Completed date
- "Download PDF" button → signed Supabase Storage URL (1-hour expiry) if storage_path exists
- "View Summary" → inline expand of close summary text

Grouped by year. No reports yet → friendly empty state with "Reports will appear here when your accountant completes a monthly close."

---

## 9. Action Items Page

Client component.

### List
Each action item: checkbox + title + due date + description expand + optional attachment upload.

Clicking checkbox: PATCH `/api/portal/actions` sets `completed_at`. Optimistic UI update (mark complete immediately, revert if API fails).

Due date logic:
- Overdue → red text
- Due within 3 days → amber text  
- Otherwise → muted text

### Attachment on completion
When completing an item: optional "Attach a file" prompt slides in. Upload goes to `portal-docs/{firmId}/{clientId}/actions/{id}`. POST `/api/portal/notify` triggers email to firm with attachment.

---

## 10. Email Notifications (Resend)

Install: `npm install resend`

`src/lib/portal/notify.ts` exports `sendPortalEmail(template, payload)`.

Templates (inline HTML, no separate files):

| Event | Recipient | Subject |
|-------|-----------|---------|
| Firm creates doc request | Client | `{firmName}: Document needed — {docName}` |
| Client uploads doc | Firm | `{clientName} uploaded: {docName}` |
| Client sends message | Firm | `New message from {clientName}` |
| Firm sends message | Client | `Message from {firmName}` |
| Action item added | Client | `{firmName}: Action needed — {title}` |
| Action item completed | Firm | `{clientName} completed: {title}` |

Email HTML: firm `accentColor` header, firm name, message body, CTA button linking to portal. Footer: "You're receiving this because your accountant uses {firmName}'s client portal." No CloseBooks branding.

Resend API key via `RESEND_API_KEY` env var. If not set, `sendPortalEmail` is a no-op (logs warning).

---

## 11. Dashboard Portal Management Upgrades

### `/dashboard/portal` (index)
Table of all clients with active portal tokens:
- Client name | Portal URL | Last accessed | Permissions | Expires | Actions (Rotate / Revoke)

### `/dashboard/portal/[clientId]/setup`
Upgraded from current demo to real functionality:
- "Generate Portal Link" button → POST `/api/portal/tokens` → creates `portal_tokens` row
- Shows generated URL with copy button
- Permission toggles (5 permissions with toggle switches)
- Expiry selector (30 / 60 / 90 / 180 days)
- "Rotate Link" button → expires current token, generates new one
- "Revoke Access" button → sets `expires_at = now()`
- "Send Invite Email" → POST `/api/portal/notify` with invite template

---

## 12. Security Implementation

### Token validation (server-side only)
- `validateToken` uses `SUPABASE_SERVICE_ROLE_KEY` — never in browser bundle
- Token is UUID v4 — 128 bits of entropy, not guessable
- Expired tokens → redirect, not 404 (client knows why)

### Rate limiting (Next.js middleware)
Simple sliding window in-memory Map (per deployment instance): 60 requests/minute per IP on `/portal/*`. Returns 429 with "Too many requests" if exceeded. Header `Retry-After: 60`.

Note: In-memory rate limiting resets on deployment. For production hardening, move to Upstash Redis (out of scope for this build — noted as future improvement).

### IP access log
Every `validateToken` call inserts to `portal_access_log`. Visible in firm dashboard settings → Audit Log.

### No sensitive data exposure
Portal API routes never return fields: SSN, EIN, bank account numbers, full card numbers. The `portal_documents` list never returns `storage_path` directly — only signed URLs generated server-side.

---

## 13. Mobile-First Design Specifications

- Base font size: 16px (never smaller than 14px for body text)
- Touch targets: minimum 44×44px for all interactive elements
- Bottom nav on mobile: fixed, 64px height + `env(safe-area-inset-bottom)` padding
- Upload: camera capture button prominent on mobile, labeled "Take Photo"
- Swipe: document list items can be swiped right to reveal "Upload" action (CSS only, no library)
- Max content width: 480px on mobile, 1100px on desktop
- No horizontal scroll anywhere
- All cards stack vertically on mobile (no multi-column grids below 640px)

---

## 14. Environment Variables Needed

```
SUPABASE_SERVICE_ROLE_KEY   — for portal server-side DB access
RESEND_API_KEY              — for email notifications (optional, graceful fallback)
NEXT_PUBLIC_APP_URL         — base URL for generating portal links
```

---

## 15. Error Handling & Edge Cases

- Token not found → `/portal/invalid` (friendly page, "This link is no longer valid. Contact your accountant.")
- Token expired → `/portal/expired` (friendly page with expiry date, "Contact your accountant for a new link.")
- Supabase unavailable → portal pages show cached/skeleton state, not crash
- Upload failure → client sees error toast, file not marked uploaded
- Resend failure → logged server-side, portal action still succeeds (email is best-effort)
- No close data yet → dashboard shows "No close data for this period" empty state
- No financial permission → financial cards show locked state with explanation

---

## Self-Review Checklist

- [x] No TBD or TODO placeholders
- [x] All file paths exact
- [x] Types consistent across all sections (PortalSession used everywhere)
- [x] RLS strategy consistent (service role for portal, user auth for dashboard)
- [x] Realtime subscription filter matches table schema
- [x] Email templates cover all 6 events
- [x] Security: no sensitive fields in portal API responses
- [x] Mobile specs concrete (44px targets, safe-area-inset, camera capture)
- [x] Error states defined for all failure modes
- [x] Env vars documented
