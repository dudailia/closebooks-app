/**
 * Server-side QuickBooks Online: token refresh, rate limiting, pull sync, journal batch push.
 */

import { createClient } from '@supabase/supabase-js'
import { getIntuitTokenUrl } from '@/lib/qboConfig'

const QBO_MINOR = 65
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
/** Intuit production default ~500 requests/min per realm (defensive cap) */
export const QBO_MAX_CALLS_PER_MINUTE = 500

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

type RateBucket = { count: number; windowStart: number }
const rateBuckets = new Map<string, RateBucket>()

export function withQboRateLimit<T>(realmId: string, fn: () => Promise<T>): Promise<T> {
  const key = realmId || 'default'
  const now = Date.now()
  const windowMs = 60_000
  let b = rateBuckets.get(key)
  if (!b || now - b.windowStart >= windowMs) {
    b = { count: 0, windowStart: now }
    rateBuckets.set(key, b)
  }
  if (b.count >= QBO_MAX_CALLS_PER_MINUTE) {
    const wait = windowMs - (now - b.windowStart)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        withQboRateLimit(realmId, fn).then(resolve).catch(reject)
      }, Math.max(100, wait))
    })
  }
  b.count += 1
  return fn()
}

export interface QBOConnectionRow {
  firm_id: string
  realm_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface IntuitErrorInfo {
  status: number
  code?: string
  message: string
  intuitTid?: string
  raw?: string
}

function parseIntuitBody(text: string): IntuitErrorInfo {
  try {
    const j = JSON.parse(text) as {
      Fault?: {
        Error?: Array<{ Message?: string; Detail?: string; code?: string }>
      }
      error?: string
      error_description?: string
    }
    const err = j.Fault?.Error?.[0]
    if (err) {
      return {
        status: 400,
        code: err.code,
        message: [err.Message, err.Detail].filter(Boolean).join(' — ') || 'QuickBooks API error',
        raw: text.slice(0, 2000),
      }
    }
    if (j.error) {
      return {
        status: 400,
        code: j.error,
        message: j.error_description ?? j.error,
        raw: text.slice(0, 2000),
      }
    }
  } catch {
    /* ignore */
  }
  return { status: 500, message: text.slice(0, 500) || 'Unknown QuickBooks error', raw: text.slice(0, 2000) }
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
    console.error('[qboClient] refresh failed', res.status, t.slice(0, 500))
    throw new Error('refresh_failed')
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export async function setConnectionError(
  firmId: string,
  info: { code?: string; message: string }
): Promise<void> {
  const supabase = getServiceSupabase()
  if (!supabase) return
  await supabase
    .from('qbo_connections')
    .update({
      last_error_code: info.code ?? 'error',
      last_error_message: info.message.slice(0, 2000),
      last_error_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
}

export async function clearConnectionError(firmId: string): Promise<void> {
  const supabase = getServiceSupabase()
  if (!supabase) return
  await supabase
    .from('qbo_connections')
    .update({
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
}

/** Returns a valid access token, refreshing and persisting when expiring within 5 minutes. */
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

  if (Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt) {
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

export async function qboGetJson<T>(
  realmId: string,
  accessToken: string,
  pathAndQuery: string
): Promise<{ ok: true; data: T } | { ok: false; error: IntuitErrorInfo }> {
  return withQboRateLimit(realmId, async () => {
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}minorversion=${QBO_MINOR}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const text = await res.text()
    if (!res.ok) {
      return { ok: false, error: { ...parseIntuitBody(text), status: res.status } }
    }
    try {
      return { ok: true, data: JSON.parse(text) as T }
    } catch {
      return { ok: false, error: { status: res.status, message: 'Invalid JSON from QuickBooks' } }
    }
  })
}

export async function qboPostJson<T>(
  realmId: string,
  accessToken: string,
  path: string,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: IntuitErrorInfo }> {
  return withQboRateLimit(realmId, async () => {
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/${path}?minorversion=${QBO_MINOR}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      const tid = res.headers.get('intuit_tid') ?? undefined
      return {
        ok: false,
        error: { ...parseIntuitBody(text), status: res.status, intuitTid: tid },
      }
    }
    try {
      return { ok: true, data: JSON.parse(text) as T }
    } catch {
      return { ok: false, error: { status: res.status, message: 'Invalid JSON from QuickBooks' } }
    }
  })
}

/** Revoke refresh token at Intuit (best-effort). */
export async function revokeIntuitRefreshToken(refreshToken: string): Promise<void> {
  const clientId = process.env.INTUIT_CLIENT_ID!
  const clientSecret = process.env.INTUIT_CLIENT_SECRET!
  const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')
  const revokeUrl =
    process.env.INTUIT_REVOKE_URL?.replace(/\/$/, '') ??
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke'
  await fetch(revokeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ token: refreshToken }).toString(),
  }).catch(() => {})
}

interface AccountRow {
  Id: string
  Name?: string
  AccountType?: string
  AccountSubType?: string
  Active?: boolean
  ParentRef?: { value?: string }
}

async function queryAllAccounts(realmId: string, accessToken: string): Promise<AccountRow[]> {
  const out: AccountRow[] = []
  let start = 1
  const page = 500
  for (;;) {
    const q = encodeURIComponent(`select * from Account startposition ${start} maxresults ${page}`)
    const r = await qboGetJson<{ QueryResponse?: { Account?: AccountRow[]; maxResults?: number } }>(
      realmId,
      accessToken,
      `query?query=${q}`
    )
    if (!r.ok) break
    const list = r.data.QueryResponse?.Account ?? []
    out.push(...list)
    if (list.length < page) break
    start += page
  }
  return out
}

export async function syncAccountsToSupabase(
  firmId: string,
  realmId: string,
  accessToken: string
): Promise<number> {
  const supabase = getServiceSupabase()
  if (!supabase) return 0

  const accounts = await queryAllAccounts(realmId, accessToken)
  const now = new Date().toISOString()
  const rows = accounts.map((a) => ({
    firm_id: firmId,
    realm_id: realmId,
    qbo_id: a.Id,
    name: a.Name ?? '',
    account_type: a.AccountType ?? null,
    account_sub_type: a.AccountSubType ?? null,
    active: a.Active !== false,
    parent_qbo_id: a.ParentRef?.value ?? null,
    raw: a as object,
    synced_at: now,
  }))

  if (rows.length === 0) return 0

  await supabase.from('qbo_accounts').delete().eq('firm_id', firmId).eq('realm_id', realmId)
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('qbo_accounts').insert(rows.slice(i, i + 200))
  }
  return rows.length
}

interface NameEntityRow {
  Id: string
  DisplayName?: string
  CompanyName?: string
  Active?: boolean
}

async function queryPaged<T extends NameEntityRow>(
  realmId: string,
  accessToken: string,
  entity: 'Vendor' | 'Customer',
  fieldList = '*'
): Promise<T[]> {
  const out: T[] = []
  let start = 1
  const page = 500
  for (;;) {
    const q = encodeURIComponent(`select ${fieldList} from ${entity} startposition ${start} maxresults ${page}`)
    const r = await qboGetJson<{ QueryResponse?: Record<string, T[] | undefined> }>(
      realmId,
      accessToken,
      `query?query=${q}`
    )
    if (!r.ok) break
    const list = (r.data.QueryResponse?.[entity] ?? []) as T[]
    out.push(...list)
    if (list.length < page) break
    start += page
  }
  return out
}

export async function syncVendorsToSupabase(
  firmId: string,
  realmId: string,
  accessToken: string
): Promise<number> {
  const supabase = getServiceSupabase()
  if (!supabase) return 0
  const vendors = await queryPaged<NameEntityRow>(realmId, accessToken, 'Vendor')
  const now = new Date().toISOString()
  const rows = vendors.map((v) => ({
    firm_id: firmId,
    realm_id: realmId,
    qbo_id: v.Id,
    display_name: v.DisplayName ?? null,
    company_name: v.CompanyName ?? null,
    active: v.Active !== false,
    raw: v as object,
    synced_at: now,
  }))
  if (rows.length === 0) return 0
  await supabase.from('qbo_vendors').delete().eq('firm_id', firmId).eq('realm_id', realmId)
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('qbo_vendors').insert(rows.slice(i, i + 200))
  }
  return rows.length
}

