// Learning-from-corrections experiment (see eval/learn.ts).
//
//   npx vite-node --config vitest.config.ts eval/learn-cli.ts [--base eval/results/full-sonnet-4-6] [--run-index 0]
//       [--out eval/results/learn-plan.md]                       plan + projections + cost estimate, no API calls
//   ... --run --budget <usd> [--ledger file]                     live "rules first" run: AI only for unmatched rows
//   ... --run --fake                                             pipeline test, no API calls
//
// The app's rule code persists rules to Supabase when it is configured; the
// eval must never do that, so Supabase settings are removed before it loads.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { RawResults } from './report'
import type { Pricing, Prediction } from './metrics'

for (const key of Object.keys(process.env)) if (key.includes('SUPABASE')) delete process.env[key]

const args = process.argv.slice(2)
const opt = (name: string, fallback: string | null = null) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] ?? fallback : fallback
}
const base = (opt('--base', 'eval/results/full-sonnet-4-6') as string).replace(/\/$/, '')
const runIndex = Number(opt('--run-index', '0'))
const out = opt('--out', 'eval/results/learn-plan.md') as string
const live = args.includes('--run')
const fake = args.includes('--fake')
const budgetUsd = opt('--budget') === null ? null : Number(opt('--budget'))
const ledgerPath = opt('--ledger', 'eval/results/spend-ledger.json') as string

