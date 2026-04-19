import { getPlaidClient } from './client'
import {
  updateCursorAndSyncTime,
  upsertTransactions,
  removeTransactions,
  updateConnectionStatus,
} from './storage'
import type { SyncResult } from './types'

export async function syncTransactions(
  firmId: string,
  clientId: string,
  accessToken: string,
  currentCursor?: string | null
): Promise<SyncResult> {
  const plaid = getPlaidClient()
  if (!plaid) return { added: 0, modified: 0, removed: 0 }

  let cursor = currentCursor ?? undefined
  let hasMore = true
  const toAdd: Parameters<typeof upsertTransactions>[2] = []
  const toModify: Parameters<typeof upsertTransactions>[2] = []
  const toRemove: string[] = []

  try {
    while (hasMore) {
      const res = await plaid.transactionsSync({
        access_token: accessToken,
        cursor,
        count: 500,
      })
      const { added, modified, removed, next_cursor, has_more } = res.data

      for (const t of added) {
        toAdd.push({
          plaid_transaction_id: t.transaction_id,
          account_id: t.account_id,
          date: t.date,
          name: t.name,
          amount: t.amount,
          currency: t.iso_currency_code ?? 'USD',
          category_primary: t.personal_finance_category?.primary ?? null,
          category_detailed: t.personal_finance_category?.detailed ?? null,
          merchant_name: t.merchant_name ?? null,
          pending: t.pending,
        })
      }
      for (const t of modified) {
        toModify.push({
          plaid_transaction_id: t.transaction_id,
          account_id: t.account_id,
          date: t.date,
          name: t.name,
          amount: t.amount,
          currency: t.iso_currency_code ?? 'USD',
          category_primary: t.personal_finance_category?.primary ?? null,
          category_detailed: t.personal_finance_category?.detailed ?? null,
          merchant_name: t.merchant_name ?? null,
          pending: t.pending,
        })
      }
      for (const r of removed) {
        toRemove.push(r.transaction_id)
      }

      cursor = next_cursor
      hasMore = has_more
    }

    const [addedCount, modifiedCount] = await Promise.all([
      upsertTransactions(firmId, clientId, toAdd),
      upsertTransactions(firmId, clientId, toModify),
      removeTransactions(toRemove),
      cursor ? updateCursorAndSyncTime(firmId, clientId, cursor) : Promise.resolve(),
    ])

    return { added: addedCount, modified: modifiedCount, removed: toRemove.length }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ITEM_LOGIN_REQUIRED')) {
      await updateConnectionStatus(firmId, clientId, 'login_required', 'ITEM_LOGIN_REQUIRED')
    } else {
      await updateConnectionStatus(firmId, clientId, 'error', msg.slice(0, 200))
    }
    throw err
  }
}
