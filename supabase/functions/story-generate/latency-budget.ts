// One absolute deadline includes request parsing, runtime authorization, usage accounting,
// model calls, validation and final serialization. The browser aborts at 130 seconds;
// the function leaves six seconds of response/network headroom.
export const STORY_REQUEST_BUDGET_MS = 124_000

// Worst bounded safety path: classifier 12s + consistency 8s + isolated fear
// adjudication 8s + separate moderation-fear adjudication 8s. Reserve another
// two seconds for validation, merging, and response serialization.
export const STORY_SAFETY_RESERVE_MS = 38_000

const MIN_PROVIDER_WINDOW_MS = 8_000

// Never start a potentially billable call unless it can finish within the
// remaining request window while preserving every mandatory downstream stage.
// A smaller-than-normal cap may be used only when it is still >= 8 seconds.
export const stageTimeoutMs = (
  deadlineAt: number,
  now: number,
  capMs: number,
  reservedAfterMs: number,
): number | null => {
  if (![deadlineAt, now, capMs, reservedAfterMs].every(Number.isFinite) || capMs <= 0 || reservedAfterMs < 0) {
    return null
  }
  const availableMs = Math.floor(deadlineAt - now - reservedAfterMs)
  return availableMs >= MIN_PROVIDER_WINDOW_MS
    ? Math.min(Math.floor(capMs), availableMs)
    : null
}

// Safety is mandatory. Insufficient time is an explicit safe-fallback;
// never publish an otherwise valid story without completing this phase.
export const hasSafetyBudget = (deadlineAt: number, now: number): boolean =>
  Number.isFinite(deadlineAt) && Number.isFinite(now) && deadlineAt - now >= STORY_SAFETY_RESERVE_MS
