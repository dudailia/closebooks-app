// Runs the real categorisation engine on the synthetic dataset and writes a report.
//
//   npx vite-node --config vitest.config.ts eval/run.ts [options]
//
//   --model <id>       model to test (default: the app's CATEGORIZE_MODEL)
//   --runs <n>         how many times to categorise the same rows (default 1)
//   --limit <n>        only n rows, evenly spaced across the dataset (default: all)
//   --labelled-only    skip rows that have no label yet
//   --out <dir>        output directory (default: eval/results/<timestamp>)
//   --fake             no API calls: a stand-in model that always answers 6300 at
//                      0.5 confidence. For testing the pipeline only.
//   --budget <usd>     hard cap on total API spend recorded in the ledger. Every
//                      attempt is checked first; if it could pass the cap the run
//                      stops cleanly and the finished part is saved.
//   --ledger <path>    spend ledger shared across invocations
//                      (default eval/results/spend-ledger.json)
//
// Calls the Anthropic API unless --fake is given. Reads ANTHROPIC_API_KEY from
// the environment or .env.local.

import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction } from '@/types'
import { Budget, budgetedClient } from './budget'
import { loadChart, loadTruth, spreadSample, DATA_DIR, EVAL_DIR, ROOT_DIR } from './data'
import { REVIEW_LABEL, type BatchTiming, type CallUsage, type Prediction, type Pricing, type TruthRow } from './metrics'
import { renderReport, writeResults, type RawResults } from './report'

interface Args {
  model: string | null
  runs: number
  limit: number | null
  labelledOnly: boolean
  out: string | null
  fake: boolean
  budget: number | null
  ledger: string | null
}

