import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const service = readFileSync('src/lib/storyService.ts', 'utf8')
const remoteClient = readFileSync('src/lib/storyRemoteClient.ts', 'utf8')

const failures = []

const appImportsStoryAgent = /from\s+['"]\.\/lib\/storyAgent['"]/.test(app)
const appCallsCreateStoryEpisode = /\bcreateStoryEpisode\b/.test(app)
const appImportsRemoteClient = /from\s+['"]\.\/lib\/storyRemoteClient['"]/.test(app)
const serviceWrapsStoryAgent = /from\s+['"]\.\/storyAgent['"]/.test(service)
const serviceWrapsRemoteClient = /from\s+['"]\.\/storyRemoteClient['"]/.test(service)
const serviceExposesGenerateEpisode = /\bgenerateEpisode\b/.test(service)
const remoteClientUsesEndpoint = /VITE_QISSA_STORY_ENDPOINT/.test(remoteClient)
const remoteClientUsesPublishableKey = /VITE_QISSA_SUPABASE_PUBLISHABLE_KEY/.test(remoteClient)
const remoteClientAddsSupabaseHeaders = /headers\.set\(['"]apikey['"]/.test(remoteClient) && /headers\.set\(['"]authorization['"]/.test(remoteClient)
const remoteClientHasTimeout = /AbortController/.test(remoteClient)
const remoteClientValidatesPayload = /isStoryGenerationOutput/.test(remoteClient)

if (appImportsStoryAgent || appCallsCreateStoryEpisode || appImportsRemoteClient) {
  failures.push('App.tsx must use storyService only and must not import providers directly.')
}

if (!serviceExposesGenerateEpisode) {
  failures.push('storyService.ts must expose generateEpisode.')
}

if (!serviceWrapsStoryAgent || !serviceWrapsRemoteClient) {
  failures.push('storyService.ts must own both local and remote provider selection.')
}

if (
  !remoteClientUsesEndpoint ||
  !remoteClientUsesPublishableKey ||
  !remoteClientAddsSupabaseHeaders ||
  !remoteClientHasTimeout ||
  !remoteClientValidatesPayload
) {
  failures.push('storyRemoteClient.ts must use Supabase auth headers, configured endpoint, timeout, and response validation.')
}

if (failures.length > 0) {
  console.error('story service boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('story service boundary check passed.')
