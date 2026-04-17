/** Shared types for AI categorization (avoid circular imports). */

export interface CorrectionHint {
  description: string
  fromCategory: string
  toCategory: string
}
