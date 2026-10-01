// Chart-of-accounts templates: the one source for every place that offers them
// (New Close, src/components/ChartOfAccountsUpload.tsx, and onboarding,
// src/app/get-started/page.tsx).
//
// STANDARD_SMALL_BUSINESS is the 34-account chart the eval measured
// (eval/data/chart_of_accounts.csv; src/lib/__tests__/coaTemplates.test.ts
// checks they match). The public /demo page uses its own 29-account sample
// chart (DEMO_COA in src/lib/demoData.ts), which is not offered as a template.

import type { ChartOfAccounts } from '@/types'


export const STANDARD_SMALL_BUSINESS: ChartOfAccounts[] = [
  // Assets
  { code: '1000', name: 'Checking Account',          type: 'asset'     },
  { code: '1010', name: 'Savings Account',            type: 'asset'     },
  { code: '1020', name: 'Petty Cash',                 type: 'asset'     },
  { code: '1100', name: 'Accounts Receivable',        type: 'asset'     },
  { code: '1200', name: 'Inventory',                  type: 'asset'     },
  { code: '1300', name: 'Prepaid Expenses',           type: 'asset'     },
  { code: '1500', name: 'Equipment',                  type: 'asset'     },
  { code: '1510', name: 'Accumulated Depreciation',   type: 'asset'     },
  // Liabilities
  { code: '2000', name: 'Accounts Payable',           type: 'liability' },
  { code: '2100', name: 'Credit Card Payable',        type: 'liability' },
  { code: '2200', name: 'Sales Tax Payable',          type: 'liability' },
  { code: '2300', name: 'Payroll Liabilities',        type: 'liability' },
  { code: '2400', name: 'Short-Term Loan',            type: 'liability' },
  { code: '2500', name: 'Long-Term Loan',             type: 'liability' },
  // Equity
  { code: '3000', name: "Owner's Equity",             type: 'equity'    },
  { code: '3100', name: "Owner's Draw",               type: 'equity'    },
  { code: '3200', name: 'Retained Earnings',          type: 'equity'    },
  // Revenue
  { code: '4000', name: 'Sales Revenue',              type: 'revenue'   },
  { code: '4100', name: 'Service Revenue',            type: 'revenue'   },
  { code: '4200', name: 'Other Income',               type: 'revenue'   },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold',         type: 'expense'   },
  { code: '5100', name: 'Payroll & Wages',            type: 'expense'   },
  { code: '5200', name: 'Rent & Lease',               type: 'expense'   },
  { code: '5300', name: 'Utilities',                  type: 'expense'   },
  { code: '5400', name: 'Office Supplies',            type: 'expense'   },
  { code: '5500', name: 'Marketing & Advertising',    type: 'expense'   },
  { code: '5600', name: 'Insurance',                  type: 'expense'   },
  { code: '5700', name: 'Professional Fees',          type: 'expense'   },
  { code: '5800', name: 'Travel & Entertainment',     type: 'expense'   },
  { code: '5900', name: 'Depreciation Expense',       type: 'expense'   },
  { code: '6000', name: 'Bank Fees & Charges',        type: 'expense'   },
  { code: '6100', name: 'Subscriptions & Software',   type: 'expense'   },
  { code: '6200', name: 'Taxes & Licenses',           type: 'expense'   },
  { code: '6300', name: 'Miscellaneous Expense',      type: 'expense'   },
]

const ECOMMERCE_ADDITIONS: ChartOfAccounts[] = [
  { code: '1110', name: 'Stripe Clearing Account',   type: 'asset'     },
  { code: '1120', name: 'PayPal Clearing Account',   type: 'asset'     },
  { code: '4300', name: 'Shopify Sales',             type: 'revenue'   },
  { code: '4400', name: 'Amazon Sales',              type: 'revenue'   },
  { code: '4500', name: 'Refunds & Returns',         type: 'revenue'   },
  { code: '5010', name: 'Product COGS',              type: 'expense'   },
  { code: '5020', name: 'Shipping & Fulfillment',    type: 'expense'   },
  { code: '5030', name: 'Packaging Materials',       type: 'expense'   },
  { code: '5510', name: 'Shopify & Platform Fees',   type: 'expense'   },
  { code: '5520', name: 'Payment Processing Fees',   type: 'expense'   },
  { code: '5530', name: 'Digital Advertising',       type: 'expense'   },
  { code: '5540', name: 'Influencer & Affiliate',    type: 'expense'   },
]

const PROFESSIONAL_SERVICES_ADDITIONS: ChartOfAccounts[] = [
  { code: '4600', name: 'Consulting Revenue',        type: 'revenue'   },
  { code: '4700', name: 'Retainer Revenue',          type: 'revenue'   },
  { code: '4800', name: 'Project Revenue',           type: 'revenue'   },
  { code: '5110', name: 'Subcontractor Fees',        type: 'expense'   },
  { code: '5120', name: 'Freelancer Payments',       type: 'expense'   },
  { code: '6110', name: 'SaaS & Software Tools',     type: 'expense'   },
  { code: '6120', name: 'Cloud Infrastructure',      type: 'expense'   },
  { code: '6130', name: 'Professional Development',  type: 'expense'   },
  { code: '6140', name: 'Home Office Expense',       type: 'expense'   },
  { code: '6150', name: 'Client Meals & Entertainment', type: 'expense' },
]

export type TemplateName = 'standard' | 'ecommerce' | 'professional'

const ECOMMERCE = dedupe([...STANDARD_SMALL_BUSINESS, ...ECOMMERCE_ADDITIONS])
const PROFESSIONAL_SERVICES = dedupe([...STANDARD_SMALL_BUSINESS, ...PROFESSIONAL_SERVICES_ADDITIONS])

export const CHART_TEMPLATES: Record<TemplateName, { label: string; description: string; accounts: ChartOfAccounts[] }> = {
  standard: {
    label: 'Standard Small Business',
    description: `${STANDARD_SMALL_BUSINESS.length} accounts · all types`,
    accounts: STANDARD_SMALL_BUSINESS,
  },
  ecommerce: {
    label: 'E-commerce',
    description: `${ECOMMERCE.length} accounts · Shopify, Stripe, COGS`,
    accounts: ECOMMERCE,
  },
  professional: {
    label: 'Professional Services',
    description: `${PROFESSIONAL_SERVICES.length} accounts · consulting, SaaS, subs`,
    accounts: PROFESSIONAL_SERVICES,
  },
}

function dedupe(accounts: ChartOfAccounts[]): ChartOfAccounts[] {
  const seen = new Set<string>()
  return accounts.filter((a) => {
    if (seen.has(a.code)) return false
    seen.add(a.code)
    return true
  })
}

