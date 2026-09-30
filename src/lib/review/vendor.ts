// Vendor keys for firm rules.
//
// A bank line carries noise that changes every month (dates, reference IDs,
// card digits, phone numbers, locations) around words that stay the same.
// vendorKey() strips the noise and keeps the stable words, so a rule learned
// from one month matches the same vendor next month. Words that tell two
// kinds of transaction from the same vendor apart (e.g. "DES:NET" vs
// "DES:TAX") are kept. The rules below are generic bank-feed patterns, not
// tuned to any vendor.

// ACH / wire fields whose value is an identifier or a name, not the transaction type.
// ("DES:" / "ENTRY DESCR:" describe the type and are kept.)
const ID_FIELDS = [
  'ppd id', 'co id', 'ind id', 'id', 'indn', 'ref', 'ref#', 'ref no', 'conf', 'conf#', 'confirmation',
  'trace', 'trn', 'sec', 'date', 'seq', 'auth', 'txn', 'transaction id',
]
// Card / POS boilerplate that says how a card was used, not who was paid.
const BOILERPLATE = [
  'pos debit', 'pos purchase', 'pos withdrawal', 'debit card purchase', 'debit purchase', 'card purchase',
  'purchase authorized on', 'checkcard', 'recurring payment', 'recurring debit', 'visa purchase', 'mc purchase',
]
const US_STATES = new Set(('al ak az ar ca co ct de dc fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj ' +
  'nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy pr').split(' '))
const WEEKDAYS = new Set(['mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun'])

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\#]/g, '\\$&')
const ID_FIELD_RE = new RegExp(`\\b(?:${ID_FIELDS.map(escape).join('|')})\\s*[:#]\\s*`, 'g')

/** Remove each ID field and its value: everything up to the next `word:` field or the end. */
function stripIdFields(s: string): string {
  let out = s
  for (;;) {
    ID_FIELD_RE.lastIndex = 0
    const m = ID_FIELD_RE.exec(out)
    if (!m) return out
    const rest = out.slice(m.index + m[0].length)
    const next = rest.search(/\s[a-z][a-z ]{0,20}:/)
    out = out.slice(0, m.index) + (next >= 0 ? rest.slice(next) : '')
  }
}

/**
 * Looks like an identifier rather than a word: any run of 2+ digits alone,
 * 3+ digits anywhere (P9170, 40D1M47D7L), or a long letter-digit mix.
 */
function isIdLike(token: string): boolean {
  const core = token.replace(/[^a-z0-9]/g, '')
  if (!core) return false
  const digits = (core.match(/\d/g) ?? []).length
  if (digits === core.length) return core.length >= 2
  if (digits >= 3) return true
  return core.length >= 6 && digits > 0
}

/**
 * Month-to-month stable key for a bank description. Idempotent:
 * vendorKey(vendorKey(x)) === vendorKey(x), so stored keys can be re-keyed.
 */
export function vendorKey(description: string): string {
  if (!description) return ''
  let s = ` ${description.toLowerCase()} `
  for (const phrase of BOILERPLATE) s = s.split(` ${phrase} `).join(' ')
  s = s.replace(/^\s*(sq|tst|pp|sp)\s*\*\s*/, ' ') // processor prefixes: "SQ *", "TST*"
  s = stripIdFields(s)
  s = s
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')          // dates 06/14, 6-14-26
    .replace(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/g, ' ')               // times 11AM, 8:30 pm
    .replace(/\(?\b\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g, ' ')            // phone numbers
    .replace(/\b\d{3}-\d{7}\b/g, ' ')                                  // 800-3333330
    .replace(/\.{2,}\s*\d+/g, ' ')                                     // masked accounts ...4417
    .replace(/#\s*[a-z0-9]*\d[a-z0-9]*/g, ' ')                         // #07891, # 1234, #R452
    .replace(/\*\s*(?=[a-z0-9]*\d)[a-z0-9]{4,}/g, ' ')                 // US*2K4TR8LQ2, *K7DB2XQLR2
  const tokens = s
    .split(/[\s-]+/)
    .map((t) => t.replace(/^[*,;]+|[*,;.]+$/g, ''))
    .filter((t) => t && !isIdLike(t) && !WEEKDAYS.has(t))
  while (tokens.length > 1 && (US_STATES.has(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === 'us' || tokens[tokens.length - 1] === 'usa')) {
    tokens.pop()
  }
  return tokens.join(' ').slice(0, 60).trim()
}

/** Kept for existing callers: the vendor key. */
export const normalizeVendor = vendorKey

/**
 * A description matches a stored pattern when their vendor keys are equal.
 * Patterns saved before vendorKey existed are re-keyed on the fly.
 */
export function vendorPatternMatches(description: string, pattern: string): boolean {
  const d = vendorKey(description)
  return d !== '' && d === vendorKey(pattern)
}
