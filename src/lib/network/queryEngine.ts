export interface NetworkQueryResult {
  answer: string
  sampleCount: number
  chartData: Array<{ label: string; value: number }>
  chartType: 'bar' | 'gauge' | 'number'
  relatedQuestions: string[]
}

// ─── Pre-built demo responses for suggested queries ───────────────────────────

const DEMO_RESPONSES: Record<string, NetworkQueryResult> = {
  "what's the typical gross margin for saas companies?": {
    answer:
      "SaaS companies on the CloseBooks network show a median gross margin of 71%. The top quartile (P75+) achieves 82% or higher, driven by efficient cloud infrastructure and minimal COGS beyond hosting and support. Early-stage SaaS firms (under $1M ARR) average 63%, while established firms above $5M ARR cluster tightly around 74–78%. Firms reporting Stripe or Chargebee as their payment processor show 3–4 points higher gross margins on average, likely correlating with subscription-model maturity.",
    sampleCount: 1247,
    chartData: [
      { label: 'P10 (bottom 10%)', value: 44 },
      { label: 'P25', value: 58 },
      { label: 'Median', value: 71 },
      { label: 'P75', value: 82 },
      { label: 'P90 (top 10%)', value: 89 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'What are typical payroll percentages for tech firms?',
      'How do SaaS firms handle deferred revenue?',
      'What R&D expense ratios do SaaS companies report?',
    ],
  },

  "how do restaurants handle delivery platform commissions?": {
    answer:
      "Among the 847 restaurant clients on the CloseBooks network, 78% categorize delivery platform commissions (DoorDash, Uber Eats, Grubhub) under 'Cost of Goods Sold' or 'Merchant Fees' — not as marketing. The median commission rate absorbed is 26% of delivery revenue, ranging from 15% (negotiated enterprise rates) to 30% (standard rates). Only 12% separately track delivery revenue vs. dine-in revenue in their chart of accounts, creating reconciliation blind spots. Firms that do separate tracking report 4.2% higher overall gross margins, suggesting better pricing decisions.",
    sampleCount: 847,
    chartData: [
      { label: 'COGS / Merchant Fees', value: 62 },
      { label: 'Marketing & Advertising', value: 16 },
      { label: 'Separate delivery account', value: 12 },
      { label: 'Other / mixed', value: 10 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'What % of restaurant revenue comes from delivery platforms?',
      'How do restaurants handle tips in payroll?',
      'What are typical food cost percentages for quick-service vs. full-service?',
    ],
  },

  "what % of law firms take the home office deduction?": {
    answer:
      "Among solo practitioners and small law firms (under 10 attorneys) in the CloseBooks network, 41% claim the home office deduction — considerably higher than the national average of 26% for all self-employed taxpayers. Mid-size firms (10–50 attorneys) drop to 8%, as most have dedicated office space. The average deduction claimed is $3,847 annually. Firms using the simplified method ($5/sq ft) account for 67% of claims; actual expense method averages $5,240 but has a 14% higher audit inquiry rate based on IRS correspondence patterns in our network.",
    sampleCount: 312,
    chartData: [
      { label: 'Solo practitioners', value: 61 },
      { label: '2–5 attorneys', value: 38 },
      { label: '6–10 attorneys', value: 19 },
      { label: '11–50 attorneys', value: 8 },
      { label: '50+ attorneys', value: 2 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'What are typical mileage deductions for law firms?',
      'How do law firms categorize bar association dues?',
      'What % of legal clients use S-Corp election?',
    ],
  },

  "what's the median ar days for medical practices?": {
    answer:
      "Medical practices on the CloseBooks network show a median Accounts Receivable days outstanding of 38 days, but with significant variance by specialty. Primary care practices average 31 days, while specialty practices (orthopedics, dermatology) average 47 days due to complex insurance billing cycles. Practices that bill Medicare/Medicaid as their primary payer average 52 days — 37% longer than commercial-only practices. The top quartile of practices (fastest collection) average 22 days and are overwhelmingly using integrated EHR/billing systems. Practices with AR >90 days exceeding 15% of total AR have a 3x higher write-off rate.",
    sampleCount: 423,
    chartData: [
      { label: 'Primary Care', value: 31 },
      { label: 'Family Medicine', value: 34 },
      { label: 'Internal Medicine', value: 39 },
      { label: 'Dermatology', value: 44 },
      { label: 'Orthopedics', value: 52 },
      { label: 'Behavioral Health', value: 58 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'How do medical practices handle bad debt write-offs?',
      'What % of healthcare revenue comes from Medicare vs. commercial?',
      'What are typical malpractice insurance costs as % of revenue?',
    ],
  },

  "how do retail firms categorize shoplifting losses?": {
    answer:
      "Retail firms on the CloseBooks network use four primary categorization approaches for inventory shrinkage including shoplifting. The most common (52%) use 'Inventory Shrinkage' as a standalone expense line under COGS. Another 31% fold it into 'Cost of Goods Sold' without a separate line, making it invisible for benchmarking. Only 9% use 'Theft & Fraud Losses' as a distinct category — though this provides the clearest audit trail. The median shrinkage rate is 1.6% of retail revenue, with specialty retailers (jewelry, electronics) averaging 2.4% and grocery/food retailers averaging 1.1%. Firms with dedicated loss prevention spend $0.34 per $100 revenue and report 40% lower shrinkage.",
    sampleCount: 634,
    chartData: [
      { label: 'Inventory Shrinkage (COGS sub)', value: 52 },
      { label: 'Blended into COGS', value: 31 },
      { label: 'Theft & Fraud Losses', value: 9 },
      { label: 'Other Expenses', value: 8 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'What are average shrinkage rates by retail category?',
      'How do retailers handle vendor chargebacks?',
      'What loss prevention expenses are deductible?',
    ],
  },

  "what are typical payroll percentages for professional services?": {
    answer:
      "Professional services firms (consulting, accounting, engineering, marketing agencies) on the CloseBooks network report payroll as 52–68% of total revenue at the median. The breakdown varies significantly by firm type: staffing-heavy firms (IT consulting, engineering) run 63–71%, while advisory/strategy firms average 47–55%. Benefits add another 12–18% on top of base wages. Firms with owner-operators who take S-Corp distributions average 8% lower total payroll-to-revenue ratios, though their actual labor cost (including distributions) is comparable. The top-quartile firms by profitability hold payroll under 55% of revenue through strong utilization rates averaging 82%+.",
    sampleCount: 891,
    chartData: [
      { label: 'Staffing / IT Consulting', value: 67 },
      { label: 'Engineering', value: 64 },
      { label: 'Accounting / CPA', value: 59 },
      { label: 'Marketing Agency', value: 56 },
      { label: 'Strategy Consulting', value: 51 },
      { label: 'Legal Services', value: 48 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'What are typical utilization rates for professional services firms?',
      'How do consulting firms handle subcontractor costs?',
      'What benefits packages do professional services firms offer?',
    ],
  },

  "do most construction firms use percentage-of-completion?": {
    answer:
      "Among construction firms on the CloseBooks network with annual revenue over $1M, 64% use the percentage-of-completion (POC) method for long-term contracts, while 29% use completed-contract. The remaining 7% use a hybrid or billing-basis approach. Adoption of POC is strongly correlated with firm size: firms over $5M revenue use POC 81% of the time vs. 43% for firms under $1M. Since the Tax Cuts and Jobs Act raised the small contractor exemption threshold to $30M (now inflation-adjusted), 18% of firms that previously used POC have switched to completed-contract for tax purposes while maintaining POC for GAAP reporting — creating a book-tax difference that many aren't properly reconciling.",
    sampleCount: 567,
    chartData: [
      { label: 'Percentage-of-Completion', value: 64 },
      { label: 'Completed-Contract', value: 29 },
      { label: 'Hybrid / Billing Basis', value: 7 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'How do construction firms handle retainage receivables?',
      'What are WIP schedule best practices for contractors?',
      'What equipment depreciation methods do contractors prefer?',
    ],
  },

  "what's the average meals & entertainment spend for tech firms?": {
    answer:
      "Technology companies on the CloseBooks network spend a median of 1.8% of revenue on meals & entertainment — higher than most industries. Pre-2018 this category was more heavily used; post-TCJA (50% deductibility for meals, 0% for entertainment), tech firms have increasingly split these expenses. Firms with 10–50 employees average $2,847 per employee annually in M&E. Notably, 34% of tech firms are still categorizing non-deductible entertainment (concerts, sporting events, golf) as meals — a common audit flag. Firms that separately track 'Team Meals' (fully deductible if for employee convenience) from 'Client Entertainment' save an average of $4,200 in incorrectly disallowed deductions per year.",
    sampleCount: 782,
    chartData: [
      { label: 'Team / Employee Meals', value: 43 },
      { label: 'Client Meals (50% ded.)', value: 31 },
      { label: 'Entertainment (0% ded.)', value: 14 },
      { label: 'Mixed / Uncategorized', value: 12 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'How do tech companies handle remote employee meal stipends?',
      'What are the TCJA implications for office parties?',
      'How should client gifts be categorized and limited?',
    ],
  },

  "how do construction firms handle equipment leases?": {
    answer:
      "Among construction firms on the CloseBooks network, equipment lease treatment varies significantly based on lease term and ASC 842 adoption. For operating leases under 12 months, 89% expense them directly to 'Equipment Rental'. For longer-term leases, 54% have adopted ASC 842 and record right-of-use assets and lease liabilities — but 46% of firms under $10M revenue still expense all leases, citing the private company practical expedient. The median equipment lease-to-revenue ratio is 4.2%, with heavy equipment-intensive subcontractors reaching 8.1%. Firms that own vs. lease equipment show 12% higher asset intensity but 3.4% better operating margins on average.",
    sampleCount: 423,
    chartData: [
      { label: 'Operating lease expense', value: 54 },
      { label: 'ROU asset (ASC 842)', value: 31 },
      { label: 'Finance lease', value: 9 },
      { label: 'Mixed approach', value: 6 },
    ],
    chartType: 'bar',
    relatedQuestions: [
      'Do most construction firms use percentage-of-completion?',
      'How do contractors handle equipment depreciation?',
      'What are typical bonding costs as % of revenue?',
    ],
  },
}

// ─── Normalize query for lookup ───────────────────────────────────────────────

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/[?!.]+$/, '').trim()
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function queryNetwork(query: string): Promise<NetworkQueryResult> {
  const key = normalizeQuery(query)

  // Direct hit
  if (DEMO_RESPONSES[key]) {
    return DEMO_RESPONSES[key]
  }

  // Fuzzy match — check if query contains key words from any demo key
  for (const [demoKey, result] of Object.entries(DEMO_RESPONSES)) {
    const demoWords = demoKey.split(' ').filter((w) => w.length > 4)
    const queryWords = key.split(' ')
    const matches = demoWords.filter((w) => queryWords.some((qw) => qw.includes(w) || w.includes(qw)))
    if (matches.length >= 3) {
      return result
    }
  }

  // Fall back to API
  const res = await fetch('/api/network/pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    throw new Error('Failed to query network')
  }

  return res.json()
}
