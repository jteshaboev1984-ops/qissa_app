import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// One synthetic E1; one HTTP POST; no retry, no E2, no TTS. Never merge this runner.
const branchName = 'audit/v87-e1-once-20260917'
const pinnedSourceSha = '659233c920784eca5ac425992064011b016bf9a1'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v87-e1-trigger.txt', 'utf8').trim()
const words = value => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length
assert.equal(process.env.GITHUB_REF, `refs/heads/${branchName}`)
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u)
assert.equal(marker, live ? 'LIVE-V87-E1-ONCE-20260917' : 'DRY-V87-E1-PREFLIGHT-20260917')
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `audit-v87-e1-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.equal(payload.selections.language, 'uz')
assert.equal(payload.selections.ageGroup, '5-7')
assert.deepEqual(payload.seriesState.choiceHistory, [])
if (!live) {
  console.log('V87_DRY_PREFLIGHT_PASS: single synthetic Uzbek age 5-7 E1, no HTTP/provider call; pinned source', pinnedSourceSha)
  process.exit(0)
}
const githubToken = process.env.GITHUB_TOKEN?.trim()
const anonKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(githubToken && anonKey, 'missing required GitHub or publishable key; no request')
// Replays of this historical workflow must fail before the production request.
const headAbort = new AbortController()
const headTimer = setTimeout(() => headAbort.abort(), 15000)
let headResponse
try {
  headResponse = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/branches/${encodeURIComponent(branchName)}`, {
    headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json' }, signal: headAbort.signal,
  })
} finally { clearTimeout(headTimer) }
assert.equal(headResponse.status, 200, 'cannot confirm audit branch HEAD; no POST')
assert.equal((await headResponse.json())?.commit?.sha, process.env.GITHUB_SHA, 'historical audit HEAD; no POST')
// Exactly one POST, no catch/retry/loop/redirect. Abort caps waiting, not upstream billed work.
const requestAbort = new AbortController()
const requestTimer = setTimeout(() => requestAbort.abort(), 125000)
let response, raw
try {
  response = await fetch(endpoint, {
    method: 'POST', redirect: 'error',
    headers: { 'content-type': 'application/json', apikey: anonKey, authorization: `Bearer ${anonKey}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify(payload), signal: requestAbort.signal,
  })
  raw = await response.text()
} finally { clearTimeout(requestTimer) }
const names = [
  'x-qissa-generation-source', 'x-qissa-fallback-reason', 'x-qissa-runtime-ai',
  'x-qissa-generation-failure-class', 'x-qissa-generation-failure-trace',
  'x-qissa-blueprint-safety-categories', 'x-qissa-provider-calls',
  'x-qissa-generation-repair', 'x-qissa-repair-retry-used',
  'x-qissa-escalation-used', 'x-qissa-narrator-model-used', 'x-qissa-story-pipeline',
  'x-qissa-initial-story-words', 'x-qissa-final-story-words',
  'x-qissa-architect-model', 'x-qissa-narrator-model', 'x-qissa-escalation-model',
]
const diagnostics = Object.fromEntries(names.map(name => [name, response.headers.get(name)]))
console.log('V87_E1_HTTP', response.status)
console.log('V87_E1_DIAGNOSTICS', JSON.stringify(diagnostics))
console.log('V87_E1_RESPONSE_JSON', raw)
assert.equal(response.status, 200, 'HTTP not OK; stop without retry')
assert.equal(diagnostics['x-qissa-story-pipeline'], 'split-v1', 'wrong pipeline')
assert.equal(diagnostics['x-qissa-generation-source'], 'openai-structured', 'fallback; stop without retry')
assert.equal(diagnostics['x-qissa-escalation-used'], 'false', 'unapproved escalation')
assert.equal(diagnostics['x-qissa-narrator-model-used'], 'gpt-5.6-luna', 'wrong narrator')
const episode = JSON.parse(raw)?.episode
assert.ok(episode && typeof episode === 'object', 'missing episode')
assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'hero identity')
assert.ok(words(episode.story_text) >= 320 && words(episode.story_text) <= 470, 'story length')
assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'choice count')
assert.equal(new Set(episode.choices.map(c => c.choice_id)).size, 2, 'choice IDs')
assert.ok(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'safety approval missing')
const events = [['top', episode.state_patch?.last_event], ...episode.choices.map((c, i) => [i === 0 ? 'A' : 'B', c.state_patch?.last_event])]
for (const [label, event] of events) {
  assert.ok(typeof event === 'string' && event.trim(), `${label} empty event`)
  assert.ok(/[.!?。؟]$/u.test(event.trim()), `${label} unfinished event: ${event}`)
  assert.ok(event.length <= 300, `${label} event exceeds 300 chars`)
}
for (const choice of episode.choices) {
  assert.ok(choice.text?.trim() && words(choice.resolution_text) >= 25 && words(choice.resolution_text) <= 60, 'choice or bridge invalid')
}
console.log('V87_E1_TECHNICAL_MEMORY_PASS', JSON.stringify({ title: episode.title, storyWords: words(episode.story_text), bridgeWords: episode.choices.map(c => words(c.resolution_text)), memoryLengths: events.map(([, e]) => e.length), providerCallsDiagnostic: diagnostics['x-qissa-provider-calls'] }))
console.log('V87_EDITORIAL_REVIEW_STILL_REQUIRED; no E2 or beta approval')
