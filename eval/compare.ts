// Side-by-side comparison of saved eval runs.
//
// Command line: eval/compare-cli.ts.

import { runLabel, summarise, type RawResults } from './report'

const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`)
const frac = (k: number, n: number) => (n ? `${k}/${n} (${pct(k / n)})` : '—')

export interface LedgerTotal { capUsd: number; spentUsd: number; calls: number }

export function renderComparison(raws: RawResults[], ledger: LedgerTotal | null = null): string {
  if (raws.length === 0) throw new Error('nothing to compare')
  const first = raws[0].meta
  const rowsBy = new Set(raws.map((r) => r.rows.length))
  const lines: string[] = [
    `# Model comparison`, '',
    `**Measured on:** the ${first.datasetRows}-row synthetic dataset (${first.business}, fictional; ${first.chartName}), ` +
    `${[...rowsBy].join(' / ')} rows sent per run, same engine code and prompt (\`src/lib/categorize.ts\`, auto-approve threshold ${first.autoApproveThreshold}, ` +
    `batch size ${first.batchSize}, no firm corrections). Dataset sha256 \`${first.datasetSha256.slice(0, 12)}\`. ` +
    `Each row below is one model; every figure is pooled over that model's runs (rows × runs predictions). ` +
    `Account accuracy excludes the REVIEW rows, which are scored only on whether they were sent to review.`, '',
    `| Model | Runs | Accuracy strict | Accuracy lenient | Wrong among auto-approved (strict / lenient) | REVIEW rows sent to review | Sent to review (of which flagged) | ECE (strict) | Median latency / transaction | Cost / 100 transactions |`,
    `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|`,
  ]
  for (const raw of raws) {
    const s = summarise(raw)
    const r = s.review
    const wrongStrict = r.autoApproved.n - r.autoApproved.strictCorrect
    const wrongLenient = r.autoApproved.n - r.autoApproved.lenientCorrect
    const perTx = s.latency.perTransactionMs.median
    const cost100 = s.cost.perTransactionUsd === null ? s.cost.reason ?? '—' : `$${(s.cost.perTransactionUsd * 100).toFixed(3)}`
    const tag = runLabel(raw.meta, raw.rows.length)
    if (r.n > 0 && r.noPrediction === r.n) {
      lines.push(`| \`${raw.meta.model}\`${tag ? ` (${tag})` : ''} | ${raw.meta.runs} | **no usable predictions** (${r.noPrediction}/${r.n} batch failures) | — | — | — | — | — | ` +
        `${s.latency.perTransactionMs.median === null ? '—' : `${(s.latency.perTransactionMs.median / 1000).toFixed(2)} s`} | ${s.cost.perTransactionUsd === null ? '—' : `$${(s.cost.perTransactionUsd * 100).toFixed(3)}`} |`)
      continue
    }
    lines.push(`| \`${raw.meta.model}\`${tag ? ` (${tag})` : ''} | ${raw.meta.runs} | ${frac(s.accuracy.strictCorrect, s.accuracy.n)} | ${frac(s.accuracy.lenientCorrect, s.accuracy.n)} | ` +
      `${frac(wrongStrict, r.autoApproved.n)} / ${frac(wrongLenient, r.autoApproved.n)} | ` +
      `${frac(s.reviewLabelled.sentToReview, s.reviewLabelled.n)} | ` +
      `${pct(r.reviewRate)} (${pct(r.flagRate)}) | ${s.calibration.strict.ece === null ? '—' : s.calibration.strict.ece.toFixed(3)} | ` +
      `${perTx === null ? '—' : `${(perTx / 1000).toFixed(2)} s`} | ${cost100} |`)
  }
  lines.push('',
    `**Columns.** *Strict* accepts only the primary label; *lenient* also accepts the listed policy alternates. ` +
    `*Wrong among auto-approved* is the share of rows the app would approve without a human that have the wrong account. ` +
    `*REVIEW rows sent to review* is correct handling of payments whose account can't be known from the bank line. ` +
    `*Sent to review* is the share of account-labelled predictions left pending or flagged; *flagged* is the subset with status flagged ` +
    `(account not in the chart, or batch failure). *ECE* is expected calibration error over 10 confidence buckets (0 = perfect). ` +
    `Latency is batch wall-clock ÷ batch size, so it depends on network and API load at run time. ` +
    `Cost uses the API-reported tokens and eval/pricing.json list prices (${raws[0].pricing.source_url}, checked ${raws[0].pricing.date_checked}).`, '',
    ...failureNotes(raws),
    `**Runs compared:** ${raws.map((r) => `\`${r.meta.model}\` ${r.meta.startedAt}`).join('; ')}.`, '',
    `**Total actual cost of these runs:** ${totalCost(raws)} (sum of each run's API-reported tokens × list price)` +
    (ledger ? `; spend ledger: $${ledger.spentUsd.toFixed(4)} over ${ledger.calls} billed calls, cap $${ledger.capUsd.toFixed(2)}.` : '.'), '',
    `**Limits:** one synthetic business and chart; a single run per model (except where Runs > 1) can't show run-to-run variation; ` +
    `labels encode one bookkeeping policy; the prompt was written for the app's current model and was not tuned for the others.`, '')
  return lines.join('\n')
}

function failureNotes(raws: RawResults[]): string[] {
  const notes = raws.flatMap((raw) => {
    const f = summarise(raw).failures
    return f.failed ? [`\`${raw.meta.model}\`: ${f.failed} of ${f.total} API calls failed; most common error (${f.topCount}×): \`${f.topError}\`. Failed calls are billed and included in its cost.`] : []
  })
  return notes.length ? [`**Failed calls.** ${notes.join(' ')}`, ''] : []
}

function totalCost(raws: RawResults[]): string {
  const costs = raws.map((r) => summarise(r).cost.totalUsd)
  if (costs.some((c) => c === null)) return 'not computed for every run (a price is missing)'
  return `$${costs.reduce((a, b) => a! + b!, 0)!.toFixed(4)}`
}
