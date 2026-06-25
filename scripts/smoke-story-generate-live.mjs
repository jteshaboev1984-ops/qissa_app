const endpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const expectedSource = process.env.QISSA_EXPECTED_GENERATION_SOURCE?.trim() || 'safe-fallback'

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the live smoke test.')
  process.exit(1)
}

const languages = ['ru', 'uz', 'kz']
const timeoutMs = 20_000

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const invoke = async (payload) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: publishableKey,
        authorization: `Bearer ${publishableKey}`,
        origin: 'https://jteshaboev1984-ops.github.io',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const responseText = await response.text()
    assert(response.ok, `story-generate returned ${response.status}: ${responseText.slice(0, 300)}`)

    let body
    try {
      body = JSON.parse(responseText)
    } catch {
      throw new Error('story-generate returned non-JSON content')
    }

    return {
      body,
      source: response.headers.get('x-qissa-generation-source'),
      fallbackReason: response.headers.get('x-qissa-fallback-reason'),
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

const basePayload = (language, heroName) => ({
  selections: {
    ageGroup: '5-7',
    language,
    heroType: 'custom',
    customHeroName: heroName,
    stylePackId: 'cozy_forest',
    storyMode: 'series',
    storyMood: 'bedtime',
  },
  seriesState: {
    id: `smoke-${language}-${Date.now()}`,
    mainCharacter: heroName,
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  },
})

const validateEpisodeOne = (result, language, heroName) => {
  const episode = result.body?.episode
  assert(episode && typeof episode === 'object', `${language}: missing episode`)
  assert(episode.episode_id === 'ep-1-cozy_forest', `${language}: wrong episode 1 id`)
  assert(episode.series_id?.startsWith(`smoke-${language}-`), `${language}: wrong series id`)
  assert(typeof episode.title === 'string' && episode.title.length > 0, `${language}: missing title`)
  assert(typeof episode.story_text === 'string' && episode.story_text.includes(heroName), `${language}: hero name was not restored`)
  assert(!episode.story_text.includes('{{HERO}}'), `${language}: unresolved hero token`)
  assert(Array.isArray(episode.choices) && episode.choices.length === 2, `${language}: episode 1 must have two choices`)
  assert(episode.safety_self_check?.approved === true, `${language}: fallback safety must be approved`)
  assert(episode.safety_self_check?.required_action === 'fallback', `${language}: expected fallback safety action`)
  assert(result.source === expectedSource, `${language}: expected source ${expectedSource}, got ${result.source}`)

  if (language === 'ru') {
    assert(Array.isArray(episode.vocabulary) && episode.vocabulary.length >= 2, 'ru: vocabulary is missing')
  } else {
    assert(Array.isArray(episode.vocabulary) && episode.vocabulary.length === 0, `${language}: vocabulary must be empty`)
  }

  return episode
}

const validateContinuation = (result, episodeOne, heroName) => {
  const episode = result.body?.episode
  assert(episode && typeof episode === 'object', 'continuation: missing episode')
  assert(episode.episode_id === 'ep-2-cozy_forest', 'continuation: wrong episode id')
  assert(Array.isArray(episode.choices) && episode.choices.length === 0, 'continuation: choices must be empty')
  assert(episode.story_text.includes(heroName), 'continuation: hero name was not restored')
  assert(!episode.story_text.includes('{{HERO}}'), 'continuation: unresolved hero token')
  assert(episode.story_text.includes(episodeOne.choices[0].tomorrow_seed), 'continuation: saved choice consequence is missing')
  assert(result.source === expectedSource, `continuation: expected source ${expectedSource}, got ${result.source}`)
}

for (const language of languages) {
  const heroName = language === 'uz' ? 'Aziza' : language === 'kz' ? 'Айдана' : 'Алиса'
  const payload = basePayload(language, heroName)
  const firstResult = await invoke(payload)
  const episodeOne = validateEpisodeOne(firstResult, language, heroName)

  if (language === 'ru') {
    const chosen = episodeOne.choices[0]
    const continuationPayload = {
      ...payload,
      seriesState: {
        ...payload.seriesState,
        lastEpisodeSummary: chosen.effect_summary,
        activeArc: chosen.state_patch?.open_arc || '',
        canonState: chosen.state_patch?.canon_updates || {},
        relationshipState: chosen.state_patch?.relationship_updates || {},
        choiceHistory: [{
          episode_id: episodeOne.episode_id,
          choice_id: chosen.choice_id,
          choice_text: chosen.text,
          effect_summary: chosen.effect_summary,
          resolution_text: chosen.resolution_text,
          tomorrow_seed: chosen.tomorrow_seed,
          state_patch: chosen.state_patch,
          selected_at: new Date().toISOString(),
        }],
        episodeCount: 1,
      },
    }
    const continuationResult = await invoke(continuationPayload)
    validateContinuation(continuationResult, episodeOne, heroName)
  }

  console.log(`${language}: live story smoke passed (${firstResult.source}; ${firstResult.fallbackReason || 'no fallback reason'})`)
}

console.log('Live story-generate smoke test passed for ru/uz/kz and continuation.')
