import { NextResponse } from 'next/server'

const DEMO_EXCEPTIONS: Record<string, Array<{
  id: string
  description: string
  date: string
  amount: number
  agentSuggestion: string
  suggestedAccount: string
  confidence: number
  reasoning: string
}>> = {
  'smith-2024': [
    { id: 'exc-1', description: 'AMZN*RT9K2', date: '2024-11-14', amount: 247.00, agentSuggestion: 'Office Supplies', suggestedAccount: 'Office Expenses', confidence: 0.68, reasoning: 'Amazon transaction pattern suggests office or supply purchase. Amount is within normal range for supplies.' },
    { id: 'exc-2', description: 'Wire Transfer OUT', date: '2024-11-22', amount: 47200.00, agentSuggestion: 'Capital Expenditure', suggestedAccount: 'Fixed Assets', confidence: 0.12, reasoning: 'Large unusual wire transfer. No matching vendor in history. Requires human review.' },
    { id: 'exc-3', description: 'STRIPE REFUND', date: '2024-11-28', amount: -850.00, agentSuggestion: 'Revenue Reversal', suggestedAccount: 'Revenue', confidence: 0.81, reasoning: 'Stripe refund pattern matches revenue reversal. Negative amount confirms refund.' },
  ],
  'chen-2024': [
    { id: 'exc-4', description: 'MEDITECH SYSTEMS', date: '2024-11-10', amount: 2400.00, agentSuggestion: 'Software Subscription', suggestedAccount: 'Technology Expenses', confidence: 0.74, reasoning: 'Medical software vendor not seen before. Likely new EHR or practice management software.' },
  ],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') ?? 'smith-2024'
  return NextResponse.json({
    exceptions: DEMO_EXCEPTIONS[clientId] ?? [],
    clientId,
  })
}
