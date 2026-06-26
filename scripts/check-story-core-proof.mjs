import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourcePaths = {
  contracts: join(root, 'supabase/functions/story-generate/contracts.ts'),
  branches: join(root, 'supabase/functions/story-generate/storyCoreBranches.ts'),
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
  .replaceAll("'./contracts.ts'", "'./contracts.mjs'")
  .replaceAll("'./storyCoreBranches.ts'", "'./storyCoreBranches.mjs'")

const memoryFromChoice = (episode, choice) => ({
  episode_id: episode.episode_id,
  choice_id: choice.choice_id,
  choice_text: choice.text,
  effect_summary: choice.effect_summary,
  resolution_text: choice.resolution_text,
  tomorrow_seed: choice.tomorrow_seed,
})

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

const temp = await mkdtemp(join(tmpdir(), 'qissa-story-core-'))
try {
  const [contractsSource, branchesSource, fallbackSource] = await Promise.all([
    readFile(sourcePaths.contracts, 'utf8'),
    readFile(sourcePaths.branches, 'utf8'),
    readFile(sourcePaths.fallback, 'utf8'),
  ])

  await Promise.all([
    writeFile(join(temp, 'contracts.mjs'), transpile(contractsSource)),
    writeFile(join(temp, 'storyCoreBranches.mjs'), transpile(branchesSource)),
    writeFile(join(temp, 'fallback.mjs'), transpile(fallbackSource)),
  ])

  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${Date.now()}`)

  const episodeOne = buildSafeFallback(baseContext)
  assert(episodeOne.choices.length === 2, 'Episode 1 must offer exactly two gentle choices.')

  const choiceA = episodeOne.choices.find((choice) => choice.choice_id === 'choice-a')
  const choiceB = episodeOne.choices.find((choice) => choice.choice_id === 'choice-b')
  assert(choiceA && choiceB, 'Both Story Core branches must exist.')
  assert(choiceA.effect_summary !== choiceB.effect_summary, 'Choice effects must be meaningfully different.')
  assert(choiceA.resolution_text !== choiceB.resolution_text, 'Choice resolutions must be meaningfully different.')
  assert(choiceA.tomorrow_seed !== choiceB.tomorrow_seed, 'Tomorrow seeds must be meaningfully different.')
  assert(
    choiceA.state_patch.canon_updates?.remembered_artifact !== choiceB.state_patch.canon_updates?.remembered_artifact,
    'Each branch must store a different remembered artifact.',
  )

  const continuationFor = (choice) => buildSafeFallback({
    ...baseContext,
    episodeIndex: 2,
    isContinuation: true,
    recurringCharacters: choice.state_patch.new_friend ? [choice.state_patch.new_friend] : [],
    lastEpisodeSummary: choice.effect_summary,
    activeArc: choice.state_patch.open_arc ?? '',
    relationshipState: choice.state_patch.relationship_updates ?? {},
    canonState: choice.state_patch.canon_updates ?? {},
    choiceHistory: [memoryFromChoice(episodeOne, choice)],
  })

  const episodeTwoA = continuationFor(choiceA)
  const episodeTwoB = continuationFor(choiceB)

  assert(episodeTwoA.story_text !== episodeTwoB.story_text, 'Episode 2 must diverge after different choices.')
  assert(/фонарик|светил|освещённой тропинке/iu.test(episodeTwoA.story_text), 'Lantern branch must visibly continue the lantern choice.')
  assert(/песня|мелодия|запел/iu.test(episodeTwoB.story_text), 'Song branch must visibly continue the song choice.')
  assert(episodeTwoA.story_text.includes('Мира') && episodeTwoB.story_text.includes('Мира'), 'Both continuations must preserve the child hero.')
  assert(episodeTwoA.choices.length === 0 && episodeTwoB.choices.length === 0, 'Episode 2 closes the first chapter without a dangling choice.')
  assert(episodeTwoA.state_patch.canon_updates?.remembered_choice === 'choice-a', 'Lantern branch must preserve choice-a in canon.')
  assert(episodeTwoB.state_patch.canon_updates?.remembered_choice === 'choice-b', 'Song branch must preserve choice-b in canon.')
  assert(episodeTwoA.state_patch.new_friend !== episodeTwoB.state_patch.new_friend, 'Different choices must strengthen different relationships.')

  for (const [label, episode] of [['choice-a', episodeTwoA], ['choice-b', episodeTwoB]]) {
    const words = wordCount(episode.story_text)
    assert(words >= 50, `${label} continuation is too short to feel like an episode.`)
    assert(words <= 120, `${label} continuation is too long for the bedtime vertical slice.`)
    assert(!forbiddenIntensity.test(episode.story_text), `${label} continuation breaks low-stimulation bedtime tone.`)
    assert(episode.safety_self_check.approved === true, `${label} continuation must remain safety-approved.`)
  }

  const genericEpisodeOne = buildSafeFallback({ ...baseContext, stylePackId: 'magic_garden' })
  const genericA = genericEpisodeOne.choices[0]
  const genericB = genericEpisodeOne.choices[1]
  assert(genericA.effect_summary !== genericB.effect_summary, 'Non-reference worlds must still preserve choice identity.')
  assert(genericA.tomorrow_seed !== genericB.tomorrow_seed, 'Non-reference worlds must still create distinct tomorrow seeds.')

  console.log('Story Core proof passed: choice A and B create distinct, remembered, bedtime-safe continuations.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
