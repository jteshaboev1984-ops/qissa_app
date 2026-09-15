import { randomUUID } from 'node:crypto'

const endpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY missing')
const installationId = randomUUID()
const heroName = 'Алиса'
const selections = {
  ageGroup: '5-7', language: 'ru', heroType: 'girl_hero', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const seriesId = `audit-v59-e2-${randomUUID()}`
const seriesState = {
  id: seriesId,
  childProfileId: installationId,
  sessionId: `session-${randomUUID()}`,
  sessionIndex: 1,
  stylePackId: 'cozy_forest',
  mainCharacter: heroName,
  recurringCharacters: ['Топа'],
  lastEpisodeSummary: 'Вода проходит по ровному каменному желобку и начинает тихо звенеть.',
  activeArc: 'Узнать, откуда после ветра в ручейке появляется новый узор.',
  relationshipState: { 'topa.trust': 'Топа благодарен за спокойную совместную помощь у ручейка.' },
  canonState: { 'stream.stone_pattern': 'После освобождения ручейка на камешках заметен необычный узор.' },
  choiceHistory: [{
    episode_id: 'ep-1-cozy_forest',
    choice_id: 'clear_with_stones',
    choice_text: 'Сложить рядом плоские камешки и аккуратно отодвинуть веточки, чтобы воде открылся узкий путь.',
    effect_summary: 'Вода проходит по ровному каменному желобку и начинает тихо звенеть.',
    resolution_text: 'Плоские камешки легли рядом ровной дорожкой. Веточки мягко отодвинулись, вода прошла по каменному желобку и тихо зазвенела.',
    tomorrow_seed: 'На камешках после вечерней росы появится маленький узор, который захочется рассмотреть утром.',
  }],
  episodeCount: 1,
}
const privacyConsent = {
  version: '2026-06-25-v1', acceptedAt: new Date().toISOString(), parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
}
const headers = {
  'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}`, origin: 'https://jteshaboev1984-ops.github.io',
}
const parse = async (response) => {
  const text = await response.text()
  try { return { text, body: text ? JSON.parse(text) : null } } catch { return { text, body: null } }
}
const call = async (withConsent) => {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ installationId, selections, seriesState, ...(withConsent ? { privacyConsent } : {}) }) })
  return { response, ...(await parse(response)) }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

for (let attempt = 1; attempt <= 40; attempt += 1) {
  const probe = await call(false)
  const runtime = probe.response.headers.get('x-qissa-runtime-ai')
  if (runtime === 'enabled') {
    if (probe.response.status !== 403 || probe.body?.error !== 'privacy_consent_required') throw new Error(`bad readiness ${probe.response.status}: ${probe.text.slice(0, 400)}`)
    console.log(`READINESS poll=${attempt}`)
    break
  }
  if (attempt === 40) throw new Error('runtime not enabled')
  await sleep(3000)
}

const result = await call(true)
const h = result.response.headers
const metadata = {
  status: result.response.status,
  source: h.get('x-qissa-generation-source'),
  fallbackReason: h.get('x-qissa-fallback-reason'),
  runtimeAi: h.get('x-qissa-runtime-ai'),
  pipeline: h.get('x-qissa-story-pipeline'),
  architectModel: h.get('x-qissa-architect-model'),
  narratorModel: h.get('x-qissa-narrator-model'),
  narratorModelUsed: h.get('x-qissa-narrator-model-used'),
  safetyModel: h.get('x-qissa-safety-model'),
  narratorRetryUsed: h.get('x-qissa-narrator-retry-used'),
  generationRepair: h.get('x-qissa-generation-repair'),
  providerCalls: h.get('x-qissa-provider-calls'),
  blueprintKeysNormalized: h.get('x-qissa-blueprint-keys-normalized'),
  failureClass: h.get('x-qissa-generation-failure-class'),
  failureTrace: h.get('x-qissa-generation-failure-trace'),
  initialStoryWords: h.get('x-qissa-initial-story-words'),
  finalStoryWords: h.get('x-qissa-final-story-words'),
}
console.log('EPISODE2_DEBUG_METADATA', JSON.stringify(metadata, null, 2))
console.log('EPISODE2_DEBUG_BODY', JSON.stringify(result.body, null, 2))
if (result.response.status !== 200) throw new Error(`episode2 status ${result.response.status}`)
if (metadata.source !== 'openai-structured' || result.body?.episode?.generationSource !== 'openai-structured') throw new Error(`episode2 fallback: ${JSON.stringify(metadata)}`)
