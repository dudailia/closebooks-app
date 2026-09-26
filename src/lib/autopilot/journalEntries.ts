import type { ChartOfAccounts, Transaction } from '@/types'

// Journal entries follow the approved chart-of-accounts account. See
// docs/engine/journal-entries.md for the rules. Pure module: no browser or
// server dependencies, so it runs in API routes, the client and unit tests.

export type JournalSource = 'rule' | 'ai' | 'human'

export interface JournalLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  memo: string
}

export interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  description: string
  memo: string
  source: JournalSource
  sourceTransactionId: string
  lines: JournalLine[]
}

/** A transaction that produced no entry, and why. */
export interface JournalException {
  transactionId: string
  date: string
  description: string
  amount: number
  reason: string
}

/** An entry that posted but deserves a second look. */
export interface JournalCheck {
  transactionId: string
  entryNumber: string
  reason: 'check: possible refund'
  detail: string
}

export interface JournalResult {
  bankAccount: ChartOfAccounts | null
  entries: JournalEntry[]
  exceptions: JournalException[]
  checks: JournalCheck[]
  totals: { debit: number; credit: number }
}

export class JournalBalanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JournalBalanceError'
  }
}

// All arithmetic happens in whole cents. The epsilon absorbs binary float
// error (1.005 * 100 = 100.49999…) before rounding.
function toCents(amount: number): number {
  return Math.round(Math.abs(amount) * 100 + 1e-7)
}

function fromCents(cents: number): number {
  return cents / 100
}

function fmtMoney(cents: number): string {
  return `$${fromCents(cents).toFixed(2)}`
}

function accountLabel(account: ChartOfAccounts): string {
  return `${account.code} ${account.name}`
}

/**
 * The client's bank account: the first asset account named "checking",
 * else code 1000 (the templates' default), else the first asset account
 * named "cash" or "bank".
 */
export function findBankAccount(chartOfAccounts: ChartOfAccounts[]): ChartOfAccounts | null {
  const assets = chartOfAccounts.filter((a) => a.type === 'asset')
  return (
    assets.find((a) => /checking/i.test(a.name)) ??
    chartOfAccounts.find((a) => a.code.trim() === '1000') ??
    assets.find((a) => /\b(cash|bank)\b/i.test(a.name)) ??
    null
  )
}

/** Who chose the account: a saved rule, the AI, or a person. */
export function journalSource(tx: Transaction): JournalSource {
  if (tx.categorizationSource === 'firm_rule') return 'rule'
  if (tx.categorizationSource === 'manual') return 'human'
  if (tx.categorizationSource === 'copilot') return 'ai'
  if (tx.status === 'edited') return 'human'
  return 'ai'
}

function dateKey(date: string): number {
  const t = Date.parse(date)
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t
}

interface Posting {
  account: ChartOfAccounts
  cents: number
}

type Resolution = { postings: Posting[] } | { reason: string }

function resolvePostings(
  tx: Transaction,
  totalCents: number,
  findAccount: (code: string | undefined) => ChartOfAccounts | undefined,
): Resolution {
  if (tx.splits && tx.splits.length > 0) {
    const postings: Posting[] = []
    for (const split of tx.splits) {
      const account = findAccount(split.account_code)
      if (!account) {
        return { reason: split.account_code
          ? `Split account code "${split.account_code}" is not in the chart of accounts.`
          : 'A split has no account code.' }
      }
      const cents = toCents(split.amount)
      if (split.amount <= 0 || cents === 0) {
        return { reason: `Split to ${accountLabel(account)} must be a positive amount.` }
      }
      postings.push({ account, cents })
    }
    const splitCents = postings.reduce((s, p) => s + p.cents, 0)
    if (splitCents !== totalCents) {
      return { reason: `Splits total ${fmtMoney(splitCents)} but the transaction is ${fmtMoney(totalCents)}.` }
    }
    return { postings }
  }

  // Auto-approved AI rows only carry the suggestion; an approval accepts it.
  const code = tx.final_account_code ?? (tx.status === 'approved' ? tx.suggested_account_code : undefined)
  if (!code) return { reason: 'No approved account code.' }
  const account = findAccount(code)
  if (!account) return { reason: `Account code "${code}" is not in the chart of accounts.` }
  return { postings: [{ account, cents: totalCents }] }
}

function sumLines(lines: JournalLine[]): { debit: number; credit: number } {
  return {
    debit: lines.reduce((s, l) => s + toCents(l.debit), 0),
    credit: lines.reduce((s, l) => s + toCents(l.credit), 0),
  }
}

