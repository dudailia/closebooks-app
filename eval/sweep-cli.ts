// Auto-approve threshold sweep from saved runs. No API calls.
//
//   npx vite-node --config vitest.config.ts eval/sweep-cli.ts <run-dir> ... [--target 0.02] [--out file.md]

import { readFileSync, writeFileSync } from 'node:fs'
import { autoApprovedAt, thresholdRange, thresholdSweep, type SweepRow } from './metrics'
import { runLabel, type RawResults } from './report'

const args = process.argv.slice(2)
let out: string | null = null
let target = 0.02
const dirs: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i] ?? null
  else if (args[i] === '--target') target = Number(args[++i])
  else dirs.push(args[i])
}
if (dirs.length === 0) {
  console.error('usage: npx vite-node --config vitest.config.ts eval/sweep-cli.ts <run-dir> ... [--target 0.02] [--out file.md]')
  process.exit(1)
}

const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`)
const lines: string[] = [
  '# Auto-approve threshold sweep', '',
  `Recomputed from saved runs, no API calls. For each threshold, a prediction is auto-approved exactly as the app decides it ` +
  `(no chart-validation flag and confidence ≥ threshold), using the confidence the engine produced in that run. ` +
  `Wrong-among-auto-approved is over rows with an account label; REVIEW rows are counted separately (any auto-approval of one is wrong). ` +
  `*Review load* is every prediction a human must check (not auto-approved), REVIEW rows included; per statement = share × the dataset's monthly average.`, '',
]

for (const dir of dirs) {
  const raw = JSON.parse(readFileSync(`${dir.replace(/\/$/, '')}/raw.json`, 'utf8')) as RawResults
  const m = raw.meta
  // Sanity: at the app's own threshold the sweep must reproduce the saved statuses.
  const mismatch = raw.predictions.filter((p) => autoApprovedAt(p, m.autoApproveThreshold) !== (p.status === 'approved'))
  if (mismatch.length) throw new Error(`${dir}: ${mismatch.length} predictions disagree with the saved status at ${m.autoApproveThreshold}`)

  const rows = thresholdSweep(raw.predictions, raw.rows, thresholdRange())
  const perStatement = (r: SweepRow) => (r.reviewLoadRate === null ? '—' : (r.reviewLoadRate * m.statementSize).toFixed(1))
  const meets = rows.filter((r) => r.wrongLenientRate !== null && r.wrongLenientRate <= target && r.reviewRowsAutoApproved === 0)
  const best = meets[0] ?? null
  const current = rows.find((r) => r.threshold === m.autoApproveThreshold)!

  const tag = [m.mergedFrom ? `pooled from ${m.mergedFrom.length} saved results` : '', runLabel(m, raw.rows.length)].filter(Boolean).join(', ')
  lines.push(`## \`${m.model}\`${tag ? ` (${tag})` : ''}`, '',
    `**Measured on:** ${raw.predictions.length} saved predictions (${raw.rows.length} rows × ${m.runs} run${m.runs === 1 ? '' : 's'}) of the ` +
    `${m.datasetRows}-row synthetic dataset (${m.business}, fictional; ${m.chartName}), run ${m.startedAt}. ` +
    `Sanity check passed: at ${m.autoApproveThreshold} the sweep reproduces all ${raw.predictions.length} saved auto-approve decisions.`, '')
  if (best) {
    lines.push(`**Lowest threshold with lenient wrong-among-auto-approved ≤ ${pct(target)} (and no REVIEW row auto-approved): ${best.threshold.toFixed(2)}.** ` +
      `It auto-approves ${pct(best.autoApproveRate)} of account-labelled predictions (${best.wrongLenient} lenient / ${best.wrongStrict} strict wrong of ${best.autoApproved}) ` +
      `and leaves a review load of ${pct(best.reviewLoadRate)}, about ${perStatement(best)} rows per ${m.statementSize}-row statement, ` +
      `versus ${pct(current.reviewLoadRate)} (${perStatement(current)} rows) at today's ${m.autoApproveThreshold}.`, '')
  } else {
    lines.push(`**No threshold from 0.70 to 0.99 keeps lenient wrong-among-auto-approved at or below ${pct(target)}.**`, '')
  }
  lines.push('| Threshold | Auto-approved | Wrong among auto-approved, strict | Wrong among auto-approved, lenient | REVIEW rows auto-approved | Review load | Review rows / statement |',
    '|---:|---:|---:|---:|---:|---:|---:|')
  for (const r of rows) {
    const mark = r.threshold === m.autoApproveThreshold ? ' ← current' : best && r.threshold === best.threshold ? ` ← ≤${pct(target)}` : ''
    lines.push(`| ${r.threshold.toFixed(2)}${mark} | ${r.autoApproved} (${pct(r.autoApproveRate)}) | ${r.wrongStrict} (${pct(r.wrongStrictRate)}) | ` +
      `${r.wrongLenient} (${pct(r.wrongLenientRate)}) | ${r.reviewRowsAutoApproved} | ${r.reviewLoad} (${pct(r.reviewLoadRate)}) | ${perStatement(r)} |`)
  }
  lines.push('')
}

lines.push('## Limits', '',
  '- Confidence values are what the engine produced in these runs; a different threshold was never actually run, but the app\'s decision depends only on confidence, flags and threshold, so the recomputation is exact for these predictions.',
  '- One synthetic business; few rows per account. A model with fewer runs has a less certain curve; the run count is stated in each section.',
  '- Confidence clusters on a few values (e.g. 0.92, 0.95), so the curve moves in steps rather than smoothly.', '')

const md = lines.join('\n')
if (out) writeFileSync(out, md)
console.log(md)
