import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { buildReturnFromTransactions } from '@/lib/tax-draft/returnBuilder'
import type { CategorizationJob } from '@/types'

// ─── Storage for created returns (persisted in memory per process, keyed by ID) ─

// In production this would be a Supabase table. For now, use a module-level map
// so returns survive across requests in the same process instance.
const returnStore = new Map<string, object>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      clientId?: string
      job?: CategorizationJob
      taxYear?: number
      formType?: string
      priorYearData?: Record<string, number>
    }

    const { clientId, job, formType = '1120S', priorYearData } = body
    const taxYear = body.taxYear ?? new Date().getFullYear() - 1

    if (!clientId && !job) {
      return NextResponse.json({ error: 'clientId or job is required' }, { status: 400 })
    }

    const clientName = job?.client_name ?? clientId ?? 'Unknown Client'
    const transactions = job?.transactions ?? []

    // Build line items from real transaction data
    const lineItems = transactions.length > 0
      ? buildReturnFromTransactions(transactions, formType, priorYearData)
      : []

    // Calculate totals
    const totalRevenue = lineItems.find(l => l.lineNumber === '1a')?.currentAmount ?? 0
    const totalCOGS = lineItems.find(l => l.lineNumber === '2')?.currentAmount ?? 0
    const grossProfit = totalRevenue - totalCOGS
    const totalDeductions = lineItems
      .filter(l => parseInt(l.lineNumber) >= 7)
      .reduce((s, l) => s + (l.currentAmount ?? 0), 0)
    const taxableIncome = grossProfit - totalDeductions

    // Estimated tax liability (rough — just for display)
    const estimatedLiability = Math.max(0, Math.round(taxableIncome * 0.21))

    // Find tax savings opportunities using AI if available
    let opportunities: string[] = []
    if (process.env.ANTHROPIC_API_KEY && transactions.length > 0) {
      try {
        const client = new Anthropic()
        const topExpenses = lineItems
          .filter(l => l.currentAmount > 0 && parseInt(l.lineNumber) >= 7)
          .sort((a, b) => b.currentAmount - a.currentAmount)
          .slice(0, 5)
          .map(l => `${l.description}: $${l.currentAmount.toLocaleString()}`)
          .join('\n')

        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: `You are a CPA. For a ${formType} return with gross revenue $${totalRevenue.toLocaleString()}, identify 3 potential tax savings opportunities. Top expenses:\n${topExpenses}\n\nReturn a JSON array of 3 strings, each under 80 chars, naming a specific actionable opportunity. No markdown.`,
          }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
        const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
        const start = stripped.indexOf('[')
        const end = stripped.lastIndexOf(']')
        if (start !== -1 && end > start) {
          opportunities = JSON.parse(stripped.slice(start, end + 1))
        }
      } catch { /* ignore AI errors */ }
    }

    if (opportunities.length === 0) {
      // Rule-based fallbacks
      if (totalDeductions < totalRevenue * 0.3) opportunities.push('Review Section 179 for any equipment purchases')
      if (!lineItems.find(l => l.description.toLowerCase().includes('home office'))) {
        opportunities.push('Home office deduction may apply if applicable')
      }
      opportunities.push('Confirm all business meals and travel are properly documented')
    }

    const returnId = randomUUID()
    const opportunitySavings = Math.round(estimatedLiability * 0.15)

    const taxReturn = {
      id: returnId,
      clientId: clientId ?? clientName.toLowerCase().replace(/\s+/g, '-'),
      clientName,
      formType,
      taxYear,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lineItems,
      summary: {
        grossRevenue: totalRevenue,
        cogs: totalCOGS,
        grossProfit,
        totalDeductions,
        taxableIncome,
        estimatedLiability,
      },
      opportunities,
      opportunitySavings,
      hasPriorYear: !!priorYearData,
      transactionCount: transactions.length,
    }

    // Persist in memory store
    returnStore.set(returnId, taxReturn)

    return NextResponse.json({ taxReturn })
  } catch (err) {
    console.error('[tax-draft/create]', err)
    return NextResponse.json({ error: 'Failed to create return', detail: String(err) }, { status: 500 })
  }
}

// ─── GET /api/tax-draft/create?id= — retrieve a stored return ────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const taxReturn = returnStore.get(id)
  if (!taxReturn) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 })
  }

  return NextResponse.json({ taxReturn })
}
