import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Disposable synthetic one-POST audit runner. Never print generated prose, child data, or response bodies.
const repository = 'jteshaboev1984-ops/qissa_app'
const branch = 'audit/v94-e1-controlled-once-20260917'
const deployedSha = '3dd6d84259e69f62afc8f30b8c2e9f37645ad88a'
const live = process.env.QISSA_LIVE === '1'
assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`)
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1', 'Audit reruns are forbidden')
assert.match(process.env.GITHUB_SHA ?? '', /^[0-9a-f]{40}$/u)
assert.equal(readFileSync('audit/TEMP-v94-e1-trigger.txt', 'utf8').trim(),
  live ? 'LIVE-V94-E1-ONCE-20260917' : 'DRY-V94-E1-ONCE-20260917')
assert.match(readFileSync('supabase/functions/story-generate/prompt.ts', 'utf8'), /repeatedUnderlength\s*\?\s*80\s*:\s*45/u)
assert.match(readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8'), /candidateLanguageMismatchFieldCodes/u)
const payload = {
  installationId: crypto.randomUUID(),
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: `synthetic-v94-once-${crypto.randomUUID()}`, mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
  privacyConsent: { version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true },
}
assert.equal(payload.seriesState.episodeCount, 0)
assert.deepEqual(payload.seriesState.choiceHistory, [])
if (!live) {
  console.log('V94_E1_PROVIDER_FREE_DRY_PASS: synthetic one-POST plan, expected production SHA=' + deployedSha)
  process.exit(0)
}
const token = process.env.GITHUB_TOKEN?.trim()
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert.ok(token && key, 'Missing credentials: NO POST')
const getRef = async ref => {
  const response = await fetch(`https://api.github.com/repos/${repository}/git/ref/heads/${ref}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(15000),
  })
  assert.equal(response.status, 200, 'GitHub SHA check failed: NO POST')
  return (await response.json()).object.sha
}
assert.equal(await getRef('main'), deployedSha, 'main changed: NO POST')
assert.equal(await getRef(branch), process.env.GITHUB_SHA, 'Audit branch changed: NO POST')

// Exactly one fetch POST, no loop, retry, delayed dispatch, E2, Sol or TTS.
const response = await fetch('https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate', {
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
const trace = response.headers.get('x-qissa-generation-failure-trace') ?? ''
const errors = [...trace.matchAll(/(?:narrator|repair|repair-retry|escalation)-validation:([a-z_,]+)/gu)]
  .map(([, codes]) => codes.split(',').filter(code => /^[a-z_]{3,70}$/u.test(code)).slice(0, 12))
const allowedFields = new Set(['title','story_text','preview','state_patch','vocabulary_word','vocabulary_example','aggregate_only',
  ...['choice_1','choice_2','choice_other'].flatMap(prefix => ['text','effect','resolution','seed','state_patch'].map(part => `${prefix}_${part}`))])
const fieldMatch = trace.match(/language_fields=([a-z_0-9+]+)/u)
const languageFields = fieldMatch ? fieldMatch[1].split('+').filter(field => allowedFields.has(field)) : []
const meta = {
  http: response.status,
  source: readEnum('x-qissa-generation-source', ['safe-fallback','openai-structured']),
  runtime: readEnum('x-qissa-runtime-ai', ['enabled','runtime-disabled','runtime-lease-expired','runtime-lease-invalid']),
  fallback: readEnum('x-qissa-fallback-reason', ['runtime-disabled','runtime-lease-expired','runtime-lease-invalid','generation-or-safety-failed','generation-time-budget','rate-limit-identity-missing']),
  failureClass: readEnum('x-qissa-generation-failure-class', ['validation','semantic-safety','deterministic-safety','provider-timeout','provider-http','provider-error','provider-incomplete','provider-failed','blueprint-validation','repair-contract','time-budget','unknown']),
  languageFields, errors,
  providerCalls: readNum('x-qissa-provider-calls'),
  initialWords: readNum('x-qissa-initial-story-words'), finalWords: readNum('x-qissa-final-story-words'),
  architectElapsedMs: readNum('x-qissa-architect-elapsed-ms'),
  decisionRepair: readEnum('x-qissa-blueprint-decision-repair', ['none','template']),
  narratorUsed: readEnum('x-qissa-narrator-model-used', ['gpt-5.6-luna','none']),
  escalationUsed: readEnum('x-qissa-escalation-used', ['true','false']),
  escalationModel: readEnum('x-qissa-escalation-model', ['disabled']),
}
console.log('V94_E1_METADATA', JSON.stringify(meta))
assert.equal(response.status, 200, 'HTTP failed: NO RETRY')
const envelope = await response.json()
const episode = envelope?.episode
assert.ok(episode && typeof episode === 'object', 'Malformed episode: NO RETRY')
assert.equal(episode.generationSource, meta.source, 'Generation source mismatch: NO RETRY')
if (meta.source !== 'openai-structured') {
  console.log('V94_E1_NO_GO: fallback. One POST consumed. No retries, E2, Sol or TTS.')
  process.exitCode = 1
} else {
  assert.equal(meta.escalationUsed, 'false', 'Unapproved model escalation')
  assert.equal(meta.narratorUsed, 'gpt-5.6-luna')
  assert.ok(typeof episode.story_text === 'string' && episode.story_text.includes('Malika') && !episode.story_text.includes('{{HERO}}'), 'Hero restoration')
  const count = text => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
  const words = count(episode.story_text)
  assert.ok(words >= 320 && words <= 470, 'Story length')
  assert.ok(Array.isArray(episode.choices) && episode.choices.length === 2 && new Set(episode.choices.map(c => c.choice_id)).size === 2, 'Choice identity')
  assert.equal(episode.safety_self_check?.approved, true)
  assert.equal(episode.safety_self_check?.required_action, 'publish')
  const resolutionWords = episode.choices.map(choice => {
    const n = count(choice.resolution_text)
    assert.ok(n >= 25 && n <= 60, 'Resolution length')
    return n
  })
  const memoryEvents = [episode.state_patch?.last_event,...episode.choices.map(c => c.state_patch?.last_event)]
  const eventLengths = memoryEvents.map(event => {
    assert.ok(typeof event === 'string' && /[.!?。؟]$/u.test(event.trim()) && event.length <= 300, 'Memory must be a complete bounded sentence')
    return event.length
  })
  console.log('V94_E1_TECH_PASS', JSON.stringify({storyWords:words,resolutionWords,eventLengths,providerCalls:meta.providerCalls,decisionRepair:meta.decisionRepair}))
  console.log('Native Uzbek editorial review and E2 A/B are still unverified; family AI beta stays NO-GO.')
}
