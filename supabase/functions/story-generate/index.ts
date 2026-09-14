import {
  buildFinalEpisode,
  isRecord,
  normalizeStoryRequest,
  type SafetyFlags,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import { buildSafeFallback } from './fallback.ts'
import { evaluateStorySafety, generateStoryCandidate, moderateStoryText } from './openai.ts'
import { combineSafety, scanRuleBasedSafety, validateCandidate } from './safety.ts'
import { claimStoryGeneration, isInstallationId, type GenerationClaim } from './usage.ts'

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
const aiEnabledSetting = Deno.env.get('QISSA_AI_ENABLED')?.trim().toLowerCase()
const aiEnabled = Boolean(openAiApiKey) && aiEnabledSetting !== 'false'
const storyModel = Deno.env.get('OPENAI_STORY_MODEL')?.trim() || 'gpt-5.6-luna'
const safetyModel = Deno.env.get('OPENAI_SAFETY_MODEL')?.trim() || storyModel
const maxAttempts = 2

const providerMetadata = (): Record<string, string> => ({
  'X-QISSA-Story-Model': storyModel,
  'X-QISSA-Safety-Model': safetyModel,
})

const hasValidPrivacyConsent = (input: unknown): boolean => {
  if (!isRecord(input) || !isRecord(input.privacyConsent)) return false
  const consent = input.privacyConsent
  return consent.version === PRIVACY_CONSENT_VERSION &&
    consent.parentOrGuardianConfirmed === true &&
    consent.aiProcessingAccepted === true &&
    typeof consent.acceptedAt === 'string' &&
    Number.isFinite(Date.parse(consent.acceptedAt))
}

const installationIdFromInput = (input: unknown): string | null => {
  if (!isRecord(input)) return null
  return isInstallationId(input.installationId) ? input.installationId : null
}

const corsHeaders = (origin: string | null) => {
  const allowed =
    origin === 'https://jteshaboev1984-ops.github.io' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    Boolean(origin && /^https:\/\/[a-z0-9-]+\.app\.github\.dev$/.test(origin))

  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://jteshaboev1984-ops.github.io',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const json = (
  body: unknown,
  status: number,
  origin: string | null,
  metadata: Record<string, string> = {},
) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...corsHeaders(origin),
    'Content-Type': 'application/json; charset=utf-8',
    ...metadata,
  },
})

const safeFallback = (
  context: NonNullable<ReturnType<typeof normalizeStoryRequest>>,
  origin: string | null,
  reason: string,
  metadata: Record<string, string> = {},
) => json(
  { episode: buildSafeFallback(context) },
  200,
  origin,
  {
    'X-QISSA-Generation-Source': 'safe-fallback',
    'X-QISSA-Fallback-Reason': reason,
    ...metadata,
  },
)

const claimMetadata = (claim: GenerationClaim): Record<string, string> => ({
  'X-QISSA-Daily-Limit': String(claim.limit),
  'X-QISSA-Daily-Used': String(claim.used),
  'X-QISSA-Global-Daily-Limit': String(claim.globalLimit),
  'X-QISSA-Global-Daily-Used': String(claim.globalUsed),
})

const failureReason = (errors: string[], safety: SafetyResult | null) => {
  const parts = [...errors]
  if (safety && !safety.approved) {
    const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
    if (flags.length > 0) parts.push(`safety:${flags.join(',')}`)
  }
  return parts.join(';').slice(0, 600)
}

const providerFailureClass = (reason: string): string => {
  if (reason === 'openai_timeout') return 'provider-timeout'
  if (reason.startsWith('openai_http_')) return 'provider-http'
  if (reason === 'openai_incomplete_response') return 'provider-incomplete'
  if (reason.startsWith('openai_response_failed:')) return 'provider-failed'
  return 'provider-error'
}

const hasRuleViolation = (flags: SafetyFlags): boolean => Object.values(flags).some(Boolean)

const ruleFailure = (flags: SafetyFlags): SafetyResult => ({
  approved: false,
  risk_level: flags.adult_theme || flags.discrimination || flags.excessive_fear || flags.religious_push || flags.political_push
    ? 'high'
    : 'medium',
  flags,
  required_action: flags.adult_theme || flags.discrimination || flags.excessive_fear || flags.religious_push || flags.political_push
    ? 'block'
    : 'regenerate',
})

