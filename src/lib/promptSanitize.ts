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

/** Longest description sent to the model. Real bank lines are well under this. */
export const MAX_PROMPT_DESCRIPTION = 200

/**
 * One line of untrusted text for a prompt field such as description="...":
 * control characters (newlines and tabs included) and Unicode line separators
 * become spaces, runs of whitespace collapse, backslashes and double quotes are
 * escaped (when `quoted`) so the text can't close its quotes, and the result is capped at
 * maxLen characters. A newline could otherwise start a fake transaction line
 * or an instruction.
 */
export function sanitizePromptField(input: unknown, maxLen = MAX_PROMPT_DESCRIPTION, quoted = true): string {
  if (typeof input !== 'string') return ''
  let s = input.replace(/[\x00-\x1f\x7f\u0085\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = s.slice(0, maxLen).trimEnd()
  return quoted ? s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : s
}
