import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const betaScope = read('src/config/betaScope.ts')
const remoteClient = read('src/lib/storyRemoteClient.ts')
const storyIndex = read('supabase/functions/story-generate/index.ts')
const splitStoryIndex = read('supabase/functions/story-generate/split-index.ts')
const provider = read('supabase/functions/story-generate/openai.ts')
const splitProvider = read('supabase/functions/story-generate/split-openai.ts')
const usage = read('supabase/functions/story-generate/usage.ts')
const pagesWorkflow = read('.github/workflows/deploy-pages.yml')
const envExample = read('.env.example')
const installationMigration = read('docs/qissa/backend/migrations/20260907_000010_add_story_generation_cost_guard.sql')
const globalMigration = read('docs/qissa/backend/migrations/20260908_000014_add_global_story_generation_cap.sql')
const accountingOnlyMigration = read('docs/qissa/backend/migrations/20260914_000015_allow_story_generation_accounting_only_mode.sql')
const runtimeFlagMigration = read('docs/qissa/backend/migrations/20260915_000017_add_story_ai_runtime_flag.sql')
const liveWorkflow = read('.github/workflows/live-story-smoke.yml')

const failures = []
const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

requireCondition(
  /storyGenerationThrottleEnabled:\s*false/.test(betaScope) &&
    /DEVELOPMENT_ACCOUNTING_ONLY_LIMIT\s*=\s*0/.test(usage) &&
    /DAILY_STORY_GENERATION_LIMIT\s*=\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage) &&
    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\s*=\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage),
  'Active Story AI tuning must use explicit zero accounting-only limits so validation work cannot be blocked by a temporary daily throttle.',
)

requireCondition(
  !/storyGenerationDailyLimit:/.test(betaScope) && !/storyGenerationGlobalDailyLimit:/.test(betaScope),
  'The frontend beta scope must not expose Story AI accounting or operational ceilings as a family quota.',
)

requireCondition(
  /getInstallationId/.test(remoteClient) && /installationId:\s*getInstallationId\(\)/.test(remoteClient),
  'Remote story requests must carry the stable installation identity used by server-side usage accounting.',
)

const disabledGuardPosition = storyIndex.indexOf('if (!STORY_AI_PRODUCTION_ROLLOUT_ENABLED || !openAiApiKey)')
const runtimeGuardPosition = storyIndex.indexOf('readStoryAiRuntimeState()')
const claimPosition = storyIndex.indexOf('claimStoryGeneration(installationId)')
requireCondition(
  disabledGuardPosition >= 0 && runtimeGuardPosition > disabledGuardPosition && claimPosition > runtimeGuardPosition,
  'Code/key and service-role runtime guards must fail closed before any accounting claim or provider path.',
)

requireCondition(
  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(storyIndex) &&
    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(splitStoryIndex) &&
    /readStoryAiRuntimeState\(\)/.test(storyIndex) &&
    /readStoryAiRuntimeState\(\)/.test(splitStoryIndex) &&
    !/QISSA_AI_ENABLED/.test(storyIndex) &&
    !/QISSA_AI_ENABLED/.test(splitStoryIndex),
  'Story AI rollout must require the reviewed code gate, configured key and service-role runtime flag; the stale env opt-in must not remain an unmanageable production dependency.',
)

requireCondition(
  /gpt-5\.6-luna/.test(storyIndex),
  'The default Story AI model must remain GPT-5.6 Luna during active development to minimize latency and provider spend.',
)

requireCondition(
  /30_000/.test(provider) &&
    /'qissa_story_candidate'[\s\S]*30_000[\s\S]*4000[\s\S]*'none'/.test(provider) &&
    /timeoutMs = 12_000/.test(provider) &&
    /'qissa_safety_evaluation'[\s\S]*timeoutMs[\s\S]*700[\s\S]*'none'/.test(provider),
  'Story generation must keep sufficient structured-output headroom while Story and Safety structured calls use bounded latency-aware timeouts and no reasoning.',
)

