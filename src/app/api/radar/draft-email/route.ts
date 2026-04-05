import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DraftEmailRequest {
  clientName: string
  issue: string
  metrics: {
    cashBalance?: number
    monthlyBurn?: number
    arDays?: number
    runwayDays?: number
    status?: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/radar/draft-email
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  let body: DraftEmailRequest
  try {
    body = (await request.json()) as DraftEmailRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { clientName, issue, metrics } = body

  if (!clientName) {
    return NextResponse.json({ error: 'clientName is required.' }, { status: 400 })
  }

  const metricsText = [
    metrics.cashBalance !== undefined && `Cash Balance: ${formatCurrency(metrics.cashBalance)}`,
    metrics.monthlyBurn !== undefined && `Monthly Burn: ${formatCurrency(metrics.monthlyBurn)}`,
    metrics.runwayDays !== undefined && `Cash Runway: ${metrics.runwayDays} days`,
    metrics.arDays !== undefined && `AR Days Outstanding: ${metrics.arDays} days`,
    metrics.status !== undefined && `Overall Status: ${metrics.status.toUpperCase()}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are a professional CPA at an accounting firm. Write a personalized, empathetic client alert email.

Client Name: ${clientName}
Issue Summary: ${issue}

Financial Metrics:
${metricsText}

Instructions:
- Tone: professional, caring, and solution-oriented (not alarmist)
- Length: 150-250 words
- Include specific metric values from above
- Suggest 2-3 concrete next steps
- Sign off as "Your CloseBooks CPA Team"
- Subject line: concise, 8-12 words, include urgency level

Return ONLY valid JSON:
{
  "subject": "Email subject line here",
  "body": "Full email body here with \\n for line breaks"
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(extractJson(rawText)) as {
      subject: string
      body: string
    }

    return NextResponse.json({ subject: parsed.subject, body: parsed.body })
  } catch (err) {
    console.error('[radar/draft-email] Claude error:', err)

    // Fallback template
    const runway = metrics.runwayDays ?? 0
    const isUrgent = metrics.status === 'red'

    const subject = isUrgent
      ? `[Action Required] ${clientName} — Urgent Financial Review Needed`
      : `[Heads Up] ${clientName} — Financial Health Update`

    const body = `Hi ${clientName} Team,

I hope this message finds you well. Our Financial Radar flagged some items that I wanted to bring to your attention promptly.

${issue}

Current Financial Snapshot:
${metricsText}

${
  isUrgent
    ? `With only ${runway} days of cash runway, we recommend scheduling a call this week to discuss immediate steps to stabilize your cash position.`
    : `While your business is operating, taking proactive steps now will help ensure continued financial health.`
}

Recommended Next Steps:
1. Review outstanding invoices and accelerate collections
2. Identify any discretionary expenses that can be deferred
3. Schedule a 30-minute review call with our team

Please don't hesitate to reach out — we're here to help.

Best regards,
Your CloseBooks CPA Team`

    return NextResponse.json({ subject, body })
  }
}
