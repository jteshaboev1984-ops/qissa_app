import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// TEMP audit script: one synthetic E1, no retries, never merge to main.
const branchName = 'audit/v86-e1-once-20260917'
const sourceSha = 'fe4c02e13356b9103dc1b97e26801e7cad61f1d7'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v86-e1-trigger.txt', 'utf8').trim()
const wordCount = (text) => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
assert.equal(process.env.GITHUB_REF, `refs/heads/${branchName}`)
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u)
assert.equal(marker, live ? 'LIVE-V86-E1-ONCE-20260917' : 'DRY-V86-E1-PREFLIGHT-20260917')
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `audit-v86-e1-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
assert.equal(payload.selections.language, 'uz')
assert.equal(payload.selections.ageGroup, '5-7')
assert.equal(sourceSha.length, 40)
if (!live) {
  console.log('V86_DRY_PREFLIGHT_PASS: synthetic Uzbek age 5–7 E1; one-shot request configured; zero story HTTP/provider calls; source', sourceSha)
  process.exit(0)
}

// The current audit branch HEAD must equal the historical run's event SHA.
// Once its trigger/workflow are deleted, manual reruns fail before POST.
const githubToken = process.env.GITHUB_TOKEN?.trim()
const anonKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(githubToken, 'missing GitHub token')
assert.ok(anonKey, 'missing Supabase publishable key')
const headAbort = new AbortController()
const headTimer = setTimeout(() => headAbort.abort(), 15000)
let headResponse
try {
  headResponse = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/branches/${encodeURIComponent(branchName)}`, {
    headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json' }, signal: headAbort.signal,
  })
} finally { clearTimeout(headTimer) }
assert.equal(headResponse.status, 200, 'cannot verify branch HEAD: fail closed')
assert.equal((await headResponse.json())?.commit?.sha, process.env.GITHUB_SHA, 'historical/replaced trigger: no production request')

// This block contains exactly one fetch POST; no catch, retry, loop or redirect.
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
  'x-qissa-provider-calls', 'x-qissa-generation-repair', 'x-qissa-repair-retry-used',
  'x-qissa-escalation-used', 'x-qissa-narrator-model-used', 'x-qissa-story-pipeline',
  'x-qissa-initial-story-words', 'x-qissa-final-story-words',
  'x-qissa-architect-model', 'x-qissa-narrator-model', 'x-qissa-escalation-model',
]
const diagnostics = Object.fromEntries(names.map(name => [name, response.headers.get(name)]))
console.log('V86_E1_HTTP', response.status)
console.log('V86_E1_DIAGNOSTICS', JSON.stringify(diagnostics))
console.log('V86_E1_RESPONSE_JSON', raw)
assert.equal(response.status, 200, 'unexpected HTTP response; no retry')
assert.equal(diagnostics['x-qissa-story-pipeline'], 'split-v1', 'wrong pipeline')
assert.equal(diagnostics['x-qissa-generation-source'], 'openai-structured', 'fallback or non-AI source; stop')
assert.equal(diagnostics['x-qissa-escalation-used'], 'false', 'unexpected paid Sol escalation')
assert.equal(diagnostics['x-qissa-narrator-model-used'], 'gpt-5.6-luna', 'wrong model')
const episode = JSON.parse(raw)?.episode
assert.ok(episode && typeof episode === 'object', 'missing episode')
assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'hero identity regression')
assert.ok(wordCount(episode.story_text) >= 320 && wordCount(episode.story_text) <= 470, 'invalid E1 length')
assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'two choices required')
assert.equal(new Set(episode.choices.map(c => c.choice_id)).size, 2, 'duplicate choice IDs')
assert.ok(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'safety not approved')
for (const [label, value] of [['top', episode.state_patch?.last_event], ...episode.choices.map((choice, index) => [index === 0 ? 'A' : 'B', choice.state_patch?.last_event])]) {
  assert.ok(typeof value === 'string' && value.trim(), `${label} missing memory event`)
  assert.ok(/[.!?。؟]$/u.test(value.trim()), `${label} incomplete memory sentence: ${value}`)
  assert.ok(value.length <= 300, `${label} memory too long`)
}
for (const choice of episode.choices) {
  assert.ok(typeof choice.text === 'string' && choice.text.trim(), 'blank choice')
  assert.ok(typeof choice.resolution_text === 'string' && wordCount(choice.resolution_text) >= 25 && wordCount(choice.resolution_text) <= 60, 'invalid bridge length')
}
console.log('V86_E1_TECHNICAL_AND_MEMORY_PASS', JSON.stringify({ title: episode.title, storyWords: wordCount(episode.story_text), bridgeWords: episode.choices.map(c => wordCount(c.resolution_text)), memoryLengths: [episode.state_patch.last_event.length, ...episode.choices.map(c => c.state_patch.last_event.length)], providerCallsDiagnostic: diagnostics['x-qissa-provider-calls'] }))
console.log('V86_EDITORIAL_AND_FAMILY_BETA_REVIEW_REQUIRED: no semantic or literary approval from technical pass.')
