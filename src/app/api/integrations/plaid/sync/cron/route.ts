import { NextRequest, NextResponse } from 'next/server'
import { getAllActiveConnections } from '@/lib/plaid/storage'
import { syncTransactions } from '@/lib/plaid/sync'
import { decrypt } from '@/lib/plaid/crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await getAllActiveConnections()
  const results: Array<{ firmId: string; clientId: string; ok: boolean; error?: string }> = []

  for (const conn of connections) {
    try {
      const accessToken = decrypt(conn.accessTokenEncrypted)
      await syncTransactions(conn.firmId, conn.clientId, accessToken, conn.cursor)
      results.push({ firmId: conn.firmId, clientId: conn.clientId, ok: true })
    } catch (err: unknown) {
      results.push({
        firmId: conn.firmId,
        clientId: conn.clientId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
