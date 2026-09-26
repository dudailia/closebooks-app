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

  // Review page — tabs
  reviewAnomaliesTab:   show,
  reviewRecurringTab:   show,
  reviewBenchmarksTab:  show,
} as const
