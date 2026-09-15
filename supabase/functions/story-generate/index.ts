import {
  buildFinalEpisode,
  isRecord,
  normalizeStoryRequest,
  type SafetyFlags,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import { buildSafeFallback } from './fallback.ts'
import { evaluateStorySafety, generateStoryCandidate, moderateStoryText, repairStoryCandidateTextLengths } from './openai.ts'
import { combineSafety, scanRuleBasedSafety, validateCandidate } from './safety.ts'
import { claimStoryGeneration, isInstallationId, type GenerationClaim } from './usage.ts'

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false
const aiEnabledSetting = Deno.env.get('QISSA_AI_ENABLED')?.trim().toLowerCase()
const aiEnabled = STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean(openAiApiKey) && aiEnabledSetting === 'true'
const storyModel = Deno.env.get('OPENAI_STORY_MODEL')?.trim() || 'gpt-5.6-luna'
const safetyModel = Deno.env.get('OPENAI_SAFETY_MODEL')?.trim() || storyModel
const maxAttempts = 3
const maxFullGenerationAttempts = 2

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
  { episode: { ...buildSafeFallback(context), generationSource: 'safe-fallback' } },
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

const wordCount = (text: string): number => text.trim().split(/\s+/u).filter(Boolean).length

const candidateValidationMetrics = (candidate: StoryCandidate): string[] => [
  `story_words=${wordCount(candidate.story_text)}`,
  ...candidate.choices.map((choice, index) => `choice_${index + 1}_resolution_words=${wordCount(choice.resolution_text)}`),
]

const textLengthValidationErrors = new Set([
  'story_too_short',
  'story_too_long',
  'choice_resolution_too_short',
  'choice_resolution_too_long',
])

const isTextLengthOnlyFailure = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textLengthValidationErrors.has(error))

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

  // Story AI is fail-closed behind a code-reviewed production rollout gate.
  // Even QISSA_AI_ENABLED=true cannot enter the provider path while the rollout
  // gate is false. Enabling paid generation therefore requires an explicit code change.
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
  let fullGenerationAttempts = 0
  let lastFailureClass = 'unknown'
  let repairCandidate: StoryCandidate | null = null
  let repairValidationErrors: string[] = []
  let usedTextLengthRepair = false
  const failureTrace: string[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attemptsUsed = attempt
    try {
      // Text-length repair may change only invalid story/resolution prose; canon and branch state remain immutable.
      let candidate: StoryCandidate
      if (repairCandidate) {
        const candidateToRepair: StoryCandidate = repairCandidate
        candidate = await repairStoryCandidateTextLengths(
          openAiApiKey,
          storyModel,
          context,
          candidateToRepair,
          repairValidationErrors,
        )
        usedTextLengthRepair = true
        repairCandidate = null
        repairValidationErrors = []
      } else {
        if (fullGenerationAttempts >= maxFullGenerationAttempts) break
        fullGenerationAttempts += 1
        candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)
      }

      const validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        const metrics = candidateValidationMetrics(candidate)
        retryReason = failureReason([...validationErrors, ...metrics], null)
        lastFailureClass = 'validation'
        failureTrace.push(`validation:${validationErrors.join(',')}[${metrics.join(',')}]`)
        if (attempt < maxAttempts && isTextLengthOnlyFailure(validationErrors)) {
          repairCandidate = candidate
          repairValidationErrors = [...validationErrors]
          continue
        }

        repairCandidate = null
        repairValidationErrors = []
        // At most two full generations are allowed. A third provider stage is
        // reserved exclusively for deterministic text-length repair, never for
        // another full rewrite of choices, state or canon.
        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) {
          continue
        }
        break
      }

      const ruleFlags = scanRuleBasedSafety(context, candidate)
      if (hasRuleViolation(ruleFlags)) {
        retryReason = failureReason([], ruleFailure(ruleFlags))
        lastFailureClass = 'deterministic-safety'
        const flags = Object.entries(ruleFlags).filter(([, value]) => value).map(([key]) => key)
        failureTrace.push(`deterministic-safety:${flags.join(',') || 'flagged'}`)
        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) continue
        break
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
        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) continue
        break
      }

      const episode = buildFinalEpisode(context, candidate, safety)
      return json(
        { episode: { ...episode, generationSource: 'openai-structured' } },
        200,
        origin,
        {
          ...providerMetadata(),
          'X-QISSA-Generation-Source': 'openai-structured',
          'X-QISSA-Generation-Attempts': String(attempt),
          'X-QISSA-Full-Generation-Attempts': String(fullGenerationAttempts),
          'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none',
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
      'X-QISSA-Full-Generation-Attempts': String(fullGenerationAttempts),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': failureTrace.join('>').slice(0, 480),
      'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none',
    },
  )
})
