import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'docs/qissa/backend/migrations/20260923_000017_add_authored_story_progress.sql',
  'utf8',
)
const schema = readFileSync('docs/qissa/backend/schema_draft.sql', 'utf8')
const api = readFileSync('docs/qissa/backend/02_API_CONTRACTS.md', 'utf8')
const edge = readFileSync('supabase/functions/story-state/index.ts', 'utf8')
const client = readFileSync('src/lib/storyStateService.ts', 'utf8')
const persistence = readFileSync('src/lib/authoredStoryPersistence.ts', 'utf8')

const failures = []
const requireAll = (label, source, phrases) => {
  for (const phrase of phrases) {
    if (!source.includes(phrase)) failures.push(`${label} is missing: ${phrase}`)
  }
}

requireAll('migration', migration, [
  'create table if not exists public.authored_story_progress',
  'child_profile_id uuid not null references public.child_profiles(id) on delete cascade',
  'unique (child_profile_id, story_id, story_version)',
  'progress_payload jsonb not null',
  'current_part_index int not null',
  'completed boolean not null',
  'enable row level security',
  'revoke all on table public.authored_story_progress from anon, authenticated',
])

requireAll('schema draft', schema, [
  'create table if not exists public.authored_story_progress',
  'unique (child_profile_id, story_id, story_version)',
])

requireAll('API contract', api, [
  'save_authored_progress',
  'load_authored_progress',
  'clear_authored_progress',
  'AuthoredStoryProgressPayload',
])

for (const action of [
  'save_authored_progress',
  'load_authored_progress',
  'clear_authored_progress',
]) {
  requireAll('story-state edge', edge, [action])
  requireAll('story-state client', client, [
    action === 'save_authored_progress'
      ? 'saveAuthoredProgress'
      : action === 'load_authored_progress'
        ? 'loadAuthoredProgress'
        : 'clearAuthoredProgress',
  ])
}

requireAll('story-state edge', edge, [
  "from('authored_story_progress')",
  "onConflict: 'child_profile_id,story_id,story_version'",
  'invalid_authored_progress',
  'authored_progress_save_failed',
  'authored_progress_load_failed',
  'authored_progress_clear_failed',
])

requireAll('local authored persistence', persistence, [
  'qissa:v1:authoredStoryProgress',
  'isAuthoredStoryProgress',
  'clearAll',
])

if (failures.length > 0) {
  console.error('authored progress backend contract check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('authored progress backend contract check passed.')
