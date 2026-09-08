import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const betaScope = read('src/config/betaScope.ts')
const remoteClient = read('src/lib/storyRemoteClient.ts')
const storyIndex = read('supabase/functions/story-generate/index.ts')
const usage = read('supabase/functions/story-generate/usage.ts')
const installationMigration = read('docs/qissa/backend/migrations/20260907_000010_add_story_generation_cost_guard.sql')
const globalMigration = read('docs/qissa/backend/migrations/20260908_000014_add_global_story_generation_cap.sql')
const liveWorkflow = read('.github/workflows/live-story-smoke.yml')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /storyGenerationDailyLimit:\s*5/.test(betaScope) && /DAILY_STORY_GENERATION_LIMIT\s*=\s*5/.test(usage),
  'Frontend beta scope and Story Edge Function must agree on the five-generation installation daily budget.',
)

requireCondition(
  /storyGenerationGlobalDailyLimit:\s*30/.test(betaScope) && /GLOBAL_DAILY_STORY_GENERATION_LIMIT\s*=\s*30/.test(usage),
  'Frontend beta scope and Story Edge Function must agree on the 30-claim closed-beta global daily ceiling.',
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
    /safeFallback\(context, origin, claim\.reason, claimMetadata\(claim\)\)/.test(storyIndex) &&
    /rate-limit-identity-missing/.test(storyIndex) &&
    /X-QISSA-Global-Daily-Limit/.test(storyIndex) &&
    /X-QISSA-Global-Daily-Used/.test(storyIndex),
  'Missing identity, exhausted installation/global budget, or guard failure must fail closed and surface budget metadata before provider usage.',
)

requireCondition(
  /admin\.rpc\('qissa_claim_story_generation_budget'/.test(usage) &&
    /p_global_daily_limit:\s*GLOBAL_DAILY_STORY_GENERATION_LIMIT/.test(usage) &&
    /rate_limit_service_unavailable/.test(usage) &&
    /rate_limit_check_failed/.test(usage),
  'Story AI usage must be claimed through the aggregate server-side database guard and fail closed when unavailable.',
)

requireCondition(
  /add column if not exists installation_id uuid/.test(installationMigration) &&
    /idx_app_events_installation_name_created/.test(installationMigration) &&
    /qissa_claim_story_generation/.test(installationMigration) &&
    /security definer/.test(installationMigration) &&
    /set search_path = public/.test(installationMigration),
  'The original installation-scoped cost migration must remain present for indexed per-installation accounting.',
)

const aggregateTableBlock = globalMigration.match(/create table if not exists public\.qissa_provider_daily_usage\s*\(([\s\S]*?)\n\);/)?.[1] ?? ''
requireCondition(
  aggregateTableBlock.length > 0 &&
    /usage_date date primary key/.test(aggregateTableBlock) &&
    /story_generation_claims integer/.test(aggregateTableBlock) &&
    !/installation_id|child_profile_id|story_text|hero|choice|audio/i.test(aggregateTableBlock),
  'The global daily usage table must be aggregate-only and contain no family identity or story/audio content.',
)

const globalLockPosition = globalMigration.indexOf("qissa:story-generation:global:")
const installationLockPosition = globalMigration.indexOf("hashtextextended(p_installation_id::text")
const aggregateIncrementPosition = globalMigration.indexOf('story_generation_claims = story_generation_claims + 1')
const eventInsertPosition = globalMigration.indexOf("'story_generation_started'")
requireCondition(
  /qissa_claim_story_generation_budget/.test(globalMigration) &&
    globalLockPosition >= 0 &&
    installationLockPosition > globalLockPosition &&
    aggregateIncrementPosition > installationLockPosition &&
    eventInsertPosition > aggregateIncrementPosition &&
    /global_daily_limit/.test(globalMigration) &&
    /security definer/.test(globalMigration) &&
    /set search_path = public/.test(globalMigration),
  'The global and installation limits must be claimed atomically with consistent lock ordering before accounting the provider-eligible story request.',
)

requireCondition(
  /alter table public\.qissa_provider_daily_usage enable row level security/.test(globalMigration) &&
    /revoke all on table public\.qissa_provider_daily_usage from anon/.test(globalMigration) &&
    /revoke all on table public\.qissa_provider_daily_usage from authenticated/.test(globalMigration) &&
    /grant all on table public\.qissa_provider_daily_usage to service_role/.test(globalMigration) &&
    /revoke all on function public\.qissa_claim_story_generation_budget[\s\S]*from anon/.test(globalMigration) &&
    /grant execute on function public\.qissa_claim_story_generation_budget[\s\S]*to service_role/.test(globalMigration),
  'Aggregate spend accounting must remain inaccessible to browser roles and callable only through the trusted service role.',
)

requireCondition(
  /create or replace function public\.qissa_claim_story_generation\(/.test(globalMigration) &&
    /qissa_claim_story_generation_budget\([\s\S]*p_installation_id[\s\S]*p_daily_limit[\s\S]*30/.test(globalMigration),
  'The legacy two-argument claim RPC must delegate to the new global budget so the currently deployed Story function is protected as soon as the migration lands.',
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

console.log('Story AI cost guard check passed: normal development stays zero-cost; provider-eligible stories are capped per installation and globally.')
