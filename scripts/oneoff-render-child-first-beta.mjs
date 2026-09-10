import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const worlds = ['cozy_forest', 'magic_garden', 'stars_and_space']
const languages = ['ru', 'uz']
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

const baseContext = (language, stylePackId) => ({
  ageGroup: '5-7',
  language,
  heroType: 'girl_hero',
  heroName: language === 'ru' ? 'Алия' : 'Aliya',
  stylePackId,
  storyMode: 'series',
  storyMood: 'bedtime',
  seriesId: `editorial-${language}-${stylePackId}`,
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

const temp = await mkdtemp(join(tmpdir(), 'qissa-editorial-render-'))
try {
  for (const sourceName of sourceNames) {
    const source = await readFile(join(root, `supabase/functions/story-generate/${sourceName}.ts`), 'utf8')
    await writeFile(join(temp, `${sourceName}.mjs`), transpile(source))
  }
  const { buildSafeFallback } = await import(`${pathToFileURL(join(temp, 'fallback.mjs')).href}?v=${Date.now()}`)

  let count = 0
  for (const language of languages) {
    for (const stylePackId of worlds) {
      const context = baseContext(language, stylePackId)
      const episodeOne = buildSafeFallback(context)
      for (const choice of episodeOne.choices) {
        const episodeTwo = buildSafeFallback(continuationContext(context, episodeOne, choice))
        count += 1
        console.log(`\n===== STORY ${count}/12 | ${language} | ${stylePackId} | ${choice.choice_id} =====`)
        console.log(`TITLE 1: ${episodeOne.title}`)
        console.log(episodeOne.story_text)
        console.log(`\nCHOICE: ${choice.text}`)
        console.log(`BRIDGE: ${choice.resolution_text}`)
        console.log(`\nTITLE 2: ${episodeTwo.title}`)
        console.log(episodeTwo.story_text)
        console.log(`===== END STORY ${count}/12 =====`)
      }
    }
  }
  if (count !== 12) throw new Error(`expected 12 stories, got ${count}`)
  console.log('\nFINAL_EDITORIAL_RENDER_COMPLETE 12/12')
} finally {
  await rm(temp, { recursive: true, force: true })
}
