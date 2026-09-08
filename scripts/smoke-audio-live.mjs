import { randomBytes, randomUUID } from 'node:crypto'

const audioEndpoint = process.env.QISSA_AUDIO_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/audio-request'
const stateEndpoint = process.env.QISSA_STATE_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const consentVersion = '2026-06-25-v1'

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the live audio smoke test.')
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

const invoke = async (endpoint, payload, { allowFailure = false } = {}) => {
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
      throw new Error(`endpoint returned non-JSON content: ${text.slice(0, 240)}`)
    }
    if (!allowFailure) assert(response.ok, `endpoint returned ${response.status}: ${text.slice(0, 300)}`)
    return { ok: response.ok, status: response.status, body }
  } finally {
    clearTimeout(timeoutId)
  }
}

const installationId = randomUUID()
const installationAuth = randomBytes(32).toString('hex')
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const seriesId = `audio-smoke-${suffix}`
const episodeId = 'ep-1-cozy_forest'
const identity = { installationId, installationAuth, seriesId, episodeId }

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
  customHeroName: 'Алина',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}

const seriesState = {
  id: seriesId,
  childProfileId: 'audio-smoke-profile',
  stylePackId: 'cozy_forest',
  mainCharacter: 'Алина',
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: 'Помочь лесным друзьям спокойно вернуться домой.',
  relationshipState: {},
  choiceHistory: [],
  canonState: {},
  episodeCount: 0,
}

const safety = {
  approved: true,
  risk_level: 'low',
  flags: {
    discrimination: false,
    humiliation: false,
    religious_push: false,
    political_push: false,
    gender_stereotype: false,
    nationality_stereotype: false,
    conditional_love: false,
    bedtime_overstimulation: false,
    adult_theme: false,
    excessive_fear: false,
  },
  required_action: 'fallback',
}

const episode = {
  episode_id: episodeId,
  series_id: seriesId,
  title: 'Тихая лесная дорожка',
  story_text: 'Алина и сова Нура спокойно шли по вечерней лесной дорожке. Светлячки мягко освещали мокрые листья, а друзья помогали маленьким зверятам добраться до уютных домов. Никто не спешил, и лес постепенно становился всё тише. Когда последний зверёк оказался дома, Алина посмотрела на тёплые огоньки между ветками. Сова Нура приглушила фонарик, ручей зашелестел совсем тихо, и вечер закончился спокойно.',
  mode: 'series',
  mood: 'bedtime',
  stylePackId: 'cozy_forest',
  choices: [],
  state_patch: {},
  vocabulary: [],
  nextEpisodePreview: '',
  safety_self_check: safety,
}

let fixtureCreated = false
try {
  const synced = await invoke(stateEndpoint, {
    action: 'sync_generated',
    installationId,
    installationAuth,
    selections,
    seriesState,
    episode,
    readerPreferences: {
      textSize: 'medium',
      fontMode: 'standard',
      lineSpacing: 'relaxed',
      theme: 'warm',
      showTextWithAudio: true,
      audioOnlyNightMode: false,
      voicePresetId: 'neutral_storyteller',
      defaultPlaybackMode: 'listen',
    },
    privacyConsent,
  })
  assert(synced.body?.ok === true, 'audio smoke fixture was not persisted')
  fixtureCreated = true

  const blocked = await invoke(audioEndpoint, {
    action: 'load_progress',
    installationId,
    installationAuth: randomBytes(32).toString('hex'),
    seriesId,
    episodeId,
  }, { allowFailure: true })
  assert(blocked.status === 403, 'wrong installation credential must be rejected by Audio Agent')

  const first = await invoke(audioEndpoint, {
    action: 'request_audio',
    ...identity,
    voicePresetId: 'neutral_storyteller',
    speed: 1,
  })

  assert(first.body?.fallbackUsed === true, 'provider-free audio smoke must use safe device fallback')
  assert(first.body?.fallbackMode === 'device', 'fallback mode must be device')
  assert(first.body?.requiresAiVoiceDisclosure === false, 'device fallback must not show AI voice disclosure')
  assert(first.body?.audioAssetId === null && first.body?.audioUrl === null, 'provider-free fallback must not expose an audio asset')

  const saved = await invoke(audioEndpoint, {
    action: 'save_progress',
    ...identity,
    speed: 1,
    positionSeconds: 12.5,
    completed: false,
  })
  assert(saved.body?.ok === true, 'playback progress was not saved')

  const loaded = await invoke(audioEndpoint, {
    action: 'load_progress',
    ...identity,
  })
  assert(loaded.body?.progress && typeof loaded.body.progress === 'object', 'playback progress was not returned')
  assert(Math.abs(Number(loaded.body.progress.positionSeconds) - 12.5) < 0.01, 'loaded position does not match saved position')
  assert(loaded.body.progress.speed === 1, 'loaded speed does not match saved speed')
  assert(loaded.body.progress.completed === false, 'loaded completion state is wrong')

  const repeated = await invoke(audioEndpoint, {
    action: 'request_audio',
    ...identity,
    voicePresetId: 'neutral_storyteller',
    speed: 1,
  })
  assert(repeated.body?.fallbackUsed === true, 'repeated provider-free request changed fallback behavior')
  assert(repeated.body?.audioAssetId === null, 'repeated fallback unexpectedly created an asset')

  console.log('Live Audio Agent smoke passed: installation auth isolation, self-contained fixture, safe device fallback, no provider asset, remote progress save/load passed.')
} finally {
  if (fixtureCreated) {
    const deleted = await invoke(stateEndpoint, {
      action: 'delete_profile_data',
      installationId,
      installationAuth,
    }, { allowFailure: true })
    if (!deleted.ok || deleted.body?.deleted !== true) {
      console.error('Audio smoke cleanup failed; inspect the temporary installation id:', installationId)
      process.exitCode = 1
    }
  }
}
