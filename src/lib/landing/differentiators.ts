export const PLATFORM_PILLARS = [
  {
    title: 'Built for the monthly close',
    copy: 'One path per client: upload a bank statement, categorize against their chart of accounts, review, export.',
  },
  {
    title: 'Trust before export',
    copy: 'COA validation, confidence scores, and an exception queue keep CPAs in control before files leave the system.',
  },
  {
    title: 'Firm memory',
    copy: 'Save a correction as a vendor rule and it is applied to matching rows on later closes. Recent corrections are also passed to the AI as hints.',
  },
  {
    title: 'Export and report',
    copy: 'Download a QuickBooks-ready CSV or a standard CSV, and print a close report for the period (Save as PDF).',
  },
] as const

// Not rendered on the landing page (competitive positioning is not verifiable
// from the product). Kept for reference.
export const COMPARISON_ROWS = [
  {
    category: 'Checklist close tools',
    typical: 'Track who did the work.',
    closebooks: 'Runs the work, validates the output, then packages the close.',
  },
  {
    category: 'AP-only automation',
    typical: 'Automates invoices and approvals.',
    closebooks: 'Handles bank activity, rules, exceptions, review, export, and client follow-up.',
  },
  {
    category: 'Document capture tools',
    typical: 'Extracts receipts and statement data.',
    closebooks: 'Turns source data into a reviewable accounting close workflow.',
  },
  {
    category: 'Outsourced bookkeeping',
    typical: 'Adds people behind the scenes.',
    closebooks: 'Lets your firm own the AI workflow, margin, client relationship, and quality bar.',
  },
] as const

export const ADD_ON_MODULES = [
  {
    name: 'COA Guard',
    tier: 'Trust layer',
    copy: 'Blocks invalid account mappings before export.',
    accent: '#F59E0B',
  },
  {
    name: 'Exception Inbox',
    tier: 'Review layer',
    copy: 'Low-confidence and COA-flagged rows wait for your team.',
    accent: '#A855F7',
  },
  {
    name: 'Firm Memory',
    tier: 'Automation layer',
    copy: 'Applies correction patterns and repeat-vendor rules.',
    accent: '#00C853',
  },
  {
    name: 'Close Report',
    tier: 'Delivery layer',
    copy: 'Printable summary of the close, next to the CSV export.',
    accent: '#38BDF8',
  },
] as const
