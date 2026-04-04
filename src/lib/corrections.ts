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

function loadCorrections(): Correction[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Correction[]
  } catch {
    return []
  }
}