async function main(): Promise<void> {
  const { supabaseConfigured } = await import('@/lib/supabase/client')
  if (supabaseConfigured) throw new Error('Supabase is configured in this process; refusing to let rule code persist from the eval')
  const learn = await import('./learn')
  const { REVIEWED_MONTH, TEST_MONTHS } = learn

  const raw = JSON.parse(readFileSync(`${base}/raw.json`, 'utf8')) as RawResults
  const pricing = JSON.parse(readFileSync('eval/pricing.json', 'utf8')) as Pricing
  const m = raw.meta
  const preds = raw.predictions.filter((p) => p.run === runIndex)
  if (preds.length !== raw.rows.length) throw new Error(`run ${runIndex} of ${base} has ${preds.length} predictions for ${raw.rows.length} rows`)

  const corrections = await learn.learnFromJune(raw.rows, preds, raw.chart)
  const plan = learn.planRulesFirst(raw.rows, preds, m.batchSize, corrections)
  const sizes = new Map(raw.batches.map((b) => [`${b.run}:${b.batchIndex}`, b.size]))
  const estimate = learn.estimateCost(plan.unmatched, m.batchSize, raw.calls, sizes, pricing.models[m.model])
  const baselineEstimate = learn.estimateCost(plan.testRows, m.batchSize, raw.calls, sizes, pricing.models[m.model])

  let liveMetrics: ReturnType<typeof learn.planRulesFirst>['rulesFirst'] | null = null
  let liveCost: number | null = null
  if (live) {
    if (!fake && budgetUsd === null) throw new Error('--run needs --budget <usd> (or --fake)')
    const engine = await import('@/lib/categorize')
    const { Budget, budgetedClient } = await import('./budget')
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const fakeClient = { messages: { create: async ({ messages }: { messages: Array<{ content: string }> }) => {
      const count = (messages[0].content.match(/^\d+: date=/gm) ?? []).length
      return { content: [{ type: 'text', text: JSON.stringify(Array.from({ length: count }, (_, index) => ({ index, suggested_category: 'Miscellaneous Expense', suggested_account_code: '6300', confidence: 0.5, reasoning: 'fake' }))) }], usage: { input_tokens: 2700, output_tokens: 1700 } }
    } } }
    const price = fake ? { input: 3, output: 15, cache_write_5m: 3.75, cache_read: 0.3 } : pricing.models[m.model]
    const budget = budgetUsd === null ? null : new Budget(budgetUsd, ledgerPath)
    const spentBefore = budget?.spentUsd ?? 0
    const api = budget ? budgetedClient((fake ? fakeClient : new Anthropic()) as never, budget, price!, `learn ${m.model}`) : fakeClient
    const aiPreds: Prediction[] = []
    const txs = plan.unmatchedRows.map(learn.toTransaction)
    for (let b = 0; b * m.batchSize < txs.length; b++) {
      const chunk = txs.slice(b * m.batchSize, (b + 1) * m.batchSize)
      const result = await engine.categorizeTransactionsWithUsage(chunk, raw.chart, [], { model: fake ? 'fake' : m.model, client: api as never })
      if (budget?.refused) throw new Error(`budget cap reached after ${b} of ${Math.ceil(txs.length / m.batchSize)} batches; live result incomplete`)
      result.transactions.forEach((t) => aiPreds.push({
        run: runIndex, id: t.id, predictedCode: t.suggested_account_code ?? '', confidence: t.confidence,
        status: t.status === 'edited' ? 'approved' : t.status, validationFlags: t.validation_flags ?? [],
        unknownToChart: (t.validation_flags ?? []).includes('coa_account_unknown'),
        noPrediction: t.status === 'flagged' && !(t.validation_flags ?? []).length && !t.suggested_account_code,
        batchIndex: b, latencyMs: 0,
      }))
    }
    // Same plan, with the live AI answers in place of the saved ones for unmatched rows.
    const unmatchedIds = new Set(plan.unmatchedRows.map((r) => r.id))
    liveMetrics = learn.planRulesFirst(raw.rows, [...preds.filter((p) => !unmatchedIds.has(p.id)), ...aiPreds], m.batchSize, corrections).rulesFirst
    liveCost = budget ? budget.spentUsd - spentBefore : 0
  }

  const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`)
  const usd = (x: number | null) => (x === null ? 'cost not computed: pricing not filled in' : `$${x.toFixed(4)}`)
  const testCount = plan.testRows
  const perStatement = (load: number) => ((load / testCount) * m.statementSize).toFixed(1)
  const before = plan.baseline
  const after = liveMetrics ?? plan.rulesFirst
  const afterLabel = liveMetrics ? (fake ? 'After (LIVE, fake model)' : 'After (live run)') : 'After: rules first (projection)'
  const cmp = (label: string, b: string, a: string) => `| ${label} | ${b} | ${a} |`
  const saved = baselineEstimate.costUsd !== null && estimate.costUsd !== null ? baselineEstimate.costUsd - estimate.costUsd : null
  const lines = [
    '# Learning from corrections: June review → rules for July–August', '',
    liveMetrics
      ? (fake ? '> **LIVE RUN WITH THE FAKE MODEL: pipeline test; the "after" numbers are meaningless.**' : '> **Includes a live run for the unmatched rows.**')
      : '> **PROJECTION FROM SAVED PREDICTIONS. No API calls were made.** Rule-matched rows take the rule\'s account; every other row keeps the AI answer saved in the earlier run. A live run would batch the unmatched rows differently, so its AI answers could differ a little.',
    '',
    `**Measured on:** the ${m.datasetRows}-row synthetic dataset (${m.business}, fictional; ${m.chartName}); saved run ${runIndex + 1} of \`${base}\` ` +
    `(model \`${m.model}\`, ${m.startedAt}). Reviewed month ${REVIEWED_MONTH} (${raw.rows.filter((r) => r.date.startsWith(REVIEWED_MONTH)).length} rows); ` +
    `test months ${TEST_MONTHS.join(' and ')} (${testCount} rows).`, '',
    `**Assumption:** the reviewer corrects every June row the model got wrong (lenient) and accepts the app's "Always categorize … as …?" prompt each time. ` +
    `Rules are created and matched by the app's own code (\`saveRule\`, \`applyRulesToJob\` in \`src/lib/review/rules.ts\`; \`vendorKey\` in \`src/lib/review/vendor.ts\`), with direction.`, '',
    `## Before vs after on July–August (${testCount} rows)`, '',
    'Accuracy and wrong auto-approvals are over rows with an account label; REVIEW rows count toward review load and are wrong only if auto-approved. Rule-applied rows count as approved (the app marks them *edited*).', '',
    `| | Before: no rules | ${afterLabel} |`, '|---|---:|---:|',
    cmp('Accuracy, lenient', pct(before.lenient), pct(after.lenient)),
    cmp('Accuracy, strict', pct(before.strict), pct(after.strict)),
    cmp('Auto-approved', String(before.autoApproved), String(after.autoApproved)),
    cmp('Wrong auto-approvals (lenient)', `${before.wrongAmongAutoApprovedLenient} (${pct(before.wrongAmongAutoApprovedLenientRate)})`, `${after.wrongAmongAutoApprovedLenient} (${pct(after.wrongAmongAutoApprovedLenientRate)})`),
    cmp('REVIEW rows auto-approved', String(before.reviewRowsAutoApproved), String(after.reviewRowsAutoApproved)),
    cmp(`Review load (rows a human checks) · per ${m.statementSize}-row statement`, `${before.reviewLoad} · ${perStatement(before.reviewLoad)}`, `${after.reviewLoad} · ${perStatement(after.reviewLoad)}`),
    cmp('Rows sent to the AI', String(before.aiRows), String(after.aiRows)),
    cmp('API calls (batches of ' + m.batchSize + ')', String(baselineEstimate.calls), String(estimate.calls)),
    cmp('Estimated API cost', usd(baselineEstimate.costUsd), usd(estimate.costUsd)),
    '',
    `**Rules caught ${plan.ruleMatched} of ${testCount} rows** (${plan.ruleMatchedCorrectLenient} right lenient, ${plan.ruleMatchedCorrectStrict} strict)` +
    `${saved !== null ? `, saving ${baselineEstimate.calls - estimate.calls} API call${baselineEstimate.calls - estimate.calls === 1 ? '' : 's'} and about ${usd(saved)} for these two months` : ''}. ` +
    `${plan.sameVendorRows} July–August rows are from vendors that had a June correction.`, '',
    ...(plan.ruleMatchedWrong.length
      ? ['**Wrong rule matches:**', '', '| Bank line | Rule pattern | Rule gave | Correct |', '|---|---|---|---|',
        ...plan.ruleMatchedWrong.map((w) => `| \`${w.description}\` | \`${w.pattern}\` | ${w.ruleCode} | ${w.trueCode} |`), '']
      : ['**Wrong rule matches: none.**', '']),
    `## June corrections → rules (${corrections.length} corrections, ${plan.rules.length} rules)`, '',
    '| June row | Model said | Correct | Rule (vendor key, direction) |', '|---|---|---|---|',
    ...corrections.map((c) => `| \`${c.description}\` | ${c.predictedCode || '(none)'} | ${c.trueCode} | \`${c.pattern}\` |`), '',
    `## Cost basis`, '',
    `- ${estimate.basis}, \`${m.model}\` list prices from eval/pricing.json. Retries on failed replies would add to this.`,
    `- A live "after" run would cost about ${usd(estimate.costUsd)} (${estimate.calls} calls for the ${plan.unmatched} unmatched rows).`,
    ...(live ? [`- Actual cost of the live run: ${fake ? '$0 (fake model)' : usd(liveCost)}.`] : []), '',
    '## Limits', '',
    '- Best case for rules: every June correction becomes a rule. In the app the reviewer must accept each prompt.',
    '- Rules learn the bank format they saw: a vendor that appears in two formats needs a correction in each.',
    '- One reviewed month, one synthetic business; real vendors vary their bank lines in more ways.', '',
  ]
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, lines.join('\n'))
  writeFileSync(out.replace(/\.md$/, '.json'), JSON.stringify({ base, runIndex, corrections, plan: { ...plan, unmatchedRows: plan.unmatchedRows.map((r) => r.id) }, estimate, baselineEstimate, liveMetrics, liveCost }, null, 2) + '\n')
  console.log(lines.join('\n'))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
