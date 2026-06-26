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
  spaceReference: join(root, 'supabase/functions/story-generate/storySpaceReference.ts'),
  spaceMemory: join(root, 'supabase/functions/story-generate/storySpaceMemory.ts'),
  fallback: join(root, 'supabase/functions/story-generate/fallback.ts'),
}

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
  .replace(/['"]\.\/storySpaceReference\.ts['"]/g, "'./storySpaceReference.mjs'")
  .replace(/['"]\.\/storySpaceMemory\.ts['"]/g, "'./storySpaceMemory.mjs'")

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
  seriesId: 'story-core-proof-series',
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
const forbiddenIntensity = /погон|ужас|страшн|крич|взрыв|опасн|сраж/iu
const technicalStoryLanguage = /последстви[ея] выбора|мир запомнил|текущей версии|сохран[её]н(?:ный|о) выбор|episode|state[_ -]?patch/iu

const temp = await mkdtemp(join(tmpdir(), 'qissa-story-core-'))
try {
  const sources = await Promise.all(Object.values(sourcePaths).map((path) => readFile(path, 'utf8')))
  const [contractsSource, branchesSource, referenceSource, spaceReferenceSource, spaceMemorySource, fallbackSource] = sources

  await Promise.all([
    writeFile(join(temp, 'contracts.mjs'), transpile(contractsSource)),
    writeFile(join(temp, 'storyCoreBranches.mjs'), transpile(branchesSource)),
    writeFile(join(temp, 'storyCoreReference.mjs'), transpile(referenceSource)),
    writeFile(join(temp, 'storySpaceReference.mjs'), transpile(spaceReferenceSource)),
    writeFile(join(temp, 'storySpaceMemory.mjs'), transpile(spaceMemorySource)),
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
    assert(reopenedContext, `${stylePackId}: saved state must survive backend normalization.`)
    assert(reopenedContext.isContinuation === true, `${stylePackId}: reopened state must be Episode 2.`)
    assert(reopenedContext.episodeIndex === 2, `${stylePackId}: reopened state must advance to Episode 2.`)
    assert(reopenedContext.heroName === 'Мира', `${stylePackId}: reopened state must preserve the child hero.`)
    assert(reopenedContext.choiceHistory[0]?.choice_id === choice.choice_id, `${stylePackId}: confirmed choice was lost.`)

    return buildSafeFallback(reopenedContext)
  }

  const episodeOne = buildSafeFallback(baseContext)
  assert(episodeOne.choices.length === 2, 'Episode 1 must offer exactly two gentle choices.')
  assert(wordCount(episodeOne.story_text) >= 160, 'Reference Episode 1 is too short for the 5–7 vertical slice.')
  assert(wordCount(episodeOne.story_text) <= 260, 'Reference Episode 1 is too long for the 5–7 vertical slice.')
  assert(!forbiddenIntensity.test(episodeOne.story_text), 'Reference Episode 1 breaks bedtime tone.')

  const choiceA = episodeOne.choices.find((choice) => choice.choice_id === 'choice-a')
  const choiceB = episodeOne.choices.find((choice) => choice.choice_id === 'choice-b')
  assert(choiceA && choiceB, 'Both Story Core branches must exist.')
  assert(choiceA.effect_summary !== choiceB.effect_summary, 'Choice effects must be meaningfully different.')
  assert(choiceA.resolution_text !== choiceB.resolution_text, 'Choice resolutions must be meaningfully different.')
  assert(choiceA.tomorrow_seed !== choiceB.tomorrow_seed, 'Tomorrow seeds must be meaningfully different.')
  assert(choiceA.state_patch.canon_updates?.remembered_artifact !== choiceB.state_patch.canon_updates?.remembered_artifact, 'Each branch must store a different remembered artifact.')
  assert(choiceA.state_patch.relationship_updates?.owl_nura === 'trust_started_through_choice', 'Lantern branch must use the stable owl_nura relationship key.')
  assert(choiceB.state_patch.relationship_updates?.hedgehog_topa === 'trust_started_through_choice', 'Song branch must use the stable hedgehog_topa relationship key.')

  const episodeTwoA = continuationAfterReopen(episodeOne, choiceA, 'cozy_forest')
  const episodeTwoB = continuationAfterReopen(episodeOne, choiceB, 'cozy_forest')
  assert(episodeTwoA.story_text !== episodeTwoB.story_text, 'Episode 2 must diverge after different choices.')
  assert(/фонарик|светил|освещённой тропинке/iu.test(episodeTwoA.story_text), 'Lantern branch must visibly continue the lantern choice.')
  assert(/песня|мелодия|запел/iu.test(episodeTwoB.story_text), 'Song branch must visibly continue the song choice.')
  assert(episodeTwoA.state_patch.canon_updates?.remembered_choice === 'choice-a', 'Lantern branch must preserve choice-a in canon.')
  assert(episodeTwoB.state_patch.canon_updates?.remembered_choice === 'choice-b', 'Song branch must preserve choice-b in canon.')
  assert(episodeTwoA.state_patch.open_arc === undefined && episodeTwoB.state_patch.open_arc === undefined, 'Reference Episode 2 must close the active arc.')

  for (const [label, episode] of [['choice-a', episodeTwoA], ['choice-b', episodeTwoB]]) {
    const words = wordCount(episode.story_text)
    assert(words >= 120 && words <= 220, `${label} continuation must fit the 5–7 editorial range.`)
    assert(!forbiddenIntensity.test(episode.story_text), `${label} continuation breaks bedtime tone.`)
    assert(episode.safety_self_check.approved === true, `${label} continuation must remain safety-approved.`)
  }

  const spaceContext = { ...baseContext, stylePackId: 'stars_and_space' }
  const spaceEpisodeOne = buildSafeFallback(spaceContext)
  assert(spaceEpisodeOne.title === 'Маяк над станцией «Люмен»', 'Space Episode 1 must use the editorial title.')
  assert(wordCount(spaceEpisodeOne.story_text) >= 160 && wordCount(spaceEpisodeOne.story_text) <= 260, 'Space Episode 1 must be a full story scene.')
  assert(!technicalStoryLanguage.test(spaceEpisodeOne.story_text), 'Space Episode 1 must not use system language.')

  const spaceChoiceA = spaceEpisodeOne.choices.find((choice) => choice.choice_id === 'choice-a')
  const spaceChoiceB = spaceEpisodeOne.choices.find((choice) => choice.choice_id === 'choice-b')
  assert(spaceChoiceA && spaceChoiceB, 'Space story must offer two choices.')
  assert(spaceChoiceA.effect_summary !== spaceChoiceB.effect_summary, 'Space choices need different effects.')
  assert(spaceChoiceA.tomorrow_seed !== spaceChoiceB.tomorrow_seed, 'Space choices need different story seeds.')
  assert(!technicalStoryLanguage.test(`${spaceChoiceA.resolution_text} ${spaceChoiceA.tomorrow_seed}`), 'Space branch A must sound literary.')
  assert(!technicalStoryLanguage.test(`${spaceChoiceB.resolution_text} ${spaceChoiceB.tomorrow_seed}`), 'Space branch B must sound literary.')

  const spaceEpisodeTwoA = continuationAfterReopen(spaceEpisodeOne, spaceChoiceA, 'stars_and_space')
  const spaceEpisodeTwoB = continuationAfterReopen(spaceEpisodeOne, spaceChoiceB, 'stars_and_space')
  assert(spaceEpisodeTwoA.story_text !== spaceEpisodeTwoB.story_text, 'Space branches must create different continuations.')
  assert(spaceEpisodeTwoA.title === 'Золотой сигнал для лунной почты', 'Space branch A needs a story title, not a memory label.')
  assert(spaceEpisodeTwoB.title === 'Созвездие «Дорога домой»', 'Space branch B needs a story title, not a memory label.')
  assert(/маяк|золотой луч|сигнал/iu.test(spaceEpisodeTwoA.story_text), 'Space branch A must continue the beacon choice.')
  assert(/созвезди|звёздн|Дорога домой/iu.test(spaceEpisodeTwoB.story_text), 'Space branch B must continue the constellation choice.')
  assert(spaceEpisodeTwoA.state_patch.canon_updates?.remembered_artifact !== spaceEpisodeTwoB.state_patch.canon_updates?.remembered_artifact, 'Space branches need different remembered artifacts.')

  for (const [label, episode] of [['space-a', spaceEpisodeTwoA], ['space-b', spaceEpisodeTwoB]]) {
    const words = wordCount(episode.story_text)
    assert(words >= 120 && words <= 220, `${label} must be a full continuation.`)
    assert(!technicalStoryLanguage.test(`${episode.title} ${episode.story_text}`), `${label} exposes technical product wording.`)
    assert(!forbiddenIntensity.test(episode.story_text), `${label} breaks bedtime tone.`)
  }

  const genericStylePackId = 'magic_garden'
  const genericEpisodeOne = buildSafeFallback({ ...baseContext, stylePackId: genericStylePackId })
  const genericA = genericEpisodeOne.choices[0]
  const genericB = genericEpisodeOne.choices[1]
  assert(genericA.effect_summary !== genericB.effect_summary, 'Non-reference worlds must preserve choice identity.')
  assert(genericA.tomorrow_seed !== genericB.tomorrow_seed, 'Non-reference worlds must create distinct tomorrow seeds.')

  const genericEpisodeTwoA = continuationAfterReopen(genericEpisodeOne, genericA, genericStylePackId)
  const genericEpisodeTwoB = continuationAfterReopen(genericEpisodeOne, genericB, genericStylePackId)
  assert(genericEpisodeTwoA.story_text !== genericEpisodeTwoB.story_text, 'Generic branches must remain different after reopen.')
  assert(genericEpisodeTwoA.state_patch.canon_updates?.remembered_choice === 'choice-a', 'Generic branch A must preserve its choice.')
  assert(genericEpisodeTwoB.state_patch.canon_updates?.remembered_choice === 'choice-b', 'Generic branch B must preserve its choice.')
  assert(genericEpisodeTwoA.state_patch.open_arc === undefined && genericEpisodeTwoB.state_patch.open_arc === undefined, 'Every Episode 2 must close the first chapter arc.')

  console.log('Story editorial proof passed: forest and space stories are full, distinct, and free of technical copy.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
