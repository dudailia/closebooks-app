import type { ChartOfAccounts, Transaction } from '@/types'

export interface CoaResolutionInput {
  suggested_category: string
  suggested_account_code: string
  confidence: number
  reasoning?: string
}

export interface CoaResolution {
  suggested_category: string
  suggested_account_code: string
  confidence: number
  status: Transaction['status']
  reasoning?: string
  validationFlags: string[]
}

const DEFAULT_AUTO_APPROVE_THRESHOLD = 0.85

function normalize(value: string | undefined | null): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function appendReasoning(reasoning: string | undefined, note: string): string {
  return reasoning ? `${reasoning} ${note}` : note
}

function isSuspiciousDirection(tx: Pick<Transaction, 'type'>, account: ChartOfAccounts): boolean {
  return (
    (tx.type === 'debit' && account.type === 'revenue') ||
    (tx.type === 'credit' && account.type === 'expense')
  )
}

export function resolveAgainstCoa(
  raw: CoaResolutionInput,
  tx: Pick<Transaction, 'type' | 'description' | 'amount'>,
  chartOfAccounts: ChartOfAccounts[],
  autoApproveThreshold = DEFAULT_AUTO_APPROVE_THRESHOLD
): CoaResolution {
  const flags: string[] = []
  const byCode = new Map(chartOfAccounts.map((account) => [normalize(account.code), account]))
  const byName = new Map(chartOfAccounts.map((account) => [normalize(account.name), account]))

  const codeKey = normalize(raw.suggested_account_code)
  const nameKey = normalize(raw.suggested_category)
  const account = byCode.get(codeKey) ?? byName.get(nameKey)

  let confidence = Math.min(1, Math.max(0, raw.confidence))
  let reasoning = raw.reasoning

  if (!account) {
    flags.push('coa_account_unknown')
    confidence = Math.min(confidence, 0.55)
    reasoning = appendReasoning(reasoning, 'COA validation: account was not found in the uploaded chart of accounts.')
    return {
      suggested_category: raw.suggested_category || 'Uncategorized',
      suggested_account_code: raw.suggested_account_code || '',
      confidence,
      status: 'flagged',
      reasoning,
      validationFlags: flags,
    }
  }

  if (codeKey && codeKey !== normalize(account.code)) {
    flags.push('coa_code_name_mismatch')
  }

  if (isSuspiciousDirection(tx, account)) {
    flags.push('coa_direction_review')
    confidence = Math.min(confidence, 0.6)
    reasoning = appendReasoning(reasoning, 'COA validation: transaction direction should be reviewed for this account type.')
  }

  return {
    suggested_category: account.name,
    suggested_account_code: account.code,
    confidence,
    status: flags.length === 0 && confidence >= autoApproveThreshold ? 'approved' : 'pending',
    reasoning,
    validationFlags: flags,
  }
}
