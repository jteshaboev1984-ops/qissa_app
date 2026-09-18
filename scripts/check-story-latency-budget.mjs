import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const budgetPath = 'supabase/functions/story-generate/latency-budget.ts'
assert.ok(existsSync(budgetPath), 'Missing shared request deadline: the 18s Architect timeout must not be raised without a bounded end-to-end budget.')
const {
  STORY_REQUEST_BUDGET_MS,
  STORY_SAFETY_RESERVE_MS,
  stageTimeoutMs,
  hasSafetyBudget,
} = await import('../supabase/functions/story-generate/latency-budget.ts')

assert.equal(STORY_REQUEST_BUDGET_MS, 124_000)
assert.equal(STORY_SAFETY_RESERVE_MS, 38_000)
const start = 10_000
const deadline = start + STORY_REQUEST_BUDGET_MS
assert.equal(stageTimeoutMs(deadline, start, 30_000, 30_000 + STORY_SAFETY_RESERVE_MS), 30_000, 'Architect gains bounded time')
assert.equal(stageTimeoutMs(deadline, start + 30_000, 30_000, STORY_SAFETY_RESERVE_MS), 30_000, 'Narrator retains its full budget')
assert.equal(stageTimeoutMs(deadline, start + 60_000, 30_000, STORY_SAFETY_RESERVE_MS), 26_000, 'Repair must yield the 38s safety reserve')
assert.equal(stageTimeoutMs(deadline, start + 86_000, 30_000, STORY_SAFETY_RESERVE_MS), null, 'No billable retry when only safety reserve remains')
assert.equal(hasSafetyBudget(deadline, start + 86_000), true)
assert.equal(hasSafetyBudget(deadline, start + 86_001), false)
assert.equal(stageTimeoutMs(deadline, start + 39_000, 30_000, STORY_SAFETY_RESERVE_MS), 30_000, 'Fast upstream calls may lend time to Repair')
assert.equal(stageTimeoutMs(deadline, start + 69_000, 30_000, STORY_SAFETY_RESERVE_MS), 17_000, 'Optional correction borrows only real slack')
assert.equal(stageTimeoutMs(deadline, start + 78_000, 30_000, STORY_SAFETY_RESERVE_MS), 8_000, 'Minimum useful window is accepted')
assert.equal(stageTimeoutMs(deadline, start + 78_001, 30_000, STORY_SAFETY_RESERVE_MS), null, 'A shorter window is refused before a provider call')
assert.equal(stageTimeoutMs(deadline, start + 200_000, 30_000, STORY_SAFETY_RESERVE_MS), null, 'An expired deadline never starts paid work')
assert.equal(stageTimeoutMs(deadline, start, 0, STORY_SAFETY_RESERVE_MS), null, 'Nonpositive caps cannot start paid work')

const orchestrator = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const architect = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const repair = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
const cost = readFileSync('scripts/check-story-cost-guard.mjs', 'utf8')
assert.match(orchestrator, /const requestStartedAt = Date\.now\(\)/, 'Deadline must include request preparation and accounting')
assert.match(orchestrator, /requestStartedAt \+ STORY_REQUEST_BUDGET_MS/, 'Orchestrator must share one absolute deadline')
assert.ok(/generateStoryBlueprint\(openAiApiKey, architectModel, context, architectTimeoutMs, onRequestAttempt\)/u.test(orchestrator), 'Architect must use allocated timeout and request-local observer')
assert.ok(/generateStoryNarration\(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs, onRequestAttempt\)/u.test(orchestrator), 'Narrator must use allocated timeout and request-local observer')
assert.match(orchestrator, /hasSafetyBudget\(deadlineAt, Date\.now\(\)\)/, 'Mandatory safety must be reserved before entering provider safety')
assert.match(orchestrator, /X-QISSA-Architect-Elapsed-Ms/, 'Architect elapsed duration must be observable without logging a story')
assert.match(orchestrator, /X-QISSA-Architect-Timeout-Ms/, 'Architect deadline must be observable without logging a story')
assert.match(architect, /timeoutMs = 30_000/, 'Architect should have a 30s upper cap, not an unconditional 30s entitlement')
assert.match(repair, /retryFeedback = ''\s*,\s*timeoutMs = 30_000/, 'Repair must accept remaining-time cap')
assert.match(repair, /requestSafetyEvaluation[\s\S]*timeoutMs = 12_000/, 'Primary semantic safety remains capped at 12s')
assert.match(repair, /requestHumiliationAdjudication[\s\S]*8_000[\s\S]*260[\s\S]*'low'/, 'Isolated humiliation adjudication is bounded to 8s')
assert.match(repair, /requestFearAdjudication[\s\S]*8_000[\s\S]*260[\s\S]*'low'/, 'Existing fear adjudication remains bounded to 8s')
assert.ok(12_000 + 8_000 + 8_000 + 8_000 <= STORY_SAFETY_RESERVE_MS, 'Worst bounded safety path must fit the 38s reserve: primary + consistency correction + humiliation adjudication + moderation fear adjudication')
assert.match(cost, /latency-budget\.ts/, 'Accounting check must cover shared latency budget')
assert.match(cost, /hasSafetyBudget/, 'Accounting check must verify mandatory safety reserve wiring')
assert.doesNotMatch(orchestrator, /Promise\.race\([^)]*generateStoryBlueprint/, 'Do not race/cancel a promise without aborting the upstream HTTP request')

console.log('Story latency budget PASS: 124s absolute deadline; Architect up to 30s, full Narrator cap, optional calls use slack, mandatory 38s safety reserve, provider-free wiring and numeric diagnostics.')
