import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourcePaths = {
  contracts: join(root, 'supabase/functions/story-generate/contracts.ts'),
  branches: join(root, 'supabase/functions/story-generate/storyCoreBranches.ts'),
  reference: join(root, 'supabase/functions/story-generate/storyCoreReference.ts'),
  worlds: join(root, 'supabase/functions/story-generate/storyWorldNarratives.ts'),
  closings: join(root, 'supabase/functions/story-generate/storyWorldClosings.ts'),
  fallback: join(root, 'supabase/functions/story-generate/fallback.ts'),
  uiCopy: join(root, 'src/i18n/storyQualityCopy.ts'),
}

const stylePackIds = [
  'cozy_forest',
  'magic_garden',
  'brave_adventure',
  'stars_and_space',
  'silk_road',
  'animal_world',
  'castle_mystery',
  'sea_islands',
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
  .replace(/['"]\.\/storyCoreReference\.ts['"]/g, "'./storyCoreReference.mjs'")
  .replace(/['"]\.\/storyWorldNarratives\.ts['"]/g, "'./storyWorldNarratives.mjs'")
  .replace(/['"]\.\/storyWorldClosings\.ts['"]/g, "'./storyWorldClosings.mjs'")

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
  ageGroup: '5-7',
  language: 'ru',
  heroType: 'custom',
  heroName: 'Мира',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
  seriesId: 'story-quality-proof-series',
  episodeIndex: 1,
  isContinuation: false,
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: '',
  relationshipState: {},
  canonState: {},
  choiceHistory: [],
}

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length
const highIntensity = /погон|ужас|страшный крик|кров|убить|взрыв|сражение/iu
const technicalLanguage = /последстви[ея] выбора|мир запомнил|история запомнила выбор|в следующей истории|текущей версии|завершить начатое дело|сохран[её]нный выбор|эпизод заверш[её]н|серия завершена/iu
const technicalUiLanguage = /в текущей версии|joriy versiya|ағымдағы нұсқа|серия завершена/iu

const assertStoryQuality = (text, label, minWords, maxWords) => {
  const words = wordCount(text)
  assert(words >= minWords, `${label}: only ${words} words; expected at least ${minWords}.`)
  assert(words <= maxWords, `${label}: ${words} words; expected at most ${maxWords}.`)
  assert(!technicalLanguage.test(text), `${label}: contains technical product language.`)
  assert(!highIntensity.test(text), `${label}: breaks the calm child-facing tone.`)
  assert(text.includes('Мира'), `${label}: custom hero name is missing.`)
}

const temp = await mkdtemp(join(tmpdir(), 'qissa-story-quality-'))
try {
  const [contractsSource, branchesSource, referenceSource, worldsSource, closingsSource, fallbackSource, uiCopySource] = await Promise.all([
    readFile(sourcePaths.contracts, 'utf8'),
    readFile(sourcePaths.branches, 'utf8'),
    readFile(sourcePaths.reference, 'utf8'),
    readFile(sourcePaths.worlds, 'utf8'),
    readFile(sourcePaths.closings, 'utf8'),
    readFile(sourcePaths.fallback, 'utf8'),
    readFile(sourcePaths.uiCopy, 'utf8'),
  ])

  assert(!technicalUiLanguage.test(uiCopySource), 'Child-facing UI copy contains technical release language.')

  await Promise.all([
    writeFile(join(temp, 'contracts.mjs'), transpile(contractsSource)),
    writeFile(join(temp, 'storyCoreBranches.mjs'), transpile(branchesSource)),
    writeFile(join(temp, 'storyCoreReference.mjs'), transpile(referenceSource)),
    writeFile(join(temp, 'storyWorldNarratives.mjs'), transpile(worldsSource)),
    writeFile(join(temp, 'storyWorldClosings.mjs'), transpile(closingsSource)),
    writeFile(join(temp, 'fallback.mjs'), transpile(fallbackSource)),
  ])

  const moduleNonce = Date.now()
  const { normalizeStoryRequest } = await import(`${pathToFileURL(join(temp, 'contracts.mjs')).href}?v=${moduleNonce}`)
  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${moduleNonce}`)

  const continuationAfterReopen = (episodeOne, choice, stylePackId) => {
    const persistedRequest = JSON.parse(JSON.stringify({
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

    const reopenedContext = normalizeStoryRequest(persistedRequest)
    assert(reopenedContext, `${stylePackId}: saved state did not survive backend normalization.`)
    assert(reopenedContext.isContinuation === true, `${stylePackId}: reopened state was not recognized as Episode 2.`)
    return buildSafeFallback(reopenedContext)
  }

  for (const stylePackId of stylePackIds) {
    const episodeOne = buildSafeFallback({ ...baseContext, stylePackId })
    assertStoryQuality(episodeOne.story_text, `${stylePackId}/episode-1`, 120, 300)
    assert(!technicalLanguage.test(episodeOne.title), `${stylePackId}/episode-1: technical title.`)
    assert(episodeOne.choices.length === 2, `${stylePackId}: Episode 1 must have two choices.`)

    const [choiceA, choiceB] = episodeOne.choices
    assert(choiceA.choice_id === 'choice-a' && choiceB.choice_id === 'choice-b', `${stylePackId}: choice IDs changed.`)
    assert(choiceA.effect_summary !== choiceB.effect_summary, `${stylePackId}: choice effects are identical.`)
    assert(choiceA.resolution_text !== choiceB.resolution_text, `${stylePackId}: choice resolutions are identical.`)
    assert(choiceA.tomorrow_seed !== choiceB.tomorrow_seed, `${stylePackId}: tomorrow seeds are identical.`)

    for (const choice of [choiceA, choiceB]) {
      const choiceCopy = `${choice.effect_summary} ${choice.resolution_text} ${choice.tomorrow_seed}`
      assert(!technicalLanguage.test(choiceCopy), `${stylePackId}/${choice.choice_id}: technical choice copy.`)
      assert(choice.resolution_text.includes('Мира'), `${stylePackId}/${choice.choice_id}: resolution lost the hero.`)
      assert(choice.state_patch.new_friend, `${stylePackId}/${choice.choice_id}: no recurring friend stored.`)
      assert(choice.state_patch.canon_updates?.remembered_artifact, `${stylePackId}/${choice.choice_id}: no remembered artifact stored.`)
    }

    const episodeTwoA = continuationAfterReopen(episodeOne, choiceA, stylePackId)
    const episodeTwoB = continuationAfterReopen(episodeOne, choiceB, stylePackId)

    assertStoryQuality(episodeTwoA.story_text, `${stylePackId}/choice-a/episode-2`, 100, 260)
    assertStoryQuality(episodeTwoB.story_text, `${stylePackId}/choice-b/episode-2`, 100, 260)
    assert(episodeTwoA.title !== episodeTwoB.title, `${stylePackId}: branch titles are identical.`)
    assert(episodeTwoA.story_text !== episodeTwoB.story_text, `${stylePackId}: branch stories are identical.`)
    assert(episodeTwoA.choices.length === 0 && episodeTwoB.choices.length === 0, `${stylePackId}: Episode 2 must close without another choice.`)
    assert(episodeTwoA.state_patch.open_arc === undefined && episodeTwoB.state_patch.open_arc === undefined, `${stylePackId}: Episode 2 left an open arc.`)
    assert(episodeTwoA.state_patch.new_friend !== episodeTwoB.state_patch.new_friend, `${stylePackId}: both branches stored the same friend.`)
    assert(episodeTwoA.state_patch.canon_updates?.remembered_choice === 'choice-a', `${stylePackId}: branch A choice missing from canon.`)
    assert(episodeTwoB.state_patch.canon_updates?.remembered_choice === 'choice-b', `${stylePackId}: branch B choice missing from canon.`)
  }

  console.log('Story quality proof passed: 8 worlds × 2 branches are literary, distinct, remembered, and free of technical copy.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
