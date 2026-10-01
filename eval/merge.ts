// Pools separately saved runs of one model into a single multi-run result, so
// compare/sweep/report treat them exactly like one `--runs n` invocation.
//
// Command line: eval/merge-cli.ts.

import type { RawResults, RunMeta } from './report'

export function mergeRuns(raws: RawResults[]): RawResults {
  if (raws.length === 0) throw new Error('nothing to merge')
  const first = raws[0]
  const same = <K extends keyof RunMeta>(key: K) => {
    const bad = raws.find((r) => r.meta[key] !== first.meta[key])
    if (bad) throw new Error(`can't merge: ${key} differs (${String(first.meta[key])} vs ${String(bad.meta[key])})`)
  }
  for (const key of ['model', 'datasetSha256', 'autoApproveThreshold', 'batchSize', 'limit', 'labelledOnly'] as const) same(key)
  // Runs saved before these fields existed used the app's prompt without caching.
  for (const [key, norm] of [['promptVariant', (v: unknown) => v ?? null], ['cache', (v: unknown) => v ?? false]] as const) {
    const bad = raws.find((r) => norm(r.meta[key]) !== norm(first.meta[key]))
    if (bad) throw new Error(`can't merge: ${key} differs (${String(norm(first.meta[key]))} vs ${String(norm(bad.meta[key]))})`)
  }
  const ids = first.rows.map((r) => r.id).join('\n')
  if (raws.some((r) => r.rows.map((x) => x.id).join('\n') !== ids)) throw new Error("can't merge: runs sent different rows")

  let offset = 0
  let cut: RunMeta['cut'] = null
  const predictions: RawResults['predictions'] = []
  const calls: RawResults['calls'] = []
  const batches: RawResults['batches'] = []
  for (const raw of raws) {
    predictions.push(...raw.predictions.map((p) => ({ ...p, run: p.run + offset })))
    calls.push(...raw.calls.map((c) => ({ ...c, run: c.run + offset })))
    batches.push(...raw.batches.map((b) => ({ ...b, run: b.run + offset })))
    if (raw.meta.cut) {
      if (cut) throw new Error("can't merge: more than one run was cut by the budget cap")
      cut = { ...raw.meta.cut, run: raw.meta.cut.run + offset }
    }
    offset += raw.meta.runs
  }
  const commits = [...new Set(raws.map((r) => r.meta.gitCommit))]
  return {
    ...first,
    meta: {
      ...first.meta,
      startedAt: raws.map((r) => r.meta.startedAt).sort()[0],
      finishedAt: raws.map((r) => r.meta.finishedAt).sort().at(-1)!,
      runs: offset,
      gitCommit: commits.join('+'),
      gitDirty: raws.some((r) => r.meta.gitDirty),
      budget: null,
      cut,
      mergedFrom: raws.map((r) => `${r.meta.startedAt} (${r.meta.runs} run${r.meta.runs === 1 ? '' : 's'}, ${r.meta.gitCommit.slice(0, 8)})`),
    },
    predictions, calls, batches,
  }
}
