import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (path) => readFileSync(path, 'utf8')
const migrationDir = 'docs/qissa/backend/migrations'
const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
const migrations = migrationFiles
  .map((name) => `-- ${name}\n${read(join(migrationDir, name))}`)
  .join('\n\n')

const collectSourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  if (statSync(path).isDirectory()) return collectSourceFiles(path)
  return /\.(ts|tsx|js|jsx)$/.test(name) ? [path] : []
})

const storyState = read('supabase/functions/story-state/index.ts')
const storyGenerateIndex = read('supabase/functions/story-generate/index.ts')
const storyGenerateUsage = read('supabase/functions/story-generate/usage.ts')
const audioShared = read('supabase/functions/audio-request/shared.ts')
const appSources = collectSourceFiles('src').map(read).join('\n')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

const protectedTables = [
  'app_events',
  'audio_assets',
  'child_profiles',
  'installation_credentials',
  'playback_progress',
  'qissa_provider_daily_usage',
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

requireCondition(
  /revoke\s+all\s+privileges\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon\s*,\s*authenticated/i.test(migrations),
  'Closed-beta migrations must revoke inherited direct table privileges from anon/authenticated.',
)
requireCondition(
  /revoke\s+all\s+privileges\s+on\s+all\s+sequences\s+in\s+schema\s+public\s+from\s+anon\s*,\s*authenticated/i.test(migrations),
  'Closed-beta migrations must revoke inherited direct sequence privileges from anon/authenticated.',
)
requireCondition(
  /revoke\s+execute\s+on\s+all\s+functions\s+in\s+schema\s+public\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i.test(migrations),
  'Closed-beta migrations must revoke direct routine execution from browser roles and PUBLIC.',
)

requireCondition(
  /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+all\s+privileges\s+on\s+tables\s+from\s+anon\s*,\s*authenticated/i.test(migrations),
  'Future postgres-owned public tables must default to no anon/authenticated privileges.',
)
requireCondition(
  /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+all\s+privileges\s+on\s+sequences\s+from\s+anon\s*,\s*authenticated/i.test(migrations),
  'Future postgres-owned public sequences must default to no anon/authenticated privileges.',
)
requireCondition(
  /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+all\s+privileges\s+on\s+functions\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i.test(migrations),
  'Future postgres-owned public functions must default to no browser/PUBLIC execution.',
)

requireCondition(
  storyState.includes('SUPABASE_SERVICE_ROLE_KEY'),
  'story-state must keep trusted database access on the server-side service role.',
)
requireCondition(
  storyGenerateIndex.includes("from './usage.ts'") && storyGenerateUsage.includes('SUPABASE_SERVICE_ROLE_KEY'),
  'story-generate must route database-backed usage claims through the server-side service role.',
)
requireCondition(
  audioShared.includes('SUPABASE_SERVICE_ROLE_KEY'),
  'audio-request must keep trusted database/storage access on the server-side service role.',
)

requireCondition(
  !appSources.includes('@supabase/supabase-js'),
  'Browser application code must not introduce direct Supabase table access during the closed beta; route persistence through Edge Functions.',
)
requireCondition(
  !appSources.includes('/rest/v1'),
  'Browser application code must not call the Supabase Data API directly during the closed beta.',
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

console.log(`backend access boundary check passed across ${migrationFiles.length} migrations and ${collectSourceFiles('src').length} browser source files.`)
