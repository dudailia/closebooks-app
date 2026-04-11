import { NextRequest, NextResponse } from 'next/server'

// ─── In-process exception store ───────────────────────────────────────────────
// Populated by the autopilot/start-close route when exceptions are detected.
// In production this would be a Supabase table.

interface AgentException {
  id: string
  transactionId?: string
  description: string
  date: string
  amount: number
  agentSuggestion: string
  suggestedAccount: string
  confidence: number
  reasoning: string
  clientId: string
  resolvedAt?: string
  resolution?: string
}

const exceptionStore = new Map<string, AgentException[]>()

export function storeExceptions(clientId: string, exceptions: AgentException[]) {
  exceptionStore.set(clientId, exceptions)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') ?? ''

  // Return stored exceptions for this client if they exist
  const stored = exceptionStore.get(clientId)
  if (stored && stored.length > 0) {
    return NextResponse.json({ exceptions: stored, clientId, fromRealData: true })
  }

  // If no exceptions stored and client exists, return empty (no exceptions = good!)
  if (clientId && clientId !== 'smith-2024' && clientId !== 'chen-2024') {
    return NextResponse.json({ exceptions: [], clientId, fromRealData: true })
  }

  // Fall back to demo data for known demo client IDs
  const DEMO_EXCEPTIONS: Record<string, AgentException[]> = {
    'smith-2024': [
      {
        id: 'exc-1', transactionId: 'tx-1', description: 'AMZN*RT9K2', date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        amount: 247.00, agentSuggestion: 'Office Supplies', suggestedAccount: 'Office Expenses', confidence: 0.68,
        reasoning: 'Amazon transaction pattern suggests office or supply purchase. Amount is within normal range for supplies.',
        clientId: 'smith-2024',
      },
      {
        id: 'exc-2', transactionId: 'tx-2', description: 'Wire Transfer OUT', date: new Date(Date.now() - 22 * 86400000).toISOString().slice(0, 10),
        amount: 47200.00, agentSuggestion: 'Capital Expenditure', suggestedAccount: 'Fixed Assets', confidence: 0.12,
        reasoning: 'Large unusual wire transfer. No matching vendor in history. Requires human review.',
        clientId: 'smith-2024',
      },
      {
        id: 'exc-3', transactionId: 'tx-3', description: 'STRIPE REFUND', date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
        amount: -850.00, agentSuggestion: 'Revenue Reversal', suggestedAccount: 'Revenue', confidence: 0.81,
        reasoning: 'Stripe refund pattern matches revenue reversal. Negative amount confirms refund.',
        clientId: 'smith-2024',
      },
    ],
    'chen-2024': [
      {
        id: 'exc-4', transactionId: 'tx-4', description: 'MEDITECH SYSTEMS', date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
        amount: 2400.00, agentSuggestion: 'Software Subscription', suggestedAccount: 'Technology Expenses', confidence: 0.74,
        reasoning: 'Medical software vendor not seen before. Likely new EHR or practice management software.',
        clientId: 'chen-2024',
      },
    ],
  }

  return NextResponse.json({
    exceptions: DEMO_EXCEPTIONS[clientId] ?? [],
    clientId,
    fromRealData: false,
  })
}

// POST: resolve an exception
export async function POST(request: NextRequest) {
  let body: { clientId: string; exceptionId: string; resolution: string; category?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { clientId, exceptionId, resolution } = body
  const exceptions = exceptionStore.get(clientId) ?? []
  const idx = exceptions.findIndex(e => e.id === exceptionId)
  if (idx !== -1) {
    exceptions[idx] = { ...exceptions[idx], resolvedAt: new Date().toISOString(), resolution }
    exceptionStore.set(clientId, exceptions)
  }

  return NextResponse.json({ success: true })
}
