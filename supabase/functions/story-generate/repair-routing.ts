import type { NormalizedStoryContext } from './contracts.ts'

export const textLengthValidationErrors = new Set([
  'story_too_short',
  'story_too_long',
  'choice_resolution_too_short',
  'choice_resolution_too_long',
  'bedtime_coda_too_short',
  'bedtime_coda_too_long',
])

// These are narration-owned defects that a bounded text repair is allowed to correct
// without changing Architect-owned plot, choices, canon, relationships or branch state.
export const textRewriteValidationErrors = new Set([
  'invalid_title',
  'invalid_resolution_text',
  'invalid_vocabulary_count',
  'unexpected_vocabulary',
  'story_language_mismatch',
  'uzbek_child_language_requires_rewrite',
  'visible_safety_language',
  'russian_hero_requires_rewrite',
  'missing_hero_token',
  'insufficient_narrative_beats',
  'story_repeats_choice_menu',
  'story_choice_menu_scaffolding',
  'choice_resolution_defers_to_future_session',
  'continuation_resets_before_resolution',
])

export const textRepairableValidationErrors = new Set([
  ...textLengthValidationErrors,
  ...textRewriteValidationErrors,
])

const fullStoryRewriteErrors = new Set([
  'invalid_title',
  'invalid_vocabulary_count',
  'unexpected_vocabulary',
  'story_language_mismatch',
  'uzbek_child_language_requires_rewrite',
  'visible_safety_language',
  'russian_hero_requires_rewrite',
  'missing_hero_token',
  'insufficient_narrative_beats',
  'story_repeats_choice_menu',
  'story_choice_menu_scaffolding',
  'continuation_resets_before_resolution',
])

const allRepairable = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textRepairableValidationErrors.has(error))

export const isTextLengthOnlyFailure = (errors: string[]): boolean =>
  errors.length > 0 && errors.every((error) => textLengthValidationErrors.has(error))

export const isTextRepairEligibleFailure = (errors: string[]): boolean => allRepairable(errors)

export const isTextRepairCorrectionEligible = (errors: string[]): boolean => allRepairable(errors)

export const textRepairRequiresFullStoryRewrite = (
  context: Pick<NormalizedStoryContext, 'episodeIndex'>,
  errors: string[],
): boolean => {
  if (errors.some((error) => fullStoryRewriteErrors.has(error))) return true
  // Short Episode 1 can use bounded insertion. Long prose must always be rewritten; insertion cannot shorten it.
  if (errors.includes('story_too_long')) return true
  if (context.episodeIndex === 2 && errors.some((error) =>
    error === 'story_too_short' ||
    error === 'story_too_long' ||
    error === 'bedtime_coda_too_short' ||
    error === 'bedtime_coda_too_long')) return true
  return false
}

export const textRepairShouldRewriteAllChoiceResolutions = (errors: string[]): boolean =>
  errors.some((error) =>
    error === 'story_language_mismatch' ||
    error === 'uzbek_child_language_requires_rewrite' ||
    error === 'visible_safety_language' ||
    error === 'russian_hero_requires_rewrite')

export const textRepairShouldRepairAllChoiceResolutions = (errors: string[]): boolean =>
  textRepairShouldRewriteAllChoiceResolutions(errors) ||
  errors.includes('choice_resolution_defers_to_future_session') ||
  errors.includes('invalid_resolution_text')
