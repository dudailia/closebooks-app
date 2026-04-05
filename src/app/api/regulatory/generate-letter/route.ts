import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { RegulatoryAlert } from '@/types/compliance'

interface RequestBody {
  alert: RegulatoryAlert
  clientName: string
  firmName: string
  tone?: string
}

function replacePlaceholders(template: string, clientName: string, firmName: string, effectiveDate: string): string {
  return template
    .replace(/\[CLIENT_NAME\]/g, clientName)
    .replace(/\[FIRM_NAME\]/g, firmName)
    .replace(/\[EFFECTIVE_DATE\]/g, effectiveDate)
}

function letterToHtml(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Convert newlines within a paragraph to <br>
      const inner = p.replace(/\n/g, '<br/>')
      return `<p style="margin:0 0 14px 0;line-height:1.6;">${inner}</p>`
    })
    .join('')
  return `<div style="font-family:Georgia,serif;font-size:14px;color:#1a1714;max-width:620px;margin:0 auto;">${paragraphs}</div>`
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json()
  const { alert, clientName, firmName, tone } = body

  // Always start with the template with placeholders replaced
  const baseText = replacePlaceholders(
    alert.draftLetterTemplate,
    clientName,
    firmName,
    alert.effectiveDate
  )

  // Check if Anthropic API key is available
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  if (!hasApiKey) {
    // Fallback: return template with placeholders replaced, no AI personalization
    const subject = `Important Regulatory Update: ${alert.title}`
    return NextResponse.json({
      subject,
      bodyText: baseText,
      bodyHtml: letterToHtml(baseText),
    })
  }

  try {
    const anthropic = new Anthropic()

    const toneInstruction = tone
      ? `Use a ${tone} tone.`
      : 'Use a warm but professional tone — approachable, not overly formal.'

    const prompt = `You are a CPA firm advisor helping to personalize a regulatory advisory letter for a specific client.

Here is the draft letter:
---
${baseText}
---

Please improve this letter by:
1. Making the language more specific and personal to "${clientName}"
2. Adding one concrete, actionable next step the client should take immediately
3. Keeping it professional and clear — no jargon
4. ${toneInstruction}
5. Keep the same general structure (greeting, body paragraphs, closing)
6. Do NOT use markdown formatting — plain text only
7. Keep the letter under 280 words

Return only the improved letter text, starting with "Dear ${clientName}," and ending with the sign-off.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const bodyText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : baseText

    const subject = `Important Regulatory Update: ${alert.title}`

    return NextResponse.json({
      subject,
      bodyText,
      bodyHtml: letterToHtml(bodyText),
    })
  } catch {
    // If AI call fails, fall back to the template
    const subject = `Important Regulatory Update: ${alert.title}`
    return NextResponse.json({
      subject,
      bodyText: baseText,
      bodyHtml: letterToHtml(baseText),
    })
  }
}
