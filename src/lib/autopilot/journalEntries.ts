import type { Transaction } from '@/types'

export interface JournalEntry {
  id: string
  date: string
  description: string
  debitAccount: string
  creditAccount: string
  amount: number
  sourceTransactionId: string
  aiReasoning: string
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

export function generateJournalEntry(transaction: Transaction): JournalEntry {
  const category = (transaction.final_category ?? transaction.suggested_category ?? '').toLowerCase()
  const desc = (transaction.description ?? transaction.original_description ?? '').toLowerCase()

  let debitAccount: string
  let creditAccount: string
  let aiReasoning: string

  if (transaction.type === 'credit') {
    debitAccount = 'Cash / Bank Account'
    creditAccount = 'Revenue'
    aiReasoning = 'Credit transaction represents incoming revenue; DR Cash, CR Revenue.'
  } else if (desc.includes('payroll') || desc.includes('salary') || desc.includes('gusto') || desc.includes('adp')) {
    debitAccount = 'Salaries Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Payroll disbursement; DR Salaries Expense, CR Cash.'
  } else if (desc.includes('rent') || desc.includes('lease') || category.includes('rent')) {
    debitAccount = 'Rent Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Rent or lease payment; DR Rent Expense, CR Cash.'
  } else if (desc.includes('insurance') || category.includes('insurance')) {
    debitAccount = 'Insurance Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Insurance premium payment; DR Insurance Expense, CR Cash.'
  } else if (desc.includes('aws') || desc.includes('software') || desc.includes('saas') || category.includes('software')) {
    debitAccount = 'Software & Subscriptions Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Software or SaaS subscription; DR Software & Subscriptions Expense, CR Cash.'
  } else if (desc.includes('meal') || desc.includes('restaurant') || desc.includes('starbucks') || desc.includes('doordash') || category.includes('meal')) {
    debitAccount = 'Meals & Entertainment Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Business meal or entertainment; DR Meals & Entertainment Expense, CR Cash.'
  } else if (desc.includes('travel') || desc.includes('airline') || desc.includes('hotel') || category.includes('travel')) {
    debitAccount = 'Travel Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Business travel expense; DR Travel Expense, CR Cash.'
  } else if (desc.includes('office') || category.includes('office')) {
    debitAccount = 'Office Supplies Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Office supplies purchase; DR Office Supplies Expense, CR Cash.'
  } else if (desc.includes('advertising') || desc.includes('google ads') || desc.includes('meta ads') || category.includes('advertising') || category.includes('marketing')) {
    debitAccount = 'Marketing & Advertising Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Marketing or advertising spend; DR Marketing & Advertising Expense, CR Cash.'
  } else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water') || category.includes('utility')) {
    debitAccount = 'Utilities Expense'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Utility bill payment; DR Utilities Expense, CR Cash.'
  } else if (category.includes('cost of goods') || category.includes('cogs') || desc.includes('inventory')) {
    debitAccount = 'Cost of Goods Sold'
    creditAccount = 'Cash / Bank Account'
    aiReasoning = 'Inventory or COGS purchase; DR Cost of Goods Sold, CR Cash.'
  } else {
    const expenseLabel = transaction.final_category ?? transaction.suggested_category ?? 'General'
    debitAccount = `${expenseLabel} Expense`
    creditAccount = 'Cash / Bank Account'
    aiReasoning = `Categorized as ${expenseLabel}; DR ${expenseLabel} Expense, CR Cash/Bank.`
  }

  return {
    id: `je_${slugify(transaction.id)}_${Date.now()}`,
    date: transaction.date,
    description: transaction.description ?? transaction.original_description,
    debitAccount,
    creditAccount,
    amount: Math.abs(transaction.amount),
    sourceTransactionId: transaction.id,
    aiReasoning,
  }
}

export function generateJournalEntries(transactions: Transaction[]): JournalEntry[] {
  return transactions.map(generateJournalEntry)
}
