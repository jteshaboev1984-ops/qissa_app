import {
  buildFinalEpisode,
  isRecord,
  normalizeStoryRequest,
  type SafetyResult,
  type StoryCandidate,
} from './contracts.ts'
import { buildSafeFallback } from './fallback.ts'
import { evaluateStorySafety, generateStoryCandidate, moderateStoryText } from './openai.ts'
import { combineSafety, scanRuleBasedSafety, validateCandidate } from './safety.ts'

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
const aiEnabled = Deno.env.get('QISSA_AI_ENABLED') === 'true'
const storyModel = Deno.env.get('OPENAI_STORY_MODEL')?.trim() || 'gpt-5.5'
const safetyModel = Deno.env.get('OPENAI_SAFETY_MODEL')?.trim() || storyModel
const maxAttempts = 2

const hasValidPrivacyConsent = (input: unknown): boolean => {
  if (!isRecord(input) || !isRecord(input.privacyConsent)) return false
  const consent = input.privacyConsent
  return consent.version === PRIVACY_CONSENT_VERSION &&
    consent.parentOrGuardianConfirmed === true &&
    consent.aiProcessingAccepted === true &&
    typeof consent.acceptedAt === 'string' &&
    Number.isFinite(Date.parse(consent.acceptedAt))
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

const failureReason = (errors: string[], safety: SafetyResult | null) => {
  const parts = [...errors]
  if (safety && !safety.approved) {
    const flags = Object.entries(safety.flags).filter(([, value]) => value).map(([key]) => key)
    if (flags.length > 0) parts.push(`safety:${flags.join(',')}`)
  }
  return parts.join(';').slice(0, 600)
}

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

  if (aiEnabled && openAiApiKey && !hasValidPrivacyConsent(input)) {
    return json({ error: 'privacy_consent_required' }, 403, origin)
  }

  if (!aiEnabled || !openAiApiKey) {
    return json(
      { episode: buildSafeFallback(context) },
      200,
      origin,
      {
        'X-QISSA-Generation-Source': 'safe-fallback',
        'X-QISSA-Fallback-Reason': !aiEnabled ? 'ai-disabled' : 'api-key-missing',
      },
    )
  }

  let retryReason = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)
      const validationErrors = validateCandidate(context, candidate)
      if (validationErrors.length > 0) {
        retryReason = failureReason(validationErrors, null)
        continue
      }

      const ruleFlags = scanRuleBasedSafety(context, candidate)
      const [evaluation, moderation] = await Promise.all([
        evaluateStorySafety(openAiApiKey, safetyModel, context, candidate),
        moderateStoryText(openAiApiKey, candidateTextForModeration(candidate)),
      ])
      const safety = combineSafety(ruleFlags, evaluation, moderation)

      if (!safety.approved) {
        retryReason = failureReason([], safety)
        continue
      }

      const episode = buildFinalEpisode(context, candidate, safety)
      return json(
        { episode },
        200,
        origin,
        {
          'X-QISSA-Generation-Source': 'openai-structured',
          'X-QISSA-Generation-Attempts': String(attempt),
        },
      )
    } catch (error) {
      console.error('QISSA story generation attempt failed', {
        attempt,
        reason: error instanceof Error ? error.message : 'unknown_error',
      })
      retryReason = error instanceof Error ? error.message.slice(0, 300) : 'provider_error'
    }
  }

  return json(
    { episode: buildSafeFallback(context) },
    200,
    origin,
    {
      'X-QISSA-Generation-Source': 'safe-fallback',
      'X-QISSA-Fallback-Reason': 'generation-or-safety-failed',
    },
  )
})
