import type { Transaction } from '@/types'

export interface ChatPromptContext {
  firmName?: string
  clientName?: string
  clientIndustry?: string
  jobId?: string
  jobMonth?: string
  transactions: Transaction[]
  overdueCount: number
}

export function chatSystemPrompt(ctx: ChatPromptContext): string {
  const serialized = JSON.stringify(
    ctx.transactions.slice(0, 500).map((t) => ({
      id: t.id,
      d: t.date,
      desc: t.description,
      amt: t.amount,
      type: t.type,
      cat: t.final_category ?? t.suggested_category,
      st: t.status,
      conf: t.confidence,
    }))
  )
  const who = ctx.clientName
    ? `You are looking at **${ctx.clientName}** (${ctx.clientIndustry ?? 'unknown industry'}), job ${
        ctx.jobId ?? ''
      }${ctx.jobMonth ? ' for ' + ctx.jobMonth : ''}.`
    : `You are looking at the firm dashboard. ${
        ctx.overdueCount > 0 ? `${ctx.overdueCount} clients are overdue for closing.` : ''
      }`
  return `You are CloseBooks AI, an expert accountant assistant. ${who}

You have full access to the current client's transaction data:
${serialized}

Answer questions concisely and professionally. Always reference specific numbers from the data. When an action is requested (flag, approve, recategorize, run close), call the matching tool instead of describing what you would do. Use specific transaction ids from the data when citing.`
}

export interface NarrativePromptContext {
  clientName: string
  clientIndustry?: string
  period: string
  transactions: Transaction[]
  priorTransactions: Transaction[] | null
}

export function narrativeSystemPrompt(ctx: NarrativePromptContext): string {
  const summarize = (txs: Transaction[]) => ({
    total: txs.length,
    revenue: txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
    expense: txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
  })
  const current = summarize(ctx.transactions)
  const prior = ctx.priorTransactions ? summarize(ctx.priorTransactions) : null

  const sample = JSON.stringify(
    ctx.transactions.slice(0, 150).map((t) => ({
      id: t.id,
      d: t.date,
      desc: t.description,
      amt: t.amount,
      type: t.type,
      cat: t.final_category ?? t.suggested_category,
    }))
  )

  return `You are CloseBooks AI generating a three-paragraph narrative summary of a client's month-end close.

Client: ${ctx.clientName} (${ctx.clientIndustry ?? 'n/a'})
Period: ${ctx.period}

Current month stats: ${JSON.stringify(current)}
Prior month stats: ${prior ? JSON.stringify(prior) : 'none available'}

Sample transactions: ${sample}

Produce a JSON object with this exact shape, and nothing else:
{
  "paragraphs": [
    { "tone": "formal",         "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id1","id2"] } ] },
    { "tone": "conversational", "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id1"] } ] },
    { "tone": "owner",          "html": "<p>…</p><p>…</p><p>…</p>", "citations": [ { "phrase": "…", "txIds": ["id3"] } ] }
  ],
  "forwardLookingLine": "One concrete forward-looking advisory line. Include a projected number where possible."
}

Rules:
- Exactly three paragraphs per tone.
- Always cite specific numbers; always include a prior-month delta if available.
- "owner" tone is written directly to the business owner, warm but clear.
- "formal" is boardroom-ready.
- "conversational" is how you'd brief a CPA colleague.
- Citations must reference real transaction ids from the sample.
- Return JSON only. No markdown code fences.`
}

export function agentCloseSystemPrompt(clientName: string): string {
  return `You are CloseBooks AI running an autonomous month-end close for ${clientName}. As you work through each stage, narrate your reasoning in a single short sentence before each significant decision. Be specific about the data you are examining. Do not invent numbers — only reference data you have been given. When you finish a stage, emit a one-line conclusion.`
}
