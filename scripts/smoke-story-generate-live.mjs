const endpoint = process.env.QISSA_STORY_ENDPOINT?.trim()
  || 'https://phwakdpxxyncyslvnqht.supabase.co/functions/v1/story-generate'
const publishableKey = process.env.QISSA_SUPABASE_ANON_KEY?.trim()
const expectedSource = process.env.QISSA_EXPECTED_GENERATION_SOURCE?.trim() || null
const allowedSources = new Set(['safe-fallback', 'openai-structured'])
const consentVersion = '2026-06-25-v1'

if (!publishableKey) {
  console.error('QISSA_SUPABASE_ANON_KEY is required for the live smoke test.')
  process.exit(1)
}

const languages = ['ru', 'uz', 'kz']
const timeoutMs = 45_000
const technicalStoryLanguage = /последстви[ея] выбора|мир запомнил|текущей версии|сохран[её]н(?:ный|о) выбор|episode|state[_ -]?patch/iu
const nauticalSpaceCopy = /\bпричал(?:а|е|у|ом)?\b/iu

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length

const validateSource = (source, label) => {
  assert(allowedSources.has(source), `${label}: unrecognized generation source ${source}`)
  if (expectedSource) {
    assert(source === expectedSource, `${label}: expected source ${expectedSource}, got ${source}`)
  }
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

const basePayload = (language, heroName, stylePackId = 'cozy_forest') => ({
  selections: {
    ageGroup: '5-7',
    language,
    heroType: 'custom',
    customHeroName: heroName,
    stylePackId,
    storyMode: 'series',
    storyMood: 'bedtime',
  },
  seriesState: {
    id: `smoke-${stylePackId}-${language}-${Date.now()}`,
    mainCharacter: heroName,
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  },
  privacyConsent: {
    version: consentVersion,
    acceptedAt: new Date().toISOString(),
    parentOrGuardianConfirmed: true,
    aiProcessingAccepted: true,
  },
})

const validateEpisodeOne = (result, language, heroName, stylePackId) => {
  const episode = result.body?.episode
  assert(episode && typeof episode === 'object', `${language}/${stylePackId}: missing episode`)
  assert(episode.episode_id === `ep-1-${stylePackId}`, `${language}/${stylePackId}: wrong episode 1 id`)
  assert(episode.series_id?.startsWith(`smoke-${stylePackId}-${language}-`), `${language}/${stylePackId}: wrong series id`)
  assert(typeof episode.title === 'string' && episode.title.length > 0, `${language}/${stylePackId}: missing title`)
  assert(typeof episode.story_text === 'string' && episode.story_text.includes(heroName), `${language}/${stylePackId}: hero name was not restored`)
  assert(!episode.story_text.includes('{{HERO}}'), `${language}/${stylePackId}: unresolved hero token`)
  assert(Array.isArray(episode.choices) && episode.choices.length === 2, `${language}/${stylePackId}: episode 1 must have two choices`)
  assert(episode.safety_self_check?.approved === true, `${language}/${stylePackId}: safety must be approved`)
  validateSource(result.source, `${language}/${stylePackId}`)

  const expectedAction = result.source === 'safe-fallback' ? 'fallback' : 'publish'
  assert(episode.safety_self_check?.required_action === expectedAction, `${language}/${stylePackId}: expected safety action ${expectedAction}`)

  if (language === 'ru') {
    assert(Array.isArray(episode.vocabulary) && episode.vocabulary.length >= 2, `${stylePackId}: RU vocabulary is missing`)
  } else {
    assert(Array.isArray(episode.vocabulary) && episode.vocabulary.length === 0, `${language}: vocabulary must be empty`)
  }

  return episode
}

const continuationPayload = (payload, episodeOne, chosen) => ({
  ...payload,
  seriesState: {
    ...payload.seriesState,
    recurringCharacters: chosen.state_patch?.new_friend ? [chosen.state_patch.new_friend] : [],
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
})

const validateContinuation = (result, chosen, heroName, stylePackId) => {
  const episode = result.body?.episode
  assert(episode && typeof episode === 'object', `${stylePackId}/${chosen.choice_id}: missing continuation episode`)
  assert(episode.episode_id === `ep-2-${stylePackId}`, `${stylePackId}/${chosen.choice_id}: wrong episode id`)
  assert(Array.isArray(episode.choices) && episode.choices.length === 0, `${stylePackId}/${chosen.choice_id}: choices must be empty`)
  assert(typeof episode.story_text === 'string' && episode.story_text.includes(heroName), `${stylePackId}/${chosen.choice_id}: hero name was not restored`)
  assert(!episode.story_text.includes('{{HERO}}'), `${stylePackId}/${chosen.choice_id}: unresolved hero token`)
  validateSource(result.source, `${stylePackId}/${chosen.choice_id}`)

  if (result.source === 'safe-fallback') {
    assert(episode.state_patch?.canon_updates?.remembered_choice === chosen.choice_id, `${stylePackId}/${chosen.choice_id}: confirmed choice is missing from canon`)
    assert(episode.state_patch?.canon_updates?.remembered_artifact, `${stylePackId}/${chosen.choice_id}: remembered artifact is missing`)

    if (stylePackId === 'cozy_forest' && chosen.choice_id === 'choice-a') {
      assert(/фонарик|светил|освещённой тропинке/iu.test(episode.story_text), 'cozy choice-a: lantern consequence is not visible')
    }
    if (stylePackId === 'cozy_forest' && chosen.choice_id === 'choice-b') {
      assert(/песня|мелодия|запел/iu.test(episode.story_text), 'cozy choice-b: song consequence is not visible')
    }
    if (stylePackId === 'stars_and_space' && chosen.choice_id === 'choice-a') {
      assert(/маяк|золотой луч|сигнал/iu.test(episode.story_text), 'space choice-a: beacon consequence is not visible')
      assert(!nauticalSpaceCopy.test(`${episode.title} ${episode.story_text}`), 'space choice-a: nautical docking copy is still deployed')
    }
    if (stylePackId === 'stars_and_space' && chosen.choice_id === 'choice-b') {
      assert(/созвезди|звёздн|Дорога домой/iu.test(episode.story_text), 'space choice-b: constellation consequence is not visible')
      assert(!nauticalSpaceCopy.test(`${episode.title} ${episode.story_text}`), 'space choice-b: nautical docking copy is still deployed')
    }
  }

  return episode
}

for (const language of languages) {
  const heroName = language === 'uz' ? 'Aziza' : language === 'kz' ? 'Айдана' : 'Алиса'
  const payload = basePayload(language, heroName)
  const firstResult = await invoke(payload)
  const episodeOne = validateEpisodeOne(firstResult, language, heroName, 'cozy_forest')

  if (language === 'ru') {
    const continuations = []
    for (const chosen of episodeOne.choices) {
      const result = await invoke(continuationPayload(payload, episodeOne, chosen))
      continuations.push(validateContinuation(result, chosen, heroName, 'cozy_forest'))
    }
    assert(continuations[0].story_text !== continuations[1].story_text, 'ru/cozy: different choices produced the same continuation')
  }

  console.log(`${language}: live cozy story smoke passed (${firstResult.source}; ${firstResult.fallbackReason || 'no fallback reason'})`)
}

const spaceHero = 'Тимур'
const spacePayload = basePayload('ru', spaceHero, 'stars_and_space')
const spaceFirstResult = await invoke(spacePayload)
const spaceEpisodeOne = validateEpisodeOne(spaceFirstResult, 'ru', spaceHero, 'stars_and_space')

if (spaceFirstResult.source === 'safe-fallback') {
  assert(spaceEpisodeOne.title === 'Маяк над станцией «Люмен»', 'space: editorial Episode 1 title is not deployed')
  assert(wordCount(spaceEpisodeOne.story_text) >= 160, 'space: Episode 1 is still the short generic fallback')
  assert(!technicalStoryLanguage.test(`${spaceEpisodeOne.title} ${spaceEpisodeOne.story_text}`), 'space: Episode 1 exposes technical copy')
  assert(!nauticalSpaceCopy.test(`${spaceEpisodeOne.title} ${spaceEpisodeOne.story_text}`), 'space: nautical docking copy is still deployed')
}

const spaceContinuations = []
for (const chosen of spaceEpisodeOne.choices) {
  const result = await invoke(continuationPayload(spacePayload, spaceEpisodeOne, chosen))
  const continuation = validateContinuation(result, chosen, spaceHero, 'stars_and_space')
  spaceContinuations.push(continuation)

  if (result.source === 'safe-fallback') {
    assert(wordCount(continuation.story_text) >= 120, `space/${chosen.choice_id}: continuation is still too short`)
    assert(!technicalStoryLanguage.test(`${continuation.title} ${continuation.story_text}`), `space/${chosen.choice_id}: technical copy is visible`)
    assert(!nauticalSpaceCopy.test(`${continuation.title} ${continuation.story_text}`), `space/${chosen.choice_id}: nautical docking copy is visible`)
  }
}

assert(spaceContinuations[0].story_text !== spaceContinuations[1].story_text, 'space: both choices produced the same continuation')
assert(spaceContinuations[0].state_patch?.canon_updates?.remembered_artifact !== spaceContinuations[1].state_patch?.canon_updates?.remembered_artifact, 'space: choices produced the same remembered artifact')

console.log(`ru/stars_and_space: editorial live smoke passed (${spaceFirstResult.source})`)
console.log('Live story-generate smoke passed for RU/UZ/KZ cozy stories and both RU space branches.')
