import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob } from '@/types'
import type { FirmSettings } from '@/lib/firmSettings'

const anthropic = new Anthropic()

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildJobSummaryText(job: CategorizationJob, prev: CategorizationJob | null): string {
  const approved  = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length
  const flagged   = job.transactions.filter((t) => t.status === 'flagged').length
  const pending   = job.transactions.filter((t) => t.status === 'pending').length
  const totalDeb  = job.transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const totalCred = job.transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)

  // Category breakdown
  const catMap = new Map<string, number>()
  for (const tx of job.transactions.filter((t) => t.type === 'debit')) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + tx.amount)
  }
  const topCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Flagged items (for client input)
  const flaggedItems = job.transactions
    .filter((t) => t.status === 'flagged')
    .slice(0, 3)
    .map((t) => `  • ${t.description} — $${fmt(t.amount)} (${t.date})`)

  // MoM comparison
  let momNote = ''
  if (prev) {
    const prevDeb = prev.transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
    if (prevDeb > 0) {
      const changePct = Math.round(((totalDeb - prevDeb) / prevDeb) * 100)
      momNote = changePct > 5
        ? `Expenses are up ${changePct}% vs last period ($${fmt(prevDeb)}).`
        : changePct < -5
        ? `Expenses are down ${Math.abs(changePct)}% vs last period ($${fmt(prevDeb)}) — nice improvement.`
        : `Expenses are consistent with last period ($${fmt(prevDeb)}).`
    }
  }

  return `Client: ${job.client_name}
Period covered: ${job.created_at.slice(0, 10)}
Transactions reviewed: ${approved} approved, ${flagged} flagged, ${pending} still pending
Total expenses: $${fmt(totalDeb)}
Total income: $${fmt(totalCred)}
Net: ${totalCred >= totalDeb ? '+' : ''}$${fmt(totalCred - totalDeb)}

Top expense categories:
${topCats.map(([cat, amt]) => `  • ${cat}: $${fmt(amt)}`).join('\n')}

${flaggedItems.length > 0 ? `Items needing client clarification:\n${flaggedItems.join('\n')}` : 'No items require client input.'}

${momNote}`
}

export async function POST(request: Request) {
  let body: {
    job: CategorizationJob
    previousJob?: CategorizationJob | null
    firmSettings?: FirmSettings
    tone?: 'professional' | 'friendly' | 'brief'
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { job, previousJob = null, firmSettings, tone = 'friendly' } = body
  if (!job) return NextResponse.json({ error: 'Missing job.' }, { status: 400 })

  const firm = firmSettings ?? { firmName: 'Your Accountant', firmTagline: '', accentColor: '#2d5a27', preparedBy: '' }
  const senderName = firm.preparedBy || firm.firmName || 'Your Accounting Firm'
  const jobSummary = buildJobSummaryText(job, previousJob ?? null)

  const toneGuide = {
    professional: 'Professional, clear, formal. Use proper paragraphs. No emoji. Precise with numbers.',
    friendly:     'Warm and conversational but professional. One or two casual sentences. No jargon. Use "you" language.',
    brief:        'Ultra concise. 3-5 sentences total. Just the most important facts. Direct and clear.',
  }[tone]

  const prompt = `You are a CPA assistant drafting a client-facing month-end summary email.

Tone: ${toneGuide}

Rules:
- DO NOT start with "I hope this email finds you well" or similar filler
- DO NOT use accounting jargon (say "expenses" not "debits", "income" not "credits")
- If there are flagged items, describe them in plain English as "one thing to check on"
- Keep under 200 words
- End with an offer to answer questions and the sender's name
- If all clean with no flags, say so positively

${jobSummary}

Sender name: ${senderName}

Return a JSON object with these exact fields:
{
  "subject": "email subject line (max 70 chars)",
  "body": "the full email body as plain text"
}`

  let subject = `Your ${new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} financial summary is ready — ${job.client_name}`
  let body_text = `Hi,\n\nYour books for ${job.created_at.slice(0, 7)} have been reviewed. ${job.approved} transactions are approved. Please reply if you have any questions.\n\n${senderName}`

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.find((c) => c.type === 'text')?.text ?? ''

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.subject) subject   = parsed.subject
      if (parsed.body)    body_text = parsed.body
    }
  } catch {
    // use fallback
  }

  // Build HTML version with firm branding
  const accent  = firm.accentColor || '#2d5a27'
  const bodyHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e0dbd4">
    <div style="background:${accent};padding:16px 24px">
      <p style="color:#ffffff;font-size:13pt;font-weight:bold;margin:0">${firm.firmName || 'CloseBooks'}</p>
    </div>
    <div style="padding:28px 24px">
      ${body_text.split('\n\n').map((p) => `<p style="margin:0 0 14px;font-size:10pt;color:#1a1714;line-height:1.6">${p.replace(/\n/g, '<br/>')}</p>`).join('')}
    </div>
    <div style="background:#faf8f4;padding:14px 24px;border-top:1px solid #e0dbd4">
      <p style="margin:0;font-size:8.5pt;color:#a09a94">This email was prepared by ${firm.firmName || 'your accounting firm'}. Please do not reply to this email directly.</p>
    </div>
  </div>
</body>
</html>`

  return NextResponse.json({ subject, bodyText: body_text, bodyHtml })
}
