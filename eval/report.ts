// Turns raw eval results into summary.json and a plain-language report.md.
//
//   npx vite-node --config vitest.config.ts eval/report.ts eval/results/<timestamp>/raw.json
//
// run.ts calls writeResults() itself; the CLI re-renders a saved run.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  accuracy, calibration, confusions, cost, excludedCount, latency, perAccount, reviewSplit,
  scoreRows, stability, unlabelledSplit,
  type BatchTiming, type CallUsage, type Prediction, type Pricing, type TruthRow,
} from './metrics'
import type { ChartAccount } from './data'

export interface RunMeta {
  startedAt: string
  finishedAt: string
  model: string
  runs: number
  /** --limit, or null for all selected rows. */
  limit: number | null
  labelledOnly: boolean
  /** Rows in the whole dataset / labelled rows in the whole dataset. */
  datasetRows: number
  datasetLabelledRows: number
  /** Average transactions per month in the dataset (one "statement"). */
  statementSize: number
  datasetSha256: string
  gitCommit: string
  gitDirty: boolean
  autoApproveThreshold: number
  batchSize: number
  business: string
  chartName: string
}

export interface RawResults {
  meta: RunMeta
  chart: ChartAccount[]
  /** The rows sent to the engine, with their labels. */
  rows: TruthRow[]
  predictions: Prediction[]
  calls: CallUsage[]
  batches: BatchTiming[]
  pricing: Pricing
}

