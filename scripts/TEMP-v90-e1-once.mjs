import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// SYNTHETIC profile ONLY. Exactly ONE POST in live mode, no retries, E2, TTS or user records.
// Historical paid runs MUST NOT be rerun. This script/workflow/trigger are temporary.
const branch = 'audit/v90-e1-once-20260917'
const functionalSha = '01f2c45ffeb5d454bdd589dc3013f5070d0bb9dd'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v90-e1-trigger.txt', 'utf8').trim()
const countWords = value => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`, 'wrong branch')
assert.match(process.env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/u)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'replayed workflow forbidden')
assert.equal(marker, live ? 'LIVE-V90-E1-ONLY-20260917' : 'DRY-V90-E1-ONLY-20260917', 'wrong trigger marker')
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `synthetic-v90-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
assert.equal(payload.selections.ageGroup, '5-7')
assert.equal(payload.selections.language, 'uz')
if (!live) {
  console.log('V90_DRY_PREFLIGHT_PASS; exactly one synthetic E1 prepared; zero HTTP/model/TTS/database calls; pinned functional SHA', functionalSha)
  process.exit(0)
}
const githubToken = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(githubToken && key, 'required GitHub/publishable key missing; no production POST')
const headController = new AbortController()
const headTimer = setTimeout(() => headController.abort(), 15000)
let branchResponse
try {
  branchResponse = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/branches/${encodeURIComponent(branch)}`, {
    headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json' },
    signal: headController.signal,
  })
} finally { clearTimeout(headTimer) }
assert.equal(branchResponse.status, 200, 'remote HEAD verification failed; no POST')
assert.equal((await branchResponse.json())?.commit?.sha, process.env.GITHUB_SHA, 'historical/stale audit HEAD; no POST')
// ONE network request to story-generate. Abort only bounds local waiting; it does NOT cancel upstream billing.
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 140000)
let response, raw
try {
  response = await fetch(endpoint, {
    method: 'POST', redirect: 'error',
    headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify(payload), signal: controller.signal,
  })
  raw = await response.text()
} finally { clearTimeout(timer) }
const names = [
  'x-qissa-generation-source', 'x-qissa-fallback-reason', 'x-qissa-runtime-ai',
  'x-qissa-generation-failure-class', 'x-qissa-generation-failure-trace',
  'x-qissa-blueprint-safety-categories', 'x-qissa-blueprint-decision-repair',
  'x-qissa-provider-calls', 'x-qissa-generation-repair', 'x-qissa-repair-retry-used',
  'x-qissa-escalation-used', 'x-qissa-narrator-model-used', 'x-qissa-story-pipeline',
  'x-qissa-initial-story-words', 'x-qissa-final-story-words',
  'x-qissa-architect-model', 'x-qissa-narrator-model', 'x-qissa-escalation-model',
]
const diagnostics = Object.fromEntries(names.map(name => [name, response.headers.get(name)]))
console.log('V90_E1_HTTP', response.status)
console.log('V90_E1_DIAGNOSTICS', JSON.stringify(diagnostics))
console.log('V90_E1_RESPONSE_JSON_SYNTHETIC', raw)
assert.equal(response.status, 200, 'unexpected HTTP status; NO RETRY')
assert.equal(diagnostics['x-qissa-story-pipeline'], 'split-v1', 'wrong story pipeline')
assert.equal(diagnostics['x-qissa-generation-source'], 'openai-structured', 'safe fallback; NO RETRY')
assert.equal(diagnostics['x-qissa-escalation-used'], 'false', 'unapproved model escalation')
assert.equal(diagnostics['x-qissa-narrator-model-used'], 'gpt-5.6-luna', 'wrong narrator model')
assert.ok(['template', 'none'].includes(diagnostics['x-qissa-blueprint-decision-repair']), 'decision repair diagnostic missing')
const episode = JSON.parse(raw)?.episode
assert.ok(episode && typeof episode === 'object', 'episode missing')
assert.equal(episode.generationSource, 'openai-structured')
assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'hero identity broken')
assert.ok(countWords(episode.story_text) >= 320 && countWords(episode.story_text) <= 470, 'E1 word count outside hard range')
assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'E1 requires two choices')
assert.equal(new Set(episode.choices.map(c => c.choice_id)).size, 2, 'duplicate choice IDs')
assert.ok(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'safety not approved')
const events = [['top', episode.state_patch?.last_event], ...episode.choices.map((choice, index) => [index === 0 ? 'A' : 'B', choice.state_patch?.last_event])]
for (const [label, event] of events) {
  assert.ok(typeof event === 'string' && event.trim(), `${label} memory event empty`)
  assert.ok(/[.!?。؟]$/u.test(event.trim()), `${label} memory event truncated: ${event}`)
  assert.ok(event.length <= 300, `${label} memory >300 chars`)
}
for (const choice of episode.choices) {
  assert.ok(typeof choice.text === 'string' && choice.text.trim(), 'choice text missing')
  assert.ok(countWords(choice.resolution_text) >= 25 && countWords(choice.resolution_text) <= 60, 'resolution length invalid')
}
console.log('V90_E1_TECHNICAL_PASS', JSON.stringify({ title: episode.title, storyWords: countWords(episode.story_text), resolutionWords: episode.choices.map(c => countWords(c.resolution_text)), memoryLengths: events.map(([, e]) => e.length), decisionRepair: diagnostics['x-qissa-blueprint-decision-repair'], providerCallsDiagnostic: diagnostics['x-qissa-provider-calls'] }))
console.log('EDITORIAL_REVIEW_PENDING: E2 A/B not run; family beta not approved')
