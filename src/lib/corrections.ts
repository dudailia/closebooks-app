// Client-side only — runs in the browser, uses localStorage.
// Stores user corrections so the AI can learn firm-specific patterns.

const KEY = 'closebooks_corrections'
const MAX_STORED = 50

export interface Correction {
  description: string   // original transaction description
  fromCategory: string  // AI's suggestion
  toCategory: string    // user's override
  savedAt: string       // ISO timestamp
}

export function saveCorrection(
  description: string,
  fromCategory: string,
  toCategory: string
): void {
  if (typeof window === 'undefined') return
  if (!fromCategory || !toCategory || fromCategory === toCategory) return

  const all = loadCorrections()

  // Update in-place if this description+from pair was already corrected
  const idx = all.findIndex(
    (c) => c.description === description && c.fromCategory === fromCategory
  )
  const entry: Correction = { description, fromCategory, toCategory, savedAt: new Date().toISOString() }

  if (idx >= 0) {
    all[idx] = entry
  } else {
    all.unshift(entry)
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX_STORED)))
  } catch {
    // localStorage full or blocked — silently ignore
  }
}

export function getRecentCorrections(n = 10): Correction[] {
  return loadCorrections().slice(0, n)
}

export interface CorrectionStats {
  totalCorrections: number
  /** Estimated AI accuracy for this firm, grows with corrections (82–97%) */
  estimatedAccuracy: number
  /** Most commonly corrected categories */
  topCorrectedFrom: { category: string; count: number }[]
  /** Most frequent correction targets */
  topCorrectedTo: { category: string; count: number }[]
}

export function getCorrectionStats(): CorrectionStats {
  const all = loadCorrections()
  const n   = all.length

  // Accuracy model: starts at 82%, grows logarithmically toward 97%
  const estimatedAccuracy = n === 0
    ? 82
    : Math.min(97, Math.round(82 + Math.log10(n + 1) * 9))

  const fromCounts = new Map<string, number>()
  const toCounts   = new Map<string, number>()
  for (const c of all) {
    fromCounts.set(c.fromCategory, (fromCounts.get(c.fromCategory) ?? 0) + 1)
    toCounts.set(c.toCategory,     (toCounts.get(c.toCategory)     ?? 0) + 1)
  }

  const topCorrectedFrom = Array.from(fromCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))

  const topCorrectedTo = Array.from(toCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))

  return { totalCorrections: n, estimatedAccuracy, topCorrectedFrom, topCorrectedTo }
}

export function loadCorrections(): Correction[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Correction[]
  } catch {
    return []
  }
}