requireCondition(
  /DEFAULT_TIMEOUT_MS = 130_000/.test(remoteClient) &&
    /MAX_TIMEOUT_MS = 140_000/.test(remoteClient) &&
    /VITE_QISSA_STORY_TIMEOUT_MS:\s*130000/.test(pagesWorkflow) &&
    /VITE_QISSA_STORY_TIMEOUT_MS=130000/.test(envExample) &&
    /'qissa_story_blueprint'[\s\S]*18_000[\s\S]*1800[\s\S]*'none'/.test(splitProvider) &&
    /'qissa_story_narration'[\s\S]*30_000[\s\S]*3200[\s\S]*'none'/.test(splitProvider) &&
    /'qissa_text_length_repair'[\s\S]*30_000[\s\S]*3000[\s\S]*'none'/.test(provider) &&
    /timeoutMs = 12_000/.test(provider) &&
    /firstErrors\.join\(','\)[\s\S]*8_000/.test(provider),
  'Browser timeout must cover the bounded 18s architect + 30s narrator + 30s narrator retry + 30s repair + 12s primary safety + 8s consistency-only safety retry envelope (128s) without exceeding the 150s hosted Edge Function ceiling.',
)

requireCondition(
  /providerFailureClass/.test(storyIndex) &&
    /lastFailureClass = providerFailureClass\(reason\)/.test(storyIndex) &&
    /X-QISSA-Generation-Failure-Class/.test(storyIndex) &&
    /X-QISSA-Generation-Attempts/.test(storyIndex) &&
    /candidateValidationMetrics/.test(storyIndex) &&
    /story_words=/.test(storyIndex),
  'Paid failures must remain diagnosable through non-sensitive model, attempt, failure-class and validation-metric metadata.',
)

const catchPosition = storyIndex.indexOf('} catch (error) {')
const providerFailurePosition = storyIndex.indexOf('lastFailureClass = providerFailureClass(reason)', catchPosition)
const providerBreakPosition = storyIndex.indexOf('break', providerFailurePosition)
requireCondition(
  catchPosition >= 0 && providerFailurePosition > catchPosition && providerBreakPosition > providerFailurePosition,
  'Provider HTTP/timeout/config failures must fail closed instead of automatically paying for a second generation attempt.',
)

