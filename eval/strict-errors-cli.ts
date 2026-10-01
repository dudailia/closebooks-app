// Breakdown of strict errors among auto-approved rows, from saved runs. No API calls.
//
//   npx vite-node --config vitest.config.ts eval/strict-errors-cli.ts eval/results/<run> ... \
//     [--thresholds 0.85,0.93] [--out eval/results/strict-errors.md]

import { readFileSync, writeFileSync } from 'node:fs'
import type { RawResults } from './report'
import { loadChart } from './data'
import { allStrictErrors, strictErrorBreakdown } from './strict-errors'

const args = process.argv.slice(2)
let out: string | null = null
let thresholds = [0.85, 0.93]
const dirs: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i]
  else if (args[i] === '--thresholds') thresholds = args[++i].split(',').map(Number)
  else dirs.push(args[i].replace(/\/$/, ''))
}
if (dirs.length === 0) {
  console.error('usage: eval/strict-errors-cli.ts <run-dir> ... [--thresholds 0.85,0.93] [--out file]')
  process.exit(1)
}
const names = new Map(loadChart().map((a) => [a.code, a.name]))
const acct = (c: string) => `${c} ${names.get(c) ?? '(not in chart)'}`
const pct = (n: number, d: number) => (d === 0 ? '—' : `${((100 * n) / d).toFixed(1)}%`)

const lines: string[] = [
  '# Strict errors among auto-approved rows', '',
  'Recomputed from saved predictions, no API calls. A row is auto-approved as the app decides it (no chart-validation flag and confidence ≥ threshold). ' +
    'A *strict* error is any account other than the primary label. A *policy alternate* is an account `eval/data/vendors.csv` lists as acceptable for that vendor ' +
    '(a bookkeeping choice, e.g. client payments to 4100 revenue instead of 1100 Accounts Receivable); everything else is a *real mistake*. ' +
    'Strict wrong minus policy alternates equals the lenient count in threshold-sweep.md.', '',
]
for (const dir of dirs) {
  const raw = JSON.parse(readFileSync(`${dir}/raw.json`, 'utf8')) as RawResults
  lines.push(`## \`${raw.meta.model}\` (${dir.split('/').pop()}, ${raw.meta.runs} run${raw.meta.runs === 1 ? '' : 's'})`, '')
  for (const t of thresholds) {
    const b = strictErrorBreakdown(raw.predictions, raw.rows, t)
    lines.push(`**At ${t.toFixed(2)}:** ${b.autoApproved} auto-approved; ${b.strictWrong} strict errors (${pct(b.strictWrong, b.autoApproved)}): ` +
      `${b.policyAlternates} policy alternate${b.policyAlternates === 1 ? '' : 's'}, ${b.realMistakes} real mistake${b.realMistakes === 1 ? '' : 's'} (${pct(b.realMistakes, b.autoApproved)}, the lenient figure).`, '',
      '| Correct account | Booked to | Rows | Kind | Example bank lines |', '|---|---|---:|---|---|')
    for (const g of b.groups) {
      lines.push(`| ${acct(g.trueCode)} | ${acct(g.predictedCode)} | ${g.count} | ${g.policy ? 'policy alternate' : '**real mistake**'} | ${g.examples.map((e) => `\`${e}\``).join('<br>')} |`)
    }
    lines.push('')
  }
  const all = allStrictErrors(raw.predictions, raw.rows)
  lines.push('**Every strict error, any confidence** (the confidence the app ends with, after its own adjustments), groups of 2 or more:', '',
    '| Correct account | Booked to | Rows | Kind | Confidence |', '|---|---|---:|---|---|')
  for (const g of all.filter((x) => x.count >= 2)) {
    const range = g.minConfidence === g.maxConfidence ? g.minConfidence.toFixed(2) : `${g.minConfidence.toFixed(2)} to ${g.maxConfidence.toFixed(2)}`
    lines.push(`| ${acct(g.trueCode)} | ${acct(g.predictedCode)} | ${g.count} | ${g.policy ? 'policy alternate' : '**real mistake**'} | ${range} |`)
  }
  lines.push('')
}
const md = lines.join('\n')
if (out) writeFileSync(out, md)
console.log(md)
