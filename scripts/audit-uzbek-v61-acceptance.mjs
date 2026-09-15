import { randomBytes, randomUUID } from 'node:crypto'

const storyEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY missing')

const installationId = randomUUID()
const installationAuth = randomBytes(32).toString('hex')
const seriesId = `audit-uz-v61-${randomUUID()}`
const sessionId = `session-${randomUUID()}`
const heroName = 'Malika'
const headers = {
  'content-type': 'application/json',
  apikey: key,
  authorization: `Bearer ${key}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}
const selections = {
  ageGroup: '5-7',
  language: 'uz',
  heroType: 'girl_hero',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}
const privacyConsent = {
  version: '2026-06-25-v1',
  acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true,
  aiProcessingAccepted: true,
}
const readerPreferences = {
  textSize: 'medium', fontMode: 'standard', lineSpacing: 'relaxed', theme: 'warm',
  showTextWithAudio: true, audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller', defaultPlaybackMode: 'read',
}
const initialSeriesState = {
  id: seriesId,
  childProfileId: installationId,
  sessionId,
  sessionIndex: 1,
  stylePackId: 'cozy_forest',
  mainCharacter: heroName,
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: '',
  relationshipState: {},
  choiceHistory: [],
  canonState: {},
  episodeCount: 0,
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const parse = async (response) => {
  const text = await response.text()
  try { return { text, body: text ? JSON.parse(text) : null } } catch { return { text, body: null } }
}
const invokeStory = async (seriesState, withConsent = true) => {
  const response = await fetch(storyEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ installationId, selections, seriesState, ...(withConsent ? { privacyConsent } : {}) }),
  })
  return { response, ...(await parse(response)) }
}
const invokeState = async (payload) => {
  const response = await fetch(stateEndpoint, { method: 'POST', headers, body: JSON.stringify(payload) })
  const parsed = await parse(response)
  if (!response.ok) throw new Error(`story-state ${response.status}: ${parsed.text.slice(0, 700)}`)
  return parsed.body
}
const wordCount = (text) => String(text ?? '').trim().split(/\s+/u).filter(Boolean).length
const stableKey = /^[a-z][a-z0-9_.-]{0,47}$/u
const assertStableMemory = (episode, label) => {
  const patches = [episode?.state_patch, ...(episode?.choices ?? []).map((choice) => choice?.state_patch)]
  for (const patch of patches) {
    if (!patch || typeof patch !== 'object') continue
    for (const [kind, updates] of [['canon', patch.canon_updates], ['rel', patch.relationship_updates]]) {
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) continue
      for (const keyName of Object.keys(updates)) {
        if (!stableKey.test(keyName)) throw new Error(`${label}: unstable ${kind} memory key ${keyName}`)
        if (keyName === 'canon' || keyName === 'rel') throw new Error(`${label}: collapsed bare memory key ${keyName}`)
      }
    }
  }
}
const metadata = (result) => {
  const h = result.response.headers
  return {
    status: result.response.status,
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
    initialStoryWords: h.get('x-qissa-initial-story-words'),
    finalStoryWords: h.get('x-qissa-final-story-words'),
    failureClass: h.get('x-qissa-generation-failure-class'),
    failureTrace: h.get('x-qissa-generation-failure-trace'),
  }
}
const assertProvider = (result, label) => {
  const meta = metadata(result)
  const episode = result.body?.episode
  if (result.response.status !== 200) throw new Error(`${label}: ${result.response.status} ${result.text.slice(0, 1200)}`)
  if (meta.source !== 'openai-structured' || episode?.generationSource !== 'openai-structured') {
    console.log(`${label.toUpperCase()}_FAIL_CLOSED`, JSON.stringify({ metadata: meta, body: result.body }, null, 2))
    throw new Error(`${label}: provider story not published`)
  }
  if (meta.runtimeAi !== 'enabled' || meta.pipeline !== 'split-v1') throw new Error(`${label}: bad runtime/pipeline metadata`)
  if ([meta.architectModel, meta.narratorModel, meta.narratorModelUsed, meta.safetyModel].some((value) => value !== 'gpt-5.6-luna')) throw new Error(`${label}: unexpected model metadata`)
  if (meta.escalationModel !== 'disabled' || meta.escalationUsed !== 'false') throw new Error(`${label}: Sol escalation used/configured`)
  if (episode?.safety_self_check?.approved !== true || episode?.safety_self_check?.required_action !== 'publish') throw new Error(`${label}: safety did not approve/publish`)
  if (typeof episode?.story_text !== 'string' || !episode.story_text.includes(heroName)) throw new Error(`${label}: hero/story finalization failed`)
  if (/[А-Яа-яЁё]/u.test([episode.title, episode.story_text, episode.nextEpisodePreview, ...(episode.choices ?? []).flatMap((c) => [c.text, c.resolution_text])].join(' '))) {
    throw new Error(`${label}: Cyrillic leakage in Uzbek story`)
  }
  assertStableMemory(episode, label)
  return { metadata: meta, episode }
}
const editorialSignals = (episode) => {
  const text = [episode?.title, episode?.story_text, ...(episode?.choices ?? []).flatMap((c) => [c?.text, c?.resolution_text])]
    .filter(Boolean).join(' ').toLocaleLowerCase('uz')
  const livingTerms = ['quyon', 'tipratikan', 'olmaxon', 'tulki', 'boyqush', 'qush', 'kapalak', "qo‘ng‘iz", "qo'ng'iz", 'chumoli', 'ari', 'sichqon', 'jonivor', 'hayvon']
  const maintenanceTerms = ['ariqni tozal', 'soyani tozal', 'suvni tozal', 'yo‘lni tuzat', "yo'lni tuzat", 'shoxlarni olib tashla', 'chiqindini tozal']
  return {
    livingCharacterTerms: livingTerms.filter((term) => text.includes(term)),
    maintenancePlotTerms: maintenanceTerms.filter((term) => text.includes(term)),
    vocabularyCount: Array.isArray(episode?.vocabulary) ? episode.vocabulary.length : null,
  }
}

// Provider-free readiness probe. It waits for the operator to enable runtime AI.
let ready = false
for (let attempt = 1; attempt <= 40; attempt += 1) {
  const probe = await invokeStory(initialSeriesState, false)
  const runtime = probe.response.headers.get('x-qissa-runtime-ai')
  const source = probe.response.headers.get('x-qissa-generation-source')
  if (runtime === 'enabled') {
    if (probe.response.status !== 403 || probe.body?.error !== 'privacy_consent_required') throw new Error(`Bad readiness ${probe.response.status}: ${probe.text.slice(0, 400)}`)
    ready = true
    console.log(`READINESS poll=${attempt} status=403 error=privacy_consent_required`)
    break
  }
  if (probe.response.status !== 200 || runtime !== 'runtime-disabled' || source !== 'safe-fallback') throw new Error(`Unexpected pre-enable state ${probe.response.status}/${runtime}/${source}`)
  await sleep(3000)
}
if (!ready) throw new Error('Runtime AI was not enabled in the audit window')

// Paid call 1: Uzbek Episode 1. No request-level retry.
const firstResult = await invokeStory(initialSeriesState, true)
const first = assertProvider(firstResult, 'episode1')
const episode1 = first.episode
const episode1Words = wordCount(episode1.story_text)
if (episode1Words < 320 || episode1Words > 470) throw new Error(`episode1 word count ${episode1Words}`)
if (!Array.isArray(episode1.choices) || episode1.choices.length !== 2) throw new Error('episode1 must have exactly 2 choices')
const e1Signals = editorialSignals(episode1)
if (e1Signals.livingCharacterTerms.length === 0) throw new Error('episode1: no obvious living forest character signal in Uzbek output')
if (e1Signals.maintenancePlotTerms.length > 0) throw new Error(`episode1: maintenance-style plot signal ${e1Signals.maintenancePlotTerms.join(',')}`)
console.log('UZBEK_EPISODE1_PUBLISHED', JSON.stringify({ metadata: first.metadata, wordCount: episode1Words, editorialSignals: e1Signals, episode: episode1 }, null, 2))

// Apply Episode 1 and the first child choice exactly like src/lib/memoryAgent.ts.
const mergePatch = (state, patch, segment) => ({
  ...state,
  episodeCount: Math.max(state.episodeCount, segment),
  lastEpisodeSummary: patch?.last_event?.trim() || state.lastEpisodeSummary,
  activeArc: patch?.open_arc === null ? '' : patch?.open_arc ?? state.activeArc,
  relationshipState: { ...state.relationshipState, ...(patch?.relationship_updates ?? {}) },
  canonState: { ...state.canonState, ...(patch?.canon_updates ?? {}) },
  recurringCharacters: patch?.new_friend && !state.recurringCharacters.includes(patch.new_friend)
    ? [...state.recurringCharacters, patch.new_friend]
    : state.recurringCharacters,
})
let continuationState = mergePatch(initialSeriesState, episode1.state_patch, 1)
const selectedChoice = episode1.choices[0]
continuationState = {
  ...mergePatch(continuationState, selectedChoice.state_patch, 1),
  lastEpisodeSummary: selectedChoice.effect_summary,
  choiceHistory: [...continuationState.choiceHistory, {
    episode_id: episode1.episode_id,
    choice_id: selectedChoice.choice_id,
    choice_text: selectedChoice.text,
    effect_summary: selectedChoice.effect_summary,
    resolution_text: selectedChoice.resolution_text,
    tomorrow_seed: selectedChoice.tomorrow_seed,
    state_patch: selectedChoice.state_patch,
    selected_at: new Date().toISOString(),
  }],
}
for (const name of [...Object.keys(continuationState.canonState), ...Object.keys(continuationState.relationshipState)]) {
  if (!stableKey.test(name) || name === 'canon' || name === 'rel') throw new Error(`continuation state has invalid memory key ${name}`)
}
console.log('UZBEK_SELECTED_CHOICE', JSON.stringify(selectedChoice, null, 2))

// Paid call 2: Uzbek Episode 2 continuation. No request-level retry.
const secondResult = await invokeStory(continuationState, true)
const second = assertProvider(secondResult, 'episode2')
const episode2 = second.episode
const episode2Words = wordCount(episode2.story_text)
if (!episode2.episode_id.startsWith('ep-2')) throw new Error(`episode2 id is ${episode2.episode_id}`)
if (episode2Words < 355 || episode2Words > 520) throw new Error(`episode2 word count ${episode2Words}`)
if (!Array.isArray(episode2.choices) || episode2.choices.length !== 0) throw new Error('episode2 must have zero choices')
if (String(episode2.nextEpisodePreview ?? '').trim()) throw new Error('episode2 preview must be empty')
const paragraphs2 = episode2.story_text.trim().split(/\n\s*\n/u).filter(Boolean)
if (wordCount(paragraphs2.at(-1) ?? '') < 50) throw new Error('episode2 bedtime coda too short')
const e2Signals = editorialSignals(episode2)
console.log('UZBEK_EPISODE2_PUBLISHED', JSON.stringify({ metadata: second.metadata, wordCount: episode2Words, editorialSignals: e2Signals, episode: episode2 }, null, 2))

// Persist completed state, read it back, then fully delete audit data.
const completedState = mergePatch(continuationState, episode2.state_patch, 2)
let created = false
let persistence
try {
  const sync = await invokeState({
    action: 'sync_generated', installationId, installationAuth, selections,
    seriesState: completedState, episode: episode2, readerPreferences, privacyConsent,
  })
  if (sync?.ok !== true) throw new Error('story-state sync_generated failed')
  created = true
  const loaded = await invokeState({ action: 'load_current', installationId, installationAuth })
  if (!loaded?.snapshot || loaded.snapshot.seriesState?.id !== seriesId || loaded.snapshot.episode?.episode_id !== episode2.episode_id) throw new Error('story-state readback mismatch')
  const deleted = await invokeState({ action: 'delete_profile_data', installationId, installationAuth })
  if (deleted?.ok !== true || deleted?.deleted !== true) throw new Error('story-state cleanup failed')
  created = false
  const after = await invokeState({ action: 'load_current', installationId, installationAuth })
  if (after?.snapshot !== null) throw new Error('audit profile still exists after deletion')
  persistence = { sync: true, readback: true, delete: true, afterDeletionNull: true }
} finally {
  if (created) {
    try { await invokeState({ action: 'delete_profile_data', installationId, installationAuth }) } catch (error) { console.error('Emergency cleanup failed', error) }
  }
}

console.log('UZBEK_V61_ACCEPTANCE_RESULT', JSON.stringify({
  installationId,
  seriesId,
  episode1: { metadata: first.metadata, wordCount: episode1Words, editorialSignals: e1Signals, episode: episode1 },
  selectedChoice,
  continuationMemory: {
    canonKeys: Object.keys(continuationState.canonState),
    relationshipKeys: Object.keys(continuationState.relationshipState),
  },
  episode2: { metadata: second.metadata, wordCount: episode2Words, editorialSignals: e2Signals, episode: episode2 },
  persistence,
}, null, 2))
