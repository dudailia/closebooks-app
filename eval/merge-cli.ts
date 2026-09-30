// Pools separately saved runs of the same model into one result directory
// (raw.json, summary.json, report.md). No API calls.
//
//   npx vite-node --config vitest.config.ts eval/merge-cli.ts <run-dir> <run-dir> ... --out <dir>

import { readFileSync } from 'node:fs'
import { mergeRuns } from './merge'
import { writeResults, type RawResults } from './report'

const args = process.argv.slice(2)
let out: string | null = null
const dirs: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i] ?? null
  else dirs.push(args[i])
}
if (dirs.length < 2 || !out) {
  console.error('usage: npx vite-node --config vitest.config.ts eval/merge-cli.ts <run-dir> <run-dir> ... --out <dir>')
  process.exit(1)
}
const raws = dirs.map((d) => JSON.parse(readFileSync(`${d.replace(/\/$/, '')}/raw.json`, 'utf8')) as RawResults)
const merged = mergeRuns(raws)
writeResults(merged, out)
console.log(`merged ${dirs.length} saved results (${merged.meta.runs} runs, ${merged.predictions.length} predictions) into ${out}`)
