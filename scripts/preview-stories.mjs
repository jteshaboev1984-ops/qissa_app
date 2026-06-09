import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const tmpRoot = '.tmp'
const outDir = path.join(tmpRoot, 'story-preview')
const configPath = path.join(tmpRoot, 'tsconfig.story-preview.json')
const runnerPath = path.join(outDir, 'run-preview.mjs')

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(configPath, JSON.stringify({
  extends: '../tsconfig.app.json',
  compilerOptions: {
    noEmit: false,
    outDir: 'story-preview',
    declaration: false,
    sourceMap: false,
    noUnusedLocals: false,
    noUnusedParameters: false
  },
  include: ['../src']
}, null, 2))

execFileSync('npx', ['tsc', '-p', configPath], { stdio: 'inherit' })

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walk(fullPath))
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      result.push(fullPath)
    }
  }
  return result
}

function withJsExtension(specifier) {
  if (!specifier.startsWith('.')) return specifier
  const withoutQuery = specifier.split('?')[0]
  if (path.extname(withoutQuery)) return specifier
  return `${specifier}.js`
}

function patchRelativeImports(filePath) {
  let text = fs.readFileSync(filePath, 'utf8')

  text = text.replace(
    /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (_match, before, specifier, after) => `${before}${withJsExtension(specifier)}${after}`
  )

  text = text.replace(
    /(import\s*\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g,
    (_match, before, specifier, after) => `${before}${withJsExtension(specifier)}${after}`
  )

  fs.writeFileSync(filePath, text)
}

for (const file of walk(outDir)) {
  patchRelativeImports(file)
}

const storyAgentImport = fs.existsSync(path.join(outDir, 'lib', 'storyAgent.js'))
  ? './lib/storyAgent.js'
  : './src/lib/storyAgent.js'

fs.writeFileSync(runnerPath, `
import { createStoryEpisode } from '${storyAgentImport}'

const stylePackIds = [
  'cozy_forest',
  'magic_garden',
  'stars_and_space',
  'silk_road',
  'animal_world',
  'sea_islands',
  'castle_mystery',
  'brave_adventure',
]

function makeSelections(stylePackId) {
  return {
    ageGroup: '5-7',
    language: 'ru',
    heroType: 'girl_hero',
    stylePackId,
    storyMode: 'series',
    storyMood: 'bedtime',
  }
}

function makeSeriesState(selections, episode, choice) {
  return {
    id: 'qa-series-' + selections.stylePackId,
    childProfileId: 'qa-child',
    stylePackId: selections.stylePackId,
    mainCharacter: 'девочка Алия',
    recurringCharacters: choice.state_patch.new_friend ? [choice.state_patch.new_friend] : [],
    lastEpisodeSummary: choice.effect_summary,
    activeArc: choice.state_patch.open_arc ?? 'qa arc',
    relationshipState: {},
    choiceHistory: [
      {
        episode_id: episode.episode_id,
        choice_id: choice.choice_id,
        choice_text: choice.text,
        effect_summary: choice.effect_summary,
        resolution_text: choice.resolution_text,
        tomorrow_seed: choice.tomorrow_seed,
        choice_icon: choice.choice_icon,
        state_patch: choice.state_patch,
        selected_at: new Date().toISOString(),
      },
    ],
    canonState: {},
    episodeCount: 1,
  }
}

function line(label, value) {
  console.log(label + ': ' + (value ?? '—'))
}

for (const stylePackId of stylePackIds) {
  const selections = makeSelections(stylePackId)
  const episode1 = createStoryEpisode({ selections })
  const choiceA = episode1.choices[0]
  const choiceB = episode1.choices[1]
  const seriesState = makeSeriesState(selections, episode1, choiceA)
  const episode2 = createStoryEpisode({ selections, seriesState })

  console.log('\\n' + '='.repeat(80))
  console.log(stylePackId)
  console.log('='.repeat(80))

  line('EP1 title', episode1.title)
  line('EP1 text', episode1.story_text)
  line('Choice A', choiceA?.text)
  line('Choice A effect', choiceA?.effect_summary)
  line('Choice A resolution', choiceA?.resolution_text)
  line('Choice A seed', choiceA?.tomorrow_seed)
  line('Choice B', choiceB?.text)
  line('Choice B effect', choiceB?.effect_summary)
  line('Choice B resolution', choiceB?.resolution_text)
  line('Choice B seed', choiceB?.tomorrow_seed)
  line('EP1 preview', episode1.nextEpisodePreview)
  line('EP2 title after Choice A', episode2.title)
  line('EP2 text after Choice A', episode2.story_text)
}

console.log('\\nStory preview generated for ' + stylePackIds.length + ' worlds.')
`)

execFileSync(process.execPath, [runnerPath], { stdio: 'inherit' })
