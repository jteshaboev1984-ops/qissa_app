from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, got {count}: {old[:120]!r}')
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
    'export const textLengthRepairOutputSchema = {',
    'export const safetyOutputSchema = {',
    """export const textLengthRepairOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['story_rewrite', 'story_expansion', 'choice_resolutions'],
  properties: {
    story_rewrite: { type: ['string', 'null'] },
    story_expansion: { type: ['string', 'null'] },
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

new_builder = """const storyWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length

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
  const storyTooShort = validationErrors.includes('story_too_short')
  const storyTooLong = validationErrors.includes('story_too_long')
  const bedtimeEpisodeOne = context.ageGroup === '5-7' &&
    context.storyMode === 'series' &&
    context.storyMood === 'bedtime' &&
    context.episodeIndex === 1
  const rewriteTargetMinimum = bedtimeEpisodeOne ? 500 : Math.min(maximumStoryWords - 10, minimumStoryWords + 40)
  const rewriteTargetMaximum = bedtimeEpisodeOne ? 535 : Math.max(rewriteTargetMinimum, maximumStoryWords - 20)
  const desiredExpandedTotal = Math.min(maximumStoryWords - 25, minimumStoryWords + 65)
  const desiredGrowth = Math.max(0, desiredExpandedTotal - currentStoryWords)
  const expansionMinimum = Math.max(25, desiredGrowth - 20)
  const expansionMaximum = Math.max(
    expansionMinimum,
    Math.min(maximumStoryWords - currentStoryWords - 10, desiredGrowth + 20),
  )
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
  const storyParagraphs = candidate.story_text.trim().split(/\\n\\s*\\n/u).map((item) => item.trim()).filter(Boolean)
  const paragraphBeforeChoiceSetup = storyParagraphs.length >= 2 ? storyParagraphs[storyParagraphs.length - 2] : ''
  const finalChoiceSetupParagraph = storyParagraphs[storyParagraphs.length - 1] ?? ''

  const system = [
    'You are QISSA Text Length Repair Agent.',
    'Return only data matching the supplied JSON schema.',
    'Repair only text fields explicitly listed in repair_plan. Every other field of the existing candidate is immutable and will be preserved by the server.',
    'For story_too_short, do NOT rewrite the existing story. Return story_rewrite as null and write only story_expansion: one coherent passage that the server will insert immediately before the existing final choice-setup paragraph. The original story remains verbatim, so the expansion must continue naturally from the preceding paragraph and lead naturally into the existing final paragraph.',
    'For story_too_long, return story_expansion as null and use story_rewrite to shorten the full story into the requested range without deleting causal beats.',
    'If there is no story length failure, return both story_rewrite and story_expansion as null.',
    'The expansion may deepen only existing action, dialogue, reactions, attempts, gentle humor and cause-and-effect. Do not introduce a new durable object, clue, relationship, location, mechanism state, branch consequence, canon fact, problem or mission.',
    'Do not resolve either choice inside the expansion or rewrite. The final decision point and existing choices must remain valid.',
    'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions, no missing ids and no extras.',
    'For each repaired resolution_text, preserve the same selected action and the exact durable consequence already represented by its effect_summary and immutable_state_patch. Only adjust wording and useful immediate action/reaction to reach the target length.',
    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name. In Russian, use {{HERO}} only as a nominative subject or direct address and use grammatically invariant phrasing such as present-tense action; never put the token after a preposition or directly before a gendered past-tense verb.',
    'Write only in the requested language and preserve bedtime tone and age fit.',
  ].join(' ')

  const user = JSON.stringify({
    task: 'Repair only deterministic text-length violations in the existing candidate.',
    language: languageNames[context.language],
    validation_errors: validationErrors,
    repair_plan: {
      story_expansion: storyTooShort
        ? {
            current_story_words: currentStoryWords,
            hard_minimum_story_words: minimumStoryWords,
            hard_maximum_story_words: maximumStoryWords,
            desired_total_after_insertion: desiredExpandedTotal,
            target_additional_words: `${expansionMinimum}-${expansionMaximum}`,
            insertion_point: 'Immediately before the existing final story paragraph.',
            paragraph_before_insertion: paragraphBeforeChoiceSetup,
            existing_final_choice_setup_paragraph: finalChoiceSetupParagraph,
            rule: 'Return only NEW prose for insertion. Do not repeat either neighboring paragraph and do not restate the choices.',
          }
        : null,
      story_rewrite: storyTooLong
        ? {
            current_story_text: candidate.story_text,
            current_words: currentStoryWords,
            hard_minimum_words: minimumStoryWords,
            hard_maximum_words: maximumStoryWords,
            target_words: `${rewriteTargetMinimum}-${rewriteTargetMaximum}`,
          }
        : null,
      choice_resolutions: resolutionTargets,
    },
    immutable_candidate_context: {
      title: candidate.title,
      story_text: candidate.story_text,
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
    new_builder,
)

provider = 'supabase/functions/story-generate/openai.ts'
replace_once(
    provider,
    "type TextLengthRepair = {\n  story_text: string | null\n  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>\n}",
    "type TextLengthRepair = {\n  story_rewrite: string | null\n  story_expansion: string | null\n  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>\n}",
)
replace_once(
    provider,
    "const repairWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length",
    "const repairWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length\n\nconst insertStoryExpansionBeforeFinalParagraph = (storyText: string, expansion: string): string => {\n  const paragraphs = storyText.trim().split(/\\n\\s*\\n/u).map((item) => item.trim()).filter(Boolean)\n  if (paragraphs.length < 2) throw new Error('openai_text_repair_story_structure')\n  return [...paragraphs.slice(0, -1), expansion.trim(), paragraphs[paragraphs.length - 1]].join('\\n\\n')\n}",
)
old_validation = """  const repairStoryText = validationErrors.includes('story_too_short') || validationErrors.includes('story_too_long')
  if (repairStoryText && (typeof repair.story_text !== 'string' || !repair.story_text.trim())) {
    throw new Error('openai_invalid_text_repair_story')
  }

  const targetChoiceIds = new Set("""
new_validation = """  const storyTooShort = validationErrors.includes('story_too_short')
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

  const targetChoiceIds = new Set("""
replace_once(provider, old_validation, new_validation)
replace_once(
    provider,
    "    story_text: repairStoryText ? (repair.story_text as string) : candidate.story_text,",
    "    story_text: storyTooShort\n      ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)\n      : storyTooLong\n        ? (repair.story_rewrite as string)\n        : candidate.story_text,",
)

check = 'scripts/check-story-ai-safety.mjs'
replace_once(
    check,
    "  'Repair only text fields explicitly listed in repair_plan.',\n  'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions',",
    "  'Repair only text fields explicitly listed in repair_plan.',\n  'For story_too_short, do NOT rewrite the existing story.',\n  'Return only NEW prose for insertion.',\n  'target_additional_words',\n  'existing_final_choice_setup_paragraph',\n  'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions',",
)
replace_once(
    check,
    "  'targetChoiceIds',\n  '3000',",
    "  'targetChoiceIds',\n  'insertStoryExpansionBeforeFinalParagraph',\n  'openai_invalid_text_repair_expansion',\n  '3000',",
)
replace_once(
    check,
    "console.log('Story AI safety, targeted story/resolution text-length repair, validator metrics, immediate choice payoff, branch isolation, compact canon, narrative roles, and deterministic short-circuit contract check passed.')",
    "console.log('Story AI safety, additive short-story repair, targeted resolution repair, validator metrics, branch isolation, compact canon, narrative roles, and deterministic short-circuit contract check passed.')",
)

for temp_path in [
    Path('scripts/temp-apply-additive-repair.py'),
    Path('.github/workflows/temp-apply-additive-repair.yml'),
]:
    if temp_path.exists():
        temp_path.unlink()
