import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { latestFirmSubscription } from '@/lib/subscriptionLookup'

// Fake Supabase: records each query's table and filters.
function fake(tables: { firms: Array<{ id: string; owner_id: string }>; subscriptions: Array<Record<string, unknown>> }) {
  const queries: Array<{ table: string; filters: Array<[string, unknown]> }> = []
  const from = (table: keyof typeof tables) => {
    const q = { table, filters: [] as Array<[string, unknown]> }
    queries.push(q)
    const chain = {
      select: () => chain,
      eq: (col: string, val: unknown) => { q.filters.push([col, val]); return chain },
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => {
        const rows = (tables[table] as Array<Record<string, unknown>>).filter((r) => q.filters.every(([c, v]) => r[c] === v))
        return { data: rows.at(-1) ?? null }
      },
    }
    return chain
  }
  return { client: { from } as never, queries }
}

describe('latestFirmSubscription', () => {
  const subs = [
    { firm_id: 'firm-a', customer_email: 'owner@a.test', status: 'active' },
    { firm_id: null, customer_email: 'victim@b.test', status: 'active' }, // anonymous checkout, no firm
  ]

  it('finds the subscription by the caller\'s firm', async () => {
    const f = fake({ firms: [{ id: 'firm-a', owner_id: 'user-a' }], subscriptions: subs })
    const { data } = await latestFirmSubscription(f.client, 'user-a', 'status')
    expect(data).toMatchObject({ firm_id: 'firm-a', status: 'active' })
    expect(f.queries[1]).toEqual({ table: 'subscriptions', filters: [['firm_id', 'firm-a']] })
  })

  it('a user whose email matches a firmless subscription gets nothing', async () => {
    const f = fake({ firms: [{ id: 'firm-x', owner_id: 'user-x' }], subscriptions: subs })
    expect((await latestFirmSubscription(f.client, 'user-x', 'status')).data).toBeNull()
  })

  it('a user with no firm gets nothing and no subscription query is made', async () => {
    const f = fake({ firms: [], subscriptions: subs })
    expect((await latestFirmSubscription(f.client, 'nobody', 'status')).data).toBeNull()
    expect(f.queries.map((q) => q.table)).toEqual(['firms'])
  })
})

describe('no code looks up subscriptions by email', () => {
  it('src/ has no .eq(\'customer_email\', ...) query', () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) { if (name !== '__tests__') walk(p) }
        else if (/\.(ts|tsx)$/.test(name) && /\.eq\(\s*['"]customer_email['"]/.test(readFileSync(p, 'utf8'))) hits.push(p)
      }
    }
    walk(join(__dirname, '../..'))
    expect(hits).toEqual([])
  })
})
