// Categorisation model and auto-approve threshold. Dependency-free, so client
// components (review table, badges) and server code read the same values.
//
// The two are chosen together: the threshold is calibrated to this model's
// confidence scores. Change one only with a fresh eval (eval/README.md).
//
// Decision 2026-09-30, from the synthetic eval (eval/results comparison +
// threshold sweep, 292 rows): Sonnet 5.5 at 0.93 kept wrong auto-approvals at
// 0.4% (1 of 274), against 5.8% for Sonnet 4.6 at 0.85.

/** The model the app categorises transactions with (src/lib/categorize.ts only). */
export const CATEGORIZE_MODEL = 'claude-sonnet-5-5'

/** A suggestion at or above this confidence, with no chart-validation flag, is auto-approved. */
export const AUTO_APPROVE_THRESHOLD = 0.93

/** The threshold as a whole percentage, for UI text ("93%"). */
export const AUTO_APPROVE_PERCENT = Math.round(AUTO_APPROVE_THRESHOLD * 100)
