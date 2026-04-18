import { createClient } from '@/lib/supabase/server'
import type { BankStatement, BankStatementLine, Reconciliation, ReconciliationItem, ParsedStatement } from './types'

export async function createStatement(firmId: string, clientId: string, parsed: ParsedStatement): Promise<BankStatement> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')

  const { data: stmt, error: e1 } = await sb
    .from('bank_statements')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      bank_name: parsed.bank_name,
      account_number_last4: parsed.account_number_last4 ?? null,
      statement_date: parsed.statement_date,
      beginning_balance: parsed.beginning_balance,
      ending_balance: parsed.ending_balance,
    })
    .select()
    .single()
  if (e1) throw new Error(e1.message)

  const lineRows = parsed.lines.map(l => ({
    statement_id: stmt.id,
    date: l.date,
    description: l.description,
    amount: l.amount,
    type: l.type,
    reference_number: l.reference_number ?? null,
    status: 'unmatched' as const,
  }))
  if (lineRows.length > 0) {
    const { error: e2 } = await sb.from('bank_statement_lines').insert(lineRows)
    if (e2) throw new Error(e2.message)
  }

  return { ...stmt, lines: [] } as BankStatement
}

export async function getStatement(id: string): Promise<BankStatement | null> {
  const sb = createClient()
  if (!sb) return null
  const { data } = await sb
    .from('bank_statements')
    .select('*, lines:bank_statement_lines(*)')
    .eq('id', id)
    .single()
  return (data as BankStatement) ?? null
}

export async function getStatements(clientId: string): Promise<BankStatement[]> {
  const sb = createClient()
  if (!sb) return []
  const { data } = await sb
    .from('bank_statements')
    .select('*')
    .eq('client_id', clientId)
    .order('statement_date', { ascending: false })
  return (data ?? []) as BankStatement[]
}

export async function updateLineMatch(
  lineId: string,
  txnId: string | null,
  confidence: number | null,
  status: BankStatementLine['status'],
): Promise<void> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')
  const { error } = await sb
    .from('bank_statement_lines')
    .update({ matched_transaction_id: txnId, match_confidence: confidence, status })
    .eq('id', lineId)
  if (error) throw new Error(error.message)
}

export async function createReconciliation(
  firmId: string,
  clientId: string,
  statementId: string,
  period: string,
  bankBalance: number,
  bookBalance: number,
): Promise<Reconciliation> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')
  const { data, error } = await sb
    .from('reconciliations')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      statement_id: statementId,
      period,
      bank_balance: bankBalance,
      book_balance: bookBalance,
      difference: bankBalance - bookBalance,
      status: 'in_progress',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Reconciliation
}

export async function getReconciliations(clientId: string): Promise<Reconciliation[]> {
  const sb = createClient()
  if (!sb) return []
  const { data } = await sb
    .from('reconciliations')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Reconciliation[]
}

export async function getReconciliation(id: string): Promise<Reconciliation | null> {
  const sb = createClient()
  if (!sb) return null
  const { data } = await sb
    .from('reconciliations')
    .select('*, items:reconciliation_items(*)')
    .eq('id', id)
    .single()
  return (data as Reconciliation) ?? null
}

export async function updateReconciliation(
  id: string,
  updates: Partial<Omit<Reconciliation, 'id' | 'firm_id' | 'client_id' | 'created_at' | 'items'>>,
): Promise<void> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')
  const { error } = await sb.from('reconciliations').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addRecItem(
  recId: string,
  type: ReconciliationItem['type'],
  description: string,
  amount: number,
): Promise<ReconciliationItem> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')
  const { data, error } = await sb
    .from('reconciliation_items')
    .insert({ reconciliation_id: recId, type, description, amount, status: 'open' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ReconciliationItem
}

export async function deleteRecItem(id: string): Promise<void> {
  const sb = createClient()
  if (!sb) throw new Error('Supabase not configured')
  const { error } = await sb.from('reconciliation_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
