import { randomBytes } from 'node:crypto'

const storyEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY missing')

const installationId = '7c64da91-4e2c-4e42-8299-ff8521bf30ef'
const installationAuth = randomBytes(32).toString('hex')
const seriesId = 'audit-luna-v55-7a8cc03f-ca04-4056-819d-88e791c68ddf'
const heroName = 'Алиса'
const headers = {
  'content-type': 'application/json',
  apikey: key,
  authorization: `Bearer ${key}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}
const selections = {
  ageGroup: '5-7', language: 'ru', heroType: 'girl_hero',
  stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
}
const generationSeriesState = {
  id: seriesId, mainCharacter: heroName, recurringCharacters: [],
  lastEpisodeSummary: '', activeArc: '', relationshipState: {},
  choiceHistory: [], canonState: {}, episodeCount: 0,
}
const privacyConsent = {
  version: '2026-06-25-v1', acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true, aiProcessingAccepted: true,
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const parse = async (response) => {
  const text = await response.text()
  try { return { text, body: text ? JSON.parse(text) : null } }
  catch { return { text, body: null } }
}

const invokeStory = async (withConsent) => {
  const response = await fetch(storyEndpoint, {
    method: 'POST', headers,
    body: JSON.stringify({
      installationId, selections, seriesState: generationSeriesState,
      ...(withConsent ? { privacyConsent } : {}),
    }),
  })
  return { response, ...(await parse(response)) }
}

const invokeState = async (payload) => {
  const response = await fetch(stateEndpoint, { method: 'POST', headers, body: JSON.stringify(payload) })
  const parsed = await parse(response)
  if (!response.ok) throw new Error(`story-state ${response.status}: ${parsed.text.slice(0, 500)}`)
  return parsed.body
}

let ready = false
for (let attempt = 1; attempt <= 40; attempt += 1) {
  const probe = await invokeStory(false)
  const runtime = probe.response.headers.get('x-qissa-runtime-ai')
  const source = probe.response.headers.get('x-qissa-generation-source')
  if (runtime === 'enabled') {
    if (probe.response.status !== 403 || probe.body?.error !== 'privacy_consent_required') {
      throw new Error(`Runtime readiness returned ${probe.response.status}: ${probe.text.slice(0, 400)}`)
    }
    ready = true
    console.log(`READINESS poll=${attempt} status=403 error=privacy_consent_required claim=none`)
    break
  }
  if (probe.response.status !== 200 || source !== 'safe-fallback' || runtime !== 'runtime-disabled') {
    throw new Error(`Unexpected pre-enable state: status=${probe.response.status} source=${source} runtime=${runtime}`)
  }
  await sleep(3000)
}
if (!ready) throw new Error('Runtime AI was not enabled within audit window; paid call was not attempted.')

// Exactly one consented Story request. There is intentionally no retry around this call.
const paid = await invokeStory(true)
const h = paid.response.headers
const episode = paid.body?.episode
const metadata = {
  status: paid.response.status,
  source: h.get('x-qissa-generation-source'),
  fallbackReason: h.get('x-qissa-fallback-reason'),
  runtimeAi: h.get('x-qissa-runtime-ai'),
  pipeline: h.get('x-qissa-story-pipeline'),
  architectModel: h.get('x-qissa-architect-model'),
  narratorModel: h.get('x-qissa-narrator-model'),
  narratorModelUsed: h.get('x-qissa-narrator-model-used'),
  safetyModel: h.get('x-qissa-safety-model'),
  escalationModel: h.get('x-qissa-escalation-model'),
  escalationUsed: h.get('x-qissa-escalation-used'),
  narratorRetryUsed: h.get('x-qissa-narrator-retry-used'),
  generationRepair: h.get('x-qissa-generation-repair'),
  providerCalls: h.get('x-qissa-provider-calls'),
  dailyLimit: h.get('x-qissa-daily-limit'),
  dailyUsed: h.get('x-qissa-daily-used'),
  globalDailyLimit: h.get('x-qissa-global-daily-limit'),
  globalDailyUsed: h.get('x-qissa-global-daily-used'),
  failureClass: h.get('x-qissa-generation-failure-class'),
  failureTrace: h.get('x-qissa-generation-failure-trace'),
}
console.log('PAID_METADATA', JSON.stringify(metadata, null, 2))
if (paid.response.status !== 200) throw new Error(`Paid Story request returned ${paid.response.status}: ${paid.text.slice(0, 800)}`)
if (metadata.dailyLimit !== '0' || metadata.globalDailyLimit !== '0') throw new Error(`Accounting-only limits not active: ${JSON.stringify(metadata)}`)
if (metadata.source !== 'openai-structured' || episode?.generationSource !== 'openai-structured') {
  throw new Error(`Paid request did not publish provider story: ${paid.text.slice(0, 1800)}`)
}
if (metadata.runtimeAi !== 'enabled') throw new Error(`Runtime metadata missing on success: ${metadata.runtimeAi}`)
if (metadata.pipeline !== 'split-v1') throw new Error(`Unexpected pipeline: ${metadata.pipeline}`)
if ([metadata.architectModel, metadata.narratorModel, metadata.narratorModelUsed, metadata.safetyModel].some((value) => value !== 'gpt-5.6-luna')) throw new Error('Unexpected model metadata')
if (metadata.escalationModel !== 'disabled' || metadata.escalationUsed !== 'false') throw new Error('Sol escalation was used/configured')
if (episode?.safety_self_check?.approved !== true || episode?.safety_self_check?.required_action !== 'publish') throw new Error('Safety result is not approve/publish')
if (!Array.isArray(episode?.choices) || episode.choices.length !== 2) throw new Error('Episode 1 must have exactly two choices')
if (!Array.isArray(episode?.vocabulary) || episode.vocabulary.length < 2 || episode.vocabulary.length > 3) throw new Error('RU vocabulary must have 2-3 entries')
if (typeof episode?.story_text !== 'string' || !episode.story_text.includes(heroName) || episode.story_text.includes('{{HERO}}') || episode.story_text.includes('QISSA_HERO')) throw new Error('Hero finalization failed')
const words = episode.story_text.trim().split(/\s+/u).filter(Boolean).length
if (words < 430 || words > 560) throw new Error(`Story word count out of range: ${words}`)

const unicodeWordStart = '(?<![\\p{L}\\p{N}_])'
const unicodeWordEnd = '(?![\\p{L}\\p{N}_])'
const token = '(?:\\{\\{HERO\\}\\}|QISSA_HERO)'
const tokenBoundary = '(?=[\\s,.:;!?»”")—-]|$)'
const masculinePastWord = '[\\p{L}Ёё-]{2,}?(?:лся|л)'
const neutralModifier = '(?:вдруг|снова|уже|тихо|медленно|осторожно|бережно|быстро|спокойно|наконец|тоже|ещё|еще|чуть|немного|сразу|затем|потом|[\\p{L}-]+(?:о|е))'
const optionalModifiers = `(?:\\s+${neutralModifier}){0,3}`
const heroGrammarText = [
  episode.title, episode.story_text, episode.nextEpisodePreview,
  ...episode.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text, choice.tomorrow_seed]),
  ...episode.vocabulary.flatMap((item) => [item.word, item.translation, item.example]),
].filter((value) => typeof value === 'string').join(' ').replaceAll(heroName, '{{HERO}}')
const preposition = new RegExp(`(?:^|[\\s(«„"—-])(?:у|к|ко|с|со|от|до|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между|рядом\\s+с)\\s+${token}${tokenBoundary}`, 'iu')
const wrongAgreementAfter = new RegExp(`${token}${tokenBoundary}${optionalModifiers}\\s+${unicodeWordStart}${masculinePastWord}${unicodeWordEnd}`, 'iu')
const wrongAgreementBefore = new RegExp(`${unicodeWordStart}${masculinePastWord}${unicodeWordEnd}${optionalModifiers}\\s+${token}${tokenBoundary}`, 'iu')
if (preposition.test(heroGrammarText) || wrongAgreementAfter.test(heroGrammarText) || wrongAgreementBefore.test(heroGrammarText)) throw new Error('Published RU girl_hero grammar still requires rewrite')

const visibleText = [
  episode.title, episode.story_text, episode.nextEpisodePreview,
  ...episode.choices.flatMap((choice) => [choice.text, choice.resolution_text, choice.tomorrow_seed]),
  ...episode.vocabulary.map((item) => item.example),
].filter((value) => typeof value === 'string').join(' ').toLocaleLowerCase()
const choiceTerms = 'вариант(?:а|ов)?|выбор(?:а|ов)?|возможност(?:ь|и|ей)'
const evaluationTerms = 'безопасн[\\p{L}-]*|добр[\\p{L}-]*|правильн[\\p{L}-]*|хорош[\\p{L}-]*|спокойн[\\p{L}-]*|верн[\\p{L}-]*'
const visibleMetaA = new RegExp(`${unicodeWordStart}(?:${choiceTerms})${unicodeWordEnd}[^.!?\\n]{0,80}${unicodeWordStart}(?:${evaluationTerms})${unicodeWordEnd}`, 'iu')
const visibleMetaB = new RegExp(`${unicodeWordStart}(?:${evaluationTerms})${unicodeWordEnd}[^.!?\\n]{0,80}${unicodeWordStart}(?:${choiceTerms})${unicodeWordEnd}`, 'iu')
if (visibleMetaA.test(visibleText) || visibleMetaB.test(visibleText)) throw new Error('Published story exposes safety/meta-choice language')

const readerPreferences = {
  textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm',
  showTextWithAudio: true, audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read',
}
const persistedState = {
  ...generationSeriesState, childProfileId: installationId,
  stylePackId: 'cozy_forest', episodeCount: 1,
}
let profileCreated = false
let persistence
try {
  const sync = await invokeState({
    action: 'sync_generated', installationId, installationAuth,
    selections, seriesState: persistedState, episode, readerPreferences, privacyConsent,
  })
  if (sync?.ok !== true) throw new Error('story-state did not confirm sync_generated')
  profileCreated = true
  const loaded = await invokeState({ action: 'load_current', installationId, installationAuth })
  if (!loaded?.snapshot) throw new Error('story-state readback returned no snapshot')
  if (loaded.snapshot.seriesState?.id !== seriesId) throw new Error('story-state readback series mismatch')
  if (loaded.snapshot.episode?.episode_id !== episode.episode_id) throw new Error('story-state readback episode mismatch')
  if (loaded.snapshot.episode?.story_text !== episode.story_text) throw new Error('story-state readback story mismatch')
  const deleted = await invokeState({ action: 'delete_profile_data', installationId, installationAuth })
  if (deleted?.ok !== true || deleted?.deleted !== true || deleted?.deletedAudioObjectCount !== 0) throw new Error('story-state cleanup failed')
  profileCreated = false
  const afterDeletion = await invokeState({ action: 'load_current', installationId, installationAuth })
  if (afterDeletion?.snapshot !== null) throw new Error('Audit profile still loads after deletion')
  persistence = { sync: true, readback: true, delete: true, afterDeletionNull: true }
} finally {
  if (profileCreated) {
    try { await invokeState({ action: 'delete_profile_data', installationId, installationAuth }) }
    catch (cleanupError) { console.error('Emergency cleanup failed', cleanupError) }
  }
}

console.log('ACCEPTANCE_RESULT', JSON.stringify({
  metadata,
  wordCount: words,
  choiceCount: episode.choices.length,
  vocabularyCount: episode.vocabulary.length,
  safety: episode.safety_self_check,
  persistence,
  episode,
}, null, 2))