requireCondition(
  /admin\.rpc\('qissa_claim_story_generation_budget'/.test(usage) &&
    /p_daily_limit:\s*DAILY_STORY_GENERATION_LIMIT/.test(usage) &&
    /p_global_daily_limit:\s*GLOBAL_DAILY_STORY_GENERATION_LIMIT/.test(usage) &&
    /rate_limit_service_unavailable/.test(usage) &&
    /rate_limit_check_failed/.test(usage),
  'Story AI provider eligibility must still go through trusted server-side accounting and fail closed when accounting is unavailable.',
)

requireCondition(
  /from\('qissa_runtime_flags'\)/.test(usage) &&
    /eq\('flag', 'story_ai_enabled'\)/.test(usage) &&
    /runtime-config-unavailable/.test(usage) &&
    /runtime-config-check-failed/.test(usage) &&
    /runtime-disabled/.test(usage) &&
    /X-QISSA-Runtime-AI/.test(storyIndex) &&
    /X-QISSA-Runtime-AI/.test(splitStoryIndex),
  'Story AI runtime rollout state must be service-role checked, observable without secrets, and fail closed on missing/failed config.',
)

requireCondition(
  /create table if not exists public\.qissa_runtime_flags/.test(runtimeFlagMigration) &&
    /enabled boolean not null default false/.test(runtimeFlagMigration) &&
    /alter table public\.qissa_runtime_flags enable row level security/.test(runtimeFlagMigration) &&
    /revoke all on table public\.qissa_runtime_flags from anon/.test(runtimeFlagMigration) &&
    /revoke all on table public\.qissa_runtime_flags from authenticated/.test(runtimeFlagMigration) &&
    /grant select, update on table public\.qissa_runtime_flags to service_role/.test(runtimeFlagMigration) &&
    /values \('story_ai_enabled', false\)/.test(runtimeFlagMigration),
  'Runtime Story AI flag storage must default OFF and remain inaccessible to browser roles.',
)

requireCondition(
  /add column if not exists installation_id uuid/.test(installationMigration) &&
    /idx_app_events_installation_name_created/.test(installationMigration) &&
    /security definer/.test(installationMigration) &&
    /set search_path = public/.test(installationMigration),
  'The indexed installation-scoped accounting foundation must remain present.',
)

const aggregateTableBlock = globalMigration.match(/create table if not exists public\.qissa_provider_daily_usage\s*\(([\s\S]*?)\n\);/)?.[1] ?? ''
requireCondition(
  aggregateTableBlock.length > 0 &&
    /usage_date date primary key/.test(aggregateTableBlock) &&
    /story_generation_claims integer/.test(aggregateTableBlock) &&
    !/installation_id|child_profile_id|story_text|hero|choice|audio/i.test(aggregateTableBlock),
  'Project-wide usage accounting must remain aggregate-only and contain no family identity or story/audio content.',
)

requireCondition(
  /if p_daily_limit < 0 or p_daily_limit > 20 then/.test(accountingOnlyMigration) &&
    /if p_global_daily_limit < 0 or p_global_daily_limit > 1000 then/.test(accountingOnlyMigration),
  'Accounting-only mode must accept zero while retaining the historical positive-limit validation ceilings.',
)

requireCondition(
  /if p_global_daily_limit > 0 and v_global_used >= p_global_daily_limit then/.test(accountingOnlyMigration) &&
    /if p_daily_limit > 0 and v_used >= p_daily_limit then/.test(accountingOnlyMigration),
  'Zero limits must disable enforcement only; positive limits must preserve existing daily and global throttling semantics.',
)

const globalLockPosition = accountingOnlyMigration.indexOf("qissa:story-generation:global:")
const installationLockPosition = accountingOnlyMigration.indexOf("hashtextextended(p_installation_id::text")
const aggregateIncrementPosition = accountingOnlyMigration.indexOf('story_generation_claims = story_generation_claims + 1')
const eventInsertPosition = accountingOnlyMigration.indexOf('insert into public.app_events')
requireCondition(
  globalLockPosition >= 0 &&
    installationLockPosition > globalLockPosition &&
    aggregateIncrementPosition > installationLockPosition &&
    eventInsertPosition > aggregateIncrementPosition &&
    /'accounting_only', p_daily_limit = 0 and p_global_daily_limit = 0/.test(accountingOnlyMigration),
  'Accounting-only provider requests must still be atomically counted using the existing global-then-installation lock order.',
)

requireCondition(
  /security definer/.test(accountingOnlyMigration) &&
    /set search_path = public/.test(accountingOnlyMigration) &&
    /revoke all on function public\.qissa_claim_story_generation_budget\(uuid, integer, integer\) from public/.test(accountingOnlyMigration) &&
    /revoke all on function public\.qissa_claim_story_generation_budget\(uuid, integer, integer\) from anon/.test(accountingOnlyMigration) &&
    /revoke all on function public\.qissa_claim_story_generation_budget\(uuid, integer, integer\) from authenticated/.test(accountingOnlyMigration) &&
    /grant execute on function public\.qissa_claim_story_generation_budget\(uuid, integer, integer\) to service_role/.test(accountingOnlyMigration),
  'Accounting-only mode must keep the RPC behind the service role with the same hardened search_path boundary.',
)

requireCondition(
  /alter table public\.qissa_provider_daily_usage enable row level security/.test(globalMigration) &&
    /revoke all on table public\.qissa_provider_daily_usage from anon/.test(globalMigration) &&
    /revoke all on table public\.qissa_provider_daily_usage from authenticated/.test(globalMigration) &&
    /grant all on table public\.qissa_provider_daily_usage to service_role/.test(globalMigration),
  'Aggregate provider accounting must remain inaccessible to browser roles.',
)

requireCondition(
  /installationId:\s*crypto\.randomUUID\(\)/.test(read('scripts/smoke-story-generate-live.mjs')),
  'Manual real-provider smoke must send a valid installation identity.',
)

requireCondition(
  /workflow_dispatch:/.test(liveWorkflow) &&
    !/^\s*push:/m.test(liveWorkflow) &&
    !/^\s*pull_request:/m.test(liveWorkflow),
  'Paid-capable permanent Story smoke must remain manual-only.',
)

if (failures.length > 0) {
  console.error('Story AI accounting check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story AI tuning accounting check passed: runtime gate remains fail-closed, provider-eligible calls are counted without a daily throttle, timeouts including the bounded safety-only consistency retry are aligned, and provider failures do not trigger blind paid retries.')
