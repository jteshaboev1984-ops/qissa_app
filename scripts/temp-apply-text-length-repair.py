from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new))


def replace_between(path: str, start_marker: str, end_marker: str, replacement: str) -> None:
    p = Path(path)
    text = p.read_text()
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    p.write_text(text[:start] + replacement + text[end:])


prompt = 'supabase/functions/story-generate/prompt.ts'
replace_between(
    prompt,
    'export const storyLengthRepairOutputSchema = {',
    'export const safetyOutputSchema = {',
    """export const textLengthRepairOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['story_text', 'choice_resolutions'],
  properties: {
    story_text: { type: ['string', 'null'] },
    choice_resolutions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['choice_id', 'resolution_text'],
        properties: {
          choice_id: { type: 'string' },
          resolution_text: { type: 'string' },
        },
      },
    },
  },
} as const

""",
)

repair_builder = """const storyWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length

const choiceNeedsResolutionLengthRepair = (
  context: NormalizedStoryContext,
  resolutionText: string,
): boolean => {
  if (!(context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime' && context.episodeIndex === 1)) {
    return false
  }
  const words = storyWordCount(resolutionText)
  return resolutionText.length > 360 || words < 25 || words > 60
}

export const buildTextLengthRepairPrompts = (
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
) => {
  const [minimumStoryWords, maximumStoryWords] = hardStoryWordRange(context)
  const currentStoryWords = storyWordCount(candidate.story_text)
  const repairStoryText = validationErrors.includes('story_too_short') || validationErrors.includes('story_too_long')
  const bedtimeEpisodeOne = context.ageGroup === '5-7' &&
    context.storyMode === 'series' &&
    context.storyMood === 'bedtime' &&
    context.episodeIndex === 1
  const targetMinimum = bedtimeEpisodeOne ? 500 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)
  const targetMaximum = bedtimeEpisodeOne ? 535 : Math.max(targetMinimum, maximumStoryWords - 20)
  const minimumGrowthWords = Math.max(0, targetMinimum - currentStoryWords)
  const resolutionTargets = candidate.choices
    .filter((choice) => choiceNeedsResolutionLengthRepair(context, choice.resolution_text))
    .map((choice) => ({
      choice_id: choice.choice_id,
      current_resolution_text: choice.resolution_text,
      current_words: storyWordCount(choice.resolution_text),
      current_characters: choice.resolution_text.length,
      target_words: '30-40',
      maximum_characters: 320,
      choice_text: choice.text,
      effect_summary: choice.effect_summary,
      tomorrow_seed: choice.tomorrow_seed,
      immutable_state_patch: choice.state_patch,
    }))

  const system = [
    'You are QISSA Text Length Repair Agent.',
    'Return only data matching the supplied JSON schema.',
    'Repair only text fields explicitly listed in repair_plan. Every other field of the existing candidate is immutable and will be preserved by the server.',
    'If repair_plan.story_text is null, return story_text as null. Otherwise rewrite story_text into the requested range while preserving the same central goal, chronology, established characters, objects, clues, locations, confirmed facts, and final decision point.',
    'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions, no missing ids and no extras.',
    'For each repaired resolution_text, preserve the same selected action and the exact durable consequence already represented by its effect_summary and immutable_state_patch. Only adjust wording and useful immediate action/reaction to reach the target length.',
    'Do not add a new durable object, clue, relationship, location, mechanism state, branch consequence, or canon fact.',
    'Do not resolve either choice inside story_text. End at the same child decision point so the existing choices remain valid.',
    'Expand through meaningful action, dialogue, reactions, attempts, gentle humor, and cause-and-effect inside existing beats; never pad with repeated explanation, scenery, a second problem, or an unrelated event.',
    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name.',
    'Write only in the requested language and preserve bedtime tone and age fit.',
  ].join(' ')

  const user = JSON.stringify({
    task: 'Repair only deterministic text-length violations in the existing candidate.',
    language: languageNames[context.language],
    validation_errors: validationErrors,
    repair_plan: {
      story_text: repairStoryText
        ? {
            current_story_text: candidate.story_text,
            current_words: currentStoryWords,
            hard_minimum_words: minimumStoryWords,
            hard_maximum_words: maximumStoryWords,
            target_words: `${targetMinimum}-${targetMaximum}`,
            minimum_growth_words_if_expanding: minimumGrowthWords,
            counting_scope: 'Whitespace-separated words in story_text only.',
          }
        : null,
      choice_resolutions: resolutionTargets,
    },
    immutable_candidate_context: {
      title: candidate.title,
      state_patch: candidate.state_patch,
      choices: candidate.choices.map((choice) => ({
        choice_id: choice.choice_id,
        text: choice.text,
        effect_summary: choice.effect_summary,
        resolution_text: choice.resolution_text,
        tomorrow_seed: choice.tomorrow_seed,
        state_patch: choice.state_patch,
      })),
      nextEpisodePreview: candidate.nextEpisodePreview,
    },
  })

  return { system, user }
}

"""
replace_between(
    prompt,
    'const storyWordCount = (text: string): number =>',
    'export const buildSafetyPrompts = (context: NormalizedStoryContext, candidateJson: string) => ({',
    repair_builder,
)

