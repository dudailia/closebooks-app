// Re-render a saved run's report.md and summary.json.
//
//   npx vite-node --config vitest.config.ts eval/report-cli.ts eval/results/<timestamp>/raw.json

import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { writeResults, type RawResults } from './report'

const path = process.argv.slice(2).find((a) => a.endsWith('raw.json'))
if (!path) {
  console.error('usage: npx vite-node --config vitest.config.ts eval/report-cli.ts <path/to/raw.json>')
  process.exit(1)
}
writeResults(JSON.parse(readFileSync(path, 'utf8')) as RawResults, dirname(path))
console.log(`wrote ${dirname(path)}/report.md and summary.json`)
