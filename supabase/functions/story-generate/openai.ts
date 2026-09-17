import type { CandidateVocabulary, SafetyEvaluation, StoryCandidate } from './contracts.ts'
import { buildSafetyPrompts, buildStoryPrompts, buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts, repairChoiceResolutionTargets, safetyOutputSchema, storyOutputSchema } from './prompt.ts'
import type { NormalizedStoryContext } from './contracts.ts'
import { storyLocalizationSystem } from './localization.ts'
import { safetyEvaluationConsistencyErrors } from './safety-verdict.ts'
import { fearAdjudicationConsistencyErrors, fearAdjudicationOutputSchema, type FearAdjudication } from './fear-adjudication.ts'
import { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from './story-safety-projection.ts'
import { textRepairRequiresFullStoryRewrite } from './repair-routing.ts'

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
  title_rewrite: string | null
  story_rewrite: string | null
  story_expansion: string | null
  choice_resolutions: { choice_1: string | null; choice_2: string | null }
  vocabulary_rewrite: CandidateVocabulary[]
}

const insertStoryExpansionBeforeFinalParagraph = (storyText: string, expansion: string): string => {
  const paragraphs = storyText.trim().split(/\n\s*\n/u).map((item) => item.trim()).filter(Boolean)
  if (paragraphs.length < 2) throw new Error('openai_text_repair_story_structure')
  return [...paragraphs.slice(0, -1), expansion.trim(), paragraphs[paragraphs.length - 1]].join('\n\n')
}

