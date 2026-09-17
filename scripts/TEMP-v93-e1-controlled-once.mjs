import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Disposable single-POST runner. No raw generated output or personally identifying content in logs.
const branch = 'audit/v93-e1-controlled-20260917b'
const mainSha = 'a1dd173f2542e3fcfe4c74bdfb66835d3069e631' // docs-only successor to deployed SHA
const deployedSha = 'a5f6e8dd8c7e2c6884ec5be0d4d7b17ae756feac'
const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const live = process.env.QISSA_LIVE === '1'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'replaying this audit is forbidden')
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u)
assert.equal(readFileSync('audit/TEMP-v93-e1-controlled-trigger.txt', 'utf8').trim(), live ? 'LIVE-V93-E1-CONTROLLED-ONE-20260917' : 'DRY-V93-E1-CONTROLLED-ONE-20260917')
assert.match(readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8'), /candidateLanguageMismatchFieldCodes/u)
assert.match(readFileSync('supabase/functions/story-generate/usage.ts', 'utf8'), /readStoryAiRuntimeState/u)
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `synthetic-v93-controlled-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
if (!live) {
  console.log('V93_CONTROLLED_DRY_GREEN: synthetic E1, no network/provider; main=' + mainSha + '; deployed=' + deployedSha)
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key, 'Missing credentials; NO POST')
const getRef = async ref => {
  const abort = AbortSignal.timeout(15000)
  const response = await fetch(`https://api.github.com/repos/jteshaboev1984-ops/qissa_app/git/ref/heads/${ref}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' }, signal: abort,
  })
  assert.equal(response.status, 200, 'GitHub SHA preflight failed: NO POST')
  return (await response.json()).object.sha
}
assert.equal(await getRef('main'), mainSha, 'Main advanced: NO POST')
assert.equal(await getRef(branch), process.env.GITHUB_SHA, 'Audit branch changed: NO POST')
// Exactly ONE synthetic production request. Caller timeout is not a billing cancellation.
const response = await fetch(endpoint, {
  method: 'POST', redirect: 'error',
  headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io' },
  body: JSON.stringify(payload), signal: AbortSignal.timeout(140000),
})
const readEnum = (name, allowed) => {
  const value = response.headers.get(name)
  return value !== null && allowed.includes(value) ? value : 'unreported'
}
const readNum = name => {
  const value = response.headers.get(name)
  return value !== null && /^\d{1,9}$/u.test(value) ? Number(value) : null
}
const rawTrace = response.headers.get('x-qissa-generation-failure-trace') ?? ''
const errors = [...rawTrace.matchAll(/(?:narrator|repair|repair-retry|escalation)-validation:([a-z_,]+)/gu)]
  .map(([, codes]) => codes.split(',').filter(code => /^[a-z_]{3,70}$/u.test(code)).slice(0, 12))
const fieldAllowlist = new Set(['title','story_text','preview','state_patch','vocabulary_word','vocabulary_example','aggregate_only',
  ...['choice_1','choice_2','choice_other'].flatMap(prefix => ['text','effect','resolution','seed','state_patch'].map(part => `${prefix}_${part}`))])
const fieldMatch = rawTrace.match(/language_fields=([a-z_0-9+]+)/u)
const languageFields = fieldMatch ? fieldMatch[1].split('+').filter(field => fieldAllowlist.has(field)) : []
const metadata = {
  http: response.status,
  source: readEnum('x-qissa-generation-source', ['safe-fallback','openai-structured']),
  runtime: readEnum('x-qissa-runtime-ai', ['runtime-enabled','runtime-disabled','runtime-lease-expired','runtime-lease-invalid']),
  fallback: readEnum('x-qissa-fallback-reason', ['runtime-disabled','runtime-lease-expired','runtime-lease-invalid','provider-timeout','validation','safety','blueprint-validation']),
  failureClass: readEnum('x-qissa-generation-failure-class', ['validation','safety','provider','provider-timeout','blueprint','repair','unknown']),
  languageFields, errors, providerCalls: readNum('x-qissa-provider-calls'),
  initialWords: readNum('x-qissa-initial-story-words'), finalWords: readNum('x-qissa-final-story-words'),
  architectElapsedMs: readNum('x-qissa-architect-elapsed-ms'), architectTimeoutMs: readNum('x-qissa-architect-timeout-ms'),
  decisionRepair: readEnum('x-qissa-blueprint-decision-repair',['none','template']),
  narratorUsed: readEnum('x-qissa-narrator-model-used',['gpt-5.6-luna','none']),
  escalationUsed: readEnum('x-qissa-escalation-used',['true','false']),
}
console.log('V93_CONTROLLED_E1_METADATA', JSON.stringify(metadata))
assert.equal(response.status, 200, 'HTTP error: NO RETRY')
const episode = (await response.json())?.episode
assert.ok(episode && typeof episode === 'object', 'Malformed response: NO RETRY')
assert.equal(episode.generationSource, metadata.source, 'Body/header mismatch: NO RETRY')
if (metadata.source !== 'openai-structured') {
  console.log('V93_CONTROLLED_E1_NO_GO: fallback; NO retry, NO E2 or TTS')
  process.exitCode = 1
} else {
  assert.equal(metadata.escalationUsed, 'false', 'Sol escalation not authorized')
  assert.equal(metadata.narratorUsed, 'gpt-5.6-luna')
  assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'Hero identity incorrect')
  const count = text => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
  const words = count(episode.story_text)
  assert.ok(words >= 320 && words <= 470, 'E1 word range violation')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2 && new Set(episode.choices.map(c => c.choice_id)).size === 2, 'E1 choice count/identity')
  assert.equal(episode.safety_self_check?.approved, true)
  assert.equal(episode.safety_self_check?.required_action, 'publish')
  const eventLengths = [episode.state_patch?.last_event,...episode.choices.map(c => c.state_patch?.last_event)].map(event => {
    assert.ok(typeof event === 'string' && /[.!?。؟]$/u.test(event.trim()) && event.length <= 300, 'Memory event must be a complete sentence')
    return event.length
  })
  const resolutionWords = episode.choices.map(c => {
    const n = count(c.resolution_text)
    assert.ok(n >= 25 && n <= 60, 'Resolution length wrong')
    return n
  })
  console.log('V93_CONTROLLED_E1_TECH_PASS', JSON.stringify({ storyWords:words, resolutionWords, eventLengths, decisionRepair:metadata.decisionRepair, providerCalls:metadata.providerCalls }))
  console.log('EDITORIAL UZ REVIEW STILL REQUIRED; E2, family beta remain NO-GO')
}