export async function syncCustomersToSupabase(
  firmId: string,
  realmId: string,
  accessToken: string
): Promise<number> {
  const supabase = getServiceSupabase()
  if (!supabase) return 0
  const customers = await queryPaged<NameEntityRow>(realmId, accessToken, 'Customer')
  const now = new Date().toISOString()
  const rows = customers.map((c) => ({
    firm_id: firmId,
    realm_id: realmId,
    qbo_id: c.Id,
    display_name: c.DisplayName ?? null,
    company_name: c.CompanyName ?? null,
    active: c.Active !== false,
    raw: c as object,
    synced_at: now,
  }))
  if (rows.length === 0) return 0
  await supabase.from('qbo_customers').delete().eq('firm_id', firmId).eq('realm_id', realmId)
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('qbo_customers').insert(rows.slice(i, i + 200))
  }
  return rows.length
}

interface PurchaseRow {
  Id: string
  TxnDate?: string
  TotalAmt?: number
  PrivateNote?: string
  Line?: unknown[]
  APAccountRef?: { value?: string }
}

interface DepositRow {
  Id: string
  TxnDate?: string
  TotalAmt?: number
  PrivateNote?: string
  Line?: unknown[]
  DepositToAccountRef?: { value?: string }
}

async function queryPurchasesDeposits(
  realmId: string,
  accessToken: string
): Promise<{ purchases: PurchaseRow[]; deposits: DepositRow[] }> {
  const purchases: PurchaseRow[] = []
  const deposits: DepositRow[] = []
  for (const entity of ['Purchase', 'Deposit'] as const) {
    let start = 1
    const page = 100
    for (let iter = 0; iter < 50; iter++) {
      const q = encodeURIComponent(
        `select * from ${entity} startposition ${start} maxresults ${page}`
      )
      const r = await qboGetJson<{
        QueryResponse?: { Purchase?: PurchaseRow[]; Deposit?: DepositRow[] }
      }>(realmId, accessToken, `query?query=${q}`)
      if (!r.ok) break
      const list =
        entity === 'Purchase'
          ? (r.data.QueryResponse?.Purchase ?? [])
          : (r.data.QueryResponse?.Deposit ?? [])
      if (entity === 'Purchase') purchases.push(...(list as PurchaseRow[]))
      else deposits.push(...(list as DepositRow[]))
      if (list.length < page) break
      start += page
    }
  }
  return { purchases, deposits }
}

