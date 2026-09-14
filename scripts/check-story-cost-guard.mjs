import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const betaScope = read('src/config/betaScope.ts')
const remoteClient = read('src/lib/storyRemoteClient.ts')
const storyIndex = read('supabase/functions/story-generate/index.ts')
const provider = read('supabase/functions/story-generate/openai.ts')
const usage = read('supabase/functions/story-generate/usage.ts')
const installationMigration = read('docs/qissa/backend/migrations/20260907_000010_add_story_generation_cost_guard.sql')
const globalMigration = read('docs/qissa/backend/migrations/20260908_000014_add_global_story_generation_cap.sql')
const liveWorkflow = read('.github/workflows/live-story-smoke.yml')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /storyGenerationThrottleEnabled:\s*false/.test(betaScope) &&
    /DEVELOPMENT_ACCOUNTING_CEILING\s*=\s*2_000_000_000/.test(usage) &&
    /DAILY_STORY_GENERATION_LIMIT\s*=\s*DEVELOPMENT_ACCOUNTING_CEILING/.test(usage) &&
    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\s*=\s*DEVELOPMENT_ACCOUNTING_CEILING/.test(usage),
  'Active Story AI development must stay unthrottled while provider-eligible calls remain counted through a non-binding int4-safe accounting ceiling.',
)

requireCondition(
  !/storyGenerationDailyLimit:/.test(betaScope) && !/storyGenerationGlobalDailyLimit:/.test(betaScope),
  'The frontend beta scope must not expose the retired temporary 3/6 Story AI quotas during active prompt and validator development.',
)

requireCondition(
  /getInstallationId/.test(remoteClient) && /installationId:\s*getInstallationId\(\)/.test(remoteClient),
  'Remote story requests must carry the stable installation identity used by server-side usage accounting.',
)

const disabledGuardPosition = storyIndex.indexOf('if (!aiEnabled || !openAiApiKey)')
const claimPosition = storyIndex.indexOf('claimStoryGeneration(installationId)')
requireCondition(
  disabledGuardPosition >= 0 && claimPosition > disabledGuardPosition,
  'AI-disabled or keyless operation must return deterministic fallback before any usage claim or provider path.',
)

requireCondition(
  /aiEnabledSetting !== 'false'/.test(storyIndex) && /Boolean\(openAiApiKey\)/.test(storyIndex),
  'A configured provider key should enable Story AI by default while QISSA_AI_ENABLED=false remains an emergency kill switch.',
)

requireCondition(
  /gpt-5\.6-luna/.test(storyIndex),
  'The default Story AI model must remain GPT-5.6 Luna during active development to minimize latency and provider spend.',
)

requireCondition(
  /30_000/.test(provider) &&
    /'qissa_story_candidate'[\s\S]*30_000[\s\S]*4000[\s\S]*'none'/.test(provider) &&
    /'qissa_safety_evaluation'[\s\S]*12_000[\s\S]*700[\s\S]*'none'/.test(provider),
  'Story generation must have enough structured-output headroom for a 430-560 word Russian story plus choices/state, while both structured calls remain latency-aware with reasoning disabled.',
)

requireCondition(
  /providerFailureClass/.test(storyIndex) &&
    /lastFailureClass = providerFailureClass\(reason\)/.test(storyIndex) &&
    /X-QISSA-Generation-Failure-Class/.test(storyIndex) &&
    /X-QISSA-Generation-Attempts/.test(storyIndex),
  'Provider fallbacks must expose a non-sensitive failure class and attempt count so paid failures can be diagnosed without blind repeat calls.',
)

const catchPosition = storyIndex.indexOf('} catch (error) {')
const providerFailurePosition = storyIndex.indexOf('lastFailureClass = providerFailureClass(reason)', catchPosition)
const providerBreakPosition = storyIndex.indexOf('break', providerFailurePosition)
requireCondition(
  catchPosition >= 0 && providerFailurePosition > catchPosition && providerBreakPosition > providerFailurePosition,
  'Provider HTTP/timeout/config failures must fail closed instead of automatically paying for a second generation attempt.',
)

const deniedClaimPosition = storyIndex.indexOf('if (!claim.allowed)')
const deniedClaimFallbackPosition = storyIndex.indexOf("safeFallback(context, origin, claim.reason", deniedClaimPosition)
const deniedClaimMetadataPosition = storyIndex.indexOf('...claimMetadata(claim)', deniedClaimFallbackPosition)
requireCondition(
  deniedClaimPosition >= 0 &&
    deniedClaimFallbackPosition > deniedClaimPosition &&
    deniedClaimMetadataPosition > deniedClaimFallbackPosition &&
    /rate-limit-identity-missing/.test(storyIndex) &&
    /X-QISSA-Global-Daily-Limit/.test(storyIndex) &&
    /X-QISSA-Global-Daily-Used/.test(storyIndex),
  'Missing identity or accounting-service failure must fail closed and surface usage metadata before provider usage.',
)

requireCondition(
  /admin\.rpc\('qissa_claim_story_generation_budget'/.test(usage) &&
    /p_daily_limit:\s*DAILY_STORY_GENERATION_LIMIT/.test(usage) &&
    /p_global_daily_limit:\s*GLOBAL_DAILY_STORY_GENERATION_LIMIT/.test(usage) &&
    /rate_limit_service_unavailable/.test(usage) &&
    /rate_limit_check_failed/.test(usage),
  'Story AI usage must still be recorded through the aggregate server-side database guard and fail closed when accounting is unavailable.',
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
const eventInsertPosition = globalMigration.indexOf('insert into public.app_events')
requireCondition(
  /qissa_claim_story_generation_budget/.test(globalMigration) &&
    globalLockPosition >= 0 &&
    installationLockPosition > globalLockPosition &&
    aggregateIncrementPosition > installationLockPosition &&
    eventInsertPosition > aggregateIncrementPosition &&
    /global_daily_limit/.test(globalMigration) &&
    /security definer/.test(globalMigration) &&
    /set search_path = public/.test(globalMigration),
  'Provider-eligible Story AI requests must continue to be accounted atomically with consistent lock ordering.',
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
  'The historical two-argument claim RPC must remain delegated to the global budget migration; the active Story function supplies the development accounting ceiling explicitly.',
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
  console.error('Story AI accounting check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story AI accounting check passed: active development is unthrottled, provider usage remains observable and fail-closed, and provider errors do not trigger blind paid retries.')
