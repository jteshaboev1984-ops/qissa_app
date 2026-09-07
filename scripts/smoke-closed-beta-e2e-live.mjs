import { randomUUID } from 'node:crypto'

const storyEndpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const stateEndpoint = process.env.QISSA_STATE_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-state'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const consentVersion = '2026-06-25-v1'

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the closed-beta live smoke test.')
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

const safeFallbackReason = (response) => response.headers.get('x-qissa-fallback-reason') || ''
const generationSource = (response) => response.headers.get('x-qissa-generation-source') || ''

const consent = () => ({
  version: consentVersion,
  acceptedAt: new Date().toISOString(),
  parentOrGuardianConfirmed: true,
  aiProcessingAccepted: true,
})

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

const baseSelections = (language, stylePackId) => ({
  ageGroup: '5-7',
  language,
  heroType: 'boy_hero',
  stylePackId,
  storyMode: 'series',
  storyMood: 'bedtime',
})

const initialSeriesState = (installationId, seriesId, stylePackId) => ({
  id: seriesId,
  childProfileId: installationId,
  stylePackId,
  mainCharacter: 'Timur',
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: '',
  relationshipState: {},
  choiceHistory: [],
  canonState: {},
  episodeCount: 0,
})

const mergeRecord = (base, patch) => ({
  ...base,
  ...(patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {}),
})

const applyChoice = (seriesState, episode, choice) => {
  const patch = choice.state_patch && typeof choice.state_patch === 'object' ? choice.state_patch : {}
  const recurringCharacters = [...seriesState.recurringCharacters]
  if (typeof patch.new_friend === 'string' && patch.new_friend && !recurringCharacters.includes(patch.new_friend)) {
    recurringCharacters.push(patch.new_friend)
  }

  return {
    ...seriesState,
    recurringCharacters,
    lastEpisodeSummary: choice.effect_summary,
    activeArc: typeof patch.open_arc === 'string' ? patch.open_arc : seriesState.activeArc,
    relationshipState: mergeRecord(seriesState.relationshipState, patch.relationship_updates),
    canonState: mergeRecord(seriesState.canonState, patch.canon_updates),
    choiceHistory: [
      ...seriesState.choiceHistory,
      {
        episode_id: episode.episode_id,
        choice_id: choice.choice_id,
        choice_text: choice.text,
        effect_summary: choice.effect_summary,
        resolution_text: choice.resolution_text,
        tomorrow_seed: choice.tomorrow_seed,
        state_patch: patch,
        selected_at: new Date().toISOString(),
      },
    ],
    episodeCount: 1,
  }
}

const assertFallbackGeneration = (result, label) => {
  assert(generationSource(result.response) === 'safe-fallback', `${label}: generation source is not safe-fallback`)
  const reason = safeFallbackReason(result.response)
  assert(reason === 'ai-disabled' || reason === 'api-key-missing', `${label}: unexpected fallback reason ${reason}`)
  const episode = result.body?.episode
  assert(episode && typeof episode === 'object', `${label}: missing episode`)
  return episode
}

const preflight = async () => {
  const selections = baseSelections('ru', 'cozy_forest')
  const probe = await invokeJson(storyEndpoint, {
    selections,
    seriesState: initialSeriesState(randomUUID(), `series-preflight-${randomUUID()}`, 'cozy_forest'),
    privacyConsent: consent(),
  })

  assert(generationSource(probe.response) === 'safe-fallback', 'Preflight must never use a paid provider.')
  const reason = safeFallbackReason(probe.response)
  assert(
    reason === 'ai-disabled' || reason === 'api-key-missing' || reason === 'rate-limit-identity-missing',
    `Unexpected provider-free preflight reason: ${reason}`,
  )

  if (reason === 'rate-limit-identity-missing') {
    throw new Error('Story AI is enabled. Closed-beta fallback E2E stopped before any paid provider request.')
  }

  console.log(`Provider-free preflight passed: ${reason}.`)
}

