export const PLATFORM_PILLARS = [
  {
    title: 'Close-native AI',
    copy: 'Built around monthly close workflows, not generic bookkeeping chat or a checklist with AI bolted on.',
  },
  {
    title: 'Trust before export',
    copy: 'COA validation, confidence scores, and exception queues keep CPAs in control before files leave the system.',
  },
  {
    title: 'Firm memory',
    copy: 'Rules and corrections compound across repeat vendors so every client close gets more consistent.',
  },
  {
    title: 'Client delivery layer',
    copy: 'Exports, narratives, portal workflows, and action lists move the work from review to client-ready package.',
  },
] as const

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
    copy: 'Routes only the judgment calls to your team.',
    accent: '#A855F7',
  },
  {
    name: 'Firm Memory',
    tier: 'Automation layer',
    copy: 'Applies correction patterns and repeat-vendor rules.',
    accent: '#00C853',
  },
  {
    name: 'Close Package',
    tier: 'Delivery layer',
    copy: 'Combines CSV export, narrative, and action list.',
    accent: '#38BDF8',
  },
  {
    name: 'Client Portal',
    tier: 'Collaboration layer',
    copy: 'Collects documents, messages, and open requests.',
    accent: '#FB7185',
  },
  {
    name: 'Connect API',
    tier: 'Enterprise layer',
    copy: 'Lets larger firms connect CloseBooks to their stack.',
    accent: '#22C55E',
  },
] as const
