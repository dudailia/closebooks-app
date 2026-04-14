/**
 * Strip control chars and cap length for strings sent to AI / logs.
 */

export function sanitizeForPrompt(input: string, maxLen = 8000): string {
  let s = input.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
  if (s.length > maxLen) s = s.slice(0, maxLen)
  return s.trim()
}

export function sanitizeOptional(input: unknown, maxLen = 4000): string {
  if (typeof input !== 'string') return ''
  return sanitizeForPrompt(input, maxLen)
}
