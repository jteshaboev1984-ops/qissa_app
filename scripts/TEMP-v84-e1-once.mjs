const live = process.env.QISSA_LIVE === '1'
const endpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const anonKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const consentVersion = '2026-06-25-v1'
let invocationCount = 0

const assert = (condition, message) => { if (!condition) throw new Error(message) }
const wordCount = (text) => String(text || '').trim().split(/\s+/u).filter(Boolean).length

const installationId = crypto.randomUUID()
const seriesId = `audit-v84-e1-${Date.now()}`
const payload = {
  installationId,
  selections: {
    ageGroup: '5-7',
    language: 'uz',
    heroType: 'custom',
    customHeroName: 'Malika',
    stylePackId: 'cozy_forest',
    storyMode: 'series',
    storyMood: 'bedtime',
  },
  seriesState: {
    id: seriesId,
    mainCharacter: 'Malika',
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  },
  privacyConsent: {
    version: consentVersion,
    acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true,
    aiProcessingAccepted: true,
  },
}

assert(payload.selections.storyMode === 'series', 'preflight: storyMode must be series')
assert(payload.seriesState.episodeCount === 0, 'preflight: E1 episodeCount must be zero')
assert(payload.seriesState.choiceHistory.length === 0, 'preflight: E1 must not have prior choice history')
assert(payload.selections.language === 'uz' && payload.selections.ageGroup === '5-7', 'preflight: wrong acceptance cohort')

if (!live) {
  console.log('DRY_RUN_PASS: exactly one E1 payload prepared; HTTP invocation count=0; no provider access attempted.')
  console.log(JSON.stringify({ selections: payload.selections, episodeCount: payload.seriesState.episodeCount, choiceHistoryLength: 0 }, null, 2))
  process.exit(0)
}

assert(anonKey, 'QISSA_SUPABASE_ANON_KEY is required only in live mode')
assert(invocationCount === 0, 'live runner may invoke story-generate only once')
invocationCount += 1

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 120_000)
let response
let text
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      origin: 'https://jteshaboev1984-ops.github.io',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
  text = await response.text()
} finally {
  clearTimeout(timeout)
}
assert(invocationCount === 1, `live runner invocation count changed: ${invocationCount}`)

const headerNames = [
  'x-qissa-generation-source',
  'x-qissa-fallback-reason',
  'x-qissa-runtime-ai',
  'x-qissa-generation-failure-class',
  'x-qissa-generation-failure-trace',
  'x-qissa-provider-calls',
  'x-qissa-generation-repair',
  'x-qissa-repair-retry-used',
  'x-qissa-narrator-retry-used',
  'x-qissa-escalation-used',
  'x-qissa-narrator-model-used',
  'x-qissa-blueprint-keys-normalized',
  'x-qissa-story-pipeline',
]
const diagnostics = Object.fromEntries(headerNames.map((name) => [name, response.headers.get(name)]))
console.log('E1_HTTP_STATUS', response.status)
console.log('E1_DIAGNOSTICS', JSON.stringify(diagnostics))
console.log('E1_RESPONSE_JSON', text)
assert(response.ok, `story-generate HTTP ${response.status}`)

let body
try { body = JSON.parse(text) } catch { throw new Error('story-generate returned non-JSON content') }
const source = diagnostics['x-qissa-generation-source']
assert(source === 'openai-structured' || source === 'safe-fallback', `unexpected generation source: ${source}`)
if (source !== 'openai-structured') {
  throw new Error(`E1_FALLBACK_STOP:${diagnostics['x-qissa-generation-failure-class'] || diagnostics['x-qissa-fallback-reason'] || 'unknown'}`)
}

const episode = body?.episode
assert(episode && typeof episode === 'object', 'successful E1 missing episode')
assert(typeof episode.story_text === 'string' && episode.story_text.includes('Malika'), 'successful E1 did not restore fictional hero')
assert(!episode.story_text.includes('{{HERO}}'), 'successful E1 leaked hero token')
assert(Array.isArray(episode.choices) && episode.choices.length === 2, 'successful E1 must have exactly two choices')
assert(new Set(episode.choices.map((choice) => choice.choice_id)).size === 2, 'successful E1 choice IDs are not unique')
assert(episode.safety_self_check?.approved === true && episode.safety_self_check?.required_action === 'publish', 'successful E1 safety verdict is not publish')
assert(wordCount(episode.story_text) >= 320 && wordCount(episode.story_text) <= 470, `successful E1 story word count out of range: ${wordCount(episode.story_text)}`)
for (const choice of episode.choices) {
  assert(typeof choice.choice_id === 'string' && choice.choice_id.trim(), 'choice_id missing')
  assert(typeof choice.text === 'string' && choice.text.trim(), 'choice text missing')
  assert(typeof choice.resolution_text === 'string' && wordCount(choice.resolution_text) >= 25 && wordCount(choice.resolution_text) <= 60, `choice bridge out of range: ${choice.choice_id}`)
}
assert(diagnostics['x-qissa-escalation-used'] !== 'true', 'live acceptance unexpectedly used escalation')
console.log('E1_ACCEPTANCE_PASS', JSON.stringify({
  title: episode.title,
  storyWords: wordCount(episode.story_text),
  choiceIds: episode.choices.map((choice) => choice.choice_id),
  choiceBridgeWords: episode.choices.map((choice) => wordCount(choice.resolution_text)),
  providerCallsDiagnostic: diagnostics['x-qissa-provider-calls'],
  repair: diagnostics['x-qissa-generation-repair'],
  repairRetry: diagnostics['x-qissa-repair-retry-used'],
  narratorModel: diagnostics['x-qissa-narrator-model-used'],
}))
