import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const service = readFileSync('src/lib/storyService.ts', 'utf8')
const remoteClient = readFileSync('src/lib/storyRemoteClient.ts', 'utf8')
const stateService = readFileSync('src/lib/storyStateService.ts', 'utf8')
const localPersistence = readFileSync('src/lib/localPersistence.ts', 'utf8')
const installationIdentity = readFileSync('src/lib/installationIdentity.ts', 'utf8')
const stateFunction = readFileSync('supabase/functions/story-state/index.ts', 'utf8')
const persistenceMigration = readFileSync('docs/qissa/backend/migrations/20260624_000003_add_remote_persistence_keys.sql', 'utf8')

const failures = []

const appImportsStoryAgent = /from\s+['"]\.\/lib\/storyAgent['"]/.test(app)
const appCallsCreateStoryEpisode = /\bcreateStoryEpisode\b/.test(app)
const appImportsRemoteClient = /from\s+['"]\.\/lib\/storyRemoteClient['"]/.test(app)
const serviceWrapsStoryAgent = /from\s+['"]\.\/storyAgent['"]/.test(service)
const serviceWrapsRemoteClient = /from\s+['"]\.\/storyRemoteClient['"]/.test(service)
const serviceWrapsStateService = /from\s+['"]\.\/storyStateService['"]/.test(service)
const serviceExposesGenerateEpisode = /\bgenerateEpisode\b/.test(service)
const servicePersistsRemoteEpisode = /syncGenerated/.test(service)
const serviceRepairsMissingSeriesState = /input\.seriesState\s*\?\?\s*localPersistence\.loadSeriesStateOrRepair\(input\.selections\)/.test(service)
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
const stateFunctionValidatesReaderPreferences =
  /validReaderPreferences\s*=\s*isRecord\(readerPreferences\)\s*\?\s*readerPreferences\s*:\s*\{\}/.test(stateFunction) &&
  /reader_preferences:\s*validReaderPreferences/.test(stateFunction)
const stateFunctionUpsertsSafetyReview =
  /from\(['"]safety_reviews['"]\)\.upsert\(/.test(stateFunction) &&
  /onConflict:\s*['"]episode_id['"]/.test(stateFunction)
const installationIdentityCachesFallback =
  /let\s+cachedId:\s*string\s*\|\s*null\s*=\s*null/.test(installationIdentity) &&
  /if\s*\(cachedId\)\s*return\s+cachedId/.test(installationIdentity) &&
  /cachedId\s*=\s*created/.test(installationIdentity)
const bootstrapUsesSideEffectFreeRestore =
  /restoreRemoteSnapshot\(snapshot\)/.test(main) &&
  !/saveSeriesState\(snapshot\.seriesState\)/.test(main) &&
  !/saveReaderPreferences\(snapshot\.readerPreferences\)/.test(main) &&
  /restoreRemoteSnapshot/.test(localPersistence)
const sessionsBackfillPosition = persistenceMigration.indexOf('update public.story_sessions')
const sessionsConstraintPosition = persistenceMigration.indexOf('alter column client_session_id set not null')
const episodesBackfillPosition = persistenceMigration.indexOf('update public.story_episodes')
const episodesConstraintPosition = persistenceMigration.indexOf('alter column client_episode_id set not null')
const migrationBackfillsBeforeConstraints =
  sessionsBackfillPosition >= 0 &&
  sessionsConstraintPosition > sessionsBackfillPosition &&
  episodesBackfillPosition >= 0 &&
  episodesConstraintPosition > episodesBackfillPosition

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

if (!serviceRepairsMissingSeriesState) {
  failures.push('storyService.ts must repair missing series state before persisting the first remote episode.')
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

if (!stateFunctionValidatesReaderPreferences) {
  failures.push('story-state Edge Function must validate reader preferences before profile upsert.')
}

if (!stateFunctionUpsertsSafetyReview) {
  failures.push('story-state Edge Function must upsert safety reviews by episode_id.')
}

if (!installationIdentityCachesFallback) {
  failures.push('installationIdentity.ts must cache the installation id when localStorage is unavailable.')
}

if (!bootstrapUsesSideEffectFreeRestore) {
  failures.push('Remote bootstrap must restore the snapshot without triggering choice or preference sync calls.')
}

if (!migrationBackfillsBeforeConstraints) {
  failures.push('Remote persistence migration must backfill session and episode client ids before NOT NULL constraints.')
}

if (failures.length > 0) {
  console.error('story service boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('story service boundary check passed.')
