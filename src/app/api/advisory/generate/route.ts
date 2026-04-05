import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob, Transaction } from '@/types'
import type { AdvisoryMemo, AdvisorySection } from '@/types/advisory'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function buildContext(
  job: CategorizationJob,
  previousJobs?: CategorizationJob[],
): string {
  const debits = job.transactions.filter((t) => t.type === 'debit')
  const credits = job.transactions.filter((t) => t.type === 'credit')

  const totalDebits = debits.reduce((s, t) => s + t.amount, 0)
  const totalCredits = credits.reduce((s, t) => s + t.amount, 0)

  // Top 5 expense categories by amount
  const categoryMap: Record<string, number> = {}
  for (const t of debits) {
    const cat = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amt]) => `${name}: $${amt.toFixed(2)}`)

  const flaggedCount = job.transactions.filter((t) => t.status === 'flagged').length

  // MoM comparison
  let momNote = ''
  if (previousJobs && previousJobs.length > 0) {
    const prev = previousJobs[previousJobs.length - 1]
    const prevDebits = prev.transactions
      .filter((t) => t.type === 'debit')
      .reduce((s, t) => s + t.amount, 0)
    if (prevDebits > 0) {
      const pct = ((totalDebits - prevDebits) / prevDebits) * 100
      momNote = `Month-over-month expense change: ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% (prev: $${prevDebits.toFixed(2)}, current: $${totalDebits.toFixed(2)})`
    }
  }

  // Cash trend
  const cashBalance = totalCredits - totalDebits
  const cashTrend =
    cashBalance > 0 ? 'improving (net positive)' : cashBalance < 0 ? 'declining (net negative)' : 'stable'

  return [
    `Client: ${job.client_name}`,
    `Period: ${job.created_at.slice(0, 10)}`,
    `Total transactions: ${job.total_transactions}`,
    `Total debits (expenses): $${totalDebits.toFixed(2)}`,
    `Total credits (income): $${totalCredits.toFixed(2)}`,
    `Net cash position: $${cashBalance.toFixed(2)}`,
    `Cash trend: ${cashTrend}`,
    `Flagged transactions: ${flaggedCount}`,
    `Top expense categories:\n${topCategories.map((c) => `  - ${c}`).join('\n')}`,
    momNote ? momNote : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildPrompt(
  context: string,
  tone: string,
  focusAreas: string[],
): string {
  const toneGuide =
    tone === 'executive'
      ? 'Be concise, data-first, no fluff. Bullet-point style where useful. Lead with the numbers.'
      : tone === 'detailed'
        ? 'Be comprehensive and explain everything thoroughly. Include methodology, context, and caveats.'
        : 'Be warm and use plain English. Avoid jargon. Write as if talking to a small business owner.'

  const focusNote =
    focusAreas.length > 0
      ? `Focus especially on: ${focusAreas.join(', ')}.`
      : ''

  return `You are an expert CPA advisory assistant. Analyze the following financial data and write a client advisory memo.

${context}

Tone guidance: ${toneGuide}
${focusNote}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "headline": "one-line executive summary of the financial situation",
  "sections": [
    {
      "type": "cashflow|expense|anomaly|recommendation|forecast",
      "title": "Section Title",
      "body": "2-3 sentences of analysis",
      "urgency": "high|medium|low",
      "dataPoints": ["specific metric or number", "another data point"]
    }
  ]
}

Generate 3-5 sections. Always include:
1. One cashflow or headline insight section
2. One recommendation section with actionable advice
3. One forecast or forward-looking section

Use only the data provided. Be specific with numbers.`
}

// ─── Fallback memo (no AI) ────────────────────────────────────────────────────

function buildFallbackMemo(
  job: CategorizationJob,
  tone: AdvisoryMemo['tone'],
): AdvisoryMemo {
  const debits = job.transactions.filter((t) => t.type === 'debit')
  const credits = job.transactions.filter((t) => t.type === 'credit')
  const totalDebits = debits.reduce((s, t) => s + t.amount, 0)
  const totalCredits = credits.reduce((s, t) => s + t.amount, 0)
  const net = totalCredits - totalDebits
  const flagged = job.transactions.filter((t) => t.status === 'flagged').length

  const categoryMap: Record<string, number> = {}
  for (const t of debits) {
    const cat = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount
  }
  const topCat = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]

  const sections: AdvisorySection[] = [
    {
      type: 'cashflow',
      title: 'Cash Flow Overview',
      body: `Total income of $${totalCredits.toFixed(2)} against expenses of $${totalDebits.toFixed(2)} resulted in a net ${net >= 0 ? 'surplus' : 'deficit'} of $${Math.abs(net).toFixed(2)}. ${net < 0 ? 'Expenses exceeded income this period.' : 'Income exceeded expenses this period.'}`,
      urgency: net < 0 ? 'high' : 'low',
      dataPoints: [
        `Income: $${totalCredits.toFixed(2)}`,
        `Expenses: $${totalDebits.toFixed(2)}`,
        `Net: $${net.toFixed(2)}`,
      ],
    },
    {
      type: 'expense',
      title: 'Top Expense Category',
      body: topCat
        ? `The largest expense category is ${topCat[0]} at $${topCat[1].toFixed(2)}. Review these transactions for any unusual or one-time items.`
        : 'No expense data available for this period.',
      urgency: 'medium',
      dataPoints: topCat ? [`${topCat[0]}: $${topCat[1].toFixed(2)}`] : [],
    },
    ...(flagged > 0
      ? [
          {
            type: 'anomaly' as const,
            title: 'Flagged Transactions',
            body: `${flagged} transaction${flagged !== 1 ? 's' : ''} were flagged for review. Please inspect these items before finalizing the close.`,
            urgency: 'high' as const,
            dataPoints: [`${flagged} flagged items`],
          },
        ]
      : []),
    {
      type: 'recommendation',
      title: 'Recommended Actions',
      body: `Review all flagged transactions and confirm categorizations. ${net < 0 ? 'Focus on reducing discretionary expenses to improve cash position.' : 'Consider allocating surplus to business savings or debt reduction.'}`,
      urgency: net < 0 ? 'high' : 'medium',
      dataPoints: [],
    },
    {
      type: 'forecast',
      title: 'Looking Ahead',
      body: `Based on this period, ensure upcoming obligations are accounted for. ${net < 0 ? 'Cash flow pressure may continue if the expense trend holds.' : 'Maintain current income levels to sustain the positive trend.'}`,
      urgency: 'low',
      dataPoints: [],
    },
  ]

  return {
    id: uuid(),
    jobId: job.id,
    clientName: job.client_name,
    generatedAt: new Date().toISOString(),
    status: 'draft',
    tone,
    headline: `${job.client_name} closed ${net >= 0 ? 'with a net surplus' : 'with a net deficit'} of $${Math.abs(net).toFixed(2)} — ${flagged} item${flagged !== 1 ? 's' : ''} flagged for review.`,
    sections,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    job: CategorizationJob
    previousJobs?: CategorizationJob[]
    firmSettings?: unknown
    tone?: AdvisoryMemo['tone']
    focusAreas?: string[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { job, previousJobs, tone = 'executive', focusAreas = [] } = body

  if (!job || !job.id) {
    return NextResponse.json({ error: 'job is required' }, { status: 400 })
  }

  // If no API key, return fallback immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    const memo = buildFallbackMemo(job, tone)
    return NextResponse.json({ memo })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const context = buildContext(job, previousJobs)
    const prompt = buildPrompt(context, tone, focusAreas)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed = JSON.parse(jsonMatch[0]) as {
      headline: string
      sections: AdvisorySection[]
    }

    const memo: AdvisoryMemo = {
      id: uuid(),
      jobId: job.id,
      clientName: job.client_name,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      tone,
      headline: parsed.headline ?? 'Advisory memo generated.',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    }

    return NextResponse.json({ memo })
  } catch (err) {
    console.error('[advisory/generate] AI error, using fallback:', err)
    const memo = buildFallbackMemo(job, tone)
    return NextResponse.json({ memo })
  }
}
