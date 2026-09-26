// Statement period derived from the transaction dates themselves
// (not from when the job was uploaded). Pure — safe on server and client.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Ymd = { y: number; m: number; d: number }

// Parsers normalise to YYYY-MM-DD. Anything else (or an impossible date) is skipped.
function parseYmd(raw: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim())
  if (!match) return null
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3])
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null
  return { y, m, d }
}

const key = (p: Ymd) => p.y * 10000 + p.m * 100 + p.d
const monthDay = (p: Ymd) => `${MONTHS[p.m - 1]} ${p.d}`

/**
 * "Aug 1 – Aug 15, 2026", "Dec 15, 2025 – Jan 14, 2026", or "Aug 1, 2026".
 * Returns null when no transaction has a usable date.
 */
export function formatStatementPeriod(transactions: { date: string }[]): string | null {
  let first: Ymd | null = null
  let last: Ymd | null = null
  for (const tx of transactions) {
    const p = parseYmd(tx.date ?? '')
    if (!p) continue
    if (!first || key(p) < key(first)) first = p
    if (!last || key(p) > key(last)) last = p
  }
  if (!first || !last) return null
  if (key(first) === key(last)) return `${monthDay(first)}, ${first.y}`
  if (first.y === last.y) return `${monthDay(first)} – ${monthDay(last)}, ${last.y}`
  return `${monthDay(first)}, ${first.y} – ${monthDay(last)}, ${last.y}`
}
