import {
  buildFinalEpisode,
  isRecord,
  normalizeStoryRequest,
  type SafetyFlags,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import { buildSafeFallback } from './fallback.ts'
import { adjudicateStoryFear, evaluateStorySafety, moderateStoryText, repairStoryCandidateTextLengths } from './openai.ts'
import { clearAdjudicatedNonSevereViolence, combineSafety, moderationNeedsFearAdjudication, scanRuleBasedSafety, validateCandidate } from './safety.ts'
import { candidateLanguageMismatchFieldCodes } from './language-diagnostics.ts'
import { locateHumiliationEvidence } from './humiliation-evidence.ts'
import { generateStoryBlueprint, generateStoryNarration } from './split-openai.ts'
import { hasSafetyBudget, stageTimeoutMs, STORY_REQUEST_BUDGET_MS, STORY_SAFETY_RESERVE_MS } from './latency-budget.ts'
import { blueprintRuleSafetyCategories, enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintHeroReferences, normalizeStoryBlueprintMemoryKeys, repairBlueprintDecisionPoint, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'
import { childVisibleStorySafetyText } from './story-safety-projection.ts'
import { isTextRepairCorrectionEligible, isTextRepairEligibleFailure } from './repair-routing.ts'
import { claimStoryGeneration, isInstallationId, readStoryAiRuntimeState, type GenerationClaim } from './usage.ts'
import { SYNTHETIC_DIAGNOSTIC_HEADER, claimSyntheticDiagnostic, newSyntheticCapture, persistSyntheticCapture, recordSyntheticStage, type SyntheticCapture } from './synthetic-diagnostics.ts'

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

const repairContractFailureCodes = new Set([
  'openai_text_repair_story_structure',
  'openai_invalid_full_text_repair_rewrite',
  'openai_invalid_text_repair_expansion',
  'openai_invalid_text_repair_vocabulary',
  'openai_invalid_text_repair_choice',
  'openai_incomplete_text_repair_choices',
])

const repairContractFailureDetail = (reason: string): string | null =>
  repairContractFailureCodes.has(reason) ? reason.replace(/^openai_/u, '') : null

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

const candidateTextForModeration = (candidate: StoryCandidate) => childVisibleStorySafetyText(candidate)

const wordCount = (text: string): number => text.trim().split(/\s+/u).filter(Boolean).length

const candidateValidationMetrics = (
  context: NonNullable<ReturnType<typeof normalizeStoryRequest>>,
  candidate: StoryCandidate,
): string[] => {
  const languageFields = candidateLanguageMismatchFieldCodes(context, candidate)
  return [
    `story_words=${wordCount(candidate.story_text)}`,
    ...candidate.choices.map((choice, index) => `choice_${index + 1}_resolution_words=${wordCount(choice.resolution_text)}`),
    ...(languageFields.length > 0 ? [`language_fields=${languageFields.join('+')}`] : []),
  ]
}

const compactFailureTrace = (items: string[]): string => items.join('>').slice(0, 480)

const handleStoryRequest = async (request: Request, diagnostic: SyntheticCapture): Promise<Response> => {
  const requestStartedAt = Date.now()
  const deadlineAt = requestStartedAt + STORY_REQUEST_BUDGET_MS
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

  // A diagnostic request is operator-armed, strictly synthetic and single-use.
  // Reject it BEFORE accounting/provider calls if authorization or schema fails.
  if (request.headers.has(SYNTHETIC_DIAGNOSTIC_HEADER)) {
    if (!await claimSyntheticDiagnostic(request, context, input, installationId, diagnostic)) {
      return json({ error: 'synthetic_diagnostic_not_authorized' }, 403, origin, runtimeProviderMetadata)
    }
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
  let blueprintDecisionPointRepaired = false
  let candidate: StoryCandidate | null = null
  let narratorModelUsed = narratorModel
  let repairUsed = false
  let repairRetryUsed = false
  let narratorRetryUsed = false
  let escalationUsed = false
  let providerCalls = 0
  // Request-local observer: one increment immediately before each actual OpenAI HTTP fetch.
  const onRequestAttempt = () => { providerCalls += 1 }
  let initialStoryWords = 0
  let lastFailureClass = 'unknown'
  let architectElapsedMs = 0
  // Full Narrator plus worst mandatory safety path must remain possible after Architect.
  const architectTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, 30_000 + STORY_SAFETY_RESERVE_MS)
  const budgetFallback = (stage: string): Response => {
    lastFailureClass = 'time-budget'
    trace.push(`${stage}:time-budget`)
    return safeFallback(context, origin, 'generation-time-budget', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),
      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs ?? 0),
      'X-QISSA-Blueprint-Decision-Repair': blueprintDecisionPointRepaired ? 'template' : 'none',
    })
  }
  if (architectTimeoutMs === null) return budgetFallback('architect')
  const architectCallStartedAt = Date.now()

  try {
    blueprint = await generateStoryBlueprint(openAiApiKey, architectModel, context, architectTimeoutMs, onRequestAttempt)
    recordSyntheticStage(diagnostic, 'architect_raw', blueprint)
  } catch (error) {
    architectElapsedMs = Date.now() - architectCallStartedAt
    const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
    lastFailureClass = providerFailureClass(reason)
    trace.push(`architect:${lastFailureClass}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),
      'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),
    })
  }
  architectElapsedMs = Date.now() - architectCallStartedAt

  blueprint = enforceStoryBlueprintContextContract(context, blueprint)
  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)
  blueprint = normalizedBlueprint.blueprint
  blueprintKeysNormalized = normalizedBlueprint.normalizedCount
  blueprint = normalizeStoryBlueprintHeroReferences(blueprint).blueprint
  let blueprintErrors = validateStoryBlueprint(context, blueprint)
  if (blueprintErrors.length > 0) {
    const decisionRepair = repairBlueprintDecisionPoint(context, blueprint, blueprintErrors)
    if (decisionRepair.repaired) {
      blueprint = decisionRepair.blueprint
      blueprintDecisionPointRepaired = true
      trace.push('blueprint-repair:decision-point-template')
      blueprintErrors = validateStoryBlueprint(context, blueprint)
    }
  }
  recordSyntheticStage(diagnostic, 'architect_validation', { blueprint, errors: blueprintErrors })
  if (blueprintErrors.length > 0) {
    lastFailureClass = 'blueprint-validation'
    trace.push(`blueprint-validation:${blueprintErrors.join(',')}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      ...(blueprintErrors.includes('blueprint_rule_safety') ? {
        'X-QISSA-Blueprint-Safety-Categories': blueprintRuleSafetyCategories(context, blueprint).join(','),
      } : {}),
    })
  }

  const narrationTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)
  if (narrationTimeoutMs === null) return budgetFallback('narrator')
  try {
    const narration = await generateStoryNarration(openAiApiKey, narratorModel, context, blueprint, '', narrationTimeoutMs, onRequestAttempt)
    candidate = narrationToCandidate(context, blueprint, narration)
    recordSyntheticStage(diagnostic, 'narrator_initial', candidate)
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
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  const initialRuleFlags = scanRuleBasedSafety(context, candidate)
  if (hasRuleViolation(initialRuleFlags)) {
    lastFailureClass = 'deterministic-safety'
    const flags = Object.entries(initialRuleFlags).filter(([, value]) => value).map(([key]) => key)
    trace.push(`deterministic-safety-pre-repair:${flags.join(',') || 'flagged'}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Generation-Repair': 'none',
      'X-QISSA-Narrator-Retry-Used': 'false',
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  let validationErrors = validateCandidate(context, candidate)
  recordSyntheticStage(diagnostic, 'narrator_validation', { errors: validationErrors })
  if (validationErrors.length > 0) {
    trace.push(`narrator-validation:${validationErrors.join(',')}[${candidateValidationMetrics(context, candidate).join(',')}]`)
  }

  // v74: every known Narrator-owned deterministic defect goes straight to the bounded repair agent.
  // Architect/schema-owned defects cannot be corrected by another prose generation, so fail closed without paying for a futile retry.
  if (validationErrors.length > 0 && !isTextRepairEligibleFailure(validationErrors)) {
    lastFailureClass = 'validation'
    trace.push(`nonrepairable-validation:${validationErrors.join(',')}`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Generation-Repair': 'none',
      'X-QISSA-Repair-Retry-Used': 'false',
      'X-QISSA-Narrator-Retry-Used': 'false',
      'X-QISSA-Escalation-Used': 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }

  if (validationErrors.length > 0 && isTextRepairEligibleFailure(validationErrors)) {
    const repairBaseCandidate = candidate
    const repairBaseErrors = [...validationErrors]
    const repairTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)
    if (repairTimeoutMs === null) return budgetFallback('repair')
    try {
      candidate = await repairStoryCandidateTextLengths(
        openAiApiKey,
        narratorModel,
        context,
        repairBaseCandidate,
        repairBaseErrors,
        '',
        repairTimeoutMs,
        onRequestAttempt,
      )
      repairUsed = true
      recordSyntheticStage(diagnostic, 'repair_first', candidate)
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`repair-validation:${validationErrors.join(',')}[${candidateValidationMetrics(context, candidate).join(',')}]`)
      }

      const repairRetryTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)
      if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors) && repairRetryTimeoutMs !== null) {
        repairRetryUsed = true
        const repairRetryFeedback = [
          `Previous text repair failed deterministic validation: ${validationErrors.join(', ')}.`,
          `Rejected repair metrics: ${candidateValidationMetrics(context, candidate).join(', ')}.`,
          'Rebuild the repair from the ORIGINAL immutable candidate, not from the rejected repaired text.',
          'Keep every existing plot beat, character identity, choice, state patch and branch consequence unchanged.',
          context.language === 'uz'
            ? 'Use natural Uzbek Latin script in all newly written prose. Do not emit Cyrillic characters unless they are part of an already-established recurring-character name supplied by memory. For ages 5-7 keep wording concrete and everyday; avoid ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simpler phrase exists.'
            : 'Use only the requested story language in newly written prose, apart from immutable established recurring-character names.',
          'If missing_hero_token is listed, include literal {{HERO}} naturally in final story_text.',
          'If a future-session/reset error is listed, keep the repaired action in the current bedtime evening; tomorrow_seed is not Episode 2 material.',
        ].join(' ')
        candidate = await repairStoryCandidateTextLengths(
          openAiApiKey,
          narratorModel,
          context,
          repairBaseCandidate,
          repairBaseErrors,
          repairRetryFeedback,
          repairRetryTimeoutMs,
          onRequestAttempt,
        )
        recordSyntheticStage(diagnostic, 'repair_retry', candidate)
        validationErrors = validateCandidate(context, candidate)
        if (validationErrors.length > 0) {
          lastFailureClass = 'validation'
          trace.push(`repair-retry-validation:${validationErrors.join(',')}[${candidateValidationMetrics(context, candidate).join(',')}]`)
        }
      } else if (validationErrors.length > 0 && isTextRepairCorrectionEligible(validationErrors)) {
        trace.push('repair-retry:skipped-time-budget')
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'
      const repairContractDetail = repairContractFailureDetail(reason)
      lastFailureClass = repairContractDetail ? 'repair-contract' : providerFailureClass(reason)
      trace.push(`${repairRetryUsed ? 'repair-retry' : 'repair'}:${lastFailureClass}${repairContractDetail ? `:${repairContractDetail}` : ''}`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': 'text-length',
        'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
        'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
        'X-QISSA-Blueprint-Decision-Repair': blueprintDecisionPointRepaired ? 'template' : 'none',
      })
    }
  }

  const escalationTimeoutMs = stageTimeoutMs(deadlineAt, Date.now(), 30_000, STORY_SAFETY_RESERVE_MS)
  if (validationErrors.length > 0 && escalationModel && escalationModel !== narratorModel && escalationTimeoutMs !== null) {
    try {
      narratorModelUsed = escalationModel
      const retryFeedback = `Luna narration still failed deterministic validation after bounded correction: ${validationErrors.join(', ')}. Keep the immutable blueprint exactly unchanged and correct only the narration.`
      const narration = await generateStoryNarration(openAiApiKey, escalationModel, context, blueprint, retryFeedback, escalationTimeoutMs, onRequestAttempt)
      candidate = narrationToCandidate(context, blueprint, narration)
      recordSyntheticStage(diagnostic, 'escalation', candidate)
      escalationUsed = true
      validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        lastFailureClass = 'validation'
        trace.push(`escalation-validation:${validationErrors.join(',')}[${candidateValidationMetrics(context, candidate).join(',')}]`)
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
      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
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
      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
    })
  }

  if (!hasSafetyBudget(deadlineAt, Date.now())) return budgetFallback('safety')
  try {
    // Both requests already started. Await BOTH so nested safety corrections are counted
    // before returning even if moderation rejects earlier. Verdicts still fail closed.
    const [evaluationOutcome, moderationOutcome] = await Promise.allSettled([
      evaluateStorySafety(openAiApiKey, safetyModel, context, candidate, onRequestAttempt),
      moderateStoryText(openAiApiKey, candidateTextForModeration(candidate), onRequestAttempt),
    ])
    if (evaluationOutcome.status === 'rejected') throw evaluationOutcome.reason
    if (moderationOutcome.status === 'rejected') throw moderationOutcome.reason
    const evaluation = evaluationOutcome.value
    const moderation = moderationOutcome.value
    let moderationForSafety = moderation
    let moderationFearDetail = ''
    if (moderationNeedsFearAdjudication(context, ruleFlags, evaluation, moderation)) {
      const adjudication = await adjudicateStoryFear(openAiApiKey, safetyModel, candidate, onRequestAttempt)
      moderationFearDetail = `moderation_fear_adjudication:${adjudication.category}`
      if (!adjudication.excessive_fear) {
        moderationForSafety = clearAdjudicatedNonSevereViolence(moderation)
      }
    }
    const safety = combineSafety(ruleFlags, evaluation, moderationForSafety)
    const humiliationEvidenceField = locateHumiliationEvidence(candidate, evaluation)
    recordSyntheticStage(diagnostic, 'semantic_verdict', {
      evaluation, moderation, combined: safety, rule_flags: ruleFlags,
      humiliation_evidence_field: humiliationEvidenceField,
    })
    if (!safety.approved) {
      lastFailureClass = 'semantic-safety'
      const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
      const evaluationFlags = Object.entries(evaluation.flags).filter(([, value]) => value).map(([key]) => key)
      const moderationCategories = Object.entries(moderation.categories)
        .filter(([, value]) => value)
        .map(([key]) => key.replace(/[^a-z0-9_-]/giu, '_').slice(0, 48))
        .slice(0, 6)
      const fearDetail = evaluation.notes.find((note) => /^fear_adjudication:[a-z_]+$/u.test(note)) ?? moderationFearDetail
      const sourceDetail = [
        evaluationFlags.length > 0 ? `eval=${evaluationFlags.join(',')}` : 'eval=clear',
        moderation.flagged || moderationCategories.length > 0
          ? `mod=${moderationCategories.join(',') || 'flagged'}`
          : 'mod=clear',
      ].join(';')
      trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}[${sourceDetail}${evaluation.flags.humiliation ? `;humiliation_evidence=${humiliationEvidenceField}` : ''}]`)
      return safeFallback(context, origin, 'generation-or-safety-failed', {
        ...runtimeProviderMetadata,
        ...claimMetadata(claim),
        'X-QISSA-Generation-Failure-Class': lastFailureClass,
        'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Initial-Story-Words': String(initialStoryWords),
        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),
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
        'X-QISSA-Architect-Elapsed-Ms': String(architectElapsedMs),
        'X-QISSA-Architect-Timeout-Ms': String(architectTimeoutMs),
        'X-QISSA-Generation-Repair': repairUsed ? 'text-length' : 'none',
      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
        'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
        'X-QISSA-Narrator-Model-Used': narratorModelUsed,
        'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
        'X-QISSA-Initial-Story-Words': String(initialStoryWords),
        'X-QISSA-Final-Story-Words': String(wordCount(candidate.story_text)),
        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
        'X-QISSA-Blueprint-Decision-Repair': blueprintDecisionPointRepaired ? 'template' : 'none',
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
      'X-QISSA-Repair-Retry-Used': repairRetryUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Retry-Used': narratorRetryUsed ? 'true' : 'false',
      'X-QISSA-Escalation-Used': escalationUsed ? 'true' : 'false',
      'X-QISSA-Narrator-Model-Used': narratorModelUsed,
      'X-QISSA-OpenAI-Request-Attempts': String(providerCalls),
      'X-QISSA-Provider-Calls': String(providerCalls),
    })
  }
}

// Single per-request wrapper: persist a synthetic transcript at MOST ONCE, after
// the normal response has been determined. Never put transcript in HTTP or logs.
Deno.serve(async (request: Request) => {
  const diagnostic = newSyntheticCapture()
  const response = await handleStoryRequest(request, diagnostic)
  if (!diagnostic.captureId) return response
  const stored = await persistSyntheticCapture(diagnostic, response)
  const headers = new Headers(response.headers)
  headers.set('X-QISSA-Synthetic-Diagnostic', stored ? 'stored' : 'unavailable')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
})
