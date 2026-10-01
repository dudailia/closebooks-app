import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHART_TEMPLATES, STANDARD_SMALL_BUSINESS } from '@/lib/coaTemplates'
import { loadChart } from '../../../eval/data'

describe('chart templates', () => {
  it('Standard Small Business is the 34-account chart the eval measured', () => {
    const evalChart = loadChart().map((a) => ({ code: a.code, name: a.name, type: a.type }))
    const appChart = STANDARD_SMALL_BUSINESS.map((a) => ({ code: a.code, name: a.name, type: a.type }))
    expect(appChart).toEqual(evalChart)
    expect(appChart).toHaveLength(34)
  })

  it('every template has unique codes and a description with its real size', () => {
    for (const t of Object.values(CHART_TEMPLATES)) {
      expect(new Set(t.accounts.map((a) => a.code)).size).toBe(t.accounts.length)
      expect(t.description.startsWith(`${t.accounts.length} accounts`)).toBe(true)
    }
  })

  it('no other chart in src/ is called "Standard Small Business"', () => {
    // The name may appear as a label or key, but only coaTemplates.ts defines its accounts.
    const SRC = path.resolve(__dirname, '..', '..')
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const full = path.join(dir, f)
        if (statSync(full).isDirectory()) { if (f !== '__tests__') walk(full); continue }
        if (!/\.(ts|tsx)$/.test(f)) continue
        const text = readFileSync(full, 'utf8')
        if (/['"]Standard Small Business['"]\s*:\s*\[/.test(text) || /Chart of Accounts\s*[—-]\s*Standard Small Business/.test(text)) offenders.push(path.relative(SRC, full))
      }
    }
    walk(SRC)
    expect(offenders).toEqual([])
  })
})
