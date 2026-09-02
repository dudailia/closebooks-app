import { NextRequest } from 'next/server'
import { getAnthropic, AI_MODELS, costOfUsage } from '@/lib/ai/anthropic'
import { agentCloseSystemPrompt } from '@/lib/ai/systemPrompts'
import { sseResponse, type SseEvent } from '@/lib/ai/sse'
import type { Transaction, CategorizationJob } from '@/types'

export const dynamic = 'force-dynamic'

interface Body {
  job: CategorizationJob
  thresholds?: { confidenceThreshold?: number; autoFlagThreshold?: number }
}

const STAGES: Array<{ id: string; label: string }> = [
  { id: 'collect',    label: 'Collect data' },
  { id: 'categorize', label: 'AI categorization' },
  { id: 'reconcile',  label: 'Bank reconciliation' },
  { id: 'journal',    label: 'Journal entries' },
  { id: 'anomalies',  label: 'Anomaly scan' },
  { id: 'trial',      label: 'Trial balance' },
  { id: 'narrative',  label: 'Narrative summary' },
  { id: 'review',     label: 'Human review queue' },
]

async function narrateStage(
  send: (e: SseEvent) => void,
  stageId: string,
  clientName: string,
  prompt: string
): Promise<{ input: number; output: number }> {
  const anthropic = getAnthropic()
  const stream = anthropic.messages.stream({
    model: AI_MODELS.haiku,
    max_tokens: 300,
    system: agentCloseSystemPrompt(clientName),
    messages: [{ role: 'user', content: prompt }],
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      send({ type: 'reasoning', stageId, text: event.delta.text })
    }
  }
  const final = await stream.finalMessage()
  return { input: final.usage.input_tokens, output: final.usage.output_tokens }
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { job, thresholds } = body
  const confidenceThreshold = thresholds?.confidenceThreshold ?? 0.85
  const autoFlagThreshold = thresholds?.autoFlagThreshold ?? 0.6

  return sseResponse(async (send) => {
    const totalTokens = { input: 0, output: 0 }
    const startAt = Date.now()
    let txs: Transaction[] = job.transactions.map((t) => ({ ...t }))

    for (const stage of STAGES) {
      send({ type: 'stage_start', id: stage.id, label: stage.label })
      const stageStart = Date.now()

      let metric = { input: 0, output: 0 }
      let output: unknown = null

      if (stage.id === 'collect') {
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `You have ${txs.length} transactions for ${job.client_name}. Briefly describe what you see (total debits/credits, date span).`
        )
        output = { txCount: txs.length }
      } else if (stage.id === 'categorize') {
        const pending = txs.filter((t) => t.status === 'pending')
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `You are categorizing ${pending.length} pending transactions for ${job.client_name}. ${
            pending.length === 0 ? 'Nothing to do.' : 'Describe your approach in one sentence.'
          }`
        )
        let approved = 0
        let flagged = 0
        txs = txs.map((t) => {
          if (t.status !== 'pending') return t
          if (t.confidence >= confidenceThreshold) {
            approved++
            return {
              ...t,
              status: 'approved',
              final_category: t.suggested_category,
              final_account_code: t.suggested_account_code,
            }
          }
          if (t.confidence < autoFlagThreshold) {
            flagged++
            return { ...t, status: 'flagged' }
          }
          return t
        })
        send({
          type: 'action',
          stageId: stage.id,
          action: `Approved ${approved} · flagged ${flagged} · ${txs.filter((t) => t.status === 'pending').length} pending manual review`,
        })
        output = { approved, flagged, pending: txs.filter((t) => t.status === 'pending').length }
      } else if (stage.id === 'reconcile') {
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `Briefly comment on bank reconciliation for ${txs.length} transactions.`
        )
        output = { reconciled: txs.length }
      } else if (stage.id === 'journal') {
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `Summarize journal entry generation: ${txs.filter((t) => t.status === 'approved' || t.status === 'edited').length} approved transactions will produce JEs.`
        )
        output = { journalEntries: txs.filter((t) => t.status === 'approved' || t.status === 'edited').length }
      } else if (stage.id === 'anomalies') {
        const largeDebits = txs.filter((t) => t.type === 'debit' && t.amount > 5000)
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `Scan for anomalies. You found ${largeDebits.length} debit(s) over $5,000. ${
            largeDebits.length > 0
              ? `Call out the top one: ${largeDebits[0].description} for $${largeDebits[0].amount.toFixed(2)}.`
              : 'Reassure that nothing looks unusual.'
          }`
        )
        output = { anomalies: largeDebits.length }
      } else if (stage.id === 'trial') {
        const totalDebit = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
        const totalCredit = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `Trial balance: total debits $${totalDebit.toFixed(2)}, total credits $${totalCredit.toFixed(2)}. Comment briefly.`
        )
        output = { totalDebit, totalCredit }
      } else if (stage.id === 'narrative') {
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `The narrative summary will be generated separately. In one sentence, note that you're handing off to the narrative engine.`
        )
        output = { narrativeDeferred: true }
      } else if (stage.id === 'review') {
        const needsReview = txs.filter((t) => t.status === 'pending' || t.status === 'flagged')
        metric = await narrateStage(
          send,
          stage.id,
          job.client_name,
          `Closing summary: ${needsReview.length} item${needsReview.length !== 1 ? 's' : ''} queued for human review.`
        )
        output = { needsReview: needsReview.length }
      }

      totalTokens.input += metric.input
      totalTokens.output += metric.output
      const costUsd = costOfUsage('haiku', metric)
      send({ type: 'stage_metric', id: stage.id, tokens: metric.input + metric.output, costUsd })
      send({ type: 'stage_complete', id: stage.id, output, durationMs: Date.now() - stageStart })
    }

    send({
      type: 'done',
      tokens: totalTokens,
      costUsd: costOfUsage('haiku', totalTokens),
      elapsedMs: Date.now() - startAt,
      finalTxs: txs,
    })
  })
}
