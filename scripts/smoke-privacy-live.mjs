import { randomUUID } from 'node:crypto'

const storyEndpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = process.env.QISSA_STATE_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const consentVersion = '2026-06-25-v1'

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the live privacy smoke test.')
  process.exit(1)
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const headers = {
  'content-type': 'application/json',
  apikey: publishableKey,
  authorization: `Bearer ${publishableKey}`,
  origin: 'https://jteshaboev1984-ops.github.io',
}

const invokeJson = async (endpoint, payload) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      throw new Error(`${endpoint} returned non-JSON content: ${text.slice(0, 240)}`)
    }
    assert(response.ok, `${endpoint} returned ${response.status}: ${text.slice(0, 300)}`)
    return { body, response }
  } finally {
    clearTimeout(timeoutId)
  }
}

const installationId = randomUUID()
const seriesId = randomUUID()
const heroName = 'Privacy Smoke Hero'
const privacyConsent = {
  version: consentVersion,
  acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true,
  aiProcessingAccepted: true,
}
const selections = {
  ageGroup: '5-7',
  language: 'ru',
  heroType: 'custom',
  customHeroName: heroName,
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}
const seriesState = {
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
  episodeCount: 1,
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

let profileCreated = false

try {
  const generation = await invokeJson(storyEndpoint, {
    selections,
    seriesState,
    privacyConsent,
  })
  const episode = generation.body?.episode
  assert(episode && typeof episode === 'object', 'story-generate did not return an episode')

  const sync = await invokeJson(stateEndpoint, {
    action: 'sync_generated',
    installationId,
    selections,
    seriesState,
    episode,
    readerPreferences,
    privacyConsent,
  })
  assert(sync.body?.ok === true, 'story-state did not confirm profile persistence')
  profileCreated = true

  const loaded = await invokeJson(stateEndpoint, {
    action: 'load_current',
    installationId,
  })
  assert(loaded.body?.snapshot, 'persisted profile snapshot could not be loaded')
  assert(loaded.body.snapshot.seriesState?.id === seriesId, 'loaded snapshot belongs to the wrong series')

  const deleted = await invokeJson(stateEndpoint, {
    action: 'delete_profile_data',
    installationId,
  })
  assert(deleted.body?.ok === true && deleted.body?.deleted === true, 'profile deletion was not confirmed')
  profileCreated = false

  const afterDeletion = await invokeJson(stateEndpoint, {
    action: 'load_current',
    installationId,
  })
  assert(afterDeletion.body?.snapshot === null, 'profile data still loads after deletion')

  const repeatedDeletion = await invokeJson(stateEndpoint, {
    action: 'delete_profile_data',
    installationId,
  })
  assert(
    repeatedDeletion.body?.ok === true && repeatedDeletion.body?.deleted === false,
    'repeated deletion must be safely idempotent',
  )

  console.log('Live privacy smoke passed: create, load, delete, verify absence, repeat delete.')
} finally {
  if (profileCreated) {
    try {
      await invokeJson(stateEndpoint, {
        action: 'delete_profile_data',
        installationId,
      })
    } catch (cleanupError) {
      console.error('Privacy smoke cleanup failed', cleanupError)
    }
  }
}