export async function syncBankActivityToSupabase(
  firmId: string,
  realmId: string,
  accessToken: string
): Promise<number> {
  const supabase = getServiceSupabase()
  if (!supabase) return 0
  const { purchases, deposits } = await queryPurchasesDeposits(realmId, accessToken)
  const now = new Date().toISOString()
  const rows: Array<Record<string, unknown>> = []

  for (const p of purchases) {
    rows.push({
      firm_id: firmId,
      realm_id: realmId,
      qbo_id: p.Id,
      entity_type: 'Purchase',
      txn_date: p.TxnDate ?? null,
      amount: p.TotalAmt ?? null,
      description: p.PrivateNote ?? null,
      account_qbo_id: p.APAccountRef?.value ?? null,
      raw: p as object,
      synced_at: now,
    })
  }
  for (const d of deposits) {
    rows.push({
      firm_id: firmId,
      realm_id: realmId,
      qbo_id: d.Id,
      entity_type: 'Deposit',
      txn_date: d.TxnDate ?? null,
      amount: d.TotalAmt ?? null,
      description: d.PrivateNote ?? null,
      account_qbo_id: d.DepositToAccountRef?.value ?? null,
      raw: d as object,
      synced_at: now,
    })
  }

  if (rows.length === 0) return 0
  await supabase.from('qbo_bank_transactions').delete().eq('firm_id', firmId).eq('realm_id', realmId)
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('qbo_bank_transactions').insert(rows.slice(i, i + 200))
  }
  return rows.length
}

