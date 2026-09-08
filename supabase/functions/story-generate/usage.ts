import { createClient } from 'npm:@supabase/supabase-js@2'

const DAILY_STORY_GENERATION_LIMIT = 5
// TEMPORARY CLOSED-BETA CIRCUIT BREAKER. This is intentionally conservative
// while Story AI is not generally enabled. It is not a future paid-plan quota.
// Before public/paid launch, use plan/account entitlements and keep a separate,
// configurable emergency project spend ceiling. Tracked in GitHub issue #98.
const GLOBAL_DAILY_STORY_GENERATION_LIMIT = 30

export type GenerationClaim = {
  allowed: boolean
  reason: string
  used: number
  limit: number
  globalUsed: number
  globalLimit: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isInstallationId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const adminClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const deniedClaim = (reason: string): GenerationClaim => ({
  allowed: false,
  reason,
  used: 0,
  limit: DAILY_STORY_GENERATION_LIMIT,
  globalUsed: 0,
  globalLimit: GLOBAL_DAILY_STORY_GENERATION_LIMIT,
})

export const claimStoryGeneration = async (installationId: string): Promise<GenerationClaim> => {
  const admin = adminClient()
  if (!admin) return deniedClaim('rate_limit_service_unavailable')

  const { data, error } = await admin.rpc('qissa_claim_story_generation_budget', {
    p_installation_id: installationId,
    p_daily_limit: DAILY_STORY_GENERATION_LIMIT,
    p_global_daily_limit: GLOBAL_DAILY_STORY_GENERATION_LIMIT,
  })

  if (error || !isRecord(data)) {
    console.error('QISSA story generation cost guard failed', error)
    return deniedClaim('rate_limit_check_failed')
  }

  return {
    allowed: data.allowed === true,
    reason: typeof data.reason === 'string' ? data.reason : 'unknown',
    used: typeof data.used === 'number' && Number.isFinite(data.used) ? data.used : 0,
    limit: typeof data.limit === 'number' && Number.isFinite(data.limit)
      ? data.limit
      : DAILY_STORY_GENERATION_LIMIT,
    globalUsed: typeof data.global_used === 'number' && Number.isFinite(data.global_used) ? data.global_used : 0,
    globalLimit: typeof data.global_limit === 'number' && Number.isFinite(data.global_limit)
      ? data.global_limit
      : GLOBAL_DAILY_STORY_GENERATION_LIMIT,
  }
}

export const storyGenerationDailyLimit = DAILY_STORY_GENERATION_LIMIT
export const storyGenerationGlobalDailyLimit = GLOBAL_DAILY_STORY_GENERATION_LIMIT
