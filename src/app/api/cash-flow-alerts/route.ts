import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob } from '@/types'

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

function analyzeJobsForAlerts(jobs: CategorizationJob[], clientName: string): CashFlowAlert[] {
  const alerts: CashFlowAlert[] = []

  if (jobs.length === 0) return alerts

  // Sort by date
  const sorted = [...jobs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const latest = sorted[sorted.length - 1]

  const latestDebits = latest.transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const latestCredits = latest.transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const netCashFlow = latestCredits - latestDebits

  // Alert: negative cash flow
  if (netCashFlow < 0) {
    alerts.push({
      id: `cf-negative-${latest.id}`,
      severity: Math.abs(netCashFlow) > latestCredits * 0.3 ? 'critical' : 'warning',
      type: 'burn_rate',
      title: 'Expenses exceeded income',
      description: `${clientName} spent $${Math.abs(netCashFlow).toLocaleString('en-US', { maximumFractionDigits: 0 })} more than they earned this period.`,
      amount: Math.abs(netCashFlow),
      recommendation: 'Review discretionary expenses and identify any one-time costs that inflated the deficit.',
      clientName,
    })
  }

  // Alert: large single transaction
  const largeTx = latest.transactions.filter(t => t.type === 'debit' && t.amount > latestDebits * 0.25 && t.amount > 5000)
  if (largeTx.length > 0) {
    const largest = largeTx.sort((a, b) => b.amount - a.amount)[0]
    alerts.push({
      id: `cf-large-${largest.id}`,
      severity: largest.amount > 50000 ? 'critical' : 'warning',
      type: 'large_expense',
      title: 'Large single expense detected',
      description: `"${largest.description}" — $${largest.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} represents ${Math.round((largest.amount / latestDebits) * 100)}% of total expenses.`,
      amount: largest.amount,
      recommendation: 'Verify this is a legitimate business expense and document the business purpose.',
      clientName,
    })
  }

  // Alert: MoM revenue drop > 20%
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2]
    const prevCredits = prev.transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    if (prevCredits > 0 && latestCredits < prevCredits * 0.8) {
      const drop = Math.round(((prevCredits - latestCredits) / prevCredits) * 100)
      alerts.push({
        id: `cf-rev-drop-${latest.id}`,
        severity: drop > 40 ? 'critical' : 'warning',
        type: 'revenue_drop',
        title: `Revenue dropped ${drop}%`,
        description: `Income fell from $${prevCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })} to $${latestCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })} — a $${(prevCredits - latestCredits).toLocaleString('en-US', { maximumFractionDigits: 0 })} decline.`,
        amount: prevCredits - latestCredits,
        recommendation: 'Identify if this is seasonal, a lost client, or delayed invoicing. Follow up on outstanding receivables.',
        clientName,
      })
    }

    // Alert: expenses trending up > 20% MoM
    const prevDebits = prev.transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
    if (prevDebits > 0 && latestDebits > prevDebits * 1.2) {
      const increase = Math.round(((latestDebits - prevDebits) / prevDebits) * 100)
      alerts.push({
        id: `cf-exp-up-${latest.id}`,
        severity: increase > 50 ? 'critical' : 'info',
        type: 'trend',
        title: `Expenses up ${increase}% vs last period`,
        description: `Total expenses increased from $${prevDebits.toLocaleString('en-US', { maximumFractionDigits: 0 })} to $${latestDebits.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`,
        amount: latestDebits - prevDebits,
        recommendation: 'Review new recurring expenses or one-time purchases driving the increase.',
        clientName,
      })
    }
  }

  // Alert: low cash runway (if expenses > 2x income)
  if (latestCredits > 0 && latestDebits > latestCredits * 2) {
    const runwayMonths = Math.round(latestCredits / (latestDebits - latestCredits) * 10) / 10
    alerts.push({
      id: `cf-runway-${latest.id}`,
      severity: 'critical',
      type: 'cash_runway',
      title: `Cash runway concern`,
      description: `At current burn rate, ${clientName} has approximately ${runwayMonths} month(s) of runway if income stays flat.`,
      recommendation: 'Discuss with client: revenue growth strategy, expense reduction, or line of credit options.',
      clientName,
    })
  }

  return alerts
}

export async function POST(request: NextRequest) {
  let body: { jobs: CategorizationJob[]; clientName: string; useAI?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { jobs, clientName, useAI = true } = body

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({ alerts: [] })
  }

  // Always run rule-based analysis
  const ruleAlerts = analyzeJobsForAlerts(jobs, clientName)

  // Optionally enhance with AI
  if (!useAI || !process.env.ANTHROPIC_API_KEY || ruleAlerts.length === 0) {
    return NextResponse.json({ alerts: ruleAlerts })
  }

  try {
    const client = new Anthropic()
    const summary = ruleAlerts.map(a => `- ${a.severity.toUpperCase()}: ${a.title} — ${a.description}`).join('\n')

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a CPA reviewing cash flow alerts for ${clientName}. For each alert, provide a single specific, actionable recommendation (max 20 words). Return JSON array: [{"id": "...", "recommendation": "..."}]\n\nAlerts:\n${summary}`,
      }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
    const start = stripped.indexOf('[')
    const end = stripped.lastIndexOf(']')

    if (start !== -1 && end > start) {
      const recommendations: { id: string; recommendation: string }[] = JSON.parse(stripped.slice(start, end + 1))
      const recMap = new Map(recommendations.map(r => [r.id, r.recommendation]))
      const enhanced = ruleAlerts.map(a => recMap.has(a.id) ? { ...a, recommendation: recMap.get(a.id)! } : a)
      return NextResponse.json({ alerts: enhanced })
    }
  } catch { /* fall through to rule-based */ }

  return NextResponse.json({ alerts: ruleAlerts })
}
