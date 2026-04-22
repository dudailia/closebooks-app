import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob, Client } from '@/types'
import type { AdvisoryMemo, AdvisorySection } from '@/types/advisory'
import {
  advisoryTemplateLabel,
  buildAdvisoryPromptContext,
  buildClientAdvisoryReport,
  type AdvisoryTemplate,
} from '@/lib/advisoryEngine'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') + Date.now().toString(36)
}

function buildContext(
  job: CategorizationJob,
  client: Client | null,
  previousJobs?: CategorizationJob[],
): string {
  const fallbackClient: Client = client ?? {
    id: job.id,
    business_name: job.client_name,
    industry: 'Other',
    contact_email: '',
    accounting_software: 'Other',
    created_at: job.created_at,
  }
  const report = buildClientAdvisoryReport(fallbackClient, [job, ...(previousJobs ?? [])])
  return buildAdvisoryPromptContext(report)
}

function buildPrompt(
  context: string,
  tone: string,
  focusAreas: string[],
  template: AdvisoryTemplate,
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

  const templateGuide: Record<AdvisoryTemplate, string> = {
    quarterly_review: 'Write for a quarterly business review meeting. Emphasize performance trends, benchmark comparisons, and owner actions for the next quarter.',
    cash_flow_advisory: 'Write for a cash-flow advisory conversation. Emphasize runway, working capital, recurring collections, and near-term cash protections.',
    tax_planning: 'Write for proactive tax planning. Emphasize profit trajectory, owner compensation, deduction timing, entity-level considerations, and estimated tax preparation.',
    annual_planning: 'Write for an annual planning session. Emphasize next-year targets, margin planning, hiring or spend capacity, and risks to the plan.',
  }

  return `You are an expert CPA advisory assistant. Analyze the following financial data and write a client advisory memo.

${context}

Tone guidance: ${toneGuide}
Template guidance: ${templateGuide[template]}
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

Use only the data provided. Be specific with numbers. Mention assumptions when giving forward-looking advice.`
}

// ─── Fallback memo (no AI) ────────────────────────────────────────────────────

function buildFallbackMemo(
  job: CategorizationJob,
  tone: AdvisoryMemo['tone'],
  template: AdvisoryTemplate,
  client: Client | null,
  previousJobs: CategorizationJob[],
): AdvisoryMemo {
  const fallbackClient: Client = client ?? {
    id: job.id,
    business_name: job.client_name,
    industry: 'Other',
    contact_email: '',
    accounting_software: 'Other',
    created_at: job.created_at,
  }
  const report = buildClientAdvisoryReport(fallbackClient, [job, ...previousJobs])
  const net = report.latestMonth?.netCashFlow ?? 0
  const topBenchmark = report.benchmarkResults[0]

  const sections: AdvisorySection[] = [
    {
      type: 'cashflow',
      title: 'Cash Flow Overview',
      body: `Expected cash for the next 90 days is $${report.forecast90.toLocaleString()} versus a current cash estimate of $${report.currentCash.toLocaleString()}. The latest close produced a ${net >= 0 ? 'surplus' : 'deficit'} of $${Math.abs(net).toLocaleString()}.`,
      urgency: net < 0 ? 'high' : 'low',
      dataPoints: [
        `Current cash: $${report.currentCash.toLocaleString()}`,
        `30-day forecast: $${report.forecast30.toLocaleString()}`,
        `90-day forecast: $${report.forecast90.toLocaleString()}`,
      ],
    },
    {
      type: 'benchmark',
      title: 'Performance Benchmark',
      body: topBenchmark
        ? `${topBenchmark.label} is running at ${topBenchmark.clientPct}% for this client versus a ${topBenchmark.median}% industry median. ${topBenchmark.insight}`
        : 'Benchmark comparisons will populate once enough categorized history is available.',
      urgency: 'medium',
      dataPoints: topBenchmark ? [`Median: ${topBenchmark.median}%`, `Client: ${topBenchmark.clientPct}%`] : [],
    },
    ...(report.alerts.length > 0
      ? [{
          type: 'anomaly' as const,
          title: report.alerts[0].title,
          body: report.alerts[0].description,
          urgency: report.alerts[0].severity === 'critical' ? 'high' as const : report.alerts[0].severity === 'warning' ? 'medium' as const : 'low' as const,
          dataPoints: report.health.drivers.slice(0, 2),
        }]
      : []),
    {
      type: 'recommendation',
      title: 'Recommended Actions',
      body: report.alerts[0]?.recommendation ?? `Use this ${advisoryTemplateLabel(template).toLowerCase()} to align the client on cash, margin, and the next owner decision.`,
      urgency: net < 0 || report.health.churnRisk === 'high' ? 'high' : 'medium',
      dataPoints: report.health.drivers,
    },
    {
      type: 'forecast',
      title: 'Looking Ahead',
      body: `The forecast assumes monthly revenue near $${Math.round(report.forecastModel.baseRevenue).toLocaleString()} and monthly expenses near $${Math.round(report.forecastModel.baseExpenses).toLocaleString()}. Minimum target cash is $${report.minimumBalance.toLocaleString()}, with current runway ${report.kpis.runwayMonths !== null ? `${report.kpis.runwayMonths} month(s)` : 'not constrained by burn'}.`,
      urgency: 'low',
      dataPoints: report.assumptions.slice(0, 2),
    },
  ]

  return {
    id: uuid(),
    jobId: job.id,
    clientName: job.client_name,
    clientIndustry: fallbackClient.industry,
    generatedAt: new Date().toISOString(),
    status: 'draft',
    tone,
    template,
    headline: `${job.client_name} ${net >= 0 ? 'is building cash' : 'needs cash attention'} with a projected 90-day balance of $${report.forecast90.toLocaleString()} and a health score of ${report.health.score}/100.`,
    sections,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    job: CategorizationJob
    previousJobs?: CategorizationJob[]
    client?: Client | null
    firmSettings?: unknown
    tone?: AdvisoryMemo['tone']
    focusAreas?: string[]
    template?: AdvisoryTemplate
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    job,
    previousJobs = [],
    client = null,
    tone = 'executive',
    focusAreas = [],
    template = 'quarterly_review',
  } = body

  if (!job || !job.id) {
    return NextResponse.json({ error: 'job is required' }, { status: 400 })
  }

  // If no API key, return fallback immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    const memo = buildFallbackMemo(job, tone, template, client, previousJobs)
    return NextResponse.json({ memo })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const context = buildContext(job, body.client ?? null, previousJobs)
    const prompt = buildPrompt(context, tone, focusAreas, template)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown fences first, then find the outermost JSON object.
    // Using index-based extraction avoids the greedy-regex issue with nested braces.
    const stripped = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) throw new Error('No JSON found in response')

    const parsed = JSON.parse(stripped.slice(start, end + 1)) as {
      headline: string
      sections: AdvisorySection[]
    }

    const memo: AdvisoryMemo = {
      id: uuid(),
      jobId: job.id,
      clientName: job.client_name,
      clientIndustry: body.client?.industry,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      tone,
      template,
      headline: parsed.headline ?? 'Advisory memo generated.',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    }

    return NextResponse.json({ memo })
  } catch (err) {
    console.error('[advisory/generate] AI error, using fallback:', err)
    const memo = buildFallbackMemo(job, tone, template, body.client ?? null, previousJobs)
    return NextResponse.json({ memo })
  }
}
