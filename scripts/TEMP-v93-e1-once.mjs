import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// One-time synthetic v93 acceptance ONLY. Never rerun a paid workflow.
const branch = 'audit/v93-e1-once-20260917'
const productionSha = 'a5f6e8dd8c7e2c6884ec5be0d4d7b17ae756feac'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
const marker = readFileSync('audit/TEMP-v93-e1-trigger.txt', 'utf8').trim()
const count = text => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Historical reruns are prohibited')
assert.match(process.env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/u)
assert.equal(marker, live ? 'LIVE-V93-E1-ONCE-20260917' : 'DRY-V93-E1-ONCE-20260917')
assert.match(readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8'), /candidateLanguageMismatchFieldCodes/u)
assert.match(readFileSync('supabase/functions/story-generate/usage.ts', 'utf8'), /readStoryAiRuntimeState/u)
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `synthetic-v93-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
if (!live) {
  console.log('V93_DRY_PREFLIGHT_PASS; synthetic payload, no requests or provider calls; productionSHA=' + productionSha)
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key, 'Missing token/publishable key; no POST')
const checkRef = async ref => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const response = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/git/ref/heads/${ref}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' }, signal: ctrl.signal,
    })
    assert.equal(response.status, 200, 'GitHub ref lookup failed; no POST')
    return (await response.json()).object.sha
  } finally { clearTimeout(timer) }
}
assert.equal(await checkRef('main'), productionSha, 'Main moved; no POST')
assert.equal(await checkRef(branch), process.env.GITHUB_SHA, 'Audit branch moved; no POST')
// Exactly ONE HTTP POST. Client abort does not imply provider billing cancellation.
const ctrl = new AbortController()
const timer = setTimeout(() => ctrl.abort(), 140000)
let response
try {
  response = await fetch(endpoint, {
    method: 'POST', redirect: 'error',
    headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
    body: JSON.stringify(payload), signal: ctrl.signal,
  })
} finally { clearTimeout(timer) }
const headerNames = [
  'x-qissa-generation-source', 'x-qissa-fallback-reason', 'x-qissa-runtime-ai',
  'x-qissa-generation-failure-class', 'x-qissa-generation-failure-trace',
  'x-qissa-blueprint-safety-categories', 'x-qissa-blueprint-decision-repair',
  'x-qissa-provider-calls', 'x-qissa-generation-repair', 'x-qissa-repair-retry-used',
  'x-qissa-escalation-used', 'x-qissa-narrator-model-used', 'x-qissa-story-pipeline',
  'x-qissa-initial-story-words', 'x-qissa-final-story-words',
  'x-qissa-architect-elapsed-ms', 'x-qissa-architect-timeout-ms',
  'x-qissa-architect-model', 'x-qissa-narrator-model', 'x-qissa-escalation-model',
]
// Header value allowlist prevents accidental story text or personal data from entering public CI logs.
const metadata = Object.fromEntries(headerNames.map(name => {
  const value = response.headers.get(name)
  return [name, value === null ? null : /^[a-zA-Z0-9_.,:\[\]=+> -]{0,480}$/u.test(value) ? value : 'REDACTED']
}))
console.log('V93_E1_HTTP', response.status)
console.log('V93_E1_METADATA', JSON.stringify(metadata))
assert.equal(response.status, 200, 'HTTP failure; no retry')
const episode = (await response.json())?.episode
assert.ok(episode && typeof episode === 'object', 'Malformed E1 response; no retry')
const source = metadata['x-qissa-generation-source']
assert.equal(episode.generationSource, source, 'Body/header source mismatch')
if (source !== 'openai-structured') {
  console.log('V93_E1_NO_GO: fallback; no retry, no E2, no TTS')
  process.exitCode = 1
} else {
  assert.equal(metadata['x-qissa-story-pipeline'], 'split-v1')
  assert.equal(metadata['x-qissa-escalation-used'], 'false', 'Sol not authorized')
  assert.equal(metadata['x-qissa-narrator-model-used'], 'gpt-5.6-luna')
  assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'Canonical hero identity')
  const words = count(episode.story_text)
  assert.ok(words >= 320 && words <= 470, 'E1 hard length')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2 && new Set(episode.choices.map(c => c.choice_id)).size === 2, 'Two distinct choices')
  assert.equal(episode.safety_self_check?.approved, true)
  assert.equal(episode.safety_self_check?.required_action, 'publish')
  const eventLengths = [episode.state_patch?.last_event, ...episode.choices.map(c => c.state_patch?.last_event)].map(event => {
    assert.ok(typeof event === 'string' && /[.!?。؟]$/u.test(event.trim()) && event.length <= 300, 'Full-sentence memory integrity')
    return event.length
  })
  const resolutionWords = episode.choices.map(c => {
    const n = count(c.resolution_text)
    assert.ok(n >= 25 && n <= 60, 'Choice resolution length')
    return n
  })
  console.log('V93_E1_TECHNICAL_PASS', JSON.stringify({ storyWords: words, resolutionWords, eventLengths, providerCalls: metadata['x-qissa-provider-calls'], decisionRepair: metadata['x-qissa-blueprint-decision-repair'] }))
  console.log('EDITORIAL_REVIEW_PENDING; E2 and family beta remain NO-GO')
}
