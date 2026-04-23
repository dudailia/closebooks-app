export function normalizeVendor(description: string): string {
  if (!description) return ''
  let s = description.toLowerCase().trim()
  // Strip common payment-processor / POS prefixes
  s = s.replace(/^(sq \*|tst\*|paypal \*|pp\*|stripe \*|sp\s+)/i, '')
  // Strip trailing "US*STORE123" style ID suffixes
  s = s.replace(/\*[a-z0-9]{4,}\b/gi, '')
  // Collapse multiple whitespace
  s = s.replace(/\s+/g, ' ')
  // Strip trailing numeric sequences (dates, IDs)
  s = s.replace(/\s+[\d#\-]{4,}$/g, '')
  // Strip trailing 2-letter state code
  s = s.replace(/\s+[a-z]{2}\s*$/i, '')
  return s.slice(0, 40).trim()
}

export function vendorPatternMatches(description: string, pattern: string): boolean {
  const d = normalizeVendor(description)
  const p = pattern.toLowerCase().trim()
  if (!d || !p) return false
  if (d === p) return true
  if (d.includes(p)) return true
  // Also match when the stored pattern fully contains a fresh normalization
  if (p.includes(d) && d.length >= 4) return true
  return false
}
