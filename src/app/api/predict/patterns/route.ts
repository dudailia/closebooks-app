import { NextResponse } from 'next/server'
import type { Transaction } from '@/types'

// ─── Pattern detection from real transactions ─────────────────────────────────

interface TransactionPattern {
  id: string
  vendor: string
  amountRange: [number, number]
  avgAmount: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'monthly_1st' | 'monthly_net30' | 'quarterly' | 'irregular'
  category: string
  reliability: number
  monthsData: number
  active: boolean
  lastSeen: string
  occurrences: number
}

function vendorKey(description: string): string {
  // Strip trailing numbers, IDs, dates to normalize vendor names
  return description
    .replace(/\s*#?\d{4,}\s*$/, '')
    .replace(/\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/, '')
    .replace(/\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}-\d{1,2}/i, '')
    .trim()
    .toLowerCase()
    .slice(0, 40)
}

function detectFrequency(dates: string[]): TransactionPattern['frequency'] {
  if (dates.length < 2) return 'irregular'
  const sorted = [...dates].sort()
  const diffs: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    diffs.push((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000)
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const variance = diffs.reduce((s, d) => s + Math.pow(d - avg, 2), 0) / diffs.length

  if (avg >= 6 && avg <= 8 && variance < 4) return 'weekly'
  if (avg >= 12 && avg <= 16 && variance < 9) return 'biweekly'
  if (avg >= 28 && avg <= 32) {
    // Check if typically on the 1st
    const days = sorted.map(d => new Date(d).getDate())
    const avg1 = days.reduce((a, b) => a + b, 0) / days.length
    if (avg1 < 5) return 'monthly_1st'
    if (avg1 > 25) return 'monthly_net30'
    return 'monthly'
  }
  if (avg >= 85 && avg <= 95) return 'quarterly'
  return 'irregular'
}

function detectPatternsFromTransactions(transactions: Transaction[]): TransactionPattern[] {
  const debits = transactions.filter(t => t.type === 'debit')
  
  // Group by vendor key
  const groups = new Map<string, { amounts: number[]; dates: string[]; categories: string[] }>()
  
  for (const tx of debits) {
    const key = vendorKey(tx.description)
    if (!key || key.length < 3) continue
    const existing = groups.get(key) ?? { amounts: [], dates: [], categories: [] }
    existing.amounts.push(Math.abs(tx.amount))
    existing.dates.push(tx.date)
    existing.categories.push(tx.final_category ?? tx.suggested_category ?? '')
    groups.set(key, existing)
  }

  const patterns: TransactionPattern[] = []

  for (const [key, data] of Array.from(groups.entries())) {
    if (data.amounts.length < 2) continue // Need at least 2 occurrences to be a pattern

    const minAmt = Math.min(...data.amounts)
    const maxAmt = Math.max(...data.amounts)
    const avgAmt = data.amounts.reduce((a: number, b: number) => a + b, 0) / data.amounts.length
    const frequency = detectFrequency(data.dates)

    // Reliability: low variance in amount = high reliability
    const variance = data.amounts.reduce((s: number, a: number) => s + Math.pow(a - avgAmt, 2), 0) / data.amounts.length
    const cv = avgAmt > 0 ? Math.sqrt(variance) / avgAmt : 1 // Coefficient of variation
    const reliability = Math.max(50, Math.min(100, Math.round((1 - cv) * 100)))

    // Most common category
    const catCounts: Record<string, number> = {}
    data.categories.forEach((c: string) => { if (c) catCounts[c] = (catCounts[c] ?? 0) + 1 })
    const category = Object.entries(catCounts).sort(([, av]: [string, number], [, bv]: [string, number]) => bv - av)[0]?.[0] ?? 'General Expense'

    // Estimate months of data
    const dates = data.dates.sort()
    const spanDays = (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / 86400000
    const monthsData = Math.max(1, Math.round(spanDays / 30))

    // Capitalize vendor name for display
    const displayName = key.replace(/\b\w/g, c => c.toUpperCase())

    patterns.push({
      id: `p_${Buffer.from(key).toString('base64').slice(0, 8)}`,
      vendor: displayName,
      amountRange: [Math.round(minAmt * 100) / 100, Math.round(maxAmt * 100) / 100],
      avgAmount: Math.round(avgAmt * 100) / 100,
      frequency,
      category,
      reliability,
      monthsData,
      active: true,
      lastSeen: dates[dates.length - 1],
      occurrences: data.amounts.length,
    })
  }

  // Sort by reliability desc, then by occurrences
  return patterns
    .sort((a, b) => b.reliability - a.reliability || b.occurrences - a.occurrences)
    .slice(0, 20)
}

// ─── GET /api/predict/patterns ────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  // Accept transactions payload as a query param JSON or from body
  let transactions: Transaction[] = []
  const txParam = searchParams.get('transactions')
  if (txParam) {
    try { transactions = JSON.parse(decodeURIComponent(txParam)) } catch { /* ignore */ }
  }

  const patterns = transactions.length > 0
    ? detectPatternsFromTransactions(transactions)
    : []

  return NextResponse.json({
    clientId,
    patterns,
    generatedAt: new Date().toISOString(),
    fromRealData: transactions.length > 0,
  })
}

// ─── POST /api/predict/patterns — accept transactions in body ─────────────────

export async function POST(request: Request) {
  let body: { clientId?: string; transactions?: Transaction[] }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { clientId, transactions = [] } = body
  const patterns = detectPatternsFromTransactions(transactions)

  return NextResponse.json({
    clientId,
    patterns,
    generatedAt: new Date().toISOString(),
    fromRealData: transactions.length > 0,
  })
}

// ─── PUT /api/predict/patterns — toggle a pattern ────────────────────────────

export async function PUT(request: Request) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  return NextResponse.json({ success: true, updated: body })
}
