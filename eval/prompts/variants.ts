// System-prompt variants for eval experiments (docs/next-experiments.md).
// Each variant is the app's prompt (CATEGORIZE_SYSTEM_PROMPT) with named lines
// replaced, so a report can show exactly what changed. The app itself always
// uses the unmodified prompt.

export interface PromptEdit {
  /** Exact text in the app's prompt. The run fails if it is missing. */
  find: string
  replace: string
}

export const PROMPT_VARIANTS: Record<string, { description: string; edits: PromptEdit[] }> = {
  'ar-liabilities': {
    description:
      'Deposits clear Accounts Receivable when the chart has one; payroll tax, sales tax and loan payments go to their balance-sheet accounts.',
    edits: [
      {
        find: '- "PAYROLL TAX", "FICA", "FUTA", "941", "940" → Payroll Tax Expense, confidence 0.97',
        replace:
          '- "PAYROLL TAX", "FICA", "FUTA", "941", "940", payroll-provider tax impounds (e.g. "GUSTO DES:TAX", "EFTPS") → Payroll Liabilities when the chart has a payroll liability account (these remit taxes already withheld or accrued); Payroll Tax Expense only if it does not',
      },
      {
        find: '- "TAX PAYMENT", "IRS", "STATE TAX", "FRANCHISE TAX" → Taxes Payable or Tax Expense, confidence 0.95',
        replace:
          '- Sales tax remittances ("SALES TAX", "COMPTROLLER", "DEPT OF REVENUE" with a sales-tax reference) → Sales Tax Payable when the chart has it\n- "TAX PAYMENT", "IRS", "STATE TAX", "FRANCHISE TAX" (income or franchise tax) → Taxes Payable or Tax Expense',
      },
      {
        find: '- "DEPOSIT", "PAYMENT FROM", "CLIENT PAYMENT", "WIRE IN", "INCOMING WIRE", "ACH CREDIT", "INVOICE PMT" → nearest Revenue account (Service Revenue, Sales Revenue, Consulting Revenue), confidence 0.92+',
        replace:
          '- "DEPOSIT", "PAYMENT FROM", "CLIENT PAYMENT", "WIRE IN", "INCOMING WIRE", "ACH CREDIT", "INVOICE PMT", and payment-processor payouts ("STRIPE TRANSFER", "SQUARE", "PAYPAL TRANSFER") → Accounts Receivable when the chart has it (the customer paid an invoice that was already booked as revenue); the nearest Revenue account only if the chart has no Accounts Receivable\n- Loan payments: "LINE OF CREDIT" → the short-term loan or line-of-credit account; "SBA", "LOAN PMT", "TERM LOAN" → the long-term loan account. Use the loan account, not an expense; the interest share cannot be seen on the bank line',
      },
      {
        find: '- Any credit with "CLIENT", "PAYMENT FROM", or "INVOICE" → Service Revenue or Sales Revenue, confidence 0.92',
        replace: '- Any credit with "CLIENT", "PAYMENT FROM", or "INVOICE" → Accounts Receivable when the chart has it, otherwise Service Revenue or Sales Revenue',
      },
      {
        find: '- Credits/deposits are almost always revenue; debits are almost always expenses.',
        replace:
          '- Credits/deposits are usually customer payments (Accounts Receivable when the chart has it) or revenue; debits are usually expenses, except payments that settle a liability (credit cards, payroll and sales tax remittances, loans).',
      },
    ],
  },
}

/** The app's prompt with a variant's edits applied. Throws if an edit's text is missing. */
export function applyPromptVariant(base: string, name: string): string {
  const variant = PROMPT_VARIANTS[name]
  if (!variant) throw new Error(`unknown prompt variant "${name}" (known: ${Object.keys(PROMPT_VARIANTS).join(', ')})`)
  let out = base
  for (const e of variant.edits) {
    if (!out.includes(e.find)) throw new Error(`prompt variant "${name}": text not found in the app's prompt: ${e.find.slice(0, 60)}…`)
    out = out.replace(e.find, e.replace)
  }
  return out
}
