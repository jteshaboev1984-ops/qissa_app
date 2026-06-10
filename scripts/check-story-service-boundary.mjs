import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const service = readFileSync('src/lib/storyService.ts', 'utf8')

const failures = []

const appImportsStoryAgent = /from\s+['"]\.\/lib\/storyAgent['"]/.test(app)
const appCallsCreateStoryEpisode = /\bcreateStoryEpisode\b/.test(app)
const serviceWrapsStoryAgent = /from\s+['"]\.\/storyAgent['"]/.test(service)
const serviceExposesGenerateEpisode = /\bgenerateEpisode\b/.test(service)

if (appImportsStoryAgent || appCallsCreateStoryEpisode) {
  failures.push('App.tsx must use storyService, not createStoryEpisode/storyAgent directly.')
}

if (!serviceExposesGenerateEpisode) {
  failures.push('storyService.ts must expose generateEpisode.')
}

if (!serviceWrapsStoryAgent) {
  failures.push('storyService.ts should currently wrap the local storyAgent provider.')
}

if (failures.length > 0) {
  console.error('story service boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('story service boundary check passed.')
