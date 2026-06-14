export const PILOT_DELIVERABLES = [
  'Setup for up to 10 client close workflows',
  'Chart-of-accounts validation for each pilot client',
  'Sample CSV import and QuickBooks-ready export walkthrough',
  'Firm rules and correction patterns configured during review',
  'Security, privacy, and DPA review path for stakeholders',
  'Conversion plan into Firm, Growth, or Enterprise subscription',
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
    title: 'Measure activation',
    copy: 'We track time to first export, exception rate, rule creation, and which clients are expansion-ready.',
  },
  {
    title: 'Convert the workflow',
    copy: 'If the pilot proves value, roll the setup into the right subscription and expand client volume.',
  },
] as const

export const PILOT_METRICS = [
  ['10', 'pilot clients'],
  ['30 days', 'to prove workflow fit'],
  ['1 goal', 'first reviewed export'],
] as const