export async function getDefaultBankQboId(
  realmId: string,
  accessToken: string
): Promise<string | null> {
  const q = encodeURIComponent("select * from Account where AccountType = 'Bank' maxresults 1")
  const r = await qboGetJson<{ QueryResponse?: { Account?: Array<{ Id: string }> } }>(
    realmId,
    accessToken,
    `query?query=${q}`
  )
  if (!r.ok) return null
  return r.data.QueryResponse?.Account?.[0]?.Id ?? null
}

/** @deprecated use mapping-based push */
export async function resolveDefaultAccountRefs(
  realmId: string,
  accessToken: string
): Promise<{ bank: { value: string; name?: string }; expense: { value: string; name?: string } } | null> {
  const qBank = encodeURIComponent("select * from Account where AccountType = 'Bank' maxresults 1")
  const rB = await qboGetJson<{ QueryResponse?: { Account?: Array<{ Id: string; Name?: string }> } }>(
    realmId,
    accessToken,
    `query?query=${qBank}`
  )
  const bank =
    rB.ok && rB.data.QueryResponse?.Account?.[0]
      ? { value: rB.data.QueryResponse.Account[0].Id, name: rB.data.QueryResponse.Account[0].Name }
      : null

  const qExp = encodeURIComponent("select * from Account where AccountType = 'Expense' maxresults 1")
  const rE = await qboGetJson<{ QueryResponse?: { Account?: Array<{ Id: string; Name?: string }> } }>(
    realmId,
    accessToken,
    `query?query=${qExp}`
  )
  const expense =
    rE.ok && rE.data.QueryResponse?.Account?.[0]
      ? { value: rE.data.QueryResponse.Account[0].Id, name: rE.data.QueryResponse.Account[0].Name }
      : null

  if (!bank || !expense) return null
  return { bank, expense }
}

export interface JournalLineInput {
  amount: number
  description: string
  debitAccountId: string
  creditAccountId: string
}

export interface JournalBatchItemResult {
  index: number
  success: boolean
  id?: string
  error?: string
}

/** Post up to 30 journal entries per Batch request (QuickBooks batch limit). */
export async function createJournalEntriesBatch(
  realmId: string,
  accessToken: string,
  lines: JournalLineInput[]
): Promise<{ results: JournalBatchItemResult[]; batchErrors: string[] }> {
  const results: JournalBatchItemResult[] = []
  const batchErrors: string[] = []
  const chunkSize = 30

  for (let offset = 0; offset < lines.length; offset += chunkSize) {
    const chunk = lines.slice(offset, offset + chunkSize)
    const batchItem: Array<Record<string, unknown>> = chunk.map((line, i) => ({
      bId: `b${offset + i}`,
      Operation: 'create',
      JournalEntry: {
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
      },
    }))

    const r = await qboPostJson<{
      BatchItemResponse?: Array<{
        bId?: string
        JournalEntry?: { Id?: string }
        Fault?: { Error?: Array<{ Message?: string }> }
      }>
    }>(realmId, accessToken, 'batch', { BatchItemRequest: batchItem })

    if (!r.ok) {
      const msg = r.error.message
      batchErrors.push(msg)
      for (let j = 0; j < chunk.length; j++) {
        results.push({
          index: offset + j,
          success: false,
          error: msg,
        })
      }
      continue
    }

    const responses = r.data.BatchItemResponse ?? []
    for (let j = 0; j < chunk.length; j++) {
      const resp = responses[j]
      const globalIdx = offset + j
      if (resp?.Fault?.Error?.length) {
        const em = resp.Fault.Error.map((e) => e.Message).filter(Boolean).join('; ')
        results.push({ index: globalIdx, success: false, error: em })
      } else if (resp?.JournalEntry?.Id) {
        results.push({ index: globalIdx, success: true, id: resp.JournalEntry.Id })
      } else {
        results.push({ index: globalIdx, success: false, error: 'Unknown batch item response' })
      }
    }
  }

  return { results, batchErrors }
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