const candidateTextForModeration = (candidate: StoryCandidate) => [
  candidate.title,
  candidate.story_text,
  ...candidate.choices.flatMap((choice) => [
    choice.text,
    choice.effect_summary,
    choice.resolution_text,
    choice.tomorrow_seed,
  ]),
].join('\n')

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, origin)
  }

  const context = normalizeStoryRequest(input)
  if (!context) return json({ error: 'invalid_story_context' }, 422, origin)

  // A configured API key enables the provider path by default. Operators can
  // still fail closed instantly with QISSA_AI_ENABLED=false. No usage claim or
  // provider request is made while the provider path is disabled or keyless.
  if (!aiEnabled || !openAiApiKey) {
    return safeFallback(context, origin, !openAiApiKey ? 'api-key-missing' : 'ai-disabled')
  }

  if (!hasValidPrivacyConsent(input)) {
    // Model identifiers are operational metadata, not secrets. Returning them
    // here lets operators verify the effective provider configuration without
    // spending a generation claim or sending story content to the provider.
    return json({ error: 'privacy_consent_required' }, 403, origin, providerMetadata())
  }

  const installationId = installationIdFromInput(input)
  if (!installationId) {
    return safeFallback(context, origin, 'rate-limit-identity-missing', providerMetadata())
  }

  const claim = await claimStoryGeneration(installationId)
  if (!claim.allowed) {
    return safeFallback(context, origin, claim.reason, {
      ...providerMetadata(),
      ...claimMetadata(claim),
    })
  }

  let retryReason = ''
  let attemptsUsed = 0
  let lastFailureClass = 'unknown'
  const failureTrace: string[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attemptsUsed = attempt
    try {
      const candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)
      const validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        retryReason = failureReason(validationErrors, null)
        lastFailureClass = 'validation'
        failureTrace.push(`validation:${validationErrors.join(',')}`)
        continue
      }

      const ruleFlags = scanRuleBasedSafety(context, candidate)
      if (hasRuleViolation(ruleFlags)) {
        retryReason = failureReason([], ruleFailure(ruleFlags))
        lastFailureClass = 'deterministic-safety'
        const flags = Object.entries(ruleFlags).filter(([, value]) => value).map(([key]) => key)
        failureTrace.push(`deterministic-safety:${flags.join(',') || 'flagged'}`)
        continue
      }

      const [evaluation, moderation] = await Promise.all([
        evaluateStorySafety(openAiApiKey, safetyModel, context, candidate),
        moderateStoryText(openAiApiKey, candidateTextForModeration(candidate)),
      ])
      const safety = combineSafety(ruleFlags, evaluation, moderation)

      if (!safety.approved) {
        retryReason = failureReason([], safety)
        lastFailureClass = 'semantic-safety'
        const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
        failureTrace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)
        continue
      }

      const episode = buildFinalEpisode(context, candidate, safety)
      return json(
        { episode },
        200,
        origin,
        {
          ...providerMetadata(),
          'X-QISSA-Generation-Source': 'openai-structured',
          'X-QISSA-Generation-Attempts': String(attempt),
          ...claimMetadata(claim),
        },
      )
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 300) : 'provider_error'
      console.error('QISSA story generation attempt failed', { attempt, reason })
      retryReason = reason
      lastFailureClass = providerFailureClass(reason)
      failureTrace.push(lastFailureClass)
      // Provider/configuration/time-out failures tend to repeat and may already
      // have consumed provider tokens. Fail closed instead of paying for the
      // same request again. Retries are reserved for candidates we actually
      // received and rejected deterministically or semantically.
      break
    }
  }

  return safeFallback(
    context,
    origin,
    'generation-or-safety-failed',
    {
      ...providerMetadata(),
      ...claimMetadata(claim),
      'X-QISSA-Generation-Attempts': String(attemptsUsed),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': failureTrace.join('>').slice(0, 480),
    },
  )
})
