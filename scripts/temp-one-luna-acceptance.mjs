const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY is required')

const installationId = crypto.randomUUID()
const stamp = Date.now()
const payload = {
  installationId,
  selections: {
    ageGroup: '5-7',
    language: 'ru',
    heroType: 'custom',
    customHeroName: 'Алиса',
    stylePackId: 'cozy_forest',
    storyMode: 'series',
    storyMood: 'bedtime',
  },
  seriesState: {
    id: `luna-acceptance-${stamp}`,
    sessionId: `luna-acceptance-session-${stamp}`,
    sessionIndex: 1,
    stylePackId: 'cozy_forest',
    mainCharacter: 'Алиса',
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  },
  privacyConsent: {
    version: '2026-06-25-v1',
    acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true,
    aiProcessingAccepted: true,
  },
}

const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 140_000)
const started = Date.now()
let response
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: key,
      authorization: `Bearer ${key}`,
      origin: 'https://jteshaboev1984-ops.github.io',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
} finally {
  clearTimeout(timer)
}
const durationSeconds = (Date.now() - started) / 1000
const responseText = await response.text()
let body
try { body = JSON.parse(responseText) } catch { body = {} }

const h = (name) => response.headers.get(name)
const episode = body?.episode
const story = typeof episode?.story_text === 'string' ? episode.story_text : ''
const storyWords = story.trim() ? story.trim().split(/\s+/u).length : 0
const choices = Array.isArray(episode?.choices) ? episode.choices : []
const vocabulary = Array.isArray(episode?.vocabulary) ? episode.vocabulary : []
const safety = episode?.safety_self_check ?? {}

const summary = {
  status: response.status,
  durationSeconds,
  installationId,
  seriesId: payload.seriesState.id,
  source: h('x-qissa-generation-source'),
  fallbackReason: h('x-qissa-fallback-reason'),
  runtimeAi: h('x-qissa-runtime-ai'),
  pipeline: h('x-qissa-story-pipeline'),
  architectModel: h('x-qissa-architect-model'),
  narratorModel: h('x-qissa-narrator-model'),
  narratorModelUsed: h('x-qissa-narrator-model-used'),
  escalationModel: h('x-qissa-escalation-model'),
  safetyModel: h('x-qissa-safety-model'),
  dailyLimit: h('x-qissa-daily-limit'),
  dailyUsed: h('x-qissa-daily-used'),
  globalLimit: h('x-qissa-global-daily-limit'),
  globalUsed: h('x-qissa-global-daily-used'),
  providerCalls: h('x-qissa-provider-calls'),
  repair: h('x-qissa-generation-repair'),
  narratorRetryUsed: h('x-qissa-narrator-retry-used'),
  escalationUsed: h('x-qissa-escalation-used'),
  blueprintKeysNormalized: h('x-qissa-blueprint-keys-normalized'),
  failureClass: h('x-qissa-generation-failure-class'),
  failureTrace: h('x-qissa-generation-failure-trace'),
  title: episode?.title ?? null,
  storyWords,
  choiceCount: choices.length,
  vocabularyCount: vocabulary.length,
  safetyApproved: safety?.approved ?? null,
  safetyAction: safety?.required_action ?? null,
}

console.log(`ACCEPTANCE_SUMMARY=${JSON.stringify(summary)}`)
console.log(`FULL_RESPONSE_JSON=${JSON.stringify(body)}`)

if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
if (summary.runtimeAi !== 'enabled') throw new Error(`runtimeAi=${summary.runtimeAi}`)
if (summary.pipeline !== 'split-v1') throw new Error(`pipeline=${summary.pipeline}`)
if (summary.architectModel !== 'gpt-5.6-luna' || summary.narratorModel !== 'gpt-5.6-luna' || summary.safetyModel !== 'gpt-5.6-luna') throw new Error('effective model mismatch')
if (summary.escalationModel !== 'disabled') throw new Error(`escalationModel=${summary.escalationModel}`)
if (summary.source !== 'openai-structured') throw new Error(`source=${summary.source}; fallback=${summary.fallbackReason}; failure=${summary.failureClass}; trace=${summary.failureTrace}`)
if (storyWords < 430 || storyWords > 560) throw new Error(`storyWords=${storyWords}`)
if (choices.length !== 2) throw new Error(`choiceCount=${choices.length}`)
if (vocabulary.length < 2) throw new Error(`vocabularyCount=${vocabulary.length}`)
if (safety?.approved !== true || safety?.required_action !== 'publish') throw new Error('safety did not publish')
if (!story.includes('Алиса') || story.includes('{{HERO}}')) throw new Error('hero restoration failed')
