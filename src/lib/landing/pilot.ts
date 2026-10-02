export const PILOT_DELIVERABLES = [
  'Setup for up to 10 client close workflows',
  'Chart-of-accounts validation for each pilot client',
  'Sample CSV import and QuickBooks-style export walkthrough',
  'Firm rules and correction patterns configured during review',
  'Security, privacy, and DPA review path for stakeholders',
  'Conversion plan into a Starter, Professional, or Enterprise subscription',
] as const

export const PILOT_STEPS = [
  {
    title: 'Map your close process',
    copy: 'We identify your client types, current QBO/CSV workflow, review owners, and bottlenecks.',
  },
  {
    title: 'Run real client samples',
    copy: 'Your team uploads statements, validates COA mappings, reviews exceptions, and exports a close package.',
  },
  {
    title: 'Review the results together',
    copy: 'We walk through the exported files, the exceptions your team handled, and the rules you saved.',
  },
  {
    title: 'Convert the workflow',
    copy: 'If the pilot proves value, roll the setup into the right subscription and expand client volume.',
  },
] as const

// Not rendered on the landing page (offer figures, not product facts). Kept for reference.
export const PILOT_METRICS = [
  ['10', 'pilot clients'],
  ['30 days', 'to prove workflow fit'],
  ['1 goal', 'first reviewed export'],
] as const