export function summarise(raw: RawResults) {
  const scored = scoreRows(raw.predictions, raw.rows)
  const names = new Map(raw.chart.map((a) => [a.code, a.name]))
  return {
    scoredRows: new Set(scored.map((r) => r.id)).size,
    scoredPredictions: scored.length,
    excludedRows: excludedCount(raw.rows.map((r) => r.id), raw.rows),
    accuracy: accuracy(scored),
    perAccount: perAccount(scored, names),
    review: reviewSplit(scored),
    calibration: { strict: calibration(scored, 'strict'), lenient: calibration(scored, 'lenient') },
    stability: stability(raw.predictions),
    latency: latency(raw.batches, raw.calls),
    cost: cost(raw.calls, raw.pricing, raw.predictions.length, raw.meta.statementSize),
    confusions: confusions(scored),
    unlabelled: unlabelledSplit(raw.predictions, raw.rows),
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`)
const of = (k: number, n: number) => `${k} of ${n} (${pct(n ? k / n : null)})`
const ms = (x: number | null) => (x === null ? '—' : x >= 1000 ? `${(x / 1000).toFixed(2)} s` : `${Math.round(x)} ms`)
const usd = (x: number | null) => (x === null ? '—' : x < 0.01 ? `$${x.toFixed(5)}` : `$${x.toFixed(4)}`)
const num = (x: number) => x.toLocaleString('en-US')
const dec = (x: number | null, d = 3) => (x === null ? '—' : x.toFixed(d))

export function renderReport(raw: RawResults): string {
  const s = summarise(raw)
  const m = raw.meta
  const names = new Map(raw.chart.map((a) => [a.code, a.name]))
  const label = (code: string) => (names.has(code) ? `${code} ${names.get(code)}` : code === '(none)' ? '(no prediction)' : `${code} (not in chart)`)
  const partial = s.scoredRows < m.datasetLabelledRows
  const runsText = `${m.runs} run${m.runs === 1 ? '' : 's'}`
  const scope = `${s.scoredRows} scored rows × ${runsText} = ${s.scoredPredictions} scored predictions`
  const basis = `${m.business} (fictional), ${m.chartName}, model \`${m.model}\`, ${runsText}`

  const lines: string[] = []
  const p = (...xs: string[]) => lines.push(...xs)

  p(`# Categorisation eval report`, '')
  if (m.model === 'fake') {
    p(`> **FAKE MODEL: no API calls were made. This is a pipeline test; every number below is meaningless.**`, '')
  }
  if (partial) {
    p(`> **${m.limit !== null && s.scoredRows <= 50 ? 'SMOKE TEST' : 'PARTIAL RUN'}: ${s.scoredRows} of ${m.datasetLabelledRows} labelled rows. Not a result.**`,
      `> Numbers below describe only these rows and are too few to compare models or settings.`, '')
  }
  p(`**Measured on:** ${m.datasetRows}-row synthetic dataset; this run sent ${raw.rows.length} rows to the engine ` +
    `(${s.scoredRows} scored, ${s.excludedRows} excluded because they have no label yet). ${basis}.`,
    '',
    `**Engine:** the real \`categorizeTransactionsWithUsage\` in \`src/lib/categorize.ts\`, called directly (the same code \`/api/categorize\` runs), ` +
    `batch size ${m.batchSize}, auto-approve threshold ${m.autoApproveThreshold}, no firm corrections supplied. ` +
    `Commit \`${m.gitCommit.slice(0, 8)}\`${m.gitDirty ? ' with uncommitted changes' : ''}, dataset sha256 \`${m.datasetSha256.slice(0, 12)}\`, ` +
    `run ${m.startedAt} → ${m.finishedAt}.`,
    '',
    `**How to read it:** *strict* counts a row correct only if the engine picked the primary label. *Lenient* also accepts the ` +
    `alternates listed where the right account is a bookkeeping policy choice (e.g. 1100 vs 4100 for client payments). ` +
    `*Auto-approved* means the app would set the row to approved without a human; everything else is *sent to review* ` +
    `(status pending or flagged).`, '')

  // Headline
  const r = s.review
  p(`## Headline`, '', `On ${scope}:`, '',
    `| Measure | Value |`, `|---|---|`,
    `| Accuracy, strict | ${of(s.accuracy.strictCorrect, s.accuracy.n)} |`,
    `| Accuracy, lenient | ${of(s.accuracy.lenientCorrect, s.accuracy.n)} |`,
    `| Auto-approved | ${of(r.approved, r.n)} |`,
    `| **Wrong among auto-approved** (strict / lenient) | **${pct(r.autoApprovedErrorRate.strict)} / ${pct(r.autoApprovedErrorRate.lenient)}** (${r.autoApproved.n - r.autoApproved.strictCorrect} / ${r.autoApproved.n - r.autoApproved.lenientCorrect} of ${r.autoApproved.n}) |`,
    `| Sent to review | ${of(r.pending + r.flagged, r.n)} (${r.pending} pending, ${r.flagged} flagged) |`,
    `| Account not in the chart | ${of(r.unknownToChart, r.n)} |`,
    `| No prediction (batch failed or row skipped) | ${of(r.noPrediction, r.n)} |`,
    `| Cost per transaction | ${s.cost.totalUsd === null ? s.cost.reason : usd(s.cost.perTransactionUsd)} |`,
    `| Latency per batch (median) | ${ms(s.latency.perBatchMs.median)} |`, '')

  // Auto-approve vs review
  p(`## Auto-approved vs sent to review`, '', `On ${scope}. The app auto-approves a row when confidence ≥ ${m.autoApproveThreshold} and chart validation raised no flag.`, '',
    `| Group | Predictions | Correct (strict) | Correct (lenient) |`, `|---|---:|---:|---:|`,
    `| Auto-approved | ${r.autoApproved.n} | ${of(r.autoApproved.strictCorrect, r.autoApproved.n)} | ${of(r.autoApproved.lenientCorrect, r.autoApproved.n)} |`,
    `| Sent to review | ${r.sentToReview.n} | ${of(r.sentToReview.strictCorrect, r.sentToReview.n)} | ${of(r.sentToReview.lenientCorrect, r.sentToReview.n)} |`, '',
    `An auto-approved mistake reaches the books unless someone checks the approved list; a mistake sent to review costs reviewer time but is likely caught.`, '')

  // Per account
  p(`## Accuracy by account`, '', `On ${scope}, grouped by the true account (each row counts once per run). *Predicted as* counts how often the engine chose that account; *precision* is how often that choice was right.`, '',
    `| Account | Predictions | Strict | Lenient | Predicted as | Precision |`, `|---|---:|---:|---:|---:|---:|`)
  for (const a of s.perAccount) {
    p(`| ${a.code} ${a.name} | ${a.n} | ${a.n ? of(a.strictCorrect, a.n) : '—'} | ${a.n ? of(a.lenientCorrect, a.n) : '—'} | ${a.predictedCount} | ${pct(a.precision)} |`)
  }
  p('')

  // Confusions
  p(`## Most common mistakes`, '', `On ${scope}. Strict mistakes, most frequent first; ✓ marks a prediction that is an accepted alternate.`, '')
  if (s.confusions.length === 0) p(`No strict mistakes in this run.`, '')
  else {
    p(`| True | Predicted | Count | Alternate? | Example description |`, `|---|---|---:|:---:|---|`)
    const scored = scoreRows(raw.predictions, raw.rows)
    const desc = new Map(raw.rows.map((row) => [row.id, row.description]))
    for (const c of s.confusions) {
      const example = scored.find((x) => !x.strict && x.trueCode === c.trueCode && (x.predictedCode || '(none)') === c.predictedCode)
      p(`| ${label(c.trueCode)} | ${label(c.predictedCode)} | ${c.count} | ${c.acceptable ? '✓' : ''} | \`${(example ? desc.get(example.id) : '') ?? ''}\` |`)
    }
    p('')
  }

  // Calibration
  const cal = s.calibration.strict
  p(`## Calibration`, '', `On ${scope}. Does the confidence number mean what it says? In a well-calibrated engine, rows given 0.9 are right about 90% of the time.`, '',
    `| Confidence | Predictions | Mean confidence | Actual accuracy (strict) | Actual accuracy (lenient) |`, `|---|---:|---:|---:|---:|`)
  cal.buckets.forEach((b, i) => {
    if (b.n === 0) return
    p(`| ${b.lower.toFixed(1)}–${b.upper.toFixed(1)} | ${b.n} | ${dec(b.meanConfidence, 2)} | ${pct(b.accuracy)} | ${pct(s.calibration.lenient.buckets[i].accuracy)} |`)
  })
  p('', `Expected calibration error: **${dec(cal.ece)}** strict, **${dec(s.calibration.lenient.ece)}** lenient (0 = perfect; the average gap between confidence and accuracy, weighted by rows).`, '')

  // Stability
  const st = s.stability
  p(`## Stability across runs`, '')
  if (st.rowsCompared === 0) p(`Not measured: this was ${runsText}. Use \`--runs 3\` or more to see how often the same row gets a different answer.`, '')
  else p(`On ${st.rowsCompared} rows seen in all ${st.runs} runs (all rows sent, labelled or not):`, '',
    `- Got a different account in at least one run: ${of(st.rowsChanged, st.rowsCompared)}`,
    `- Auto-approve decision changed between runs: ${of(st.rowsDecisionChanged, st.rowsCompared)}`,
    `- Average confidence spread (max − min) per row: ${dec(st.meanConfidenceSpread)}`, '')

  // Latency
  const l = s.latency
  p(`## Latency`, '', `On ${l.batches} batch${l.batches === 1 ? '' : 'es'} of up to ${m.batchSize} rows (all rows sent, labelled or not). Wall-clock, including retries.`, '',
    `| | Median | p90 |`, `|---|---:|---:|`,
    `| Per batch | ${ms(l.perBatchMs.median)} | ${ms(l.perBatchMs.p90)} |`,
    `| Per transaction (batch time ÷ batch size) | ${ms(l.perTransactionMs.median)} | ${ms(l.perTransactionMs.p90)} |`,
    `| Per API call | ${ms(l.perCallMs.median)} | ${ms(l.perCallMs.p90)} |`, '')

  // Cost
  const c = s.cost
  p(`## Cost and tokens`, '', `From the token usage the API reported for every call in this run (${c.tokens.calls} call${c.tokens.calls === 1 ? '' : 's'}, ${c.tokens.failedCalls} failed; failed calls are billed too) and prices in \`eval/pricing.json\` (${raw.pricing.source_url ?? 'no source'}, checked ${raw.pricing.date_checked ?? 'never'}).`, '',
    `| | Value |`, `|---|---:|`,
    `| Input tokens | ${num(c.tokens.inputTokens)} |`,
    `| Output tokens | ${num(c.tokens.outputTokens)} |`,
    `| Cache read / write tokens | ${num(c.tokens.cacheReadTokens)} / ${num(c.tokens.cacheWriteTokens)} |`,
    `| Total cost of this run | ${c.totalUsd === null ? c.reason : usd(c.totalUsd)} |`,
    `| Cost per transaction | ${c.totalUsd === null ? '—' : usd(c.perTransactionUsd)} |`,
    `| Cost per statement (${c.statementSize} transactions, the dataset's monthly average) | ${c.totalUsd === null ? '—' : usd(c.perStatementUsd)} |`, '')

  // Unlabelled
  const u = s.unlabelled
  p(`## Rows not scored`, '')
  if (u.n === 0) p(`None: every row sent had a label.`, '')
  else p(`${u.n} prediction${u.n === 1 ? '' : 's'} on rows with no label yet (ambiguous vendors awaiting a hand label). Not scored; this is only what the app did with them, which shows whether genuinely unclear rows get auto-approved:`, '',
    `- Auto-approved: ${of(u.approved, u.n)}`, `- Sent to review: ${of(u.pending + u.flagged, u.n)} (${u.pending} pending, ${u.flagged} flagged)`, '')

  // Limits
  p(`## Limits`, '',
    `- **Synthetic data.** One fictional business, one bank account, three months, US-English descriptions drawn from 2–3 templates per vendor. Real bank feeds are messier; expect real accuracy to differ, likely downward.`,
    `- **Labels are one bookkeeper's policy.** Where two answers are defensible only the listed alternates are accepted, so strict accuracy understates a model that picks the other reasonable answer.`,
    `- **Not every account is exercised.** Accounts with few rows have wide uncertainty; a handful of rows can swing their accuracy by tens of points.`,
    `- **No firm corrections.** The app feeds a firm's past corrections into the prompt; this run supplies none, like a brand-new firm.`,
    `- **The model sees the chart names only.** The dataset's \`why\` notes and policy are never shown to it.`,
    `- **Latency** depends on network and API load at run time; compare runs taken close together.`,
    `- **Cost** uses list prices on the date checked, without batch, caching or negotiated discounts.`)
  if (partial) p(`- **This run covers ${s.scoredRows} of ${m.datasetLabelledRows} labelled rows.** It checks that the harness works; it says little about the engine.`)
  p('')
  return lines.join('\n')
}

export function writeResults(raw: RawResults, dir: string): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/raw.json`, JSON.stringify(raw, null, 2) + '\n')
  writeFileSync(`${dir}/summary.json`, JSON.stringify({ meta: raw.meta, ...summarise(raw) }, null, 2) + '\n')
  writeFileSync(`${dir}/report.md`, renderReport(raw))
}

// CLI: re-render a saved run.
if (process.argv[1] && fileIsMain(process.argv[1])) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: vite-node --config vitest.config.ts eval/report.ts <path/to/raw.json>')
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as RawResults
  writeResults(raw, dirname(path))
  console.log(`wrote ${dirname(path)}/report.md and summary.json`)
}

function fileIsMain(argv1: string): boolean {
  return /eval[/\\]report\.ts$/.test(argv1)
}
