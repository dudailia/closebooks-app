import type { Transaction } from '@/types'

export interface TaxLineItem {
  id: string
  lineNumber: string
  description: string
  currentAmount: number
  priorYearAmount: number | null
  reasoning: string
  lawReference?: string
  confidence: 'high' | 'medium' | 'low'
  opportunity?: string
  opportunityValue?: number
  needsReview: boolean
}

// Maps QuickBooks/transaction categories to tax form line items
const REVENUE_CATEGORIES = [
  'Service Revenue',
  'Product Sales',
  'Consulting',
  'Contract Revenue',
  'Sales',
  'Income',
  'Revenue',
]

const COGS_CATEGORIES = [
  'Cost of Goods Sold',
  'COGS',
  'Direct Labor',
  'Materials',
  'Subcontractors',
  'Job Costs',
]

const OPERATING_EXPENSE_CATEGORIES: Record<string, string> = {
  Payroll: 'L8 — Salaries and wages',
  'Officer Salary': 'L7 — Compensation of officers',
  Rent: 'L11 — Rents',
  Interest: 'L13 — Interest',
  Depreciation: 'L14 — Depreciation',
  Insurance: 'L20 — Other deductions',
  Advertising: 'L17 — Advertising',
  Meals: 'L20 — Other deductions (50%)',
  Travel: 'L20 — Other deductions',
  Utilities: 'L20 — Other deductions',
  Taxes: 'L12 — Taxes and licenses',
  Licenses: 'L12 — Taxes and licenses',
  'Repairs and Maintenance': 'L9 — Repairs and maintenance',
  'Bad Debts': 'L10 — Bad debts',
  'Pension Plan': 'L18 — Pension and profit-sharing plans',
  'Employee Benefits': 'L19 — Employee benefit programs',
}

interface CategoryAggregate {
  category: string
  total: number
  count: number
  hasLargeItems: boolean
  hasUnusualItems: boolean
}

function aggregateByCategory(transactions: Transaction[]): Map<string, CategoryAggregate> {
  const map = new Map<string, CategoryAggregate>()

  for (const tx of transactions) {
    const cat = tx.final_category || tx.suggested_category || 'Uncategorized'
    const existing = map.get(cat) || {
      category: cat,
      total: 0,
      count: 0,
      hasLargeItems: false,
      hasUnusualItems: false,
    }
    existing.total += Math.abs(tx.amount)
    existing.count += 1
    if (Math.abs(tx.amount) > 10000) existing.hasLargeItems = true
    if (tx.status === 'flagged') existing.hasUnusualItems = true
    map.set(cat, existing)
  }

  return map
}

function matchesCategory(category: string, targets: string[]): boolean {
  const lower = category.toLowerCase()
  return targets.some((t) => lower.includes(t.toLowerCase()))
}

