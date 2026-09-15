import type { SafetyEvaluation, StoryCandidate } from './contracts.ts'
import { buildSafetyPrompts, buildStoryPrompts, buildTextLengthRepairPrompts, safetyOutputSchema, storyOutputSchema, textLengthRepairOutputSchema } from './prompt.ts'
import type { NormalizedStoryContext } from './contracts.ts'
import { storyLocalizationSystem } from './localization.ts'
import { safetyEvaluationConsistencyErrors } from './safety-verdict.ts'

const RESPONSES_URL = 'https://api.openai.com/v1/responses'
const MODERATIONS_URL = 'https://api.openai.com/v1/moderations'

type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

const extractOutputText = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') throw new Error('openai_invalid_response')
  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) throw new Error('openai_missing_output')

  for (const item of output) {
    if (!item || typeof item !== 'object' || (item as { type?: unknown }).type !== 'message') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'output_text' &&
        typeof (part as { text?: unknown }).text === 'string'
      ) return (part as { text: string }).text
    }
  }
  throw new Error('openai_missing_output_text')
}

const postJson = async (
  url: string,
  apiKey: string,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      const details = (await response.text()).trim().slice(0, 300)
      throw new Error(`openai_http_${response.status}${details ? `:${details}` : ''}`)
    }
    return response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('openai_timeout')
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const requestStructured = async <T>(
  apiKey: string,
  model: string,
  schemaName: string,
  schema: unknown,
  system: string,
  user: string,
  timeoutMs: number,
  maxOutputTokens: number,
  reasoningEffort: ReasoningEffort,
): Promise<T> => {
  const payload = await postJson(RESPONSES_URL, apiKey, {
    model,
    store: false,
    reasoning: { effort: reasoningEffort },
    max_output_tokens: maxOutputTokens,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema,
      },
    },
  }, timeoutMs)

  const status = payload && typeof payload === 'object' ? (payload as { status?: unknown }).status : null
  if (status === 'failed') {
    const details = payload && typeof payload === 'object'
      ? (payload as { error?: { message?: unknown }; status_details?: { failed?: { error?: { message?: unknown } } } })
      : null
    const message = typeof details?.error?.message === 'string'
      ? details.error.message
      : typeof details?.status_details?.failed?.error?.message === 'string'
        ? details.status_details.failed.error.message
        : 'unknown_failed_status'
    throw new Error(`openai_response_failed:${message.slice(0, 240)}`)
  }
  if (status === 'incomplete') throw new Error('openai_incomplete_response')
  return JSON.parse(extractOutputText(payload)) as T
}

export const generateStoryCandidate = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  retryReason: string,
): Promise<StoryCandidate> => {
  const prompts = buildStoryPrompts(context, retryReason)
  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)}`
  return requestStructured<StoryCandidate>(
    apiKey,
    model,
    'qissa_story_candidate',
    storyOutputSchema,
    localizedSystem,
    prompts.user,
    30_000,
    4000,
    'none',
  )
}


type TextLengthRepair = {
  story_rewrite: string | null
  story_expansion: string | null
  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>
}

const repairWordCount = (text: string): number => text.trim().split(/\s+/u).filter(Boolean).length

const insertStoryExpansionBeforeFinalParagraph = (storyText: string, expansion: string): string => {
  const paragraphs = storyText.trim().split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean)
  if (paragraphs.length < 2) throw new Error('openai_text_repair_story_structure')
  return [...paragraphs.slice(0, -1), expansion.trim(), paragraphs[paragraphs.length - 1]].join('\n\n')
}

const needsChoiceResolutionRepair = (context: NormalizedStoryContext, resolutionText: string): boolean => {
  if (!(context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime' && context.episodeIndex === 1)) {
    return false
  }
  const words = repairWordCount(resolutionText)
  return resolutionText.length > 360 || words < 25 || words > 60
}

export const repairStoryCandidateTextLengths = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
): Promise<StoryCandidate> => {
  const prompts = buildTextLengthRepairPrompts(context, candidate, validationErrors)
  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)}`
  const repair = await requestStructured<TextLengthRepair>(
    apiKey,
    model,
    'qissa_text_length_repair',
    textLengthRepairOutputSchema,
    localizedSystem,
    prompts.user,
    30_000,
    3000,
    'none',
  )

  const storyTooShort = validationErrors.includes('story_too_short')
  const storyTooLong = validationErrors.includes('story_too_long')
  if (storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {
    throw new Error('openai_invalid_text_repair_expansion')
  }
  if (storyTooLong && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {
    throw new Error('openai_invalid_text_repair_rewrite')
  }
  if (!storyTooShort && !storyTooLong && (repair.story_rewrite !== null || repair.story_expansion !== null)) {
    throw new Error('openai_unexpected_text_repair_story')
  }

  const targetChoiceIds = new Set(
    candidate.choices
      .filter((choice) => needsChoiceResolutionRepair(context, choice.resolution_text))
      .map((choice) => choice.choice_id),
  )
  const repairedByChoiceId = new Map<string, string>()
  for (const item of repair.choice_resolutions) {
    if (!targetChoiceIds.has(item.choice_id) || repairedByChoiceId.has(item.choice_id) || !item.resolution_text.trim()) {
      throw new Error('openai_invalid_text_repair_choice')
    }
    repairedByChoiceId.set(item.choice_id, item.resolution_text)
  }
  if (repairedByChoiceId.size !== targetChoiceIds.size) throw new Error('openai_incomplete_text_repair_choices')

  return {
    ...candidate,
    story_text: storyTooShort
      ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)
      : storyTooLong
        ? (repair.story_rewrite as string)
        : candidate.story_text,
    choices: candidate.choices.map((choice) => targetChoiceIds.has(choice.choice_id)
      ? { ...choice, resolution_text: repairedByChoiceId.get(choice.choice_id) as string }
      : choice),
  }
}

