/**
 * Server-side QuickBooks API helpers (token refresh, minimal journal push).
 */

import { createClient } from '@supabase/supabase-js'
import { getIntuitTokenUrl } from '@/lib/qboConfig'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface QBOConnectionRow {
  firm_id: string
  realm_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

async function refreshTokens(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const clientId = process.env.INTUIT_CLIENT_ID!
  const clientSecret = process.env.INTUIT_CLIENT_SECRET!
  const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(getIntuitTokenUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const t = await res.text()
    console.error('[qboClient] refresh failed', res.status, t)
    throw new Error('refresh_failed')
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

/** Returns a valid access token for the firm, refreshing and persisting when needed. */
export async function getValidAccessTokenForFirm(firmId: string): Promise<{
  accessToken: string
  realmId: string
}> {
  const supabase = getServiceSupabase()
  if (!supabase) throw new Error('no_supabase')

  const { data: row, error } = await supabase
    .from('qbo_connections')
    .select('realm_id, access_token, refresh_token, expires_at')
    .eq('firm_id', firmId)
    .maybeSingle()

  if (error || !row) throw new Error('not_connected')

  let accessToken = row.access_token as string
  const refreshToken = row.refresh_token as string
  const realmId = row.realm_id as string
  const expiresAt = new Date(row.expires_at as string).getTime()
  const bufferMs = 120_000

  if (Date.now() + bufferMs >= expiresAt) {
    const tokens = await refreshTokens(refreshToken)
    accessToken = tokens.access_token
    const newRefresh = tokens.refresh_token || refreshToken
    const newExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase
      .from('qbo_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: newRefresh,
        expires_at: newExpires,
        updated_at: new Date().toISOString(),
      })
      .eq('firm_id', firmId)
  }

  return { accessToken, realmId }
}

interface AccountRef {
  value: string
  name?: string
}

async function queryAccounts(
  realmId: string,
  accessToken: string,
  accountType: string
): Promise<AccountRef | null> {
  const q = encodeURIComponent(`select * from Account where AccountType = '${accountType}' maxresults 1`)
  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${q}&minorversion=65`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    QueryResponse?: { Account?: Array<{ Id: string; Name?: string }> }
  }
  const acc = data.QueryResponse?.Account?.[0]
  if (!acc) return null
  return { value: acc.Id, name: acc.Name }
}

export async function resolveDefaultAccountRefs(
  realmId: string,
  accessToken: string
): Promise<{ bank: AccountRef; expense: AccountRef } | null> {
  const bank =
    (await queryAccounts(realmId, accessToken, 'Bank')) ??
    (await queryAccounts(realmId, accessToken, 'Other Current Asset'))
  const expense =
    (await queryAccounts(realmId, accessToken, 'Expense')) ??
    (await queryAccounts(realmId, accessToken, 'Cost of Goods Sold'))

  if (!bank || !expense) return null
  return { bank, expense }
}

export async function createJournalEntry(
  realmId: string,
  accessToken: string,
  lines: Array<{
    amount: number
    description: string
    debitAccountId: string
    creditAccountId: string
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const line of lines) {
    const payload = {
      Line: [
        {
          Description: line.description.slice(0, 400),
          Amount: line.amount,
          DetailType: 'JournalEntryLineDetail',
          JournalEntryLineDetail: {
            PostingType: 'Debit',
            AccountRef: { value: line.debitAccountId },
          },
        },
        {
          Description: line.description.slice(0, 400),
          Amount: line.amount,
          DetailType: 'JournalEntryLineDetail',
          JournalEntryLineDetail: {
            PostingType: 'Credit',
            AccountRef: { value: line.creditAccountId },
          },
        },
      ],
    }

    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/journalentry?minorversion=65`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) success++
    else {
      failed++
      const t = await res.text()
      console.error('[qboClient] journalentry error', res.status, t.slice(0, 500))
    }
  }

  return { success, failed }
}

export async function updateSyncStats(firmId: string, added: number): Promise<void> {
  const supabase = getServiceSupabase()
  if (!supabase || added <= 0) return

  const { data: row } = await supabase
    .from('qbo_connections')
    .select('total_synced')
    .eq('firm_id', firmId)
    .maybeSingle()

  const prev = Number(row?.total_synced ?? 0)
  await supabase
    .from('qbo_connections')
    .update({
      total_synced: prev + added,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
}
