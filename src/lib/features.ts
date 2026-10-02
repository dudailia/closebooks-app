// Feature visibility for the demo build.
//
// Everything outside the core path (sign up → client → chart of accounts →
// upload → categorise → review → export/report) is hidden, not deleted.
// Set DEMO_HIDE to false to bring every hidden surface back at once, or flip
// an individual flag below to re-enable just that one.
//
// Imported by middleware (edge) and client components — keep it dependency-free.

export const DEMO_HIDE = true

const show = !DEMO_HIDE

// ─── Routes ───────────────────────────────────────────────────────────────────

// `[param]` matches exactly one path segment. Matching is exact: sub-routes
// (e.g. /dashboard/clients/[clientId]/bank-rec) must be listed separately.
export const VISIBLE_DASHBOARD_ROUTES: readonly string[] = [
  '/dashboard',
  '/dashboard/upload',
  '/dashboard/clients',
  '/dashboard/clients/[clientId]',
  '/dashboard/review/[jobId]',
  '/dashboard/subscription',
]

const ROUTE_PATTERNS = VISIBLE_DASHBOARD_ROUTES.map(
  (route) => new RegExp('^' + route.replace(/\[[^\]]+\]/g, '[^/]+') + '$'),
)

/** True if `pathname` (no query string) may be shown. Non-dashboard paths are always visible. */
export function isDashboardRouteVisible(pathname: string): boolean {
  if (!DEMO_HIDE) return true
  if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/')) return true
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return ROUTE_PATTERNS.some((re) => re.test(path))
}

// Public pages that can't be made honest, so they return 404 (not deleted).
// - `/demo/[slug]` (incl. `/demo/warren`): a "personalized demo" for any firm
//   name in the URL, and one real person's firm; both called invented sample
//   data real. `/demo` itself stays.
// - `/certification`: a CPE-credit program that doesn't exist.
// - `/connect`, `/connect/docs`: a public API, keys, webhooks and SDKs that don't exist.
// - `/ref/[slug]`: a referral page for any name in the URL, with a reward
//   that isn't implemented and an unmeasured "72%" claim.
export const HIDDEN_PUBLIC_ROUTES: readonly string[] = [
  '/demo/[slug]',
  '/certification',
  '/connect',
  '/connect/docs',
  '/ref/[slug]',
]

const PUBLIC_PATTERNS = HIDDEN_PUBLIC_ROUTES.map(
  (route) => new RegExp('^' + route.replace(/\[[^\]]+\]/g, '[^/]+') + '$'),
)

/** False for a hidden public page (see HIDDEN_PUBLIC_ROUTES). */
export function isPublicRouteVisible(pathname: string): boolean {
  if (!DEMO_HIDE) return true
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return !PUBLIC_PATTERNS.some((re) => re.test(path))
}

// ─── API routes and portal ────────────────────────────────────────────────────

// API routes the core path calls. While DEMO_HIDE is on, middleware returns 404
// for every other /api route, so a hidden feature's back end is off too, not
// just its page. Matching is exact (`[param]` = one segment).
export const VISIBLE_API_ROUTES: readonly string[] = [
  '/api/auth/membership',   // role lookup (usePermissions)
  '/api/auth/sessions',     // session heartbeat (SessionPulse in the dashboard layout)
  '/api/categorize',        // upload + onboarding
  '/api/parse-pdf',         // PDF upload
  '/api/export',            // review: CSV and journal-entry export
  '/api/report',            // review: close report
  '/api/demo/categorize',   // public /demo page
  '/api/subscription',      // subscription state (SubscriptionContext)
  '/api/stripe/checkout',   // pricing page
  '/api/stripe/webhook',    // Stripe → subscriptions
  '/api/stripe/portal',     // subscription page
  '/api/stripe/invoices',   // subscription page
]

const API_PATTERNS = VISIBLE_API_ROUTES.map(
  (route) => new RegExp('^' + route.replace(/\[[^\]]+\]/g, '[^/]+') + '$'),
)

/** True if an /api path may be served. Non-API paths are always true. */
export function isApiRouteVisible(pathname: string): boolean {
  if (!DEMO_HIDE) return true
  if (pathname !== '/api' && !pathname.startsWith('/api/')) return true
  const path = pathname.replace(/\/+$/, '')
  return API_PATTERNS.some((re) => re.test(path))
}

/** The client portal (/portal/*) and its routes are part of the hidden set. */
export const PORTAL_ENABLED = show

// ─── Sidebar ──────────────────────────────────────────────────────────────────

// Matched by label, since some items share an href (Bank Rec → /dashboard/clients).
const VISIBLE_SIDEBAR_ITEMS: readonly string[] = ['Dashboard', 'New Close', 'Clients']

export function isSidebarItemVisible(label: string): boolean {
  return !DEMO_HIDE || VISIBLE_SIDEBAR_ITEMS.includes(label)
}

// ─── UI surfaces ──────────────────────────────────────────────────────────────

export const FEATURES = {
  // Global chrome
  aiChatPanel:          show, // floating "Ask CloseBooks AI" button + panel
  copilotShortcut:      show, // global ⌘K → /dashboard/clients/[id]/copilot

  // Unmeasured figures (fixed-rate estimates, not measurements)
  savingsEstimates:     show, // every hours-/$-saved figure: home "AI Savings" strip + "Time Saved" card, client "Time Saved", review ROI line
  estimatedAccuracy:    show, // home Firm Intelligence "est. accuracy" % and baseline/target bar (formula of correction count)

  // Client page
  clientBankConnection: show, // Plaid "Bank Account" widget (+ the upload page's "Pull from Bank" toggle that points to it)
  clientAiInsights:     show, // "AI Trends & Insights" panel
  clientHealthExport:   show, // "Export Report" button on the health-score card
  clientHealthScore:    show, // health score card + pills: half its points come from hidden features (doc requests, bank rec)

  // Dashboard home
  homePortalLink:       show, // "Client Portal Link" quick action
  homeClientPortal:     show, // "Client Upload Portal" section
  homeDemoLink:         show, // "View Demo" quick action, "See Demo" empty-state link, onboarding demo link
  homePracticeView:     show, // "Practice View" tab
  homeQuickBooksStrip:  show, // "QuickBooks Online connected" strip

  // Review page — header actions
  reviewClientSummary:  show,
  reviewTaxHandoff:     show,
  reviewEmailClient:    show,
  reviewMonthlyReport:  show,
  reviewQuickBooksPush: show,
  reviewAutoClose:      show,

  // Review page — body
  reviewCopilotPanel:   show, // "Close Copilot / Run Copilot" auto-approve card
  reviewNarrative:      show, // AI Narrative Summary
  reviewAiInsights:     show, // AI Insights under the transaction table
  reviewCloseChat:      show, // floating "Ask" chat on the review page
  reviewShareModal:     show, // "Share your win" modal after Mark as Complete

  // Public site — footer links to pages outside the demo audit
  publicRoiCalculator:  show, // /tools/roi-calculator: savings estimates from fixed assumptions
  publicApiDocs:        show, // /connect/docs: documents an API that is mostly not implemented
  publicCompare:        show, // /compare/[slug]: competitor claims

  // Review page — tabs
  reviewAnomaliesTab:   show,
  reviewRecurringTab:   show,
  reviewBenchmarksTab:  show,
} as const