export const repairStoryCandidateTextLengths = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
  retryFeedback = '',
  timeoutMs = 30_000,
): Promise<StoryCandidate> => {
  const prompts = buildTextLengthRepairPrompts(context, candidate, validationErrors, retryFeedback)
  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)}`
  const repair = await requestStructured<TextLengthRepair>(
    apiKey,
    model,
    'qissa_text_length_repair',
    buildTextLengthRepairOutputSchema(context, validationErrors, candidate),
    localizedSystem,
    prompts.user,
    timeoutMs,
    3000,
    'none',
  )

  const storyTooShort = validationErrors.includes('story_too_short')
  const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors)
  if (fullStoryRewrite && (typeof repair.title_rewrite !== 'string' || !repair.title_rewrite.trim() || typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim())) {
    throw new Error('openai_invalid_full_text_repair_rewrite')
  }
  if (!fullStoryRewrite && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim())) {
    throw new Error('openai_invalid_text_repair_expansion')
  }
  if (fullStoryRewrite && context.language === 'ru' && (repair.vocabulary_rewrite.length < 2 || repair.vocabulary_rewrite.length > 3)) {
    throw new Error('openai_invalid_text_repair_vocabulary')
  }

  const targetChoiceIds = new Set(repairChoiceResolutionTargets(context, candidate, validationErrors))
  const slots = repair.choice_resolutions
  if (!slots || typeof slots !== 'object' || Array.isArray(slots) ||
    Object.keys(slots).sort().join(',') !== 'choice_1,choice_2') {
    throw new Error('openai_invalid_text_repair_choice_slots')
  }
  const repairedByChoiceId = new Map<string, string>()
  for (const [index, choice] of candidate.choices.entries()) {
    if (index >= 2) throw new Error('openai_invalid_text_repair_choice_slots')
    const text = index === 0 ? slots.choice_1 : slots.choice_2
    if (targetChoiceIds.has(choice.choice_id)) {
      if (typeof text !== 'string' || !text.trim()) throw new Error('openai_incomplete_text_repair_choices')
      repairedByChoiceId.set(choice.choice_id, text)
    } else if (text !== null) {
      throw new Error('openai_unexpected_text_repair_choice')
    }
  }
  if (candidate.choices.length < 2 && slots.choice_2 !== null) throw new Error('openai_unexpected_text_repair_choice')
  if (candidate.choices.length === 0 && slots.choice_1 !== null) throw new Error('openai_unexpected_text_repair_choice')
  if (repairedByChoiceId.size !== targetChoiceIds.size) throw new Error('openai_incomplete_text_repair_choices')

  return {
    ...candidate,
    title: fullStoryRewrite ? (repair.title_rewrite as string) : candidate.title,
    story_text: fullStoryRewrite
      ? (repair.story_rewrite as string)
      : storyTooShort
        ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)
        : candidate.story_text,
    vocabulary: fullStoryRewrite
      ? (context.language === 'ru' ? repair.vocabulary_rewrite : [])
      : candidate.vocabulary,
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
      'Do NOT set excessive_fear merely because the central low-stakes goal is not fully solved before the child chooses. excessive_fear is about frightening content intensity: sustained panic, threatening pursuit, abandonment, trapping, serious injury, frightening danger, or comparable age-inappropriate distress.',
      'Ordinary evening darkness, rain, a brief worry, a harmless mistake, a friendly character asking for help, or uncertainty among trusted companions is not excessive_fear by itself when no real threat is present.',
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
  additionalInstruction = '',
  timeoutMs = 12_000,
): Promise<SafetyEvaluation> => {
  const prompts = buildSafetyPrompts(context, candidateJson)
  const retryInstruction = additionalInstruction.trim()
    ? ` ${additionalInstruction.trim()}`
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

const requestFearAdjudication = async (
  apiKey: string,
  model: string,
  candidateJson: string,
): Promise<FearAdjudication> => requestStructured<FearAdjudication>(
  apiKey,
  model,
  'qissa_fear_adjudication',
  fearAdjudicationOutputSchema,
  [
    'You are the narrow child-bedtime fear adjudicator for QISSA.',
    'Classify ONLY whether the exact child-visible material contains excessive fear for age 5-7 bedtime.',
    'excessive_fear=true ONLY for sustained panic, threatening pursuit, abandonment or separation distress, trapping, serious injury, frightening danger, or comparable age-inappropriate distress that is actually present in the text.',
    'Ordinary evening darkness, forest sounds, sleep difficulty, yawning, a harmless mistake, brief worry, gentle uncertainty, a child choice boundary, an unfinished low-stakes goal, or a friendly character asking for help is none_or_mild by itself.',
    'If excessive fear is present, choose the matching severe category and copy one short exact excerpt from the supplied child-visible text into evidence. Do not paraphrase or invent evidence.',
    'If no severe category is directly supported, return excessive_fear=false, category=none_or_mild, evidence as an empty string.',
    'Do not classify any other safety issue here.',
  ].join(' '),
  candidateJson,
  8_000,
  260,
  'low',
)

export const adjudicateStoryFear = async (
  apiKey: string,
  model: string,
  candidate: StoryCandidate,
): Promise<FearAdjudication> => {
  const childVisibleText = childVisibleStorySafetyText(candidate)
  const adjudication = await requestFearAdjudication(
    apiKey,
    model,
    JSON.stringify(childVisibleStorySafetyProjection(candidate)),
  )
  const adjudicationErrors = fearAdjudicationConsistencyErrors(adjudication, childVisibleText)
  if (adjudicationErrors.length > 0) throw new Error('openai_fear_adjudication_inconsistent')
  return adjudication
}

const needsInteractiveFearConfirmation = (
  context: NormalizedStoryContext,
  evaluation: SafetyEvaluation,
): boolean => {
  if (!(context.storyMood === 'bedtime' && context.storyMode === 'series' && context.episodeIndex === 1)) return false
  if (evaluation.flags.excessive_fear !== true) return false
  return Object.entries(evaluation.flags).every(([flag, value]) => flag === 'excessive_fear' || value !== true)
}

export const evaluateStorySafety = async (
  apiKey: string,
  model: string,
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
): Promise<SafetyEvaluation> => {
  const candidateJson = JSON.stringify(childVisibleStorySafetyProjection(candidate))
  const first = await requestSafetyEvaluation(apiKey, model, context, candidateJson)
  const firstErrors = safetyEvaluationConsistencyErrors(first)
  let evaluation = first

  if (firstErrors.length > 0) {
    // This is a classifier-only consistency correction, not a new story generation. Keep it
    // shorter than the primary safety window so even the worst bounded Story path remains bounded.
    const corrected = await requestSafetyEvaluation(
      apiKey,
      model,
      context,
      candidateJson,
      `Previous structured verdict was internally inconsistent: ${firstErrors.join(',')}. Re-evaluate the exact same story from scratch and obey the verdict consistency contract.`,
      8_000,
    )
    const correctedErrors = safetyEvaluationConsistencyErrors(corrected)
    if (correctedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
    evaluation = corrected
  }

  if (!needsInteractiveFearConfirmation(context, evaluation)) return evaluation

  // General semantic safety remains authoritative for every named flag. When Episode 1 is
  // rejected ONLY for excessive_fear, one bounded narrow adjudicator checks for direct evidence
  // of the severe fear categories. It may clear only that isolated flag; malformed or unsupported
  // adjudication fails closed and every other safety flag remains untouched.
  const adjudication = await requestFearAdjudication(apiKey, model, candidateJson)
  const adjudicationErrors = fearAdjudicationConsistencyErrors(adjudication, childVisibleStorySafetyText(candidate))
  if (adjudicationErrors.length > 0) throw new Error('openai_fear_adjudication_inconsistent')
  if (adjudication.excessive_fear) {
    return {
      ...evaluation,
      notes: [`fear_adjudication:${adjudication.category}`],
    }
  }

  const cleared: SafetyEvaluation = {
    approved: true,
    risk_level: 'low',
    flags: { ...evaluation.flags, excessive_fear: false },
    required_action: 'publish',
    notes: ['isolated excessive_fear was not confirmed by narrow fear adjudication'],
  }
  const clearedErrors = safetyEvaluationConsistencyErrors(cleared)
  if (clearedErrors.length > 0) throw new Error('openai_safety_evaluation_inconsistent')
  return cleared
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