function parseArgs(argv: string[]): Args {
  const args: Args = { model: null, runs: 1, limit: null, labelledOnly: false, out: null, fake: false, budget: null, ledger: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const value = () => {
      const v = argv[++i]
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`)
      return v
    }
    const positive = (v: string) => {
      const n = Number(v)
      if (!Number.isInteger(n) || n < 1) throw new Error(`${a} must be a positive whole number`)
      return n
    }
    if (a === '--model') args.model = value()
    else if (a === '--runs') args.runs = positive(value())
    else if (a === '--limit') args.limit = positive(value())
    else if (a === '--labelled-only') args.labelledOnly = true
    else if (a === '--out') args.out = value()
    else if (a === '--fake') args.fake = true
    else if (a === '--budget') {
      const n = Number(value())
      if (!(n > 0)) throw new Error('--budget must be a positive dollar amount')
      args.budget = n
    }
    else if (a === '--ledger') args.ledger = value()
    else throw new Error(`unknown option ${a}`)
  }
  return args
}

function loadApiKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return
  const path = `${ROOT_DIR}.env.local`
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/)
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, '')
  }
}

function git(cmd: string): string {
  try { return execSync(`git ${cmd}`, { cwd: ROOT_DIR, encoding: 'utf8' }).trim() } catch { return '' }
}

const fakeClient = {
  messages: {
    create: async ({ messages }: { messages: Array<{ content: string }> }) => {
      const count = (messages[0].content.match(/^\d+: date=/gm) ?? []).length
      const items = Array.from({ length: count }, (_, index) => ({
        index, suggested_category: 'Miscellaneous Expense', suggested_account_code: '6300', confidence: 0.5, reasoning: 'fake',
      }))
      // Smoke-test-sized token counts, so --fake --budget exercises the budget cut path.
      return { content: [{ type: 'text', text: JSON.stringify(items) }], usage: { input_tokens: 2700, output_tokens: 1700 } }
    },
  },
}

function toTransaction(row: TruthRow): Transaction {
  // The same shape parseTransactionCSV gives the app for an uploaded row.
  return {
    id: row.id, date: row.date, description: row.description, original_description: row.description,
    amount: row.amount, type: row.type, suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.fake) loadApiKey()
  if (!args.fake && !process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set (environment or .env.local)')

  // Import after the key is in the environment: categorize.ts builds its client at load time.
  const engine = await import('@/lib/categorize')
  const model = args.fake ? 'fake' : args.model ?? engine.CATEGORIZE_MODEL

  const truthPath = `${DATA_DIR}synthetic_transactions.csv`
  const truth = loadTruth(truthPath)
  const chart = loadChart()
  const pricing = JSON.parse(readFileSync(`${EVAL_DIR}pricing.json`, 'utf8')) as Pricing
  const pool = args.labelledOnly ? truth.filter((t) => t.trueCode) : truth
  const rows = spreadSample(pool, args.limit)
  const months = new Set(truth.map((t) => t.date.slice(0, 7))).size
  const calls = args.runs * Math.ceil(rows.length / engine.BATCH_SIZE)

  console.log(`${rows.length} rows × ${args.runs} run(s) with ${model}: ${calls} API call(s)${args.fake ? ' (fake, no API)' : ''}`)

  // --fake has no real price; a made-up one lets --fake --budget test the cut path.
  const price = args.fake ? { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 } : pricing.models[model]
  const budget = args.budget !== null
    ? new Budget(args.budget, args.ledger ?? `${EVAL_DIR}results/spend-ledger.json`)
    : null
  if (budget && !price) throw new Error(`--budget needs a price for ${model} in eval/pricing.json`)
  const spentBeforeUsd = budget?.spentUsd ?? 0
  if (budget) console.log(`budget: $${spentBeforeUsd.toFixed(4)} of $${budget.capUsd.toFixed(2)} already spent`)

  const startedAt = new Date().toISOString()
  const label = `${model} ${startedAt}`
  const base = args.fake ? fakeClient : new Anthropic()
  const api = budget ? budgetedClient(base as Anthropic, budget, price!, label) : base
  const predictions: Prediction[] = []
  const callLog: CallUsage[] = []
  const batchLog: BatchTiming[] = []
  const txs = rows.map(toTransaction)
  const size = engine.BATCH_SIZE
  let cut: { run: number; rowsDone: number; rowsPlanned: number } | null = null

  // One engine call per batch (identical to the engine's own batching), so the
  // budget is checked between batches and a refused batch can be discarded.
  outer: for (let run = 0; run < args.runs; run++) {
    for (let b = 0; b * size < txs.length; b++) {
      const chunk = txs.slice(b * size, (b + 1) * size)
      const result = await engine.categorizeTransactionsWithUsage(chunk, chart, [], { model, client: api as never })
      const billed = result.calls.filter((c) => !c.error?.startsWith('budget cap'))
      callLog.push(...billed.map((c) => ({ ...c, run, batchIndex: b })))
      if (budget?.refused) {
        cut = { run, rowsDone: b * size, rowsPlanned: txs.length }
        console.log(`stopped by the budget cap in run ${run + 1}, before batch ${b + 1}: ${cut.rowsDone} of ${txs.length} rows done in this run`)
        break outer
      }
      batchLog.push(...result.batches.map((t) => ({ ...t, run, batchIndex: b })))
      const perRow = result.batches[0] ? result.batches[0].wallMs / result.batches[0].size : 0
      result.transactions.forEach((t, j) => {
        if (t.id !== chunk[j].id) throw new Error(`engine returned rows out of order at ${b * size + j}`)
        const flags = t.validation_flags ?? []
        predictions.push({
          run, id: t.id,
          predictedCode: t.suggested_account_code ?? '',
          confidence: t.confidence,
          status: t.status === 'edited' ? 'approved' : t.status,
          validationFlags: flags,
          unknownToChart: flags.includes('coa_account_unknown'),
          noPrediction: t.status === 'flagged' && flags.length === 0 && !t.suggested_account_code,
          batchIndex: b,
          latencyMs: perRow,
        })
      })
    }
    const runCalls = callLog.filter((c) => c.run === run)
    console.log(`run ${run + 1}/${args.runs}: ${runCalls.length} call(s), ${runCalls.filter((c) => c.error).length} failed` +
      (budget ? `, spent so far $${budget.spentUsd.toFixed(4)}` : ''))
  }

  if (predictions.length === 0) {
    console.log('nothing was categorised (budget cap reached before the first batch); no report written')
    return
  }

  const stamp = startedAt.replace(/\.\d+Z$/, 'Z').replace(/:/g, '-')
  const out = args.out ?? `${EVAL_DIR}results/${stamp}${args.fake ? '-fake' : ''}`
  const raw: RawResults = {
    meta: {
      startedAt,
      finishedAt: new Date().toISOString(),
      model,
      runs: args.runs,
      limit: args.limit,
      labelledOnly: args.labelledOnly,
      datasetRows: truth.length,
      datasetLabelledRows: truth.filter((t) => t.trueCode && t.trueCode !== REVIEW_LABEL).length,
      datasetReviewRows: truth.filter((t) => t.trueCode === REVIEW_LABEL).length,
      statementSize: Math.round(truth.length / months),
      datasetSha256: createHash('sha256').update(readFileSync(truthPath)).digest('hex'),
      gitCommit: git('rev-parse HEAD'),
      gitDirty: git('status --porcelain') !== '',
      autoApproveThreshold: engine.AUTO_APPROVE_THRESHOLD,
      batchSize: engine.BATCH_SIZE,
      business: 'Brightline Studio LLC',
      chartName: `Standard Small Business chart (${chart.length} accounts)`,
      budget: budget ? { capUsd: budget.capUsd, spentBeforeUsd, spentAfterUsd: budget.spentUsd } : null,
      cut,
    },
    chart, rows, predictions, calls: callLog, batches: batchLog, pricing,
  }
  writeResults(raw, out)
  console.log(`\nwrote ${out}/report.md, summary.json, raw.json\n`)
  if (args.fake) console.log(renderReport(raw).split('\n').slice(0, 20).join('\n'))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
