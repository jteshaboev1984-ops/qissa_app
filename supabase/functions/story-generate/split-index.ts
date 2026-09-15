import {
  buildFinalEpisode,
  isRecord,
  normalizeStoryRequest,
  type SafetyFlags,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import { buildSafeFallback } from './fallback.ts'
import { evaluateStorySafety, moderateStoryText, repairStoryCandidateTextLengths } from './openai.ts'
import { combineSafety, scanRuleBasedSafety, validateCandidate } from './safety.ts'
import { generateStoryBlueprint, generateStoryNarration } from './split-openai.ts'
import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'
import { claimStoryGeneration, isInstallationId, readStoryAiRuntimeState, type GenerationClaim } from './usage.ts'

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true
const legacyStoryModel = Deno.env.get('OPENAI_STORY_MODEL')?.trim() || ''
const architectModel = Deno.env.get('OPENAI_ARCHITECT_MODEL')?.trim() || legacyStoryModel || 'gpt-5.6-luna'
const narratorModel = Deno.env.get('OPENAI_NARRATOR_MODEL')?.trim() || legacyStoryModel || 'gpt-5.6-luna'
const escalationModel = Deno.env.get('OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || ''
const safetyModel = Deno.env.get('OPENAI_SAFETY_MODEL')?.trim() || narratorModel

const providerMetadata = (): Record<string, string> => ({
  'X-QISSA-Story-Pipeline': 'split-v1',
  'X-QISSA-Architect-Model': architectModel,
  'X-QISSA-Narrator-Model': narratorModel,
  'X-QISSA-Escalation-Model': escalationModel || 'disabled',
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

const compactFailureTrace = (items: string[]): string => items.join('>').slice(0, 480)

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

  if (!STORY_AI_PRODUCTION_ROLLOUT_ENABLED || !openAiApiKey) {
    return safeFallback(context, origin, !openAiApiKey ? 'api-key-missing' : 'ai-disabled', providerMetadata())
  }

  const runtimeState = await readStoryAiRuntimeState()
  const runtimeMetadata = { 'X-QISSA-Runtime-AI': runtimeState.enabled ? 'enabled' : runtimeState.reason }
  const runtimeProviderMetadata = { ...providerMetadata(), ...runtimeMetadata }
  if (!runtimeState.enabled) {
    return safeFallback(context, origin, runtimeState.reason, runtimeProviderMetadata)
  }

  if (!hasValidPrivacyConsent(input)) {
    return json({ error: 'privacy_consent_required' }, 403, origin, runtimeProviderMetadata)
  }

  const installationId = installationIdFromInput(input)
  if (!installationId) {
    return safeFallback(context, origin, 'rate-limit-identity-missing', runtimeProviderMetadata)
  }

  const claim = await claimStoryGeneration(installationId)
  if (!claim.allowed) {
    return safeFallback(context, origin, claim.reason, {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
    })
  }

  const trace: string[] = []
  let blueprint: StoryBlueprint
  let blueprintKeysNormalized = 0
  let candidate: StoryCandidate | null = null
  let narratorModelUsed = narratorModel
  let repairUsed = false
  let narratorRetryUsed = false
  let escalationUsed = false
  let providerCalls = 0
  let initialStoryWords = 0
  let lastFailureClass = 'unknown'

  try {
    providerCalls += 1
    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context)
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
    lastFailureClass = providerFailureClass(reason)
    trace.push(`architect:${lastFailureClass}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
    })
  }

  blueprint = enforceStoryBlueprintContextContract(context, blueprint)
  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)
  blueprint = normalizedBlueprint.blueprint
  blueprintKeysNormalized = normalizedBlueprint.normalizedCount
  const blueprintErrors = validateStoryBlueprint(context, blueprint)
  if (blueprintErrors.length > 0) {
    lastFailureClass = 'blueprint-validation'
    trace.push(`blueprint-validation:${blueprintErrors.join(',')}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  try {
    providerCalls += 1
    const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint)
    candidate = narrationToCandidate(context, blueprint, narration)
    initialStoryWords = wordCount(candidate.story_text)
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
    lastFailureClass = providerFailureClass(reason)
    trace.push(`narrator:${lastFailureClass}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  let validationErrors = validateCandidate(context, candidate)
  if (validationErrors.length > 0) {
    trace.push(`narrator-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
  }

  // One prose-only Luna retry is safe because the immutable Architect blueprint owns all canon,
  // branch consequences and choices. This retry cannot mutate state; it only rewrites narration.
  if (validationErrors.length > 0 && !isTextLengthOnlyFailure(validationErrors)) {
    try {
      providerCalls += 1
      narratorRetryUsed = true
      const retryFeedback = [
        `Previous narration failed deterministic validation: ${validationErrors.join(', ')}.`,
        `Observed metrics: ${candidateValidationMetrics(candidate).join(', ')}.`,
        'Keep the immutable blueprint exactly unchanged.',
        'Correct every listed narration failure in one pass. If story_too_short is present, add meaningful action/dialogue/reaction inside existing blueprint beats until the hard minimum is safely exceeded.',
        'For russian_hero_requires_rewrite, keep {{HERO}} only as nominative subject or direct address and rewrite every case/preposition or gendered-past-tense construction around the token.',
        'For visible_safety_language, remove any child-visible explanation that a choice, option or possibility is safe, good, calm, correct or morally preferred; show the story consequences without evaluating the menu.',
        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',
        'For story_repeats_choice_menu, end story_text with one neutral decision cue or question and remove every listing or paraphrase of the two structured choice actions from story_text.',
        'For technical_preview_language, rewrite the preview as one natural child-facing in-world sentence. Do not mention confirmation, selection mechanics, episodes, segments, pipelines, or story branches.',
        'For story_choice_menu_scaffolding, remove explicit alternative scaffolding such as “можно... а можно...” from story_text; end with only a neutral decision cue.',
        'For branching_preview_language, make the preview branch-neutral and true after either choice. Do not mention both alternatives or join possible outcomes with or/yoki/немесе.',
      ].join(' ')
      const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, retryFeedback)
      candidate = narrationToCandidate(context, blueprint, narration)
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        trace.push(`narrator-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`narrator-retry:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Narrator-Retry-Used': 'true',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }

  if (validationErrors.length > 0 && isTextLengthOnlyFailure(validationErrors)) {
    try {
      providerCalls += 1
      candidate = await repairStoryCandidateTextLengths(
        openAiApiKey,
        narratorModel,
        context,
        candidate,
        validationErrors,
      )
      repairUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`repair-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`repair:${lastFailureClass}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': 'text-length',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      })
    }
  }

  if (validationErrors.length > 0 && escalationModel && escalationModel !== narratorModel) {
    try {
      providerCalls += 1
      narratorModelUsed = escalationModel
      const retryFeedback = `Luna narration still failed deterministic validation after bounded correction: ${validationErrors.join(', ')}. Keep the immutable blueprint exactly unchanged and correct only the narration.`
      const narration = await generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback)
      candidate = narrationToCandidate(context, blueprint, narration)
      escalationUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`escalation-validation:${validationErrors.join(',')}[${candidateValidationMetrics(candidate).join(',')}]`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      lastFailureClass = providerFailureClass(reason)
      trace.push(`escalation:${lastFailureClass}`)
    }
  }

  if (validationErrors.length > 0) lastFailureClass = lastFailureClass === 'unknown' ? 'validation' : lastFailureClass

  if (validationErrors.length > 0 || !candidate) {
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass || 'validation',
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  const ruleFlags = scanRuleBasedSafety(context, candidate)
  if (hasRuleViolation(ruleFlags)) {
    lastFailureClass = 'deterministic-safety'
    const flags = Object.entries(ruleFlags).filter(([, value]) => value).map(([key]) => key)
    trace.push(`deterministic-safety:${flags.join(',') || 'flagged'}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-Provider-Calls': String(providerCalls),
    })
  }

  try {
    providerCalls += 1
    const [evaluation, moderation] = await Promise.all([
      evaluateStorySafety(openAiApiKey, safetyModel, context, candidate),
      moderateStoryText(openAiApiKey, candidateTextForModeration(candidate)),
    ])
    const safety = combineSafety(ruleFlags, evaluation, moderation)
    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-Provider-Calls': String(providerCalls),
      })
    }

    const episode = buildFinalEpisode(context, candidate, safety)
    return json(
      { episode: { ...episode, generationSource: 'openai-structured' } },
      200,
      origin,
      {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Source': 'openai-structured',
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Initial-Story-Words': String(initialStoryWords),
        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      },
    )
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
    lastFailureClass = providerFailureClass(reason)
    trace.push(`safety:${lastFailureClass}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-Provider-Calls': String(providerCalls),
    })
  }
})
