import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const worlds = ['cozy_forest', 'magic_garden', 'stars_and_space']
const languages = ['ru', 'uz']
const EXPRESSIVE_ACCEPTANCE_WPM = 140
const MIN_SESSION_MINUTES = 5
const MAX_SESSION_MINUTES = 10
const MIN_SESSION_WORDS = EXPRESSIVE_ACCEPTANCE_WPM * MIN_SESSION_MINUTES
const MAX_SESSION_WORDS = EXPRESSIVE_ACCEPTANCE_WPM * MAX_SESSION_MINUTES
const sourceNames = [
  'contracts',
  'storyCoreBranches',
  'storyGenericEditorial',
  'storyCoreReference',
  'storyBedtimeExpansion',
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
  .replace(/['"]\.\/storyBedtimeExpansion\.ts['"]/g, "'./storyBedtimeExpansion.mjs'")
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

const baseContext = (language, stylePackId) => ({
  ageGroup: '5-7',
  language,
  heroType: 'boy_hero',
  heroName: 'Timur',
  stylePackId,
  storyMode: 'series',
  storyMood: 'bedtime',
  seriesId: `duration-${language}-${stylePackId}`,
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

const minutesAt = (words, wpm) => (words / wpm).toFixed(2)
const temp = await mkdtemp(join(tmpdir(), 'qissa-duration-'))

try {
  for (const sourceName of sourceNames) {
    const source = await readFile(join(root, `supabase/functions/story-generate/${sourceName}.ts`), 'utf8')
    await writeFile(join(temp, `${sourceName}.mjs`), transpile(source))
  }

  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${Date.now()}`)
  const rows = []

  for (const language of languages) {
    for (const stylePackId of worlds) {
      const context = baseContext(language, stylePackId)
      const episodeOne = buildSafeFallback(context)
      const episodeOneWords = wordCount(episodeOne.story_text)

      for (const [branch, choice] of [['a', episodeOne.choices[0]], ['b', episodeOne.choices[1]]]) {
        const episodeTwo = buildSafeFallback(continuationContext(context, episodeOne, choice))
        const resolutionWords = wordCount(choice.resolution_text ?? choice.effect_summary ?? '')
        const episodeTwoWords = wordCount(episodeTwo.story_text)
        const totalWords = episodeOneWords + resolutionWords + episodeTwoWords
        const scenario = `${language}/${stylePackId}/${branch}`

        assert(
          totalWords >= MIN_SESSION_WORDS,
          `${scenario}: ${totalWords} words is below the ${MIN_SESSION_WORDS}-word floor required for ${MIN_SESSION_MINUTES} minutes at ${EXPRESSIVE_ACCEPTANCE_WPM} WPM.`,
        )
        assert(
          totalWords <= MAX_SESSION_WORDS,
          `${scenario}: ${totalWords} words exceeds the ${MAX_SESSION_WORDS}-word ceiling for ${MAX_SESSION_MINUTES} minutes at ${EXPRESSIVE_ACCEPTANCE_WPM} WPM.`,
        )

        rows.push({
          scenario,
          ep1: episodeOneWords,
          resolution: resolutionWords,
          ep2: episodeTwoWords,
          total: totalWords,
          min125: minutesAt(totalWords, 125),
          min140: minutesAt(totalWords, EXPRESSIVE_ACCEPTANCE_WPM),
          min155: minutesAt(totalWords, 155),
        })
      }
    }
  }

  console.table(rows)
  const totals = rows.map((row) => row.total)
  console.log(`Bedtime session range: ${Math.min(...totals)}-${Math.max(...totals)} words.`)
  console.log(`Acceptance band: ${MIN_SESSION_WORDS}-${MAX_SESSION_WORDS} words = ${MIN_SESSION_MINUTES}-${MAX_SESSION_MINUTES} minutes at ${EXPRESSIVE_ACCEPTANCE_WPM} WPM.`)
  console.log('Duration model: Episode 1 + confirmed choice resolution + Episode 2. 125/140/155 WPM are reported for visibility; 140 WPM is the release acceptance pace for normal expressive bedtime reading.')
  console.log('bedtime duration check passed for all 12 closed-beta RU/UZ branches.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
