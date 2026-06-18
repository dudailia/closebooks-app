export const COMPARISONS = {
  floqast: {
    name: 'FloQast',
    title: 'CloseBooks vs. close-management platforms',
    description:
      'FloQast-style tools are strong for internal accounting teams managing close checklists. CloseBooks is focused on CPA firms that need AI-assisted execution across many client books.',
    bestFor: 'Mid-market internal accounting teams that need close orchestration, checklists, reconciliations, and documentation.',
    closeBooksAngle:
      'CPA-firm-owned AI close execution: transaction categorization, COA validation, exception review, QuickBooks-ready export, and client delivery.',
    rows: [
      ['Primary buyer', 'Internal controller/accounting team', 'CPA/CAS firm managing many client books'],
      ['Main job', 'Organize and document the close', 'Run and validate recurring client close work'],
      ['Adoption model', 'ERP-connected close management project', 'Start with one client CSV/QBO-style workflow and expand'],
      ['Trust model', 'Close documentation and controls', 'AI suggestions with confidence, COA guard, and human approval'],
    ],
  },
  keeper: {
    name: 'Keeper / Double-style tools',
    title: 'CloseBooks vs. bookkeeping review tools',
    description:
      'Bookkeeping review tools help firms catch issues and collaborate with clients. CloseBooks adds a stronger AI execution layer around categorization, validation, and export packaging.',
    bestFor: 'CAS firms that want transaction review, client questions, and ledger-connected bookkeeping workflows.',
    closeBooksAngle:
      'Exception-first AI close workflow with firm memory, COA validation, and a paid-pilot path for rollout.',
    rows: [
      ['Primary workflow', 'Review and client collaboration', 'AI categorization through reviewed close package'],
      ['AI role', 'Assist review and summaries', 'Draft categorizations, reason, validate, and route exceptions'],
      ['Export boundary', 'Depends on ledger workflow', 'Preflight validation before accounting output leaves CloseBooks'],
      ['Firm rollout', 'Client-by-client review process', 'Pilot 10 clients, measure activation, then expand'],
    ],
  },
  'financial-cents': {
    name: 'Financial Cents-style tools',
    title: 'CloseBooks vs. practice-management platforms',
    description:
      'Practice-management tools are great for tracking firm work. CloseBooks is designed to perform the accounting close workflow those tasks represent.',
    bestFor: 'Firms that need task templates, deadlines, client requests, time tracking, billing, and operational visibility.',
    closeBooksAngle:
      'AI accounting execution layer that can sit alongside practice management: categorize, validate, review, export, and package the close.',
    rows: [
      ['Primary job', 'Track tasks and client work', 'Execute accounting close steps'],
      ['Accounting depth', 'Workflow visibility', 'COA validation, exception review, export package'],
      ['Client relationship', 'Portal and requests', 'Transaction-specific questions tied to close exceptions'],
      ['Best together', 'Practice operating system', 'AI close operating layer'],
    ],
  },
} as const

export type ComparisonSlug = keyof typeof COMPARISONS

export function getComparison(slug: string) {
  return COMPARISONS[slug as ComparisonSlug]
}

export const COMPARISON_SLUGS = Object.keys(COMPARISONS) as ComparisonSlug[]
