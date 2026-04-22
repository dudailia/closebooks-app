import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob, Client } from '@/types'
import { buildClientAdvisoryReport, type AdvisoryAlert } from '@/lib/advisoryEngine'

export interface CashFlowAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: 'burn_rate' | 'revenue_drop' | 'large_expense' | 'irregular_payment' | 'cash_runway' | 'trend'
  title: string
  description: string
  amount?: number
  recommendation: string
  clientName: string
}

function toCashFlowAlert(clientName: string, alert: AdvisoryAlert): CashFlowAlert {
  const typeMap: Record<AdvisoryAlert['type'], CashFlowAlert['type']> = {
    cash_flow: 'burn_rate',
    revenue_drop: 'revenue_drop',
    expense_spike: 'large_expense',
    uncategorized: 'irregular_payment',
    runway: 'cash_runway',
    health: 'trend',
    growth: 'trend',
  }

  return {
    id: alert.id,
    severity: alert.severity,
    type: typeMap[alert.type],
    title: alert.title,
    description: alert.description,
    recommendation: alert.recommendation,
    clientName,
  }
}

export async function POST(request: NextRequest) {
  let body: { jobs: CategorizationJob[]; clientName: string; client?: Client | null; useAI?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { jobs, clientName, useAI = true } = body

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({ alerts: [] })
  }

  const latestJob = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const fallbackClient: Client = body.client ?? {
    id: latestJob.id,
    business_name: clientName || latestJob.client_name,
    industry: 'Other',
    contact_email: '',
    accounting_software: 'Other',
    created_at: latestJob.created_at,
  }
  const report = buildClientAdvisoryReport(fallbackClient, jobs)
  const baseAlerts = report.alerts.map((alert) => toCashFlowAlert(clientName, alert))

  if (!useAI || !process.env.ANTHROPIC_API_KEY || baseAlerts.length === 0) {
    return NextResponse.json({ alerts: baseAlerts })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const summary = baseAlerts
      .map((alert) => `- ${alert.severity.toUpperCase()}: ${alert.title} — ${alert.description}`)
      .join('\n')

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a CPA reviewing proactive alerts for ${clientName}. For each alert, rewrite the recommendation to be highly specific and practical in under 20 words. Return JSON array: [{"id":"...","recommendation":"..."}]\n\nAlerts:\n${summary}`,
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    const start = stripped.indexOf('[')
    const end = stripped.lastIndexOf(']')

    if (start !== -1 && end > start) {
      const recommendations: { id: string; recommendation: string }[] = JSON.parse(stripped.slice(start, end + 1))
      const recMap = new Map(recommendations.map((entry) => [entry.id, entry.recommendation]))
      return NextResponse.json({
        alerts: baseAlerts.map((alert) => (
          recMap.has(alert.id)
            ? { ...alert, recommendation: recMap.get(alert.id)! }
            : alert
        )),
      })
    }
  } catch {
    // Fall back to rule-based alerts.
  }

  return NextResponse.json({ alerts: baseAlerts })
}