export function buildReturnFromTransactions(
  transactions: Transaction[],
  formType: string,
  priorYearData?: object
): TaxLineItem[] {
  const aggregates = aggregateByCategory(transactions)
  const lines: TaxLineItem[] = []

  let totalRevenue = 0
  let totalCOGS = 0
  const operatingExpenses: Record<string, number> = {}

  for (const [cat, agg] of Array.from(aggregates.entries())) {
    if (matchesCategory(cat, REVENUE_CATEGORIES)) {
      totalRevenue += agg.total
    } else if (matchesCategory(cat, COGS_CATEGORIES)) {
      totalCOGS += agg.total
    } else {
      // Find best matching operating expense line
      let matched = false
      for (const [expCat, lineLabel] of Object.entries(OPERATING_EXPENSE_CATEGORIES)) {
        if (matchesCategory(cat, [expCat])) {
          operatingExpenses[lineLabel] = (operatingExpenses[lineLabel] || 0) + agg.total
          matched = true
          break
        }
      }
      if (!matched) {
        const otherLabel = 'L20 — Other deductions'
        operatingExpenses[otherLabel] = (operatingExpenses[otherLabel] || 0) + agg.total
      }
    }
  }

  const priorYear = priorYearData as Record<string, number> | undefined

  // Line 1a — Gross Receipts
  lines.push({
    id: 'L1a',
    lineNumber: '1a',
    description: 'Gross receipts or sales',
    currentAmount: Math.round(totalRevenue),
    priorYearAmount: priorYear?.grossReceipts ?? null,
    reasoning: `Total revenue of $${totalRevenue.toLocaleString()} aggregated from ${
      Array.from(aggregates.keys())
        .filter((k) => matchesCategory(k, REVENUE_CATEGORIES))
        .join(', ') || 'revenue accounts'
    } across ${transactions.filter((t) => t.type === 'credit').length} credit transactions.`,
    lawReference: 'IRC §61',
    confidence: 'high',
    needsReview: false,
  })

  // Line 2 — COGS
  lines.push({
    id: 'L2',
    lineNumber: '2',
    description: 'Cost of goods sold',
    currentAmount: Math.round(totalCOGS),
    priorYearAmount: priorYear?.cogs ?? null,
    reasoning: `Direct costs of $${totalCOGS.toLocaleString()} from job cost accounts. Please verify this amount against the ending inventory balance and confirm no mixed business/personal items are included.`,
    lawReference: 'IRC §263A',
    confidence: totalCOGS > 0 ? 'high' : 'low',
    needsReview: totalCOGS === 0,
  })

  // Line 3 — Gross Profit
  const grossProfit = totalRevenue - totalCOGS
  lines.push({
    id: 'L3',
    lineNumber: '3',
    description: 'Gross profit',
    currentAmount: Math.round(grossProfit),
    priorYearAmount:
      priorYear?.grossReceipts && priorYear?.cogs
        ? priorYear.grossReceipts - priorYear.cogs
        : null,
    reasoning: `Gross profit is $${grossProfit.toLocaleString()} (${
      totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0
    }% margin). Calculated as gross receipts less cost of goods sold.`,
    lawReference: 'IRC §61',
    confidence: 'high',
    needsReview: false,
  })

  // Operating expense lines
  let lineIndex = 7
  for (const [label, amount] of Object.entries(operatingExpenses)) {
    const isMeals = label.includes('Meals')
    const effectiveAmount = isMeals ? Math.round(amount * 0.5) : Math.round(amount)
    const hasUnusual = Array.from(aggregates.values()).some(
      (a) => a.hasUnusualItems && matchesCategory(a.category, [label.split('—')[0].trim()])
    )

    lines.push({
      id: `L${lineIndex}`,
      lineNumber: String(lineIndex),
      description: label.split('—')[1]?.trim() || label,
      currentAmount: effectiveAmount,
      priorYearAmount: null,
      reasoning: `${isMeals ? '50% of meals expenses per IRC §274. ' : ''}Amount of $${effectiveAmount.toLocaleString()} from categorized transactions. ${
        hasUnusual ? 'FLAGGED: Some items in this category were marked for review — please verify before filing.' : 'All items appear to be ordinary and necessary business expenses.'
      }`,
      lawReference: isMeals ? 'IRC §274' : 'IRC §162',
      confidence: hasUnusual ? 'low' : 'medium',
      needsReview: hasUnusual,
    })
    lineIndex++
  }

  // Total deductions
  const totalDeductions = Object.values(operatingExpenses).reduce((s, v) => s + v, 0) + totalCOGS
  const ordinaryIncome = grossProfit - (totalDeductions - totalCOGS)

  lines.push({
    id: 'L21',
    lineNumber: '21',
    description: 'Total deductions',
    currentAmount: Math.round(totalDeductions - totalCOGS),
    priorYearAmount: null,
    reasoning: `Sum of all operating deductions. Total deductions represent ${
      totalRevenue > 0 ? Math.round(((totalDeductions - totalCOGS) / totalRevenue) * 100) : 0
    }% of gross revenue.`,
    lawReference: 'IRC §162',
    confidence: 'high',
    needsReview: false,
  })

  lines.push({
    id: 'L22',
    lineNumber: '22',
    description: 'Ordinary business income (loss)',
    currentAmount: Math.round(ordinaryIncome),
    priorYearAmount: priorYear?.ordinaryIncome ?? null,
    reasoning: `Net ordinary income flowing through to Schedule K and shareholder K-1s. ${
      formType === '1120S' || formType === '1065'
        ? 'As a pass-through entity, this income is taxed at the shareholder/partner level, not the entity level.'
        : ''
    }`,
    lawReference: 'IRC §1366',
    confidence: 'high',
    needsReview: ordinaryIncome < 0,
  })

  return lines
}
