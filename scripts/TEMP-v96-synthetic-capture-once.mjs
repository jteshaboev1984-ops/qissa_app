import { readFileSync } from 'node:fs'

const mode = readFileSync('audit/TEMP-v96-capture-trigger.txt', 'utf8').trim()
const ids = JSON.parse(readFileSync('audit/TEMP-v96-capture-ids.json', 'utf8'))
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const assert = (condition, message) => { if (!condition) throw new Error(message) }
for (const key of ['capture_id', 'installation_id', 'series_uuid']) assert(uuid.test(ids[key] || ''), `invalid ${key}`)

if (mode === 'DRY') {
  console.log('DRY PASS: v96 runner syntax/UUID contract valid; provider calls 0')
  process.exit(0)
}
assert(mode === 'LIVE', `unexpected mode ${mode}`)
const endpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
const anon = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
assert(endpoint, 'missing QISSA_STORY_ENDPOINT')
assert(anon, 'missing QISSA_SUPABASE_ANON_KEY')

const payload = {
  installationId: ids.installation_id,
  selections: {
    ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika',
    stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
  },
  seriesState: {
    id: `qissa-synthetic-diagnostic-${ids.series_uuid}`,
    sessionId: `qissa-synthetic-diagnostic-${ids.series_uuid}`,
    sessionIndex: 1,
    mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',
    relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0,
  },
  privacyConsent: {
    version: '2026-06-25-v1', acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
  },
}

const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 140_000)
let response
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', apikey: anon, authorization: `Bearer ${anon}`,
      origin: 'https://jteshaboev1984-ops.github.io',
      'x-qissa-synthetic-diagnostic-id': ids.capture_id,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
} finally {
  clearTimeout(timer)
}
const responseText = await response.text()
let body
try { body = JSON.parse(responseText) } catch { body = null }
const meta = {
  http: response.status,
  source: response.headers.get('x-qissa-generation-source'),
  fallback_reason: response.headers.get('x-qissa-fallback-reason'),
  diagnostic: response.headers.get('x-qissa-synthetic-diagnostic'),
  runtime_ai: response.headers.get('x-qissa-runtime-ai'),
  failure_class: response.headers.get('x-qissa-generation-failure-class'),
  failure_trace: response.headers.get('x-qissa-generation-failure-trace'),
  provider_calls: response.headers.get('x-qissa-provider-calls'),
  initial_story_words: response.headers.get('x-qissa-initial-story-words'),
  final_story_words: response.headers.get('x-qissa-final-story-words'),
  repair: response.headers.get('x-qissa-generation-repair'),
  repair_retry: response.headers.get('x-qissa-repair-retry-used'),
}
console.log(JSON.stringify(meta))
assert(response.ok, `story request HTTP ${response.status}`)
assert(body && typeof body === 'object', 'response body was not JSON')
assert(meta.runtime_ai === 'enabled', `runtime AI was ${meta.runtime_ai}`)
assert(meta.diagnostic === 'stored', `diagnostic capture was ${meta.diagnostic}`)
console.log('LIVE COMPLETE: exactly one synthetic E1 POST; raw story withheld from logs')
