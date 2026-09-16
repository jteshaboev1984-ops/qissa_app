import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Temporary synthetic audit runner. Never add this file to main. No retries.
const BRANCH = 'audit/v85-e1-once-20260916'
const SOURCE_SHA = '8f01f4a895371f9641727885921189b0bfffa36c'
const ENDPOINT = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v85-e1-trigger.txt', 'utf8').trim()
const words = (value) => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length

assert.equal(process.env.GITHUB_REF, `refs/heads/${BRANCH}`, 'unexpected audit branch')
assert.equal(marker, live ? 'LIVE-V85-E1-ONCE-20260916' : 'DRY-V85-E1-PREFLIGHT-20260916', 'unexpected audit trigger')
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u, 'missing event commit SHA')
const payload = {
  installationId: crypto.randomUUID(),
  selections: {
    ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika',
    stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
  },
  seriesState: {
    id: `audit-v85-e1-${crypto.randomUUID()}`,
    mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',
    relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0,
  },
  privacyConsent: {
    version: '2026-06-25-v1', acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
  },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
assert.equal(payload.selections.storyMode, 'series')
assert.equal(payload.selections.language, 'uz')
assert.equal(payload.selections.ageGroup, '5-7')
assert.equal(SOURCE_SHA.length, 40)

if (!live) {
  console.log('V85_DRY_PREFLIGHT_PASS: one synthetic Uzbek 5-7 series E1 payload; zero HTTP/provider calls; production source SHA', SOURCE_SHA)
  process.exit(0)
}

// A historical workflow rerun after the trigger branch advances MUST fail before any POST.
const githubToken = process.env.GITHUB_TOKEN?.trim()
const anonKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(githubToken, 'missing GitHub read token')
assert.ok(anonKey, 'missing Supabase publishable/anon key')
const branchController = new AbortController()
const branchTimer = setTimeout(() => branchController.abort(), 15000)
let branchResponse
try {
  branchResponse = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/branches/${encodeURIComponent(BRANCH)}`, {
    headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json' },
    signal: branchController.signal,
  })
} finally { clearTimeout(branchTimer) }
assert.equal(branchResponse.status, 200, 'cannot verify audit branch HEAD, fail closed')
const branch = await branchResponse.json()
assert.equal(branch?.commit?.sha, process.env.GITHUB_SHA, 'historical/replaced audit trigger; no production call')

let requestCount = 0
assert.equal(requestCount, 0)
requestCount += 1
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 125000)
let response
let raw
try {
  response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', apikey: anonKey,
      authorization: `Bearer ${anonKey}`, origin: 'https://jteshaboev1984-ops.github.io',
    },
    body: JSON.stringify(payload), signal: controller.signal,
  })
  raw = await response.text()
} finally { clearTimeout(timeout) }
assert.equal(requestCount, 1, 'more than one HTTP POST attempted')
const names = [
  'x-qissa-generation-source', 'x-qissa-fallback-reason', 'x-qissa-runtime-ai',
  'x-qissa-generation-failure-class', 'x-qissa-generation-failure-trace',
  'x-qissa-provider-calls', 'x-qissa-generation-repair', 'x-qissa-repair-retry-used',
  'x-qissa-escalation-used', 'x-qissa-narrator-model-used', 'x-qissa-story-pipeline',
  'x-qissa-initial-story-words', 'x-qissa-final-story-words',
  'x-qissa-architect-model', 'x-qissa-narrator-model', 'x-qissa-escalation-model',
]
const diagnostics = Object.fromEntries(names.map(name => [name, response.headers.get(name)]))
console.log('V85_E1_HTTP', response.status)
console.log('V85_E1_DIAGNOSTICS', JSON.stringify(diagnostics))
console.log('V85_E1_RESPONSE_JSON', raw)
assert.equal(response.status, 200, 'unexpected story-generate HTTP response')
assert.equal(diagnostics['x-qissa-story-pipeline'], 'split-v1', 'wrong pipeline')
assert.equal(diagnostics['x-qissa-generation-source'], 'openai-structured', `V85_E1_FALLBACK_STOP:${diagnostics['x-qissa-generation-failure-class'] || diagnostics['x-qissa-fallback-reason'] || 'unknown'}`)
assert.equal(diagnostics['x-qissa-escalation-used'], 'false', 'unexpected Sol escalation')
assert.equal(diagnostics['x-qissa-narrator-model-used'], 'gpt-5.6-luna', 'unexpected narrator model')
const body = JSON.parse(raw)
const episode = body?.episode
assert.ok(episode && typeof episode === 'object', 'missing episode')
assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'hero identity regression')
assert.ok(words(episode.story_text) >= 320 && words(episode.story_text) <= 470, `story length: ${words(episode.story_text)}`)
assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2, 'expected two choices')
assert.equal(new Set(episode.choices.map(c => c.choice_id)).size, 2, 'duplicate choice IDs')
assert.ok(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'unapproved safety verdict')
for (const choice of episode.choices) {
  assert.ok(typeof choice.text === 'string' && choice.text.trim(), 'missing choice text')
  assert.ok(typeof choice.resolution_text === 'string' && words(choice.resolution_text) >= 25 && words(choice.resolution_text) <= 60, 'invalid bridge length')
}
console.log('V85_E1_TECHNICAL_PASS', JSON.stringify({ title: episode.title, storyWords: words(episode.story_text), choices: episode.choices.map(c => ({ id: c.choice_id, bridgeWords: words(c.resolution_text) })), providerCallsDiagnostic: diagnostics['x-qissa-provider-calls'] }))
console.log('V85_EDITORIAL_REVIEW_REQUIRED: technical PASS does not approve causal choice, Uzbek quality or family beta.')
