export const TRUST_PILLARS = [
  {
    title: 'Human review before export',
    copy: 'Rows under 85% confidence, or that don\'t match the client\'s chart of accounts, wait for your team. Export is blocked until every row is approved and maps to the chart.',
  },
  {
    title: 'Firm-scoped access',
    copy: 'Signed-in firm workspaces, with database row-level security scoping client data to your firm.',
  },
  {
    title: 'Session controls',
    copy: 'Dashboard sessions require signing in again after 30 minutes of inactivity.',
  },
  {
    title: 'Stripe-hosted billing',
    copy: 'Subscriptions, invoices, and payment methods are handled through Stripe Checkout and the Stripe customer portal.',
  },
] as const
