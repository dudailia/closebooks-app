import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Transaction } from '@/types'
import {
  createJournalEntriesBatch,
  getDefaultBankQboId,
  getValidAccessTokenForFirm,
  setConnectionError,
  clearConnectionError,
  updateSyncStats,
} from '@/lib/qboClient'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUserServer } from '@/lib/supabase/qboFirm'
import { resolveQboAccountForTx, validateMappingForAccounts } from '@/lib/qboMapping'
import type { ChartOfAccounts } from '@/types'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const bodySchema = z.object({
  transactions: z.array(z.unknown()),
  chartOfAccounts: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
      })
    )
    .optional(),
  clientKey: z.string().min(1).max(200).optional(),
  clientName: z.string().min(1).max(500).optional(),
  accountMapping: z.record(z.string()).optional(),
})

function slugClientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120)
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const json = await request.json()
    const r = bodySchema.safeParse(json)
    if (!r.success) {
      return NextResponse.json({ error: 'Invalid request body', details: r.error.flatten() }, { status: 400 })
    }
    parsed = r.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const txsUnknown = parsed.transactions as Transaction[]
  const txs = txsUnknown.filter((t) => t.status === 'approved' || t.status === 'edited')
  if (txs.length === 0) {
    return NextResponse.json({ error: 'No approved transactions to push.' }, { status: 422 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const firmId = await getFirmIdForUserServer(supabase, user.id)
  if (!firmId) {
    return NextResponse.json(
      { error: 'Create a firm profile (sign up with Supabase) before connecting QuickBooks.' },
      { status: 400 }
    )
  }

  const clientName = parsed.clientName?.trim() || 'default'
  const clientKey = parsed.clientKey?.trim() || slugClientKey(clientName)

  let mapping: Record<string, string> = parsed.accountMapping ?? {}

  if (Object.keys(mapping).length === 0) {
    const { data: settings } = await supabase
      .from('qbo_client_settings')
      .select('qbo_account_mapping')
      .eq('firm_id', firmId)
      .eq('client_key', clientKey)
      .maybeSingle()
    const stored = settings?.qbo_account_mapping as Record<string, string> | null
    if (stored && typeof stored === 'object') mapping = stored
  }

  const chart: ChartOfAccounts[] = (parsed.chartOfAccounts ?? []) as ChartOfAccounts[]
  const codesInUse = new Set<string>()
  for (const tx of txs) {
    const code = (tx.final_account_code?.trim() || tx.suggested_account_code?.trim()) ?? ''
    if (code) codesInUse.add(code)
  }
  const accountsToMap = chart.filter((a) => codesInUse.has(a.code))
  const validation = validateMappingForAccounts(accountsToMap, mapping)
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: 'Account mapping incomplete.',
        missingCodes: validation.missingCodes,
        hint: 'Map every account code used in this close on the QuickBooks mapping page.',
      },
      { status: 422 }
    )
  }

  let accessToken: string
  let realmId: string
  try {
    const t = await getValidAccessTokenForFirm(firmId)
    accessToken = t.accessToken
    realmId = t.realmId
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'qbo_error'
    if (msg === 'not_connected') {
      return NextResponse.json({ error: 'QuickBooks is not connected.' }, { status: 400 })
    }
    await setConnectionError(firmId, { code: 'token', message: 'Could not refresh QuickBooks session.' })
    return NextResponse.json({ error: 'Could not refresh QuickBooks session.' }, { status: 502 })
  }

  const bankId = await getDefaultBankQboId(realmId, accessToken)
  if (!bankId) {
    await setConnectionError(firmId, { code: 'accounts', message: 'No Bank account found in QuickBooks.' })
    return NextResponse.json(
      {
        error:
          'Could not find a Bank account in QuickBooks. Add at least one Bank account, then sync again.',
      },
      { status: 422 }
    )
  }

  const lines: Array<{
    amount: number
    description: string
    debitAccountId: string
    creditAccountId: string
  }> = []

  const lineErrors: Array<{ index: number; message: string }> = []

  txs.forEach((tx, index) => {
    const amt = Math.abs(tx.amount)
    if (amt < 0.01) return
    const glId = resolveQboAccountForTx(tx, mapping)
    if (!glId) {
      lineErrors.push({ index, message: 'Missing GL mapping for transaction' })
      return
    }
    const desc = `${tx.date} — ${tx.description}`.slice(0, 400)
    if (tx.type === 'debit') {
      lines.push({
        amount: amt,
        description: desc,
        debitAccountId: glId,
        creditAccountId: bankId,
      })
    } else {
      lines.push({
        amount: amt,
        description: desc,
        debitAccountId: bankId,
        creditAccountId: glId,
      })
    }
  })

  if (lines.length === 0) {
    return NextResponse.json(
      {
        error: 'No journal lines to post.',
        lineErrors: lineErrors.length ? lineErrors : undefined,
      },
      { status: 422 }
    )
  }

  const batch = await createJournalEntriesBatch(realmId, accessToken, lines)
  const pushed = batch.results.filter((r) => r.success).length
  const failed = batch.results.filter((r) => !r.success)

  if (pushed > 0) {
    await updateSyncStats(firmId, pushed)
    await clearConnectionError(firmId)
  }

  if (failed.length > 0) {
    const first = failed[0]
    await setConnectionError(firmId, {
      code: 'journal',
      message: first.error ?? 'One or more journal entries failed',
    })
  }

  return NextResponse.json({
    ok: true,
    pushed,
    failed: failed.length,
    batchErrors: batch.batchErrors.length ? batch.batchErrors : undefined,
    lineFailures: failed.slice(0, 20).map((f) => ({ index: f.index, error: f.error })),
    message:
      pushed > 0
        ? `Posted ${pushed} journal entr${pushed === 1 ? 'y' : 'ies'} to QuickBooks${failed.length ? ` (${failed.length} failed)` : ''}.`
        : 'No entries were posted. Check the mapping and QuickBooks response.',
  })
}
