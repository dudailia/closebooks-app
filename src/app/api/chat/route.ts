import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction, ChatMessage } from '@/types'

const anthropic = new Anthropic()

interface JobSummary {
  clientName: string
  totalTx: number
  dateRange: { from: string; to: string } | null
  categories: { name: string; count: number; totalDebits: number; totalCredits: number }[]
  flaggedCount: number
  pendingCount: number
  approvedCount: number
}

function buildJobSummary(transactions: Transaction[], clientName: string): JobSummary {
  const catMap = new Map<string, { count: number; totalDebits: number; totalCredits: number }>()
  let dateMin = '', dateMax = ''

  for (const tx of transactions) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const e = catMap.get(cat) ?? { count: 0, totalDebits: 0, totalCredits: 0 }
    catMap.set(cat, {
      count:       e.count + 1,
      totalDebits: e.totalDebits + (tx.type === 'debit' ? tx.amount : 0),
      totalCredits: e.totalCredits + (tx.type === 'credit' ? tx.amount : 0),
    })
    if (!dateMin || tx.date < dateMin) dateMin = tx.date
    if (!dateMax || tx.date > dateMax) dateMax = tx.date
  }

  return {
    clientName,
    totalTx:      transactions.length,
    dateRange:    dateMin ? { from: dateMin, to: dateMax } : null,
    categories:   Array.from(catMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.totalDebits - a.totalDebits)
      .slice(0, 15),
    flaggedCount:  transactions.filter((t) => t.status === 'flagged').length,
    pendingCount:  transactions.filter((t) => t.status === 'pending').length,
    approvedCount: transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length,
  }
}

function buildSystemPrompt(summary: JobSummary): string {
  const catLines = summary.categories
    .map((c) => `  • ${c.name}: ${c.count} transactions, $${c.totalDebits.toFixed(0)} debits, $${c.totalCredits.toFixed(0)} credits`)
    .join('\n')

  return `You are CloseBooks Chat, an AI assistant for a CPA firm reviewing ${summary.clientName}'s financials.

JOB CONTEXT:
- Client: ${summary.clientName}
- Total transactions: ${summary.totalTx}
- Date range: ${summary.dateRange ? `${summary.dateRange.from} to ${summary.dateRange.to}` : 'unknown'}
- Approved: ${summary.approvedCount} | Flagged: ${summary.flaggedCount} | Pending: ${summary.pendingCount}

CATEGORY BREAKDOWN:
${catLines || '  (none)'}

TRANSACTION DATA:
You will be given up to 50 relevant transactions with each query.
Each transaction has: id, date, description, amount, type (debit/credit), status, suggested_category, confidence.

BEHAVIOR RULES:
- Answer questions concisely and factually. Never invent data.
- When your answer refers to specific transactions, append their IDs at the end in this exact format: [TX_IDS:id1,id2,id3]
  This allows the UI to highlight those rows for the CPA. Do this whenever referencing specific transactions.
- Use plain language. Translate accounting jargon.
- If asked to approve, flag, or change transactions say: "I can highlight them — click the [action] button to confirm."
- Keep responses under 150 words unless the user asks for detail.
- If you don't have enough data, say so honestly.`
}

export async function POST(request: Request) {
  let body: {
    message: string
    jobId: string
    clientName: string
    transactions: Transaction[]
    history: ChatMessage[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { message, clientName, transactions = [], history = [] } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  const summary = buildJobSummary(transactions, clientName || 'the client')

  // Find relevant transactions (keyword search against description + category)
  const lowerMsg = message.toLowerCase()
  const keywords = lowerMsg.split(/\s+/).filter((w) => w.length > 3)
  const relevant = transactions
    .filter((tx) => {
      const haystack = `${tx.description} ${tx.final_category ?? tx.suggested_category ?? ''} ${tx.status}`.toLowerCase()
      return keywords.some((k) => haystack.includes(k))
    })
    .slice(0, 50)

  // If no keyword match, send a sample of flagged/pending
  const txContext = relevant.length > 0
    ? relevant
    : transactions.filter((t) => t.status === 'flagged' || t.status === 'pending').slice(0, 30)

  const txBlock = txContext.length > 0
    ? '\n\nRELEVANT TRANSACTIONS:\n' + txContext.map((tx) =>
        `[${tx.id}] ${tx.date} | ${tx.description} | $${tx.amount.toFixed(2)} ${tx.type} | ${tx.final_category ?? tx.suggested_category ?? '?'} | ${tx.status} | conf:${(tx.confidence * 100).toFixed(0)}%`
      ).join('\n')
    : ''

  // Build conversation history for Claude (last 8 messages)
  const claudeHistory: { role: 'user' | 'assistant'; content: string }[] = history
    .slice(-8)
    .map((m) => ({
      role:    m.role,
      content: m.content,
    }))

  // Append the new user message with transaction context
  claudeHistory.push({
    role:    'user',
    content: message + txBlock,
  })

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      system:     buildSystemPrompt(summary),
      messages:   claudeHistory,
    })

    const text = msg.content.find((c) => c.type === 'text')?.text ?? ''

    // Extract transaction ID references
    const idMatch = text.match(/\[TX_IDS:([\w,\-]+)\]/)
    const highlightIds = idMatch ? idMatch[1].split(',').map((s) => s.trim()).filter(Boolean) : []
    const cleanText = text.replace(/\[TX_IDS:[\w,\-]+\]/, '').trim()

    return NextResponse.json({ text: cleanText, highlightIds })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Claude error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
