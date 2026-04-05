import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface AnalyzeRequest {
  auditType: string
  taxYear: string | number
  issuesRaised: string
  clientData?: {
    name?: string
    industry?: string
    revenue?: number
    entityType?: string
  }
}

export async function POST(req: Request) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { auditType, taxYear, issuesRaised, clientData } = body

    if (!auditType || !taxYear || !issuesRaised) {
      return NextResponse.json(
        { success: false, error: 'auditType, taxYear, and issuesRaised are required' },
        { status: 400 }
      )
    }

    const AUDIT_PROMPT = `You are a CPA and tax attorney analyzing an IRS audit notice.
Audit type: ${auditType}
Tax year: ${taxYear}
Issues raised: ${issuesRaised}
${clientData ? `Client: ${clientData.name ?? 'Unknown'}, ${clientData.entityType ?? 'Business'}, ${clientData.industry ?? 'General'}` : ''}

Provide:
1. Defense strategy (2-3 paragraphs)
2. A complete IRS response letter (professional, citing IRC sections)
3. Required supporting documents list
4. Estimated resolution timeline

Be specific and cite actual IRC sections and IRS procedures.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: AUDIT_PROMPT,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const rawText = content.text

    // Parse sections from the response
    const sections = {
      defenseStrategy: '',
      responseLetter: '',
      requiredDocuments: [] as string[],
      resolutionTimeline: '',
      fullResponse: rawText,
    }

    // Extract response letter (typically between "Dear" and "Sincerely/Respectfully")
    const letterMatch = rawText.match(/(?:Dear\s+(?:Sir|Ma'am|IRS|Appeals|Revenue|Examination)[^]*?(?:Sincerely|Respectfully|Regards)[^]*?(?:\n\n|\n[A-Z]))/i)
    if (letterMatch) {
      sections.responseLetter = letterMatch[0].trim()
    }

    // Extract document list
    const docSection = rawText.match(/(?:required|supporting|necessary)\s+documents?[^]*?(?=\n\n[A-Z4]|\n#{1,3}|\d\.\s+Estimated|$)/i)
    if (docSection) {
      const docLines = docSection[0]
        .split('\n')
        .filter(line => /^[-•*]|\d+\./.test(line.trim()))
        .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
        .filter(Boolean)
      sections.requiredDocuments = docLines
    }

    return NextResponse.json({
      success: true,
      analysis: sections,
      auditType,
      taxYear,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
