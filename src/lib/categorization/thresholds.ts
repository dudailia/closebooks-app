/** Default confidence thresholds (0–1 scale in app). */

export const DEFAULT_THRESHOLDS = {
  /** Auto-approve when confidence >= this (e.g. 0.90) */
  autoApprove: 0.9,
  /** Below this → flagged for manual (e.g. 0.70) */
  reviewFloor: 0.7,
  /** Between reviewFloor and autoApprove → pending (suggested, one-click approve) */
} as const

export interface CategorizationThresholds {
  autoApprove: number
  reviewFloor: number
}

export function normalizeThresholds(input?: Partial<CategorizationThresholds>): CategorizationThresholds {
  return {
    autoApprove: clamp01(input?.autoApprove ?? DEFAULT_THRESHOLDS.autoApprove),
    reviewFloor: clamp01(input?.reviewFloor ?? DEFAULT_THRESHOLDS.reviewFloor),
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return DEFAULT_THRESHOLDS.autoApprove
  return Math.min(1, Math.max(0, n))
}
