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
  'storyMagicGardenBedtime',
  'storySpaceReference',
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
  .replace(/['"]\.\/storyMagicGardenBedtime\.ts['"]/g, "'./storyMagicGardenBedtime.mjs'")
  .replace(/['"]\.\/storySpaceReference\.ts['"]/g, "'./storySpaceReference.mjs'")
  .replace(/['"]\.\/storySpaceMemory\.ts['"]/g, "'./storySpaceMemory.mjs'")

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length
const forbiddenIntensity = /погон|ужас|страшн|крич|взрыв|опасн|сраж/iu
const technicalStoryLanguage = /последстви[ея] выбора|мир запомнил|текущей версии|сохран[её]н(?:ный|о) выбор|episode|state[_ -]?patch/iu
const nauticalSpaceCopy = /\bпричал(?:а|е|у|ом)?\b/iu
const memoryFromChoice = (episode, choice) => ({
  episode_id: episode.episode_id,
  choice_id: choice.choice_id,
  choice_text: choice.text,
  effect_summary: choice.effect_summary,
  resolution_text: choice.resolution_text,
  tomorrow_seed: choice.tomorrow_seed,
})

const baseSelections = {
  ageGroup: '5-7',
  language: 'ru',
  heroType: 'custom',
  customHeroName: 'Мира',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}
const baseContext = {
  ageGroup: '5-7', language: 'ru', heroType: 'custom', heroName: 'Мира',
  stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
  seriesId: 'story-editorial-proof', episodeIndex: 1, isContinuation: false,
  recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',
  relationshipState: {}, canonState: {}, choiceHistory: [],
}

const temp = await mkdtemp(join(tmpdir(), 'qissa-story-editorial-'))
try {
  for (const sourceName of sourceNames) {
    const source = await readFile(join(root, `supabase/functions/story-generate/${sourceName}.ts`), 'utf8')
    await writeFile(join(temp, `${sourceName}.mjs`), transpile(source))
  }

  const nonce = Date.now()
  const { normalizeStoryRequest } = await import(`${pathToFileURL(join(temp, 'contracts.mjs')).href}?v=${nonce}`)
  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${nonce}`)

  const continueAfterReopen = (episodeOne, choice, stylePackId) => {
    const saved = JSON.parse(JSON.stringify({
      selections: { ...baseSelections, stylePackId },
      seriesState: {
        id: `${baseContext.seriesId}-${stylePackId}`,
        mainCharacter: baseContext.heroName,
        recurringCharacters: choice.state_patch.new_friend ? [choice.state_patch.new_friend] : [],
        lastEpisodeSummary: choice.effect_summary,
        activeArc: choice.state_patch.open_arc ?? '',
        relationshipState: choice.state_patch.relationship_updates ?? {},
        canonState: choice.state_patch.canon_updates ?? {},
        choiceHistory: [memoryFromChoice(episodeOne, choice)],
        episodeCount: 1,
      },
    }))
    const context = normalizeStoryRequest(saved)
    assert(context?.isContinuation && context.episodeIndex === 2, `${stylePackId}: reopen state is invalid.`)
    assert(context.heroName === 'Мира', `${stylePackId}: hero was lost after reopen.`)
    return buildSafeFallback(context)
  }

  const verifyTwoBranches = (episodeOne, stylePackId) => {
    assert(episodeOne.choices.length === 2, `${stylePackId}: expected two choices.`)
    const [choiceA, choiceB] = episodeOne.choices
    assert(choiceA.effect_summary !== choiceB.effect_summary, `${stylePackId}: effects are identical.`)
    assert(choiceA.tomorrow_seed !== choiceB.tomorrow_seed, `${stylePackId}: story seeds are identical.`)
    assert(!technicalStoryLanguage.test(`${choiceA.effect_summary} ${choiceA.resolution_text} ${choiceA.tomorrow_seed}`), `${stylePackId}/A exposes technical wording.`)
    assert(!technicalStoryLanguage.test(`${choiceB.effect_summary} ${choiceB.resolution_text} ${choiceB.tomorrow_seed}`), `${stylePackId}/B exposes technical wording.`)

    const episodeTwoA = continueAfterReopen(episodeOne, choiceA, stylePackId)
    const episodeTwoB = continueAfterReopen(episodeOne, choiceB, stylePackId)
    assert(episodeTwoA.story_text !== episodeTwoB.story_text, `${stylePackId}: continuations are identical.`)
    assert(episodeTwoA.state_patch.canon_updates?.remembered_choice === 'choice-a', `${stylePackId}/A lost canon choice.`)
    assert(episodeTwoB.state_patch.canon_updates?.remembered_choice === 'choice-b', `${stylePackId}/B lost canon choice.`)
    assert(episodeTwoA.state_patch.open_arc === undefined && episodeTwoB.state_patch.open_arc === undefined, `${stylePackId}: Episode 2 left an open arc.`)
    assert(!technicalStoryLanguage.test(`${episodeTwoA.title} ${episodeTwoA.story_text}`), `${stylePackId}/A continuation exposes technical wording.`)
    assert(!technicalStoryLanguage.test(`${episodeTwoB.title} ${episodeTwoB.story_text}`), `${stylePackId}/B continuation exposes technical wording.`)
    return [episodeTwoA, episodeTwoB]
  }

  const forestOne = buildSafeFallback(baseContext)
  assert(wordCount(forestOne.story_text) >= 160 && wordCount(forestOne.story_text) <= 260, 'Forest Episode 1 editorial length failed.')
  assert(!forbiddenIntensity.test(forestOne.story_text), 'Forest Episode 1 breaks bedtime tone.')
  const [forestA, forestB] = verifyTwoBranches(forestOne, 'cozy_forest')
  assert(/фонарик|светил|освещённой тропинке/iu.test(forestA.story_text), 'Forest A lost lantern consequence.')
  assert(/песня|мелодия|запел/iu.test(forestB.story_text), 'Forest B lost song consequence.')

  const spaceOne = buildSafeFallback({ ...baseContext, stylePackId: 'stars_and_space' })
  assert(spaceOne.title === 'Маяк над станцией «Люмен»', 'Space Episode 1 title is not editorial.')
  assert(wordCount(spaceOne.story_text) >= 160 && wordCount(spaceOne.story_text) <= 260, 'Space Episode 1 is not a full scene.')
  assert(!technicalStoryLanguage.test(`${spaceOne.title} ${spaceOne.story_text}`), 'Space Episode 1 exposes technical wording.')
  assert(!nauticalSpaceCopy.test(`${spaceOne.title} ${spaceOne.story_text}`), 'Space Episode 1 uses nautical copy.')
  const [spaceA, spaceB] = verifyTwoBranches(spaceOne, 'stars_and_space')
  assert(spaceA.title === 'Золотой сигнал для лунной почты', 'Space A title is wrong.')
  assert(spaceB.title === 'Созвездие «Дорога домой»', 'Space B title is wrong.')
  assert(/маяк|золотой луч|сигнал/iu.test(spaceA.story_text), 'Space A lost beacon consequence.')
  assert(/созвезди|звёздн|Дорога домой/iu.test(spaceB.story_text), 'Space B lost constellation consequence.')
  for (const [label, episode] of [['space-a', spaceA], ['space-b', spaceB]]) {
    assert(wordCount(episode.story_text) >= 120 && wordCount(episode.story_text) <= 220, `${label} editorial length failed.`)
    assert(!forbiddenIntensity.test(episode.story_text), `${label} breaks bedtime tone.`)
    assert(!nauticalSpaceCopy.test(`${episode.title} ${episode.story_text}`), `${label} uses nautical copy.`)
  }

  for (const stylePackId of ['magic_garden', 'brave_adventure', 'silk_road', 'animal_world', 'castle_mystery', 'sea_islands']) {
    const episodeOne = buildSafeFallback({ ...baseContext, stylePackId })
    assert(!technicalStoryLanguage.test(`${episodeOne.title} ${episodeOne.story_text}`), `${stylePackId}: opening exposes technical wording.`)
    verifyTwoBranches(episodeOne, stylePackId)
  }

  console.log('Story editorial proof passed for every world; forest and space full references remain distinct and bedtime-safe.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
