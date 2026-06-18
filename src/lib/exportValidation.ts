import type { ChartOfAccounts, Transaction } from '@/types'

export interface ExportIssue {
  txId: string
  description: string
  issues: string[]
}

function normalize(value: string | undefined | null): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function validateTransactionsForExport(
  transactions: Transaction[],
  chartOfAccounts: ChartOfAccounts[]
): { ok: boolean; issues: ExportIssue[] } {
  const byCode = new Map(chartOfAccounts.map((account) => [normalize(account.code), account]))

  const issues = transactions
    .map((tx) => {
      const txIssues: string[] = []
      const code = tx.final_account_code ?? tx.suggested_account_code
      const category = tx.final_category ?? tx.suggested_category

      if (tx.status === 'pending' || tx.status === 'flagged') {
        txIssues.push('Transaction is not approved or edited.')
      }

      if (!code) {
        txIssues.push('Missing account code.')
      }

      const account = code ? byCode.get(normalize(code)) : null
      if (code && !account) {
        txIssues.push(`Account code "${code}" is not in the chart of accounts.`)
      }

      if (account && category && normalize(account.name) !== normalize(category)) {
        txIssues.push(`Category should be "${account.name}" for account ${account.code}.`)
      }

      return txIssues.length > 0
        ? { txId: tx.id, description: tx.description, issues: txIssues }
        : null
    })
    .filter((issue): issue is ExportIssue => issue !== null)

  return { ok: issues.length === 0, issues }
}

export function canonicalizeTransactionForExport(
  tx: Transaction,
  chartOfAccounts: ChartOfAccounts[]
): Transaction {
  const code = tx.final_account_code ?? tx.suggested_account_code
  const account = chartOfAccounts.find((item) => normalize(item.code) === normalize(code))
  if (!account) return tx

  return {
    ...tx,
    final_account_code: account.code,
    final_category: account.name,
  }
}
