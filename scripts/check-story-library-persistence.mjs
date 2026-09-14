import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const failures = []
const requireCondition = (condition, message) => { if (!condition) failures.push(message) }

const migration = read('docs/qissa/backend/migrations/20260914_000016_add_series_session_library.sql')
const state = read('supabase/functions/story-state/index.ts')
const contracts = read('supabase/functions/story-generate/contracts.ts')
const architecture = read('supabase/functions/story-generate/story-architecture.ts')
const domain = read('src/contracts/storyContracts.ts')
const memory = read('src/lib/memoryAgent.ts')
const service = read('src/lib/storyService.ts')
const app = read('src/App.tsx')
const localAgent = read('src/lib/storyAgent.ts')

requireCondition(/client_series_id\s+text/.test(migration), 'Migration must add client_series_id.')
requireCondition(/series_session_index\s+integer\s+not null\s+default 1/i.test(migration), 'Migration must add 1-based series_session_index.')
requireCondition(/selection_snapshot\s+jsonb\s+not null/i.test(migration), 'Migration must persist per-session selections for rereading.')
requireCondition(/ux_story_sessions_profile_series_session_index/.test(migration), 'Series/session identity must be unique per child profile.')

requireCondition(/sessionId\?: string/.test(domain) && /sessionIndex\?: number/.test(domain), 'SeriesState must carry backward-compatible session identity.')
requireCondition(/id: uniqueId\('series'\)/.test(memory), 'New series IDs must be unique, not world/language deterministic.')
requireCondition(/sessionId: uniqueId\('session'\)/.test(memory), 'Every bedtime session must have a unique session ID.')
requireCondition(/createNextSeriesSessionState/.test(memory) && /episodeCount: 0/.test(memory), 'A next-series-session helper must preserve series memory while resetting current-session progress.')
requireCondition(/applyEpisodeToSeriesState/.test(memory) && /canon_updates/.test(memory) && /relationship_updates/.test(memory), 'Durable episode patches must be merged into SeriesState.')
requireCondition(/applyEpisodeToSeriesState\(seriesState, output\.episode\)/.test(service), 'Remote persistence must save the merged episode state.')
requireCondition(/applyEpisodeToSeriesState\(seriesState, firstEpisode\)/.test(app) && /applyEpisodeToSeriesState\(seriesState, secondEpisode\)/.test(app), 'App state must match the durable episode state.')

requireCondition(/explicitSessionIdentity/.test(contracts) && /sessionEpisodeCount/.test(contracts), 'Story AI must derive current segment from session progress, not all historical choices.')
requireCondition(/hasSeriesMemory/.test(contracts) && /sessionIndex/.test(contracts), 'Story AI context must distinguish later series sessions from current-session continuation.')
requireCondition(/-s\$\{context\.sessionIndex\}/.test(contracts), 'Later bedtime sessions must receive unique episode IDs.')
requireCondition(/fresh child-scale goal for tonight/.test(architecture), 'Architect must start a fresh bedtime goal in later series sessions.')
requireCondition(/isCurrentSessionContinuation/.test(localAgent), 'Local fallback agent must also use current-session progress.')

requireCondition(/client_session_id: identity\.sessionId/.test(state), 'story-state must key rows by bedtime session ID.')
requireCondition(/client_series_id: identity\.seriesId/.test(state), 'story-state must persist stable series identity.')
requireCondition(/series_session_index: identity\.sessionIndex/.test(state), 'story-state must persist session order.')
requireCondition(/selection_snapshot: selections/.test(state), 'story-state must snapshot the selections used to create each story.')
requireCondition(/'list_library'/.test(state) && /async function listLibrary/.test(state), 'story-state must expose an authenticated server Story Library action.')
requireCondition(/episodes: bySession\.get\(session\.id\) \?\? \[\]/.test(state), 'Server Story Library must return stored episode payloads for rereading.')
requireCondition(/\.eq\('client_session_id', identity\.sessionId\)/.test(state), 'Choice confirmation must target the current bedtime session, not the whole series ID.')

if (failures.length) {
  console.error(`Story Library / series persistence contract failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('Story Library / multi-session series persistence contract passed.')