const safetyVerdictContract = [
  'The safety flags are exhaustive for this classifier and the structured verdict must be internally consistent.',
  'If every flag is false, approved MUST be true, risk_level MUST be low, and required_action MUST be publish.',
  'If any flag is true, approved MUST be false and required_action MUST NOT be publish.',
  'Never return regenerate, fallback, or block merely because the story contains an ordinary gentle challenge, uncertainty, choice, or bedtime mystery that does not trigger a named flag.',
].join(' ')

const safetySessionContract = (context: NormalizedStoryContext): string => {
  if (context.storyMood === 'bedtime' && context.storyMode === 'series' && context.episodeIndex === 1) {
    return [
      'This is technical Episode 1 of one continuous bedtime session, not the end of the bedtime story.',
      'The story_text intentionally stops at the explicit child decision point. Each choices[].resolution_text is the immediate spoken bridge that follows if that choice is selected, and Episode 2 continues after that bridge.',
      'Evaluate bedtime closure by considering story_text together with EACH available resolution_text branch.',
      'Do NOT set bedtime_overstimulation merely because story_text pauses for the child choice, because Episode 2 continues the same story, or because nextEpisodePreview gently signals continuation.',
      'Set bedtime_overstimulation when the material is genuinely over-activating for bedtime, contains an alarming/startling cliffhanger, or leaves material fear/tension unresolved even after an available immediate resolution branch.',
      'A gentle curiosity loop, quiet mystery, ordinary uncertainty, or calm decision point is acceptable when every immediate branch lowers or safely carries the tension forward.',
    ].join(' ')
  }
  if (context.storyMood === 'bedtime' && context.storyMode === 'series' && context.episodeIndex === 2) {
    return 'This is the closing technical episode of the bedtime session. Judge the final story ending strictly for calm resolution; material unresolved fear or an alarming cliffhanger may trigger bedtime_overstimulation.'
  }
  return ''
}

const requestSafetyEvaluation = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidateJson: string,
  retryFeedback = '',
  timeoutMs = 12_000,
): Promise<SafetyEvaluation> => {
  const prompts = buildSafetyPrompts(context, candidateJson)
  const retryInstruction = retryFeedback
    ? ` Previous structured verdict was rejected as internally inconsistent: ${retryFeedback}. Re-evaluate the exact same story from scratch and obey the verdict consistency contract.`
    : ''
  return requestStructured<SafetyEvaluation>(
    apiKey,
    model,
    'qissa_safety_evaluation',
    safetyOutputSchema,
    `${prompts.system} ${safetyVerdictContract} ${safetySessionContract(context)}${retryInstruction}`,
    prompts.user,
    timeoutMs,
    700,
    'none',
  )
}

export const evaluateStorySafety = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
): Promise<SafetyEvaluation> => {
  const candidateJson = JSON.stringify(candidate)
  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
  const firstErrors = safetyEvaluationConsistencyErrors(first)
  if (firstErrors.length === 0) return first

  // This is a classifier-only correction, not a new story generation. Keep it
  // shorter than the primary safety window so even the worst bounded Story path
  // remains inside the 130s browser timeout and the hosted Edge Function ceiling.
  const second = await requestSafetyEvaluation(
    apiKey,
    model,
    context,
    candidateJson,
    firstErrors.join(','),
    8_000,
  )
  const secondErrors = safetyEvaluationConsistencyErrors(second)
  if (secondErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
  return second
}

export type ModerationResult = {
  flagged: boolean
  categories: Record<string, boolean>
}

export const moderateStoryText = async (apiKey: string, text: string): Promise<ModerationResult> => {
  const payload = await postJson(MODERATIONS_URL, apiKey, {
    model: 'omni-moderation-latest',
    input: text,
  }, 7_000)

  const results = payload && typeof payload === 'object' ? (payload as { results?: unknown }).results : null
  const first = Array.isArray(results) ? results[0] : null
  if (!first || typeof first !== 'object') throw new Error('moderation_invalid_response')
  const categoriesRaw = (first as { categories?: unknown }).categories
  const categories: Record<string, boolean> = {}
  if (categoriesRaw && typeof categoriesRaw === 'object') {
    for (const [key, value] of Object.entries(categoriesRaw)) categories[key] = value === true
  }
  return { flagged: (first as { flagged?: unknown }).flagged === true, categories }
}
