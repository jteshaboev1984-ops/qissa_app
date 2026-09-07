import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (path) => readFileSync(path, 'utf8')
const migrationDir = 'docs/qissa/backend/migrations'
const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
const migrations = migrationFiles
  .map((name) => `-- ${name}\n${read(join(migrationDir, name))}`)
  .join('\n\n')

const storyState = read('supabase/functions/story-state/index.ts')
const storyGenerate = read('supabase/functions/story-generate/index.ts')
const audioShared = read('supabase/functions/audio-request/shared.ts')
const appSources = [
  'src/App.tsx',
  'src/main.tsx',
  'src/lib/storyService.ts',
  'src/lib/storyStateService.ts',
  'src/lib/storyRemoteClient.ts',
].map(read).join('\n')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

const protectedTables = [
  'app_events',
  'audio_assets',
  'child_profiles',
  'playback_progress',
  'safety_reviews',
  'story_choice_events',
  'story_choices',
  'story_episodes',
  'story_sessions',
  'voice_presets',
]

for (const table of protectedTables) {
  const pattern = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i')
  requireCondition(pattern.test(migrations), `${table} must remain protected by RLS.`)
}

requireCondition(
  !/create\s+policy\b/i.test(migrations),
  'Closed-beta persistence must not add direct anon/authenticated RLS policies without an explicit access-model change.',
)

requireCondition(
  !/grant\s+[\s\S]{0,180}\s+to\s+(anon|authenticated)\b/i.test(migrations),
  'Closed-beta migrations must not grant direct table/routine access to anon or authenticated roles without an explicit access-model change.',
)

for (const [label, source] of [
  ['story-state', storyState],
  ['story-generate', storyGenerate],
  ['audio-request', audioShared],
]) {
  requireCondition(
    source.includes('SUPABASE_SERVICE_ROLE_KEY'),
    `${label} must keep trusted database access on the server-side service role.`,
  )
}

requireCondition(
  !appSources.includes('@supabase/supabase-js'),
  'Browser application code must not introduce direct Supabase table access during the closed beta; route persistence through Edge Functions.',
)

requireCondition(
  /alter\s+function\s+public\.set_updated_at\(\)\s+set\s+search_path\s*=\s*public,\s*pg_temp/i.test(migrations),
  'set_updated_at() must keep a fixed safe search_path.',
)

if (failures.length > 0) {
  console.error('backend access boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`backend access boundary check passed across ${migrationFiles.length} migrations.`)
