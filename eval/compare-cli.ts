// Side-by-side comparison of saved runs.
//
//   npx vite-node --config vitest.config.ts eval/compare-cli.ts <run-dir> ... [--ledger ledger.json] [--out comparison.md]

import { readFileSync, writeFileSync } from 'node:fs'
import { renderComparison } from './compare'
import type { RawResults } from './report'

const args = process.argv.slice(2)
let out: string | null = null
let ledgerPath: string | null = null
const dirs: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i] ?? null
  else if (args[i] === '--ledger') ledgerPath = args[++i] ?? null
  else dirs.push(args[i])
}
if (dirs.length === 0) {
  console.error('usage: npx vite-node --config vitest.config.ts eval/compare-cli.ts <run-dir> ... [--ledger file] [--out file]')
  process.exit(1)
}
const ledgerJson = ledgerPath ? (JSON.parse(readFileSync(ledgerPath, 'utf8')) as { capUsd: number; entries: Array<{ costUsd: number }> }) : null
const ledger = ledgerJson
  ? { capUsd: ledgerJson.capUsd, spentUsd: ledgerJson.entries.reduce((s, e) => s + e.costUsd, 0), calls: ledgerJson.entries.length }
  : null
const raws = dirs.map((d) => JSON.parse(readFileSync(`${d.replace(/\/$/, '')}/raw.json`, 'utf8')) as RawResults)
const md = renderComparison(raws, ledger)
if (out) writeFileSync(out, md)
console.log(md)
