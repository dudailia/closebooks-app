export const USE_CASES = {
  'month-end-close': {
    eyebrow: 'Use case',
    title: 'AI month-end close for CPA firms.',
    description:
      'CloseBooks helps firms move from raw bank activity to reviewed, validated, QuickBooks-ready output in one workflow.',
    pains: [
      'Preparers spend too much time categorizing repeat vendors.',
      'Reviewers find errors late, often after export or client delivery.',
      'Client questions live in email threads instead of the close file.',
    ],
    workflow: [
      'Upload bank or credit card activity',
      'Categorize against the client chart of accounts',
      'Route low-confidence rows to exception review',
      'Approve, edit, or ask the client',
      'Export a validated close package',
    ],
    outcomes: [
      'Exception-first review instead of row-by-row cleanup',
      'COA validation before accounting output leaves CloseBooks',
      'Repeatable close process for every client',
    ],
  },
  'client-accounting-services': {
    eyebrow: 'Use case',
    title: 'Scale client accounting services without giving up control.',
    description:
      'CloseBooks is built for CAS teams that want AI leverage while keeping client relationships, review standards, and firm margin in-house.',
    pains: [
      'Every new client adds manual categorization and review load.',
      'Offshoring or outsourcing can reduce visibility and consistency.',
      'Firm owners need a portfolio view of what is ready, blocked, or waiting on clients.',
    ],
    workflow: [
      'Standardize client setup and COA validation',
      'Use firm memory for repeat vendor decisions',
      'Review exceptions by client or across the portfolio',
      'Package outputs for staff review and client delivery',
      'Expand with paid pilot and subscription tiers',
    ],
    outcomes: [
      'More clients served by the same team',
      'Firm-owned AI workflow instead of outsourced black boxes',
      'Clear path from pilot to recurring subscription',
    ],
  },
  'bookkeeping-review': {
    eyebrow: 'Use case',
    title: 'Bookkeeping review that surfaces what matters.',
    description:
      'CloseBooks gives reviewers confidence scores, AI reasoning, COA validation, and exception queues so they can focus on judgment calls.',
    pains: [
      'Reviewers cannot tell which rows need attention first.',
      'Invalid or inconsistent account mappings slip through manual workflows.',
      'Notes, reasoning, and final decisions are scattered across files.',
    ],
    workflow: [
      'Run AI categorization with confidence scores',
      'Block invalid COA mappings before export',
      'Review flagged rows and suspicious account directions',
      'Save repeat decisions as firm rules',
      'Export with audit-ready context',
    ],
    outcomes: [
      'Reviewer time spent on exceptions, not every row',
      'Cleaner export boundaries',
      'More consistent client books month after month',
    ],
  },
} as const

export type UseCaseSlug = keyof typeof USE_CASES

export function getUseCase(slug: string) {
  return USE_CASES[slug as UseCaseSlug]
}

export const USE_CASE_SLUGS = Object.keys(USE_CASES) as UseCaseSlug[]
