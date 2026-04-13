/** One-time legacy import prompt per browser session (in-memory). */

let legacyImportSkipped = false

export function wasLegacyImportSkipped(): boolean {
  return legacyImportSkipped
}

export function skipLegacyImportPrompt(): void {
  legacyImportSkipped = true
}
