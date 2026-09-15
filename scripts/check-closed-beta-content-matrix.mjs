import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourceNames = [
  'contracts',
  'storyCoreBranches',
  'storyGenericEditorial',
  'storyCoreReference',
  'storyBedtimeExpansion',
  'storySixMinuteEditorial',
  'storyCozyForestBedtime',
  'storyCozyForestBedtimeArc',
  'storyMagicGardenBedtime',
  'storyMagicGardenMemory',
  'storySpaceReference',
  'storySpaceBedtimeMemory',
  'storySpaceBedtime',
  'storySpaceMemory',
  'fallback',
]

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
  },
}).outputText
  .replace(/['"]\.\/contracts\.ts['"]/g, "'./contracts.mjs'")
  .replace(/['"]\.\/storyCoreBranches\.ts['"]/g, "'./storyCoreBranches.mjs'")
  .replace(/['"]\.\/storyGenericEditorial\.ts['"]/g, "'./storyGenericEditorial.mjs'")
  .replace(/['"]\.\/storyCoreReference\.ts['"]/g, "'./storyCoreReference.mjs'")
  .replace(/['"]\.\/storyBedtimeExpansion\.ts['"]/g, "'./storyBedtimeExpansion.mjs'")
  .replace(/['"]\.\/storySixMinuteEditorial\.ts['"]/g, "'./storySixMinuteEditorial.mjs'")
  .replace(/['"]\.\/storyCozyForestBedtime\.ts['"]/g, "'./storyCozyForestBedtime.mjs'")
  .replace(/['"]\.\/storyCozyForestBedtimeArc\.ts['"]/g, "'./storyCozyForestBedtimeArc.mjs'")
  .replace(/['"]\.\/storyMagicGardenBedtime\.ts['"]/g, "'./storyMagicGardenBedtime.mjs'")
  .replace(/['"]\.\/storyMagicGardenMemory\.ts['"]/g, "'./storyMagicGardenMemory.mjs'")
  .replace(/['"]\.\/storySpaceReference\.ts['"]/g, "'./storySpaceReference.mjs'")
  .replace(/['"]\.\/storySpaceMemory\.ts['"]/g, "'./storySpaceMemory.mjs'")
  .replace(/['"]\.\/storySpaceBedtimeMemory\.ts['"]/g, "'./storySpaceBedtimeMemory.mjs'")
  .replace(/['"]\.\/storySpaceBedtime\.ts['"]/g, "'./storySpaceBedtime.mjs'")

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length
const paragraphs = (text) => text.split(/\n\s*\n/u).map((paragraph) => paragraph.trim()).filter(Boolean)
const technicalCopy = /последстви[ея] выбора|мир запомнил|текущей версии|сохран[её]н(?:ный|о) выбор|episode|state[_ -]?patch/iu
const unresolvedBedtime = /продолжим завтра|новая загадка ждала|опасность только начиналась|неизвестно что будет дальше|тайна осталась/iu
const nextDayReset = /^(утром|на следующее утро|на следующий день|ertasi tong|ertasiga|tañerteñ|келесі таң)/iu
const genericOpening = /уютный лес|уютном лесу|shinam o‘rmon|волшебном саду|sehrli bog‘|звёздной станции|yulduzli bekat/iu
const minBedtimeWords = 300

const assertRussianHeroFinalization = (label, heroName, fields) => {
  const combined = fields.filter(Boolean).join(' ')
  assert(combined.includes(heroName), `${label}: custom hero name was not restored.`)
  assert(!combined.includes('{{HERO}}'), `${label}: unresolved hero token remains.`)
  assert(!/\{\{HERO\}\}/u.test(combined), `${label}: unresolved hero placeholder remains.`)
}

const finalEpisodeFields = (episode) => [
  episode.title,
  episode.story_text,
  episode.nextEpisodePreview,
  ...episode.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text, choice.tomorrow_seed]),
  ...episode.vocabulary.flatMap((item) => [item.word, item.translation, item.example]),
]

const baseSelections = (language, stylePackId) => ({
  ageGroup: '5-7',
  language,
  heroType: 'custom',
  customHeroName: language === 'ru' ? 'Мира' : 'Mira',
  stylePackId,
  storyMode: 'series',
  storyMood: 'bedtime',
})

const baseRequest = (language, stylePackId) => ({
  selections: baseSelections(language, stylePackId),
  seriesState: {
    id: `matrix-${language}-${stylePackId}`,
    mainCharacter: language === 'ru' ? 'Мира' : 'Mira',
    recurringCharacters: [],
    lastEpisodeSummary: '',
    activeArc: '',
    relationshipState: {},
    choiceHistory: [],
    canonState: {},
    episodeCount: 0,
  },
})

const continuationContext = (context, episodeOne, choice) => ({
  ...context,
  episodeIndex: 2,
  isContinuation: true,
  recurringCharacters: choice.state_patch?.new_friend ? [choice.state_patch.new_friend] : [],
  lastEpisodeSummary: choice.effect_summary,
  activeArc: choice.state_patch?.open_arc ?? '',
  relationshipState: choice.state_patch?.relationship_updates ?? {},
  canonState: choice.state_patch?.canon_updates ?? {},
  choiceHistory: [{
    episode_id: episodeOne.episode_id,
    choice_id: choice.choice_id,
    choice_text: choice.text,
    effect_summary: choice.effect_summary,
    resolution_text: choice.resolution_text,
    tomorrow_seed: choice.tomorrow_seed,
  }],
})

const temp = await mkdtemp(join(tmpdir(), 'qissa-beta-matrix-'))
try {
  for (const sourceName of sourceNames) {
    const source = await readFile(join(root, `supabase/functions/story-generate/${sourceName}.ts`), 'utf8')
    await writeFile(join(temp, `${sourceName}.mjs`), transpile(source))
  }

  const nonce = Date.now()
  const { normalizeStoryRequest } = await import(`${pathToFileURL(join(temp, 'contracts.mjs')).href}?v=${nonce}`)
  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${nonce}`)

  let passed = 0
  let minimumEpisodeOneWords = Number.POSITIVE_INFINITY
  let minimumEpisodeTwoWords = Number.POSITIVE_INFINITY

  for (const language of ['ru', 'uz']) {
    for (const stylePackId of ['cozy_forest', 'magic_garden', 'stars_and_space']) {
      const request = baseRequest(language, stylePackId)
      const context = normalizeStoryRequest(request)
      const label = `${language}/${stylePackId}`
      assert(context, `${label}: request normalization failed.`)
      const episodeOne = buildSafeFallback(context)
      const episodeOneWords = wordCount(episodeOne.story_text)
      const episodeOneParagraphs = paragraphs(episodeOne.story_text)
      minimumEpisodeOneWords = Math.min(minimumEpisodeOneWords, episodeOneWords)
      if (language === 'ru') assertRussianHeroFinalization(`${label}/episode-1`, context.heroName, finalEpisodeFields(episodeOne))
      assert(episodeOne.episode_id === `ep-1-${stylePackId}`, `${label}: wrong Episode 1 id.`)
      assert(episodeOne.series_id === context.seriesId, `${label}: Episode 1 lost series id.`)
      assert(episodeOneWords >= minBedtimeWords, `${label}: Episode 1 is below ${minBedtimeWords} words.`)
      assert(episodeOneParagraphs.length >= 5, `${label}: Episode 1 does not have enough story beats.`)
      assert(Array.isArray(episodeOne.choices) && episodeOne.choices.length === 2, `${label}: Episode 1 must contain exactly two choices.`)
      assert(!technicalCopy.test(`${episodeOne.title} ${episodeOne.story_text}`), `${label}: Episode 1 exposes technical copy.`)
      assert(!unresolvedBedtime.test(episodeOne.story_text), `${label}: Episode 1 breaks bedtime tone.`)
      assert(!genericOpening.test(episodeOne.story_text.slice(0, 80)), `${label}: Episode 1 still uses the old generic fallback opening.`)
      assert(language === 'ru' ? episodeOne.vocabulary.length >= 2 && episodeOne.vocabulary.length <= 3 : episodeOne.vocabulary.length === 0, `${label}: vocabulary contract mismatch.`)

      const [choiceA, choiceB] = episodeOne.choices
      for (const [branch, choice] of [['a', choiceA], ['b', choiceB]]) {
        assert(Boolean(choice.effect_summary?.trim()), `${label}/${branch}: missing effect summary.`)
        assert(Boolean(choice.resolution_text?.trim()), `${label}/${branch}: missing resolution text.`)
        assert(Boolean(choice.tomorrow_seed?.trim()), `${label}/${branch}: missing tomorrow seed.`)
        assert(!technicalCopy.test(`${choice.effect_summary} ${choice.resolution_text} ${choice.tomorrow_seed}`), `${label}/${branch}: choice memory exposes technical copy.`)
      }
      assert(choiceA.effect_summary !== choiceB.effect_summary, `${label}: branch effects must differ.`)
      assert(choiceA.tomorrow_seed !== choiceB.tomorrow_seed, `${label}: branch seeds must differ.`)

      const episodeTwoA = buildSafeFallback(continuationContext(context, episodeOne, choiceA))
      const episodeTwoB = buildSafeFallback(continuationContext(context, episodeOne, choiceB))

      for (const [branch, episodeTwo] of [['a', episodeTwoA], ['b', episodeTwoB]]) {
        const episodeTwoWords = wordCount(episodeTwo.story_text)
        const episodeTwoParagraphs = paragraphs(episodeTwo.story_text)
        minimumEpisodeTwoWords = Math.min(minimumEpisodeTwoWords, episodeTwoWords)
        if (language === 'ru') assertRussianHeroFinalization(`${label}/${branch}/episode-2`, context.heroName, finalEpisodeFields(episodeTwo))
        assert(episodeTwo.episode_id === `ep-2-${stylePackId}`, `${label}/${branch}: wrong Episode 2 id.`)
        assert(episodeTwo.series_id === context.seriesId, `${label}/${branch}: Episode 2 lost series id.`)
        assert(episodeTwoWords >= minBedtimeWords, `${label}/${branch}: Episode 2 is below ${minBedtimeWords} words.`)
        assert(episodeTwoParagraphs.length >= 4, `${label}/${branch}: Episode 2 does not have enough consequence/resolution beats.`)
        assert(!nextDayReset.test(episodeTwo.story_text.trim()), `${label}/${branch}: Episode 2 resets to a new day before resolving the child choice.`)
        assert(wordCount(episodeTwoParagraphs.at(-1) ?? '') >= 40, `${label}/${branch}: calm ending/coda is too short.`)
        assert(Array.isArray(episodeTwo.choices) && episodeTwo.choices.length === 0, `${label}/${branch}: Episode 2 must contain zero choices.`)
        assert(episodeTwo.nextEpisodePreview === '', `${label}/${branch}: Episode 2 must not promise another episode.`)
        assert(episodeTwo.state_patch?.canon_updates?.remembered_choice === `choice-${branch}`, `${label}/${branch}: remembered branch is missing from canon patch.`)
        assert(episodeTwo.state_patch?.open_arc === null, `${label}/${branch}: Episode 2 must explicitly close the nightly active arc.`)
        assert(!technicalCopy.test(`${episodeTwo.title} ${episodeTwo.story_text}`), `${label}/${branch}: Episode 2 exposes technical copy.`)
        assert(!unresolvedBedtime.test(episodeTwo.story_text), `${label}/${branch}: Episode 2 breaks bedtime tone.`)
      }

      assert(episodeTwoA.story_text !== episodeTwoB.story_text, `${label}: A/B continuations must be different.`)
      passed += 2
    }
  }

  assert(passed === 12, `Closed-beta matrix expected 12 branches, got ${passed}.`)
  console.log(`closed beta deterministic content matrix passed: 12/12 RU/UZ bedtime branches; minimum Episode 1=${minimumEpisodeOneWords} words, Episode 2=${minimumEpisodeTwoWords} words; all continuations resolve in the same story arc.`)
} finally {
  await rm(temp, { recursive: true, force: true })
}
