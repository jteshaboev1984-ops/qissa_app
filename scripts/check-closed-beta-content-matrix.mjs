import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const minBedtimeWords = 160
const worlds = ['cozy_forest', 'magic_garden', 'stars_and_space']
const languages = ['ru', 'uz']
const sourceNames = [
  'contracts',
  'storyCoreBranches',
  'storyGenericEditorial',
  'storyCoreReference',
  'storyCozyForestBedtime',
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
  .replace(/['"]\.\/storyCozyForestBedtime\.ts['"]/g, "'./storyCozyForestBedtime.mjs'")
  .replace(/['"]\.\/storyMagicGardenBedtime\.ts['"]/g, "'./storyMagicGardenBedtime.mjs'")
  .replace(/['"]\.\/storyMagicGardenMemory\.ts['"]/g, "'./storyMagicGardenMemory.mjs'")
  .replace(/['"]\.\/storySpaceReference\.ts['"]/g, "'./storySpaceReference.mjs'")
  .replace(/['"]\.\/storySpaceMemory\.ts['"]/g, "'./storySpaceMemory.mjs'")
  .replace(/['"]\.\/storySpaceBedtimeMemory\.ts['"]/g, "'./storySpaceBedtimeMemory.mjs'")
  .replace(/['"]\.\/storySpaceBedtime\.ts['"]/g, "'./storySpaceBedtime.mjs'")

const wordCount = (text) => typeof text === 'string'
  ? text.trim().split(/\s+/u).filter(Boolean).length
  : 0

const technicalCopy = /state[_ -]?patch|episode[_ -]?id|series[_ -]?id|choice[_ -]?id|состояни[ея]\s+истории|техническ(?:ий|ая)\s+маркер/iu
const unresolvedBedtime = /продолжение следует|davomi bor|страшн(?:ый|ая|ое)|dahshatli|погоня|quv(?:di|ish)|взрыв|portlash/iu

const baseContext = (language, stylePackId) => ({
  ageGroup: '5-7',
  language,
  heroType: 'boy_hero',
  heroName: 'Timur',
  stylePackId,
  storyMode: 'series',
  storyMood: 'bedtime',
  seriesId: `beta-matrix-${language}-${stylePackId}`,
  episodeIndex: 1,
  isContinuation: false,
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: '',
  relationshipState: {},
  canonState: {},
  choiceHistory: [],
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
  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${nonce}`)
  let passed = 0
  let minimumEpisodeOneWords = Number.POSITIVE_INFINITY
  let minimumEpisodeTwoWords = Number.POSITIVE_INFINITY

  for (const language of languages) {
    for (const stylePackId of worlds) {
      const context = baseContext(language, stylePackId)
      const episodeOne = buildSafeFallback(context)
      const label = `${language}/${stylePackId}`
      const episodeOneWords = wordCount(episodeOne.story_text)
      minimumEpisodeOneWords = Math.min(minimumEpisodeOneWords, episodeOneWords)

      assert(episodeOne.episode_id === `ep-1-${stylePackId}`, `${label}: wrong Episode 1 id.`)
      assert(episodeOne.series_id === context.seriesId, `${label}: Episode 1 lost series id.`)
      assert(episodeOneWords >= minBedtimeWords, `${label}: Episode 1 is below ${minBedtimeWords} words.`)
      assert(Array.isArray(episodeOne.choices) && episodeOne.choices.length === 2, `${label}: Episode 1 must contain exactly two choices.`)
      assert(new Set(episodeOne.choices.map((choice) => choice.choice_id)).size === 2, `${label}: choice ids must be distinct.`)
      assert(Boolean(episodeOne.nextEpisodePreview?.trim()), `${label}: Episode 1 must expose a calm continuation preview.`)
      assert(episodeOne.safety_self_check?.approved === true, `${label}: fallback Episode 1 must be safety-approved.`)
      assert(episodeOne.safety_self_check?.required_action === 'fallback', `${label}: deterministic matrix must stay on fallback source.`)
      assert(!technicalCopy.test(`${episodeOne.title} ${episodeOne.story_text}`), `${label}: Episode 1 exposes technical copy.`)
      assert(!unresolvedBedtime.test(episodeOne.story_text), `${label}: Episode 1 breaks bedtime tone.`)
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
        minimumEpisodeTwoWords = Math.min(minimumEpisodeTwoWords, episodeTwoWords)
        assert(episodeTwo.episode_id === `ep-2-${stylePackId}`, `${label}/${branch}: wrong Episode 2 id.`)
        assert(episodeTwo.series_id === context.seriesId, `${label}/${branch}: Episode 2 lost series id.`)
        assert(episodeTwoWords >= minBedtimeWords, `${label}/${branch}: Episode 2 is below ${minBedtimeWords} words.`)
        assert(Array.isArray(episodeTwo.choices) && episodeTwo.choices.length === 0, `${label}/${branch}: Episode 2 must contain zero choices.`)
        assert(episodeTwo.nextEpisodePreview === '', `${label}/${branch}: Episode 2 must not promise another episode.`)
        assert(episodeTwo.state_patch?.canon_updates?.remembered_choice === `choice-${branch}`, `${label}/${branch}: remembered branch is missing from canon patch.`)
        assert(episodeTwo.state_patch?.open_arc === undefined, `${label}/${branch}: Episode 2 must close the active arc.`)
        assert(!technicalCopy.test(`${episodeTwo.title} ${episodeTwo.story_text}`), `${label}/${branch}: Episode 2 exposes technical copy.`)
        assert(!unresolvedBedtime.test(episodeTwo.story_text), `${label}/${branch}: Episode 2 breaks bedtime tone.`)
      }

      assert(episodeTwoA.story_text !== episodeTwoB.story_text, `${label}: A/B continuations must be different.`)
      passed += 2
    }
  }

  assert(passed === 12, `Closed-beta matrix expected 12 branches, got ${passed}.`)
  console.log(`closed beta deterministic content matrix passed: 12/12 RU/UZ bedtime branches; minimum Episode 1=${minimumEpisodeOneWords} words, Episode 2=${minimumEpisodeTwoWords} words.`)
} finally {
  await rm(temp, { recursive: true, force: true })
}