/** Throws JournalBalanceError unless debits equal credits for every entry and in total. */
export function assertBalanced(entries: JournalEntry[]): { debit: number; credit: number } {
  let debit = 0
  let credit = 0
  for (const entry of entries) {
    const t = sumLines(entry.lines)
    if (t.debit !== t.credit) {
      throw new JournalBalanceError(
        `Entry ${entry.entryNumber} is unbalanced: debits ${fmtMoney(t.debit)}, credits ${fmtMoney(t.credit)}.`,
      )
    }
    debit += t.debit
    credit += t.credit
  }
  if (debit !== credit) {
    throw new JournalBalanceError(`Journal is unbalanced: debits ${fmtMoney(debit)}, credits ${fmtMoney(credit)}.`)
  }
  return { debit: fromCents(debit), credit: fromCents(credit) }
}

/**
 * One balanced two-sided entry per approved transaction. Money direction comes
 * from `type` ('debit' = money out, 'credit' = money in); amounts are stored
 * unsigned, so the sign of `amount` is ignored.
 */
export function generateJournalEntries(
  transactions: Transaction[],
  chartOfAccounts: ChartOfAccounts[],
): JournalResult {
  const byCode = new Map(chartOfAccounts.map((a) => [a.code.trim(), a]))
  const findAccount = (code: string | undefined) => (code ? byCode.get(code.trim()) : undefined)
  const bank = findBankAccount(chartOfAccounts)

  const entries: JournalEntry[] = []
  const exceptions: JournalException[] = []
  const checks: JournalCheck[] = []

  const ordered = transactions
    .map((tx, i) => ({ tx, i }))
    .sort((a, b) => dateKey(a.tx.date) - dateKey(b.tx.date) || a.i - b.i)
    .map(({ tx }) => tx)

  for (const tx of ordered) {
    const description = tx.description ?? tx.original_description ?? ''
    const except = (reason: string) =>
      exceptions.push({ transactionId: tx.id, date: tx.date, description, amount: tx.amount, reason })

    if (tx.status === 'flagged') { except('Flagged for review.'); continue }
    if (tx.status !== 'approved' && tx.status !== 'edited') { except('Not approved.'); continue }
    if (!bank) { except('No bank account in the chart of accounts.'); continue }

    const totalCents = toCents(tx.amount)
    if (totalCents === 0) { except('Zero amount.'); continue }

    const resolved = resolvePostings(tx, totalCents, findAccount)
    if ('reason' in resolved) { except(resolved.reason); continue }
    const { postings } = resolved

    if (postings.some((p) => p.account.code === bank.code)) {
      except(`Posted to the bank account itself (${accountLabel(bank)}).`)
      continue
    }

    const moneyOut = tx.type === 'debit'
    const entryNumber = `JE-${String(entries.length + 1).padStart(4, '0')}`
    const memo = `Posted to ${postings.map((p) => accountLabel(p.account)).join(', ')}`

    const accountLines: JournalLine[] = postings.map((p) => ({
      accountCode: p.account.code,
      accountName: p.account.name,
      debit: moneyOut ? fromCents(p.cents) : 0,
      credit: moneyOut ? 0 : fromCents(p.cents),
      memo: `Posted to ${accountLabel(p.account)}`,
    }))
    const bankLine: JournalLine = {
      accountCode: bank.code,
      accountName: bank.name,
      debit: moneyOut ? 0 : fromCents(totalCents),
      credit: moneyOut ? fromCents(totalCents) : 0,
      memo: description,
    }

    entries.push({
      id: `je_${tx.id}`,
      entryNumber,
      date: tx.date,
      description,
      memo,
      source: journalSource(tx),
      sourceTransactionId: tx.id,
      // Money out: accounts first (debits), bank last. Money in: bank first.
      lines: moneyOut ? [...accountLines, bankLine] : [bankLine, ...accountLines],
    })

    for (const p of postings) {
      if (!moneyOut && p.account.type === 'expense') {
        checks.push({
          transactionId: tx.id, entryNumber, reason: 'check: possible refund',
          detail: `Money in posted to expense account ${accountLabel(p.account)}.`,
        })
      } else if (moneyOut && p.account.type === 'revenue') {
        checks.push({
          transactionId: tx.id, entryNumber, reason: 'check: possible refund',
          detail: `Money out posted to revenue account ${accountLabel(p.account)}.`,
        })
      }
    }
  }

  const totals = assertBalanced(entries)
  return { bankAccount: bank, entries, exceptions, checks, totals }
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export const JOURNAL_CSV_COLUMNS = [
  'Date', 'Entry #', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Memo', 'Source', 'Bank Account',
] as const

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Header row plus one row per line, nothing else (QuickBooks treats the first
 * row as the header). The bank account used is repeated in the last column.
 */
export function journalEntriesToCSV(result: JournalResult): string {
  const bank = result.bankAccount ? accountLabel(result.bankAccount) : ''
  const rows: string[][] = [[...JOURNAL_CSV_COLUMNS]]
  for (const entry of result.entries) {
    for (const line of entry.lines) {
      rows.push([
        entry.date,
        entry.entryNumber,
        line.accountCode,
        line.accountName,
        line.debit ? line.debit.toFixed(2) : '',
        line.credit ? line.credit.toFixed(2) : '',
        line.memo,
        entry.source,
        bank,
      ])
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