const runScenario = async ({ language, stylePackId, branchIndex }) => {
  const installationId = randomUUID()
  const seriesId = `series-${randomUUID()}`
  const selections = baseSelections(language, stylePackId)
  const privacyConsent = consent()
  const initialState = initialSeriesState(installationId, seriesId, stylePackId)
  const label = `${language}/${stylePackId}/choice-${branchIndex === 0 ? 'a' : 'b'}`
  let profileCreated = false

  try {
    const first = await invokeJson(storyEndpoint, {
      installationId,
      selections,
      seriesState: initialState,
      privacyConsent,
    })
    const episodeOne = assertFallbackGeneration(first, `${label}/episode-1`)
    assert(episodeOne.series_id === seriesId, `${label}: episode 1 series id mismatch`)
    assert(Array.isArray(episodeOne.choices) && episodeOne.choices.length === 2, `${label}: episode 1 must have two choices`)
    assert(typeof episodeOne.story_text === 'string' && episodeOne.story_text.length > 400, `${label}: episode 1 is too short`)

    const syncOne = await invokeJson(stateEndpoint, {
      action: 'sync_generated',
      installationId,
      selections,
      seriesState: { ...initialState, episodeCount: 1 },
      episode: episodeOne,
      readerPreferences,
      privacyConsent,
    })
    assert(syncOne.body?.ok === true, `${label}: episode 1 persistence failed`)
    profileCreated = true

    const choice = episodeOne.choices[branchIndex]
    assert(choice && typeof choice.choice_id === 'string', `${label}: choice missing`)
    const afterChoice = applyChoice(initialState, episodeOne, choice)

    const confirmed = await invokeJson(stateEndpoint, {
      action: 'confirm_choice',
      installationId,
      seriesState: afterChoice,
      episodeId: episodeOne.episode_id,
      choiceId: choice.choice_id,
    })
    assert(confirmed.body?.ok === true, `${label}: choice persistence failed`)

    const second = await invokeJson(storyEndpoint, {
      installationId,
      selections,
      seriesState: afterChoice,
      privacyConsent,
    })
    const episodeTwo = assertFallbackGeneration(second, `${label}/episode-2`)
    assert(episodeTwo.series_id === seriesId, `${label}: episode 2 series id mismatch`)
    assert(String(episodeTwo.episode_id).startsWith('ep-2-'), `${label}: continuation did not become episode 2`)
    assert(Array.isArray(episodeTwo.choices) && episodeTwo.choices.length === 0, `${label}: episode 2 must not offer another choice`)
    assert(typeof episodeTwo.story_text === 'string' && episodeTwo.story_text.length > 400, `${label}: episode 2 is too short`)

    const finalState = { ...afterChoice, episodeCount: 2 }
    const syncTwo = await invokeJson(stateEndpoint, {
      action: 'sync_generated',
      installationId,
      selections,
      seriesState: finalState,
      episode: episodeTwo,
      readerPreferences,
      privacyConsent,
    })
    assert(syncTwo.body?.ok === true, `${label}: episode 2 persistence failed`)

    const loaded = await invokeJson(stateEndpoint, {
      action: 'load_current',
      installationId,
    })
    assert(loaded.body?.snapshot, `${label}: persisted snapshot missing`)
    assert(loaded.body.snapshot.seriesState?.id === seriesId, `${label}: loaded series mismatch`)
    assert(String(loaded.body.snapshot.episode?.episode_id).startsWith('ep-2-'), `${label}: load_current did not restore episode 2`)

    const deleted = await invokeJson(stateEndpoint, {
      action: 'delete_profile_data',
      installationId,
    })
    assert(deleted.body?.ok === true && deleted.body?.deleted === true, `${label}: deletion failed`)
    profileCreated = false

    const afterDeletion = await invokeJson(stateEndpoint, {
      action: 'load_current',
      installationId,
    })
    assert(afterDeletion.body?.snapshot === null, `${label}: data still loads after deletion`)

    console.log(`PASS ${label}`)
  } finally {
    if (profileCreated) {
      try {
        await invokeJson(stateEndpoint, { action: 'delete_profile_data', installationId })
      } catch (cleanupError) {
        console.error(`Cleanup failed for ${label}`, cleanupError)
      }
    }
  }
}

await preflight()

const worlds = ['cozy_forest', 'magic_garden', 'stars_and_space']
const languages = ['ru', 'uz']
let passed = 0

for (const language of languages) {
  for (const stylePackId of worlds) {
    for (const branchIndex of [0, 1]) {
      await runScenario({ language, stylePackId, branchIndex })
      passed += 1
    }
  }
}

console.log(`Closed-beta production E2E passed: ${passed}/12 scenarios, all provider-free and deleted after verification.`)
