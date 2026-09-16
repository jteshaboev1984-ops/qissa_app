import { randomUUID } from 'node:crypto'

const key = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
if (!key) throw new Error('QISSA_SUPABASE_ANON_KEY is required')

const storyEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const installationId = randomUUID()
const seriesId = `v79-live-${randomUUID()}`
const heroName = 'Malika'
const consentVersion = '2026-06-25-v1'
const headers = {
  'content-type': 'application/json',
  apikey: key,
  authorization: `Bearer ${key}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const words = (text) => String(text || '').trim().split(/\s+/u).filter(Boolean).length
const normalize = (text) => String(text || '').toLocaleLowerCase('uz').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const invoke = async (endpoint, payload, label) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 150_000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try { body = text ? JSON.parse(text) : null } catch {}
    const qissaHeaders = Object.fromEntries(
      [...response.headers.entries()].filter(([name]) => name.toLowerCase().startsWith('x-qissa-')),
    )
    if (!response.ok) throw new Error(`${label} returned ${response.status}: ${text.slice(0, 800)}`)
    return { body, qissaHeaders }
  } finally {
    clearTimeout(timeoutId)
  }
}

const consent = {
  version: consentVersion,
  acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true,
  aiProcessingAccepted: true,
}
const selections = {
  ageGroup: '5-7',
  language: 'uz',
  heroType: 'custom',
  customHeroName: heroName,
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}
const readerPreferences = {
  textSize: 'medium',
  fontMode: 'standard',
  lineSpacing: 'relaxed',
  theme: 'warm',
  showTextWithAudio: true,
  audioOnlyNightMode: true,
  voicePresetId: 'neutral_storyteller',
  defaultPlaybackMode: 'read',
}
const initialState = {
  id: seriesId,
  childProfileId: installationId,
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

let profileCreated = false
try {
  const first = await invoke(storyEndpoint, {
    installationId,
    selections,
    seriesState: initialState,
    privacyConsent: consent,
  }, 'episode-1')
  const e1 = first.body?.episode
  assert(e1 && typeof e1 === 'object', 'episode-1 missing episode')
  assert(first.qissaHeaders['x-qissa-generation-source'] === 'openai-structured', `episode-1 source=${first.qissaHeaders['x-qissa-generation-source'] || 'missing'}`)
  assert(e1.series_id === seriesId, 'episode-1 series mismatch')
  assert(typeof e1.story_text === 'string' && e1.story_text.includes(heroName), 'episode-1 lost Malika')
  assert(!e1.story_text.includes('{{HERO}}'), 'episode-1 leaked HERO token')
  assert(!/\bqizaloq\b/iu.test(e1.story_text), 'episode-1 duplicated Malika as qizaloq')
  assert(Array.isArray(e1.choices) && e1.choices.length === 2, 'episode-1 must have two choices')
  assert(e1.safety_self_check?.approved === true, 'episode-1 not safety-approved')

  console.log('=== V79 LIVE E1 HEADERS ===')
  console.log(JSON.stringify(first.qissaHeaders, null, 2))
  console.log('=== V79 LIVE E1 META ===')
  console.log(JSON.stringify({ episode_id: e1.episode_id, title: e1.title, words: words(e1.story_text), state_patch: e1.state_patch }, null, 2))
  console.log('=== V79 LIVE STORY E1 ===')
  console.log(e1.story_text)
  console.log('=== V79 LIVE CHOICES E1 ===')
  console.log(JSON.stringify(e1.choices, null, 2))

  profileCreated = true
  const syncOne = await invoke(stateEndpoint, {
    action: 'sync_generated', installationId, selections,
    seriesState: { ...initialState, episodeCount: 1 },
    episode: e1, readerPreferences, privacyConsent: consent,
  }, 'sync-e1')
  assert(syncOne.body?.ok === true, 'episode-1 persistence failed')

  const chosen = e1.choices[0]
  assert(typeof chosen.resolution_text === 'string' && chosen.resolution_text.length > 0, 'chosen resolution missing')
  const patch = chosen.state_patch && typeof chosen.state_patch === 'object' ? chosen.state_patch : {}
  assert(patch.new_friend !== heroName, 'new_friend duplicated hero name')
  assert(patch.new_friend !== '{{HERO}}', 'new_friend persisted HERO token')
  assert(!/^qizaloq$/iu.test(String(patch.new_friend || '')), 'new_friend persisted generic qizaloq')

  const recurringCharacters = []
  if (typeof patch.new_friend === 'string' && patch.new_friend) recurringCharacters.push(patch.new_friend)
  const afterChoice = {
    ...initialState,
    recurringCharacters,
    lastEpisodeSummary: chosen.effect_summary,
    activeArc: typeof patch.open_arc === 'string' ? patch.open_arc : '',
    relationshipState: patch.relationship_updates || {},
    canonState: patch.canon_updates || {},
    choiceHistory: [{
      episode_id: e1.episode_id,
      choice_id: chosen.choice_id,
      choice_text: chosen.text,
      effect_summary: chosen.effect_summary,
      resolution_text: chosen.resolution_text,
      tomorrow_seed: chosen.tomorrow_seed,
      state_patch: patch,
      selected_at: new Date().toISOString(),
    }],
    episodeCount: 1,
  }

  const confirmed = await invoke(stateEndpoint, {
    action: 'confirm_choice', installationId, seriesState: afterChoice,
    episodeId: e1.episode_id, choiceId: chosen.choice_id,
  }, 'confirm-choice')
  assert(confirmed.body?.ok === true, 'choice persistence failed')

  const second = await invoke(storyEndpoint, {
    installationId,
    selections,
    seriesState: afterChoice,
    privacyConsent: consent,
  }, 'episode-2')
  const e2 = second.body?.episode
  assert(e2 && typeof e2 === 'object', 'episode-2 missing episode')
  assert(second.qissaHeaders['x-qissa-generation-source'] === 'openai-structured', `episode-2 source=${second.qissaHeaders['x-qissa-generation-source'] || 'missing'}`)
  assert(e2.series_id === seriesId, 'episode-2 series mismatch')
  assert(typeof e2.story_text === 'string' && e2.story_text.includes(heroName), 'episode-2 lost Malika')
  assert(!e2.story_text.includes('{{HERO}}'), 'episode-2 leaked HERO token')
  assert(!/\bqizaloq\b/iu.test(e2.story_text), 'episode-2 duplicated Malika as qizaloq')
  assert(Array.isArray(e2.choices) && e2.choices.length === 0, 'episode-2 must have zero choices')
  assert(e2.safety_self_check?.approved === true, 'episode-2 not safety-approved')
  const resolution = normalize(chosen.resolution_text)
  const e2Text = normalize(e2.story_text)
  assert(resolution.length < 40 || !e2Text.includes(resolution), 'episode-2 replays selected resolution verbatim')

  console.log('=== V79 LIVE SELECTED CHOICE ===')
  console.log(JSON.stringify(chosen, null, 2))
  console.log('=== V79 LIVE E2 HEADERS ===')
  console.log(JSON.stringify(second.qissaHeaders, null, 2))
  console.log('=== V79 LIVE E2 META ===')
  console.log(JSON.stringify({ episode_id: e2.episode_id, title: e2.title, words: words(e2.story_text), state_patch: e2.state_patch }, null, 2))
  console.log('=== V79 LIVE STORY E2 ===')
  console.log(e2.story_text)

  const syncTwo = await invoke(stateEndpoint, {
    action: 'sync_generated', installationId, selections,
    seriesState: { ...afterChoice, episodeCount: 2 },
    episode: e2, readerPreferences, privacyConsent: consent,
  }, 'sync-e2')
  assert(syncTwo.body?.ok === true, 'episode-2 persistence failed')

  const loaded = await invoke(stateEndpoint, { action: 'load_current', installationId }, 'load-current')
  assert(loaded.body?.snapshot?.seriesState?.id === seriesId, 'load_current series mismatch')
  assert(loaded.body?.snapshot?.seriesState?.mainCharacter === heroName, 'persisted hero is not Malika')
  assert(!JSON.stringify(loaded.body.snapshot.seriesState).includes('{{HERO}}'), 'persisted state leaked HERO token')
  assert(loaded.body?.snapshot?.episode?.episode_id === e2.episode_id, 'reload did not restore episode-2')

  console.log('=== V79 LIVE PERSISTENCE ===')
  console.log(JSON.stringify({
    loaded_episode_id: loaded.body.snapshot.episode.episode_id,
    mainCharacter: loaded.body.snapshot.seriesState.mainCharacter,
    recurringCharacters: loaded.body.snapshot.seriesState.recurringCharacters,
    episodeCount: loaded.body.snapshot.seriesState.episodeCount,
  }, null, 2))
  console.log(`PASS v79 Uzbek live acceptance · E1 ${words(e1.story_text)} words · E2 ${words(e2.story_text)} words`)
} finally {
  if (profileCreated) {
    const deleted = await invoke(stateEndpoint, { action: 'delete_profile_data', installationId }, 'cleanup-delete')
    assert(deleted.body?.ok === true && deleted.body?.deleted === true, 'cleanup deletion failed')
    const afterDeletion = await invoke(stateEndpoint, { action: 'load_current', installationId }, 'cleanup-load')
    assert(afterDeletion.body?.snapshot === null, 'test data still loads after cleanup')
    console.log('CLEANUP PASS: temporary v79 live profile deleted')
  }
}
