export interface TaxOpportunity {
  id: string
  title: string
  description: string
  estimatedSavings: number
  confidence: 'high' | 'medium' | 'low'
  actionRequired: string
  lawReference: string
  type: 'Section 179' | 'QBI' | 'R&D' | 'Cost Seg' | 'Retirement' | 'Other'
  status?: 'pending' | 'accepted' | 'dismissed'
}

export interface ReturnLine {
  id: string
  lineNumber: string
  description: string
  currentAmount: number | null
  priorYearAmount: number | null
  reasoning: string
  lawReference?: string
  confidence: 'high' | 'medium' | 'low'
  opportunity?: string
  opportunityValue?: number
  needsReview?: boolean
}

export interface FormSection {
  id: string
  name: string
  lines: ReturnLine[]
}

export interface DemoReturn {
  client: string
  formType: string
  taxYear: number
  ein: string
  sections: FormSection[]
  opportunities: TaxOpportunity[]
  totalOpportunitySavings: number
  totalTaxLiability: number
  priorYearLiability: number
}

export const SMITH_CONSTRUCTION_RETURN: DemoReturn = {
  client: 'Smith Construction LLC',
  formType: '1120S',
  taxYear: 2024,
  ein: '82-1047293',
  totalOpportunitySavings: 71200,
  totalTaxLiability: 284000,
  priorYearLiability: 241000,

  sections: [
    {
      id: 'income',
      name: 'Income',
      lines: [
        {
          id: 'L1a',
          lineNumber: '1a',
          description: 'Gross receipts or sales',
          currentAmount: 2847420,
          priorYearAmount: 2410180,
          reasoning:
            'Total revenue from QuickBooks sales report matches sum of all credit transactions categorized as Service Revenue ($2,612,890) and Product Sales ($234,530). This represents an 18.1% increase over prior year, consistent with the new commercial contracts added in Q2.',
          lawReference: 'IRC §61',
          confidence: 'high',
        },
        {
          id: 'L1b',
          lineNumber: '1b',
          description: 'Returns and allowances',
          currentAmount: 12340,
          priorYearAmount: 8750,
          reasoning:
            'Three project change orders were reversed in Q3 totaling $9,200, plus $3,140 in materials credit memos from suppliers. These have been verified against the accounts receivable subledger.',
          lawReference: 'IRC §61',
          confidence: 'high',
        },
        {
          id: 'L2',
          lineNumber: '2',
          description: 'Cost of goods sold (Schedule A)',
          currentAmount: 1423710,
          priorYearAmount: 1189420,
          reasoning:
            'Direct job costs per Schedule A: direct labor $812,400, materials $487,600, subcontractors $123,710. COGS as % of revenue is 50.0%, slightly above prior year 49.3% due to higher lumber and steel prices in the first half of the year.',
          lawReference: 'IRC §263A',
          confidence: 'high',
        },
        {
          id: 'L3',
          lineNumber: '3',
          description: 'Gross profit',
          currentAmount: 1411370,
          priorYearAmount: 1212010,
          reasoning:
            'Calculated as Line 1c minus Line 2. Gross margin of 49.8% is strong for the commercial construction segment and reflects the higher-margin government contract work secured in Q2.',
          lawReference: 'IRC §61',
          confidence: 'high',
        },
        {
          id: 'L5',
          lineNumber: '5',
          description: 'Interest income',
          currentAmount: 14200,
          priorYearAmount: 6840,
          reasoning:
            'Interest earned on operating account and money market account per bank statements. Higher than prior year due to Federal Reserve rate environment; average balance of $680,000 earning 2.09% blended rate.',
          lawReference: 'IRC §61(a)(4)',
          confidence: 'high',
        },
        {
          id: 'L6',
          lineNumber: '6',
          description: 'Gross rents',
          currentAmount: 36000,
          priorYearAmount: 36000,
          reasoning:
            'Annual rental income from company-owned equipment yard leased to third-party landscaping firm under a 3-year lease signed in 2022. Rental rate is $3,000/month, consistent with prior year.',
          lawReference: 'IRC §61(a)(5)',
          confidence: 'high',
        },
        {
          id: 'L9',
          lineNumber: '9',
          description: 'Total income',
          currentAmount: 1461570,
          priorYearAmount: 1254850,
          reasoning:
            'Sum of gross profit ($1,411,370), interest income ($14,200), and gross rents ($36,000). Represents the consolidated income base before deductions.',
          lawReference: 'IRC §61',
          confidence: 'high',
        },
      ],
    },
    {
      id: 'deductions',
      name: 'Deductions',
      lines: [
        {
          id: 'L7',
          lineNumber: '7',
          description: 'Compensation of officers',
          currentAmount: 240000,
          priorYearAmount: 210000,
          reasoning:
            'Two S-Corp officers received reasonable compensation per W-2s: James Smith $140,000 (CEO/General Contractor, 14.3% increase from $122,000) and Maria Smith $100,000 (CFO, unchanged). Compensation is within market range per RS Means benchmark data for the Southeast construction market.',
          lawReference: 'IRC §1366; Rev. Rul. 74-44',
          confidence: 'high',
          needsReview: true,
        },
        {
          id: 'L8',
          lineNumber: '8',
          description: 'Salaries and wages',
          currentAmount: 387420,
          priorYearAmount: 341800,
          reasoning:
            'Non-officer payroll per ADP reports: 12 full-time field employees + 3 administrative staff. The 13.4% increase reflects two new hires in Q1 for the expanded municipal contract work. W-2 totals reconcile to payroll tax returns (940/941).',
          lawReference: 'IRC §162',
          confidence: 'high',
        },
        {
          id: 'L9d',
          lineNumber: '9',
          description: 'Repairs and maintenance',
          currentAmount: 41200,
          priorYearAmount: 38100,
          reasoning:
            'Equipment maintenance contracts ($22,400), incidental facility repairs ($11,800), and vehicle maintenance ($7,000). All items are ordinary and necessary business expenses; no single item exceeds the safe harbor threshold requiring capitalization.',
          lawReference: 'Treas. Reg. §1.263(a)-3',
          confidence: 'high',
        },
        {
          id: 'L10',
          lineNumber: '10',
          description: 'Bad debts',
          currentAmount: 18600,
          priorYearAmount: 0,
          reasoning:
            'Specific charge-off of Riverside Mall project receivable ($18,600) that was written off in Q4 after the general contractor filed for Chapter 7 bankruptcy. Specific charge-off method applies; no general reserve is maintained.',
          lawReference: 'IRC §166',
          confidence: 'high',
          needsReview: true,
        },
        {
          id: 'L11',
          lineNumber: '11',
          description: 'Rents',
          currentAmount: 84000,
          priorYearAmount: 84000,
          reasoning:
            'Annual rent for main office ($48,000) and equipment storage yard ($36,000) under arms-length leases. Both leases are operating leases with no capitalization required under IRC §168.',
          lawReference: 'IRC §162',
          confidence: 'high',
        },
        {
          id: 'L12',
          lineNumber: '12',
          description: 'Taxes and licenses',
          currentAmount: 62840,
          priorYearAmount: 58420,
          reasoning:
            'State payroll taxes ($31,200), real property taxes on business property ($12,400), contractor license fees ($8,240), and local business privilege taxes ($11,000). All items are deductible under IRC §164.',
          lawReference: 'IRC §164',
          confidence: 'high',
        },
        {
          id: 'L13',
          lineNumber: '13',
          description: 'Interest',
          currentAmount: 28340,
          priorYearAmount: 31200,
          reasoning:
            'Interest on equipment financing note ($18,340) and operating line of credit ($10,000). The business interest limitation under §163(j) does not apply as gross receipts are under the $29M threshold for the 3-year average test.',
          lawReference: 'IRC §163(j)',
          confidence: 'high',
        },
        {
          id: 'L14',
          lineNumber: '14',
          description: 'Depreciation (from Form 4562)',
          currentAmount: 87400,
          priorYearAmount: 94200,
          reasoning:
            'Regular MACRS depreciation on existing equipment fleet. Current year lower due to several assets becoming fully depreciated. NOTE: An additional $204,000 Section 179 election is available if client elects to expense newly acquired equipment rather than depreciate over 5 years.',
          lawReference: 'IRC §168; IRC §179',
          confidence: 'high',
          opportunity: 'Section 179 election available — see Opportunities panel',
          opportunityValue: 47000,
        },
        {
          id: 'L17',
          lineNumber: '17',
          description: 'Advertising',
          currentAmount: 22100,
          priorYearAmount: 18400,
          reasoning:
            'Digital advertising ($14,600), trade show attendance ($4,800), and branded vehicle wraps ($2,700). All expenses are ordinary and necessary for maintaining client relationships in the competitive commercial construction market.',
          lawReference: 'IRC §162',
          confidence: 'high',
        },
        {
          id: 'L18',
          lineNumber: '18',
          description: 'Pension and profit-sharing plans',
          currentAmount: 48000,
          priorYearAmount: 38000,
          reasoning:
            'Employer contributions to SEP-IRA for two officer-owners ($24,000 each). Contributions are 17.14% of W-2 compensation, within the 25% limit. A Solo 401(k) could increase deductible contributions by approximately $43,500 per officer.',
          lawReference: 'IRC §404',
          confidence: 'medium',
          opportunity: 'Solo 401(k) conversion could add $43,500 deduction per owner',
          opportunityValue: 0,
        },
        {
          id: 'L19',
          lineNumber: '19',
          description: 'Employee benefit programs',
          currentAmount: 34800,
          priorYearAmount: 31200,
          reasoning:
            'Group health insurance premiums ($28,400) and dental/vision ($6,400) for all employees. Officer health premiums are properly included in W-2 Box 1 per IRC §1372 and then deducted on Schedule K Line 13 for self-employed health insurance.',
          lawReference: 'IRC §1372; IRC §162',
          confidence: 'high',
        },
        {
          id: 'L20',
          lineNumber: '20',
          description: 'Other deductions (see statement)',
          currentAmount: 127840,
          priorYearAmount: 108920,
          reasoning:
            'Itemized: Professional fees/accounting ($18,000), software subscriptions ($12,400), vehicle expenses ($28,640), meals at 50% ($8,200 of $16,400 actual), cell phones ($6,800), continuing education ($4,800), uniforms ($6,200), miscellaneous supplies ($42,800). All substantiated with receipts.',
          lawReference: 'IRC §162; IRC §274',
          confidence: 'medium',
          needsReview: true,
        },
        {
          id: 'L21',
          lineNumber: '21',
          description: 'Total deductions',
          currentAmount: 1182540,
          priorYearAmount: 1015040,
          reasoning:
            'Sum of all allowable deductions before QBI deduction. Total deduction percentage of revenue is 41.5%, up from 42.1% prior year, reflecting improved overhead management despite wage inflation.',
          lawReference: 'IRC §162',
          confidence: 'high',
        },
        {
          id: 'L22',
          lineNumber: '22',
          description: 'Ordinary business income (loss)',
          currentAmount: 279030,
          priorYearAmount: 239810,
          reasoning:
            'Net ordinary income of $279,030 flows through to Schedule K and is allocated to shareholders per their ownership percentages. This is the primary income figure for calculating QBI deduction on individual returns.',
          lawReference: 'IRC §1366',
          confidence: 'high',
          opportunity: 'QBI deduction of up to $55,806 available on individual returns',
          opportunityValue: 0,
        },
      ],
    },
    {
      id: 'schedule_k',
      name: 'Schedule K — Shareholder Distributions',
      lines: [
        {
          id: 'K1',
          lineNumber: 'K-1',
          description: 'Ordinary business income',
          currentAmount: 279030,
          priorYearAmount: 239810,
          reasoning:
            'Passed through to Form 1040 Schedule E for each shareholder. James Smith (60% owner): $167,418; Maria Smith (40% owner): $111,612. Subject to self-employment tax if treated as active participation.',
          lawReference: 'IRC §1366; IRC §1402',
          confidence: 'high',
        },
        {
          id: 'K2',
          lineNumber: 'K-2',
          description: 'Net rental real estate income',
          currentAmount: 36000,
          priorYearAmount: 36000,
          reasoning:
            'Equipment yard rental income passes through as passive income. Allocated 60/40 to shareholders. This income is not subject to self-employment tax but may be subject to Net Investment Income Tax (NIIT) of 3.8%.',
          lawReference: 'IRC §1366; IRC §1411',
          confidence: 'high',
        },
        {
          id: 'K5',
          lineNumber: 'K-5',
          description: 'Interest income',
          currentAmount: 14200,
          priorYearAmount: 6840,
          reasoning:
            'Portfolio interest income passes through as investment income. Subject to NIIT on shareholder returns. Allocated per ownership percentages.',
          lawReference: 'IRC §1366; IRC §163(d)',
          confidence: 'high',
        },
        {
          id: 'K16',
          lineNumber: 'K-16',
          description: 'Qualified business income (W-2 wages)',
          currentAmount: 627420,
          priorYearAmount: 551800,
          reasoning:
            'Total W-2 wages paid by S-Corp ($240,000 officers + $387,420 employees) are relevant for calculating the QBI deduction on shareholder returns. The W-2 wage limitation is 50% of W-2 wages ($313,710), which exceeds 20% of QBI ($55,806), so the QBI deduction is not limited.',
          lawReference: 'IRC §199A',
          confidence: 'high',
          opportunity: '20% QBI deduction reduces taxable income on individual returns',
          opportunityValue: 0,
        },
        {
          id: 'K17',
          lineNumber: 'K-17',
          description: 'Section 179 deduction',
          currentAmount: 0,
          priorYearAmount: 42000,
          reasoning:
            'No Section 179 election was made on current draft. Client purchased $340,000 in equipment during 2024. Electing full Section 179 expensing would generate an additional $204,000 deduction this year vs. standard MACRS depreciation over 5 years.',
          lawReference: 'IRC §179',
          confidence: 'high',
          opportunity: 'Section 179 election of $204,000 available — $47,000 estimated tax savings',
          opportunityValue: 47000,
        },
      ],
    },
    {
      id: 'schedule_m1',
      name: 'Schedule M-1 — Reconciliation',
      lines: [
        {
          id: 'M1_1',
          lineNumber: 'M1-1',
          description: 'Net income per books',
          currentAmount: 291200,
          priorYearAmount: 249400,
          reasoning:
            'Book net income per QuickBooks P&L report for the year ended December 31, 2024. Differs from tax income due to timing differences in depreciation, meals disallowance, and other book-tax differences.',
          lawReference: 'Treas. Reg. §1.1368-2',
          confidence: 'high',
        },
        {
          id: 'M1_3',
          lineNumber: 'M1-3',
          description: 'Expenses on books not deducted on return',
          currentAmount: 8200,
          priorYearAmount: 7400,
          reasoning:
            'Meals expense disallowance of $8,200 (50% of $16,400 actual meals per IRC §274). This is the primary permanent book-tax difference for this client.',
          lawReference: 'IRC §274',
          confidence: 'high',
        },
        {
          id: 'M1_8',
          lineNumber: 'M1-8',
          description: 'Income per tax return',
          currentAmount: 279030,
          priorYearAmount: 239810,
          reasoning:
            'Tax income after all book-tax adjustments. Primary difference from book income is the additional depreciation timing differences and the meals disallowance. Reconciliation ties to Schedule K Line 1.',
          lawReference: 'IRC §1366',
          confidence: 'high',
        },
      ],
    },
    {
      id: 'schedule_m2',
      name: 'Schedule M-2 — Accumulated Adjustments',
      lines: [
        {
          id: 'M2_1',
          lineNumber: 'M2-1',
          description: 'Balance at beginning of tax year (AAA)',
          currentAmount: 412840,
          priorYearAmount: 231200,
          reasoning:
            'Accumulated Adjustments Account (AAA) opening balance equals prior year ending balance. AAA tracks cumulative undistributed S-Corp income since S-election. This represents the amount shareholders can distribute tax-free.',
          lawReference: 'IRC §1368(e)',
          confidence: 'high',
        },
        {
          id: 'M2_2',
          lineNumber: 'M2-2',
          description: 'Ordinary income from page 1',
          currentAmount: 279030,
          priorYearAmount: 239810,
          reasoning:
            'Current year ordinary income increases AAA. This amount flows from Line 22 of the return.',
          lawReference: 'IRC §1368(e)',
          confidence: 'high',
        },
        {
          id: 'M2_6',
          lineNumber: 'M2-6',
          description: 'Distributions',
          currentAmount: 180000,
          priorYearAmount: 58170,
          reasoning:
            'Shareholder distributions of $180,000 in 2024 ($108,000 to James Smith, $72,000 to Maria Smith). Distributions are tax-free to the extent of AAA balance. Current AAA before distributions is $691,870, so all distributions are non-taxable return of basis.',
          lawReference: 'IRC §1368',
          confidence: 'high',
        },
        {
          id: 'M2_8',
          lineNumber: 'M2-8',
          description: 'Balance at end of tax year (AAA)',
          currentAmount: 511870,
          priorYearAmount: 412840,
          reasoning:
            'Ending AAA balance of $511,870 = $412,840 + $279,030 - $180,000. Shareholders have significant tax-free distribution capacity. Planning note: consider additional distributions before year-end if cash flow permits.',
          lawReference: 'IRC §1368(e)',
          confidence: 'high',
        },
      ],
    },
  ],

  opportunities: [
    {
      id: 'opp1',
      title: 'Section 179 Equipment Expensing',
      description:
        'Client purchased $340,000 in equipment in 2024. Full Section 179 expensing vs. 5-year MACRS depreciation would provide an additional $204,000 deduction this year, reducing pass-through income to shareholders.',
      estimatedSavings: 47000,
      confidence: 'high',
      actionRequired:
        'Confirm all equipment is used >50% for business. Complete Form 4562 Part I. Ensure entity-level taxable income is sufficient to absorb the election (income is $279,030, exceeding the $204,000 election).',
      lawReference: 'IRC §179',
      type: 'Section 179',
      status: 'pending',
    },
    {
      id: 'opp2',
      title: 'R&D Tax Credit — Software Development',
      description:
        "Client has $890,000 in software development costs for their proprietary project management platform. Qualified Research Expenses may generate a credit of approximately $24,200 under the traditional method (20% × excess QRE over base amount).",
      estimatedSavings: 24200,
      confidence: 'medium',
      actionRequired:
        'CPA to review project documentation to confirm activities meet the 4-part test. Require contemporaneous records of employee time by project. Consider engaging a qualified R&D credit specialist.',
      lawReference: 'IRC §41',
      type: 'R&D',
      status: 'pending',
    },
    {
      id: 'opp3',
      title: 'QBI Deduction Optimization',
      description:
        "Smith Construction's $279,030 ordinary income qualifies for the Section 199A QBI deduction on owner's individual returns. At the 37% marginal rate, the 20% deduction is worth approximately $20,650 in federal tax savings across both shareholders.",
      estimatedSavings: 0,
      confidence: 'high',
      actionRequired:
        'Deduction is automatically available on individual returns. Ensure Schedule K-1 clearly identifies QBI-eligible income. W-2 wage limitation ($313,710) exceeds 20% of QBI, so no limitation applies.',
      lawReference: 'IRC §199A',
      type: 'QBI',
      status: 'pending',
    },
    {
      id: 'opp4',
      title: 'Cost Segregation Study',
      description:
        'Client acquired a $480,000 commercial property in Q1. A cost segregation study could reclassify 25-30% of the building cost to 5-15 year property, accelerating approximately $120,000 in depreciation into the current year.',
      estimatedSavings: 0,
      confidence: 'medium',
      actionRequired:
        'Engage a qualified cost segregation firm to perform the study (cost: $4,000–$8,000). Must be completed before return is filed. Combined with bonus depreciation, could generate significant first-year deduction.',
      lawReference: 'IRC §168; Rev. Proc. 87-56',
      type: 'Cost Seg',
      status: 'pending',
    },
    {
      id: 'opp5',
      title: 'Retirement Plan Upgrade to Solo 401(k)',
      description:
        'Converting from SEP-IRA to Solo 401(k) would allow each officer-owner to contribute an additional $23,000 employee deferral on top of the current employer contribution, reducing officer W-2 income and pass-through income simultaneously.',
      estimatedSavings: 0,
      confidence: 'high',
      actionRequired:
        'Establish Solo 401(k) plan before December 31, 2024. Review plan document requirements. Employee deferrals must be elected before year-end; employer contributions can be made until return due date.',
      lawReference: 'IRC §401(k); IRC §404',
      type: 'Retirement',
      status: 'pending',
    },
  ],
}

export const DEMO_RETURNS = [
  {
    id: 'smith-construction-2024',
    client: 'Smith Construction LLC',
    formType: '1120S',
    taxYear: 2024,
    status: 'Draft' as const,
    opportunities: 5,
    opportunitySavings: 71200,
    lastUpdated: '2026-04-03',
  },
  {
    id: 'bella-vista-2024',
    client: 'Bella Vista Restaurant',
    formType: '1065',
    taxYear: 2024,
    status: 'Under Review' as const,
    opportunities: 3,
    opportunitySavings: 28400,
    lastUpdated: '2026-04-02',
  },
  {
    id: 'chen-medical-2024',
    client: 'Chen Medical Practice',
    formType: '1040-S',
    taxYear: 2024,
    status: 'Approved' as const,
    opportunities: 2,
    opportunitySavings: 14200,
    lastUpdated: '2026-03-28',
  },
  {
    id: 'techflow-2024',
    client: 'TechFlow Inc',
    formType: '1120',
    taxYear: 2024,
    status: 'Draft' as const,
    opportunities: 4,
    opportunitySavings: 43800,
    lastUpdated: '2026-04-04',
  },
]
