import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PlaidConnection, PlaidAccount, PlaidTransaction } from './types'
import { decrypt } from './crypto'

export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function rowToConnection(r: Record<string, unknown>): PlaidConnection {
  return {
    id: String(r.id),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    itemId: String(r.item_id),
    institutionId: r.institution_id ? String(r.institution_id) : null,
    institutionName: r.institution_name ? String(r.institution_name) : null,
    accounts: (r.accounts_json as PlaidAccount[]) ?? [],
    cursor: r.cursor ? String(r.cursor) : null,
    status: (r.status as PlaidConnection['status']) ?? 'active',
    errorCode: r.error_code ? String(r.error_code) : null,
    lastSyncedAt: r.last_synced_at ? String(r.last_synced_at) : null,
    createdAt: String(r.created_at),
  }
}

export async function getConnection(firmId: string, clientId: string): Promise<PlaidConnection | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data } = await sb
    .from('plaid_connections')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .maybeSingle()
  if (!data) return null
  return rowToConnection(data as Record<string, unknown>)
}

export async function getConnectionByItemId(itemId: string): Promise<(PlaidConnection & { accessTokenEncrypted: string }) | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data } = await sb
    .from('plaid_connections')
    .select('*')
    .eq('item_id', itemId)
    .maybeSingle()
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    ...rowToConnection(row),
    accessTokenEncrypted: String(row.access_token_encrypted),
  }
}

export async function getDecryptedAccessToken(firmId: string, clientId: string): Promise<string | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data } = await sb
    .from('plaid_connections')
    .select('access_token_encrypted')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .maybeSingle()
  if (!data) return null
  try {
    return decrypt(String((data as Record<string, unknown>).access_token_encrypted))
  } catch {
    return null
  }
}

export async function upsertConnection(params: {
  firmId: string
  clientId: string
  accessTokenEncrypted: string
  itemId: string
  institutionId: string | null
  institutionName: string | null
  accounts: PlaidAccount[]
}): Promise<PlaidConnection | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('plaid_connections')
    .upsert({
      firm_id: params.firmId,
      client_id: params.clientId,
      access_token_encrypted: params.accessTokenEncrypted,
      item_id: params.itemId,
      institution_id: params.institutionId,
      institution_name: params.institutionName,
      accounts_json: params.accounts,
      status: 'active',
      error_code: null,
    }, { onConflict: 'firm_id,client_id' })
    .select()
    .single()
  if (error || !data) return null
  return rowToConnection(data as Record<string, unknown>)
}

export async function updateConnectionStatus(
  firmId: string,
  clientId: string,
  status: PlaidConnection['status'],
  errorCode?: string
): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb
    .from('plaid_connections')
    .update({ status, error_code: errorCode ?? null })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
}

export async function updateCursorAndSyncTime(
  firmId: string,
  clientId: string,
  cursor: string
): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb
    .from('plaid_connections')
    .update({ cursor, last_synced_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
}

export async function deleteConnection(firmId: string, clientId: string): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb.from('plaid_connections').delete().eq('firm_id', firmId).eq('client_id', clientId)
}

export async function getAllActiveConnections(): Promise<Array<PlaidConnection & { accessTokenEncrypted: string }>> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('plaid_connections')
    .select('*')
    .eq('status', 'active')
  if (!data) return []
  return (data as Record<string, unknown>[]).map(row => ({
    ...rowToConnection(row),
    accessTokenEncrypted: String(row.access_token_encrypted),
  }))
}

export async function upsertTransactions(
  firmId: string,
  clientId: string,
  transactions: Array<{
    plaid_transaction_id: string
    account_id: string
    date: string
    name: string
    amount: number
    currency: string
    category_primary: string | null
    category_detailed: string | null
    merchant_name: string | null
    pending: boolean
  }>
): Promise<number> {
  if (transactions.length === 0) return 0
  const sb = getServiceClient()
  if (!sb) return 0
  const rows = transactions.map(t => ({ firm_id: firmId, client_id: clientId, ...t }))
  const { data, error } = await sb
    .from('plaid_transactions')
    .upsert(rows, { onConflict: 'plaid_transaction_id', ignoreDuplicates: false })
    .select('id')
  if (error) { console.error('[plaid storage upsert]', error.message); return 0 }
  return data?.length ?? 0
}

export async function removeTransactions(plaidTransactionIds: string[]): Promise<void> {
  if (plaidTransactionIds.length === 0) return
  const sb = getServiceClient()
  if (!sb) return
  await sb
    .from('plaid_transactions')
    .delete()
    .in('plaid_transaction_id', plaidTransactionIds)
}

export async function getTransactions(firmId: string, clientId: string, limit = 200): Promise<PlaidTransaction[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('plaid_transactions')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(limit)
  if (!data) return []
  return (data as Record<string, unknown>[]).map(r => ({
    id: String(r.id),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    plaidTransactionId: String(r.plaid_transaction_id),
    accountId: String(r.account_id),
    date: String(r.date),
    name: String(r.name),
    amount: Number(r.amount),
    currency: String(r.currency),
    categoryPrimary: r.category_primary ? String(r.category_primary) : null,
    categoryDetailed: r.category_detailed ? String(r.category_detailed) : null,
    merchantName: r.merchant_name ? String(r.merchant_name) : null,
    pending: Boolean(r.pending),
    importedAt: String(r.imported_at),
  }))
}