provider = 'supabase/functions/story-generate/openai.ts'
replace_once(
    provider,
    "import { buildSafetyPrompts, buildStoryLengthRepairPrompts, buildStoryPrompts, safetyOutputSchema, storyLengthRepairOutputSchema, storyOutputSchema } from './prompt.ts'",
    "import { buildSafetyPrompts, buildStoryPrompts, buildTextLengthRepairPrompts, safetyOutputSchema, storyOutputSchema, textLengthRepairOutputSchema } from './prompt.ts'",
)

repair_function = """type TextLengthRepair = {
  story_text: string | null
  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>
}

const repairWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length

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

  const repairStoryText = validationErrors.includes('story_too_short') || validationErrors.includes('story_too_long')
  if (repairStoryText && (typeof repair.story_text !== 'string' || !repair.story_text.trim())) {
    throw new Error('openai_invalid_text_repair_story')
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
    story_text: repairStoryText ? (repair.story_text as string) : candidate.story_text,
    choices: candidate.choices.map((choice) => targetChoiceIds.has(choice.choice_id)
      ? { ...choice, resolution_text: repairedByChoiceId.get(choice.choice_id) as string }
      : choice),
  }
}

"""
replace_between(
    provider,
    'export const repairStoryCandidateLength = async (',
    'export const evaluateStorySafety = async (',
    repair_function,
)

index = 'supabase/functions/story-generate/index.ts'
replace_once(
    index,
    "import { evaluateStorySafety, generateStoryCandidate, moderateStoryText, repairStoryCandidateLength } from './openai.ts'",
    "import { evaluateStorySafety, generateStoryCandidate, moderateStoryText, repairStoryCandidateTextLengths } from './openai.ts'",
)
replace_once(
    index,
    "const isStoryLengthOnlyFailure = (errors: string[]): boolean =>\n  errors.length > 0 && errors.every((error) => error === 'story_too_short' || error === 'story_too_long')",
    "const textLengthValidationErrors = new Set([\n  'story_too_short',\n  'story_too_long',\n  'choice_resolution_too_short',\n  'choice_resolution_too_long',\n])\n\nconst isTextLengthOnlyFailure = (errors: string[]): boolean =>\n  errors.length > 0 && errors.every((error) => textLengthValidationErrors.has(error))",
)
replace_once(index, 'let usedLengthRepair = false', 'let usedTextLengthRepair = false')
replace_once(index, '// A pure story-length failure keeps all already-valid canon and branch data immutable.', '// Text-length repair may change only invalid story/resolution prose; canon and branch state remain immutable.')
replace_once(index, 'candidate = await repairStoryCandidateLength(', 'candidate = await repairStoryCandidateTextLengths(')
replace_once(index, 'usedLengthRepair = true', 'usedTextLengthRepair = true')
replace_once(index, 'isStoryLengthOnlyFailure(validationErrors)', 'isTextLengthOnlyFailure(validationErrors)')
replace_once(index, "'X-QISSA-Generation-Repair': usedLengthRepair ? 'story-length' : 'none'", "'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none'")
replace_once(index, "'X-QISSA-Generation-Repair': usedLengthRepair ? 'story-length' : 'none'", "'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none'")

check = 'scripts/check-story-ai-safety.mjs'
replace_once(check, "  'isStoryLengthOnlyFailure',\n  'repairStoryCandidateLength',", "  'isTextLengthOnlyFailure',\n  'choice_resolution_too_short',\n  'choice_resolution_too_long',\n  'repairStoryCandidateTextLengths',")
replace_once(check, "  'buildStoryLengthRepairPrompts',\n  'storyLengthRepairOutputSchema',\n  \"'qissa_story_length_repair'\",", "  'buildTextLengthRepairPrompts',\n  'textLengthRepairOutputSchema',\n  \"'qissa_text_length_repair'\",\n  'targetChoiceIds',")
replace_once(check, "  'Story Length Repair Agent',\n  'Rewrite only story_text.',\n  'Every other field of the existing candidate is immutable',", "  'Text Length Repair Agent',\n  'Repair only text fields explicitly listed in repair_plan.',\n  'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions',\n  'Every other field of the existing candidate is immutable',")
replace_once(check, "  'minimum_growth_words_if_expanding',\n  'immutable_candidate_context',", "  'minimum_growth_words_if_expanding',\n  'maximum_characters: 320',\n  'immutable_candidate_context',")
replace_once(check, "console.log('Story AI safety, targeted length repair, validator metrics, immediate choice payoff, branch isolation, compact canon, narrative roles, and deterministic short-circuit contract check passed.')", "console.log('Story AI safety, targeted story/resolution text-length repair, validator metrics, immediate choice payoff, branch isolation, compact canon, narrative roles, and deterministic short-circuit contract check passed.')")

for temp_path in [
    Path('.github/workflows/temp-apply-text-length-repair.yml'),
    Path('scripts/temp-apply-text-length-repair.py'),
]:
    if temp_path.exists():
        temp_path.unlink()
