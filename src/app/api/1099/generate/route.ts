import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface Transaction {
  vendor: string
  amount: number
  date: string
  category: string
  paymentMethod: string
  isCorpration?: boolean
}

interface GenerateRequest {
  transactions: Transaction[]
  taxYear?: number
}

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()
    const { transactions = [], taxYear = 2024 } = body

    const txSummary = transactions.length > 0
      ? JSON.stringify(transactions.slice(0, 50), null, 2)
      : JSON.stringify([
          { vendor: 'Martinez Plumbing LLC', amount: 8500, date: '2024-03-15', category: 'Subcontractors', paymentMethod: 'check', isCorporation: false },
          { vendor: 'Rodriguez Design Studio', amount: 4200, date: '2024-05-20', category: 'Professional Services', paymentMethod: 'ACH', isCorporation: false },
          { vendor: 'ABC Corp', amount: 12000, date: '2024-02-10', category: 'IT Services', paymentMethod: 'check', isCorporation: true },
          { vendor: 'Sarah Johnson Consulting', amount: 9800, date: '2024-07-01', category: 'Consulting', paymentMethod: 'check', isCorporation: false },
          { vendor: 'QuickPay Credit Card', amount: 3200, date: '2024-04-12', category: 'Office Supplies', paymentMethod: 'credit_card', isCorporation: false },
          { vendor: 'Tom Chen Photography', amount: 1800, date: '2024-08-05', category: 'Marketing', paymentMethod: 'check', isCorporation: false },
          { vendor: 'Williams Legal Services', amount: 15000, date: '2024-01-30', category: 'Legal', paymentMethod: 'wire', isCorporation: false },
          { vendor: 'MegaCorp Inc', amount: 22000, date: '2024-06-15', category: 'Software', paymentMethod: 'check', isCorporation: true },
        ], null, 2)

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a tax compliance expert. Analyze these ${taxYear} payment transactions and identify which vendors require a 1099 form.

Rules:
- Must have paid ≥ $600 total to the vendor during the tax year
- Exclude corporations (Inc, Corp, LLC that are S-corps, etc.) UNLESS they provide legal or medical services
- Exclude credit card payments (the card company handles those)
- Exclude rent paid to real estate agents/property managers (they get 1099-MISC)
- 1099-NEC: contractors, freelancers, service providers, attorneys
- 1099-MISC: rent, royalties, prizes, other income

Transactions:
${txSummary}

Return ONLY valid JSON, no markdown, no explanation. Format:
{
  "recipients": [
    {
      "vendor": "string",
      "totalAmount": number,
      "formType": "1099-NEC" | "1099-MISC",
      "reason": "string",
      "requiresReview": boolean
    }
  ],
  "excluded": [
    { "vendor": "string", "reason": "string" }
  ],
  "summary": "string"
}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let parsed
    try {
      parsed = JSON.parse(content.text)
    } catch {
      // Try to extract JSON from the response
      const match = content.text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('Could not parse Claude response as JSON')
      }
    }

    return NextResponse.json({ success: true, data: parsed, taxYear })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
