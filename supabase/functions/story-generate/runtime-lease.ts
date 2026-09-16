// A runtime ON flag is a short-lived permit, not a permanent provider switch.
// Pure logic shared by the Edge Function and deterministic tests.
// Expiry blocks NEW requests. A request already admitted may finish.
export const STORY_AI_RUNTIME_LEASE_MS = 180_000
export const STORY_AI_MAX_CLOCK_SKEW_MS = 30_000

export type RuntimeLeaseDecision = {
  enabled: boolean
  reason: 'runtime-enabled' | 'runtime-disabled' | 'runtime-lease-expired' | 'runtime-lease-invalid'
}

export const evaluateStoryAiRuntimeLease = (
  row: unknown,
  nowMs: number = Date.now(),
): RuntimeLeaseDecision => {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { enabled: false, reason: 'runtime-disabled' }
  }
  const data = row as Record<string, unknown>
  if (data.enabled !== true) return { enabled: false, reason: 'runtime-disabled' }

  // An ON flag without its issuance time cannot authorize a provider request.
  if (typeof data.updated_at !== 'string' || !data.updated_at.trim() || !Number.isFinite(nowMs)) {
    return { enabled: false, reason: 'runtime-lease-invalid' }
  }
  const issuedAtMs = Date.parse(data.updated_at)
  if (!Number.isFinite(issuedAtMs)) return { enabled: false, reason: 'runtime-lease-invalid' }

  const ageMs = nowMs - issuedAtMs
  if (ageMs < -STORY_AI_MAX_CLOCK_SKEW_MS) {
    return { enabled: false, reason: 'runtime-lease-invalid' }
  }
  if (ageMs >= STORY_AI_RUNTIME_LEASE_MS) {
    return { enabled: false, reason: 'runtime-lease-expired' }
  }
  return { enabled: true, reason: 'runtime-enabled' }
}
