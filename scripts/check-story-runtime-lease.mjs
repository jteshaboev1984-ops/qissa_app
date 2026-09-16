import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  evaluateStoryAiRuntimeLease,
  STORY_AI_MAX_CLOCK_SKEW_MS,
  STORY_AI_RUNTIME_LEASE_MS,
} from '../supabase/functions/story-generate/runtime-lease.ts'

const now = Date.parse('2026-09-16T12:00:00.000Z')
const issued = (ageMs) => new Date(now - ageMs).toISOString()
const decision = (row, current = now) => evaluateStoryAiRuntimeLease(row, current)
const disabled = (row, reason) => assert.deepEqual(decision(row), { enabled: false, reason })

assert.equal(STORY_AI_RUNTIME_LEASE_MS, 180_000, 'lease must be short and bounded')
assert.equal(STORY_AI_MAX_CLOCK_SKEW_MS, 30_000, 'clock skew must be bounded')
disabled(null, 'runtime-disabled')
disabled({ enabled: false, updated_at: issued(0) }, 'runtime-disabled')
disabled({ enabled: true }, 'runtime-lease-invalid')
disabled({ enabled: true, updated_at: null }, 'runtime-lease-invalid')
disabled({ enabled: true, updated_at: 'not-a-date' }, 'runtime-lease-invalid')
disabled({ enabled: true, updated_at: issued(STORY_AI_RUNTIME_LEASE_MS) }, 'runtime-lease-expired')
disabled({ enabled: true, updated_at: issued(STORY_AI_RUNTIME_LEASE_MS + 1) }, 'runtime-lease-expired')
disabled({ enabled: true, updated_at: issued(-STORY_AI_MAX_CLOCK_SKEW_MS - 1) }, 'runtime-lease-invalid')
assert.deepEqual(decision({ enabled: true, updated_at: issued(0) }), { enabled: true, reason: 'runtime-enabled' })
assert.deepEqual(decision({ enabled: true, updated_at: issued(STORY_AI_RUNTIME_LEASE_MS - 1) }), { enabled: true, reason: 'runtime-enabled' })
assert.deepEqual(decision({ enabled: true, updated_at: issued(-STORY_AI_MAX_CLOCK_SKEW_MS) }), { enabled: true, reason: 'runtime-enabled' })
assert.deepEqual(decision({ enabled: true, updated_at: issued(0) }, Number.NaN), { enabled: false, reason: 'runtime-lease-invalid' })

const usage = readFileSync('supabase/functions/story-generate/usage.ts', 'utf8')
const legacy = readFileSync('supabase/functions/story-generate/index.ts', 'utf8')
const split = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
assert.ok(usage.includes(".select('enabled, updated_at')"), 'runtime check must request issuance time')
assert.ok(usage.includes('evaluateStoryAiRuntimeLease(data, Date.now())'), 'runtime check must enforce expiry')
for (const [name, source] of [['legacy', legacy], ['split', split]]) {
  const runtime = source.indexOf('const runtimeState = await readStoryAiRuntimeState()')
  const claim = source.indexOf('claimStoryGeneration(installationId)')
  assert.ok(runtime >= 0 && claim > runtime, `${name} must check lease before accounting/provider`)
  assert.ok(source.includes('if (!runtimeState.enabled)'), `${name} must fail closed on lease expiry`)
}
console.log('Story AI runtime lease regression PASS: OFF/missing/malformed/future/expired fail closed; valid lease works; both entrypoints gate before accounting/provider.')
