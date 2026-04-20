import { NextRequest, NextResponse } from 'next/server'
import { getPlaidClient } from '@/lib/plaid/client'
import { getConnectionByItemId, updateConnectionStatus } from '@/lib/plaid/storage'
import { syncTransactions } from '@/lib/plaid/sync'
import { decrypt } from '@/lib/plaid/crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()

  let webhook: Record<string, unknown>
  try {
    webhook = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Optional: verify Plaid webhook JWT signature
  const plaidToken = request.headers.get('plaid-verification')
  const plaid = getPlaidClient()
  if (plaid && plaidToken) {
    try {
      const keyId = extractKeyId(plaidToken)
      if (keyId) await plaid.webhookVerificationKeyGet({ key_id: keyId })
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }
  }

  const type = String(webhook.webhook_type ?? '')
  const code = String(webhook.webhook_code ?? '')
  const itemId = String(webhook.item_id ?? '')

  if (type === 'TRANSACTIONS' && code === 'SYNC_UPDATES_AVAILABLE' && itemId) {
    void handleTransactionsReady(itemId)
  }

  if (type === 'ITEM' && code === 'ERROR' && itemId) {
    const errorCode = String((webhook.error as Record<string, unknown>)?.error_code ?? 'UNKNOWN')
    void handleItemError(itemId, errorCode)
  }

  return NextResponse.json({ ok: true })
}

async function handleTransactionsReady(itemId: string): Promise<void> {
  const conn = await getConnectionByItemId(itemId)
  if (!conn) return
  try {
    const accessToken = decrypt(conn.accessTokenEncrypted)
    await syncTransactions(conn.firmId, conn.clientId, accessToken, conn.cursor)
  } catch (err) {
    console.error('[plaid webhook sync]', err instanceof Error ? err.message : err)
  }
}

async function handleItemError(itemId: string, errorCode: string): Promise<void> {
  const conn = await getConnectionByItemId(itemId)
  if (!conn) return
  const status = errorCode === 'ITEM_LOGIN_REQUIRED' ? 'login_required' : 'error'
  await updateConnectionStatus(conn.firmId, conn.clientId, status, errorCode)
}

function extractKeyId(jwt: string): string {
  try {
    const header = JSON.parse(Buffer.from(jwt.split('.')[0], 'base64url').toString())
    return String(header.kid ?? '')
  } catch {
    return ''
  }
}
