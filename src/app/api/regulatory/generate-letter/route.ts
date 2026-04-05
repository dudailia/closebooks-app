import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { alert, clientName, firmName } = await req.json()

    const prompt = `You are a professional CPA firm advisor. Write a concise, professional client advisory letter about the following regulatory update.

Alert: ${alert.title}
Summary: ${alert.summary}
Effective Date: ${alert.effectiveDate}
Action Required: ${alert.actionRequired}

Client Name: ${clientName}
Firm Name: ${firmName}

Write a 3-4 paragraph advisory letter that:
1. Opens with the regulatory update and its significance
2. Explains how it applies to the client's situation
3. States the specific action the client needs to take
4. Closes professionally

Use a warm but professional tone. Be specific and actionable. Format as a letter with "Dear ${clientName}," opening and closing with "Warm regards,\n${firmName}". Do not use markdown formatting.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const letter = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ letter })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate letter' }, { status: 500 })
  }
}
