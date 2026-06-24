import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const service = readFileSync('src/lib/storyService.ts', 'utf8')
const remoteClient = readFileSync('src/lib/storyRemoteClient.ts', 'utf8')
const stateService = readFileSync('src/lib/storyStateService.ts', 'utf8')
const stateFunction = readFileSync('supabase/functions/story-state/index.ts', 'utf8')

const failures = []

const appImportsStoryAgent = /from\s+['"]\.\/lib\/storyAgent['"]/.test(app)
const appCallsCreateStoryEpisode = /\bcreateStoryEpisode\b/.test(app)
const appImportsRemoteClient = /from\s+['"]\.\/lib\/storyRemoteClient['"]/.test(app)
const serviceWrapsStoryAgent = /from\s+['"]\.\/storyAgent['"]/.test(service)
const serviceWrapsRemoteClient = /from\s+['"]\.\/storyRemoteClient['"]/.test(service)
const serviceWrapsStateService = /from\s+['"]\.\/storyStateService['"]/.test(service)
const serviceExposesGenerateEpisode = /\bgenerateEpisode\b/.test(service)
const servicePersistsRemoteEpisode = /syncGenerated/.test(service)
const remoteClientUsesEndpoint = /VITE_QISSA_STORY_ENDPOINT/.test(remoteClient)
const remoteClientUsesPublishableKey = /VITE_QISSA_SUPABASE_PUBLISHABLE_KEY/.test(remoteClient)
const remoteClientAddsSupabaseHeaders = /headers\.set\(['"]apikey['"]/.test(remoteClient) && /headers\.set\(['"]authorization['"]/.test(remoteClient)
const remoteClientHasTimeout = /AbortController/.test(remoteClient)
const remoteClientValidatesPayload = /isStoryGenerationOutput/.test(remoteClient)
const stateClientUsesEndpoint = /VITE_QISSA_STATE_ENDPOINT/.test(stateService)
const stateClientUsesInstallationIdentity = /getInstallationId/.test(stateService)
const stateClientCanSync = /sync_generated/.test(stateService)
const stateFunctionUsesServiceRole = /SUPABASE_SERVICE_ROLE_KEY/.test(stateFunction)
const stateFunctionPersistsCoreTables = [
  'child_profiles',
  'story_sessions',
  'story_episodes',
  'story_choices',
  'safety_reviews',
].every((table) => stateFunction.includes(`'${table}'`))

if (appImportsStoryAgent || appCallsCreateStoryEpisode || appImportsRemoteClient) {
  failures.push('App.tsx must use storyService only and must not import providers directly.')
}

if (!serviceExposesGenerateEpisode) {
  failures.push('storyService.ts must expose generateEpisode.')
}

if (!serviceWrapsStoryAgent || !serviceWrapsRemoteClient || !serviceWrapsStateService) {
  failures.push('storyService.ts must own local generation, remote generation, and remote state sync.')
}

if (!servicePersistsRemoteEpisode) {
  failures.push('storyService.ts must persist remote episodes after generation.')
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

if (!stateClientUsesEndpoint || !stateClientUsesInstallationIdentity || !stateClientCanSync) {
  failures.push('storyStateService.ts must use the state endpoint, stable installation identity, and sync action.')
}

if (!stateFunctionUsesServiceRole || !stateFunctionPersistsCoreTables) {
  failures.push('story-state Edge Function must use trusted server access and persist core story tables.')
}

if (failures.length > 0) {
  console.error('story service boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('story service boundary check passed.')
