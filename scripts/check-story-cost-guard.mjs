import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const betaScope = read('src/config/betaScope.ts')
const remoteClient = read('src/lib/storyRemoteClient.ts')
const storyIndex = read('supabase/functions/story-generate/index.ts')
const usage = read('supabase/functions/story-generate/usage.ts')
const migration = read('docs/qissa/backend/migrations/20260907_000010_add_story_generation_cost_guard.sql')
const liveWorkflow = read('.github/workflows/live-story-smoke.yml')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /storyGenerationDailyLimit:\s*5/.test(betaScope) && /DAILY_STORY_GENERATION_LIMIT\s*=\s*5/.test(usage),
  'Frontend beta scope and Story Edge Function must agree on the five-generation daily budget.',
)

requireCondition(
  /getInstallationId/.test(remoteClient) && /installationId:\s*getInstallationId\(\)/.test(remoteClient),
  'Remote story requests must carry the stable installation identity used by the server cost guard.',
)

const disabledGuardPosition = storyIndex.indexOf('if (!aiEnabled || !openAiApiKey)')
const claimPosition = storyIndex.indexOf('claimStoryGeneration(installationId)')
requireCondition(
  disabledGuardPosition >= 0 && claimPosition > disabledGuardPosition,
  'AI-disabled development must return deterministic fallback before any usage claim or provider path.',
)

requireCondition(
  /if \(!claim\.allowed\)/.test(storyIndex) &&
    /safeFallback\(context, origin, claim\.reason/.test(storyIndex) &&
    /rate-limit-identity-missing/.test(storyIndex),
  'Missing identity, exhausted budget, or guard failure must fail closed to safe fallback before provider usage.',
)

requireCondition(
  /admin\.rpc\('qissa_claim_story_generation'/.test(usage) &&
    /rate_limit_service_unavailable/.test(usage) &&
    /rate_limit_check_failed/.test(usage),
  'Story AI usage must be claimed through the server-side database guard and fail closed when unavailable.',
)

requireCondition(
  /add column if not exists installation_id uuid/.test(migration) &&
    /idx_app_events_installation_name_created/.test(migration) &&
    /qissa_claim_story_generation/.test(migration) &&
    /pg_advisory_xact_lock/.test(migration) &&
    /security definer/.test(migration) &&
    /set search_path = public/.test(migration) &&
    /revoke all on function[\s\S]*from anon/.test(migration) &&
    /grant execute on function[\s\S]*to service_role/.test(migration),
  'Database migration must enforce an atomic, indexed, service-role-only story generation claim.',
)

requireCondition(
  /installationId:\s*crypto\.randomUUID\(\)/.test(read('scripts/smoke-story-generate-live.mjs')),
  'Manual real-provider smoke must send a valid installation identity.',
)

requireCondition(
  /workflow_dispatch:/.test(liveWorkflow) &&
    !/^\s*push:/m.test(liveWorkflow) &&
    !/^\s*pull_request:/m.test(liveWorkflow),
  'Paid-capable live Story smoke must remain manual-only.',
)

if (failures.length > 0) {
  console.error('Story AI cost guard check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story AI cost guard check passed: normal development stays zero-cost and provider use is capped server-side.')
