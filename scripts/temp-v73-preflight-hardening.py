from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'missing exact fragment in {path}: {old[:120]!r}')
    text = text.replace(old, new, 1)
    write(path, text)


def regex_once(path, pattern, replacement, flags=0):
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'regex count {count} in {path}: {pattern[:100]!r}')
    write(path, updated)

# 1) Centralize repair routing so mixed validator failures cannot silently fall between retry and repair.
replace_once(
    'supabase/functions/story-generate/split-index.ts',
    "import { childVisibleStorySafetyText } from './story-safety-projection.ts'\n",
    "import { childVisibleStorySafetyText } from './story-safety-projection.ts'\nimport { isTextLengthOnlyFailure, isTextRepairCorrectionEligible, isTextRepairEligibleFailure } from './repair-routing.ts'\n",
)
regex_once(
    'supabase/functions/story-generate/split-index.ts',
    r"const textLengthValidationErrors = new Set\(\[[\s\S]*?const isTextRepairCorrectionEligible = \(errors: string\[\]\): boolean =>\n  errors\.length > 0 && errors\.every\(\(error\) => textRepairCorrectionErrors\.has\(error\)\)\n\n",
    '',
)
replace_once(
    'supabase/functions/story-generate/split-index.ts',
    'isTextLengthRepairEligibleFailure(validationErrors)',
    'isTextRepairEligibleFailure(validationErrors)',
)

# 2) Make the repair schema capable of replacing all Narrator-owned child-facing fields when a defect is already in existing prose.
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "import type { JsonRecord, NormalizedStoryContext, StoryCandidate } from './contracts.ts'\n",
    "import type { JsonRecord, NormalizedStoryContext, StoryCandidate } from './contracts.ts'\nimport { textRepairRequiresFullStoryRewrite, textRepairShouldRepairAllChoiceResolutions } from './repair-routing.ts'\n",
)
regex_once(
    'supabase/functions/story-generate/prompt.ts',
    r"export const textLengthRepairOutputSchema = \{[\s\S]*?\n\} as const\n\nexport const safetyOutputSchema",
    """export const textLengthRepairOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title_rewrite', 'story_rewrite', 'story_expansion', 'choice_resolutions', 'vocabulary_rewrite'],
  properties: {
    title_rewrite: { type: ['string', 'null'] },
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
    vocabulary_rewrite: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'translation', 'example'],
        properties: {
          word: { type: 'string' },
          translation: { type: 'string' },
          example: { type: 'string' },
        },
      },
    },
  },
} as const

export const safetyOutputSchema""",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "  const rewriteContinuation = bedtimeEpisodeTwo && (storyTooShort || storyTooLong || codaTooShort || codaTooLong)\n",
    "  const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors)\n  const repairAllChoiceResolutions = textRepairShouldRepairAllChoiceResolutions(validationErrors) || validationErrors.includes('choice_resolution_defers_to_future_session')\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "  const resolutionTargets = candidate.choices\n    .filter((choice) => choiceNeedsResolutionLengthRepair(context, choice.resolution_text))\n",
    "  const resolutionTargets = candidate.choices\n    .filter((choice) => repairAllChoiceResolutions || choiceNeedsResolutionLengthRepair(context, choice.resolution_text))\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "    rewriteContinuation\n      ? 'For Episode 2 continuation length or bedtime-coda failures, rewrite the full story_text while preserving the same characters, causal events, selected-choice consequence, central goal and immutable state. Return story_expansion as null. Reach the requested total naturally, solve the original problem before the end, and make the final paragraph a real 60-120 word sleepy coda rather than another plot beat.'\n      : 'For story_too_short, do NOT rewrite the existing story. Return story_rewrite as null and write only story_expansion: one coherent passage that the server will insert immediately before the existing final choice-setup paragraph. The original story remains verbatim, so the expansion must continue naturally from the preceding paragraph and lead naturally into the existing final paragraph.',\n",
    "    fullStoryRewrite\n      ? 'A deterministic prose or language defect is already present in the Narrator output, so rewrite the full title and story_text from the immutable candidate while preserving the exact same Architect-owned plot, characters, choices, canon, relationships and branch consequences. Return story_expansion as null. For Episode 2, solve the same original goal and keep the final paragraph a real 60-120 word sleepy coda. For Episode 1, stop at the same neutral decision point without replaying or naming either structured choice inside story_text.'\n      : 'For a pure Episode 1 story_too_short failure, do NOT rewrite the existing story. Return title_rewrite as null and story_rewrite as null; write only story_expansion: one coherent passage that the server will insert immediately before the existing final choice-setup paragraph. The original story remains verbatim, so the expansion must continue naturally from the preceding paragraph and lead naturally into the existing final paragraph.',\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "    'For story_too_long, return story_expansion as null and use story_rewrite to shorten the full story into the requested range without deleting causal beats.',\n",
    "    'For story_too_long, return story_expansion as null and use the full title/story rewrite path to shorten the story into the requested range without deleting causal beats.',\n    'When full-story rewrite is required, return title_rewrite as a child-facing title in the requested language that describes the same story. Do not rename established characters.',\n    'When full-story rewrite is required, also return a complete replacement vocabulary_rewrite: exactly 2-3 grounded Russian-to-English items for Russian, and an empty array for Uzbek or Kazakh. For a pure insertion-only or choice-resolution-only repair, vocabulary_rewrite must be an empty array.',\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "      story_expansion: storyTooShort && !rewriteContinuation\n",
    "      title_rewrite: fullStoryRewrite ? { current_title: candidate.title, rule: 'Same story and character identities; correct language, age fit and grammar.' } : null,\n      story_expansion: storyTooShort && !fullStoryRewrite\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "      story_rewrite: rewriteContinuation || storyTooLong\n",
    "      story_rewrite: fullStoryRewrite\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "            preserve_story_contract: rewriteContinuation ? 'same Episode 2 plot, same selected-choice consequence, same characters and immutable state; no new problem or durable fact' : 'preserve all causal beats while shortening',\n            final_bedtime_coda_words: rewriteContinuation ? '60-120 words in the final paragraph after the main problem is solved' : null,\n",
    "            preserve_story_contract: context.episodeIndex === 2 ? 'same Episode 2 plot, same selected-choice consequence, same established characters and immutable state; no new problem, helper group or durable fact' : 'same Episode 1 plot, same established characters, same decision point and structured choices; no new problem or durable fact',\n            final_bedtime_coda_words: context.episodeIndex === 2 ? '60-120 words in the final paragraph after the main problem is solved' : null,\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "      choice_resolutions: resolutionTargets,\n",
    "      choice_resolutions: resolutionTargets,\n      vocabulary_rewrite: fullStoryRewrite\n        ? (context.language === 'ru' ? 'return exactly 2-3 complete replacement vocabulary items' : 'return an empty array')\n        : 'return an empty array',\n",
)
replace_once(
    'supabase/functions/story-generate/prompt.ts',
    "      nextEpisodePreview: candidate.nextEpisodePreview,\n",
    "      nextEpisodePreview: candidate.nextEpisodePreview,\n      vocabulary: candidate.vocabulary,\n",
)

# 3) Provider validates the broader repair contract and replaces title/vocabulary only on full rewrite.
replace_once(
    'supabase/functions/story-generate/openai.ts',
    "import type { SafetyEvaluation, StoryCandidate } from './contracts.ts'\n",
    "import type { CandidateVocabulary, SafetyEvaluation, StoryCandidate } from './contracts.ts'\n",
)
replace_once(
    'supabase/functions/story-generate/openai.ts',
    "import { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from './story-safety-projection.ts'\n",
    "import { childVisibleStorySafetyProjection, childVisibleStorySafetyText } from './story-safety-projection.ts'\nimport { textRepairRequiresFullStoryRewrite, textRepairShouldRepairAllChoiceResolutions } from './repair-routing.ts'\n",
)
replace_once(
    'supabase/functions/story-generate/openai.ts',
    "type TextLengthRepair = {\n  story_rewrite: string | null\n  story_expansion: string | null\n  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>\n}\n",
    "type TextLengthRepair = {\n  title_rewrite: string | null\n  story_rewrite: string | null\n  story_expansion: string | null\n  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>\n  vocabulary_rewrite: CandidateVocabulary[]\n}\n",
)
replace_once(
    'supabase/functions/story-generate/openai.ts',
    "  const codaLengthFailure = validationErrors.includes('bedtime_coda_too_short') || validationErrors.includes('bedtime_coda_too_long')\n  const rewriteContinuation = context.episodeIndex === 2 && (storyTooShort || storyTooLong || codaLengthFailure)\n  if (rewriteContinuation && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_continuation_text_repair_rewrite')\n  }\n  if (!rewriteContinuation && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {\n    throw new Error('openai_invalid_text_repair_expansion')\n  }\n  if (!rewriteContinuation && storyTooLong && (typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_text_repair_rewrite')\n  }\n  if (!storyTooShort && !storyTooLong && !codaLengthFailure && (repair.story_rewrite !== null || repair.story_expansion !== null)) {\n    throw new Error('openai_unexpected_text_repair_story')\n  }\n\n  const targetChoiceIds = new Set(\n    candidate.choices\n      .filter((choice) => needsChoiceResolutionRepair(context, choice.resolution_text))\n      .map((choice) => choice.choice_id),\n  )\n",
    "  const codaLengthFailure = validationErrors.includes('bedtime_coda_too_short') || validationErrors.includes('bedtime_coda_too_long')\n  const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors)\n  const repairAllChoiceResolutions = textRepairShouldRepairAllChoiceResolutions(validationErrors) || validationErrors.includes('choice_resolution_defers_to_future_session')\n  if (fullStoryRewrite && (typeof repair.title_rewrite !== 'string' || !repair.title_rewrite.trim() || typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {\n    throw new Error('openai_invalid_full_text_repair_rewrite')\n  }\n  if (!fullStoryRewrite && repair.title_rewrite !== null) throw new Error('openai_unexpected_text_repair_title')\n  if (!fullStoryRewrite && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {\n    throw new Error('openai_invalid_text_repair_expansion')\n  }\n  if (!fullStoryRewrite && !storyTooShort && !storyTooLong && !codaLengthFailure && (repair.story_rewrite !== null || repair.story_expansion !== null)) {\n    throw new Error('openai_unexpected_text_repair_story')\n  }\n  if (fullStoryRewrite) {\n    if (context.language === 'ru' && (repair.vocabulary_rewrite.length < 2 || repair.vocabulary_rewrite.length > 3)) throw new Error('openai_invalid_text_repair_vocabulary')\n    if (context.language !== 'ru' && repair.vocabulary_rewrite.length !== 0) throw new Error('openai_unexpected_text_repair_vocabulary')\n  } else if (repair.vocabulary_rewrite.length !== 0) {\n    throw new Error('openai_unexpected_text_repair_vocabulary')\n  }\n\n  const targetChoiceIds = new Set(\n    candidate.choices\n      .filter((choice) => repairAllChoiceResolutions || needsChoiceResolutionRepair(context, choice.resolution_text))\n      .map((choice) => choice.choice_id),\n  )\n",
)
replace_once(
    'supabase/functions/story-generate/openai.ts',
    "  return {\n    ...candidate,\n    story_text: rewriteContinuation\n      ? (repair.story_rewrite as string)\n      : storyTooShort\n        ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)\n        : storyTooLong\n          ? (repair.story_rewrite as string)\n          : candidate.story_text,\n    choices: candidate.choices.map((choice) => targetChoiceIds.has(choice.choice_id)\n",
    "  return {\n    ...candidate,\n    title: fullStoryRewrite ? (repair.title_rewrite as string) : candidate.title,\n    story_text: fullStoryRewrite\n      ? (repair.story_rewrite as string)\n      : storyTooShort\n        ? insertStoryExpansionBeforeFinalParagraph(candidate.story_text, repair.story_expansion as string)\n        : candidate.story_text,\n    vocabulary: fullStoryRewrite ? repair.vocabulary_rewrite : candidate.vocabulary,\n    choices: candidate.choices.map((choice) => targetChoiceIds.has(choice.choice_id)\n",
)

# 4) Shared Uzbek child-level guard can run at Architect stage, before paying for Narrator.
replace_once(
    'supabase/functions/story-generate/safety.ts',
    "export const uzbekChildLanguageNeedsRewrite = (\n  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,\n  candidate: StoryCandidate,\n): boolean => {\n  if (context.language !== 'uz' || context.ageGroup !== '5-7') return false\n  const visibleText = [\n    candidate.title,\n    candidate.story_text,\n    candidate.nextEpisodePreview,\n    ...(Array.isArray(candidate.choices)\n      ? candidate.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text])\n      : []),\n    ...(Array.isArray(candidate.vocabulary)\n      ? candidate.vocabulary.flatMap((item) => [item.word, item.translation, item.example])\n      : []),\n  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)\n    .join(' ')\n    .replace(/[\\u2018\\u2019\\u02BB`]/g, \"'\")\n    .toLocaleLowerCase()\n  return uzbekYoungChildAvoidPatterns.some((pattern) => pattern.test(visibleText))\n}\n",
    "export const uzbekYoungChildValuesNeedRewrite = (\n  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,\n  values: Array<string | null | undefined>,\n): boolean => {\n  if (context.language !== 'uz' || context.ageGroup !== '5-7') return false\n  const visibleText = values\n    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)\n    .join(' ')\n    .replace(/[\\u2018\\u2019\\u02BB`]/g, \"'\")\n    .toLocaleLowerCase()\n  return uzbekYoungChildAvoidPatterns.some((pattern) => pattern.test(visibleText))\n}\n\nexport const uzbekChildLanguageNeedsRewrite = (\n  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,\n  candidate: StoryCandidate,\n): boolean => uzbekYoungChildValuesNeedRewrite(context, [\n  candidate.title,\n  candidate.story_text,\n  candidate.nextEpisodePreview,\n  ...(Array.isArray(candidate.choices)\n    ? candidate.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text])\n    : []),\n  ...(Array.isArray(candidate.vocabulary)\n    ? candidate.vocabulary.flatMap((item) => [item.word, item.translation, item.example])\n    : []),\n])\n",
)

replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "import { hasSingleLanguageMismatch } from './language.ts'\n",
    "import { hasSingleLanguageMismatch } from './language.ts'\nimport { branchingPreviewNeedsRewrite, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "const blueprintNaturalLanguageValues = (blueprint: StoryBlueprint): string[] => {\n",
    "const blueprintChildVisibleValues = (blueprint: StoryBlueprint): string[] => [\n  blueprint.decision_point,\n  blueprint.next_episode_preview,\n  ...blueprint.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.tomorrow_seed]),\n].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)\n\nconst blueprintNaturalLanguageValues = (blueprint: StoryBlueprint): string[] => {\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value), context.recurringCharacters)) errors.push('blueprint_language_mismatch')\n\n",
    "  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value), context.recurringCharacters)) errors.push('blueprint_language_mismatch')\n  const childVisibleBlueprint = blueprintChildVisibleValues(value)\n  if (visibleSafetyLanguageNeedsRewrite(context.language, childVisibleBlueprint.join(' '))) errors.push('blueprint_visible_safety_language')\n  if (uzbekYoungChildValuesNeedRewrite(context, childVisibleBlueprint)) errors.push('blueprint_uzbek_child_language_requires_rewrite')\n  if (context.episodeIndex === 1 && typeof value.next_episode_preview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.next_episode_preview)) errors.push('blueprint_technical_preview_language')\n  if (context.episodeIndex === 1 && typeof value.next_episode_preview === 'string' && branchingPreviewNeedsRewrite(context.language, value.next_episode_preview)) errors.push('blueprint_branching_preview_language')\n\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    ? context.episodeIndex === 1 ? '350-390' : '430-490'\n",
    "    ? context.episodeIndex === 1 ? '380-420' : '430-490'\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "      ? { target_paragraphs: '6-7', average_words_per_paragraph: '50-60', final_choice_setup_words: '35-50' }\n",
    "      ? { target_paragraphs: '8-10', average_words_per_paragraph: '40-55', final_choice_setup_words: '35-50' }\n",
)
replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    'For ages 5-7 bedtime series, treat paragraph_budget as a quantitative drafting plan. Do not compress several blueprint beats into a few very short paragraphs; hit the requested total through meaningful beat development, not filler.',\n",
    "    'For ages 5-7 bedtime series, treat paragraph_budget as a quantitative drafting plan. Do not compress several blueprint beats into a few very short paragraphs; hit the requested total through meaningful beat development, not filler. For Episode 1, do not finish story_text below 340 words: develop each Architect beat with concrete action, dialogue or reaction before the final decision cue.',\n",
)

# 5) Prevent deterministic flagship casts from replacing established series identity after session 1.
replace_once(
    'supabase/functions/story-generate/storySixMinuteEditorial.ts',
    "const choicePatch = (world: ClosedBetaWorld, branch: 'choice-a' | 'choice-b'): CandidatePatch => ({\n",
    "const choicePatch = (world: ClosedBetaWorld, branch: 'choice-a' | 'choice-b'): CandidatePatch => ({\n",
)
replace_once(
    'supabase/functions/story-generate/storySixMinuteEditorial.ts',
    "  canon_updates: [{ key: 'remembered_choice', value: branch }],\n})\n",
    "  canon_updates: [\n    { key: 'remembered_choice', value: branch },\n    { key: 'beta_story_version', value: 'child_first_v1' },\n  ],\n})\n",
)
replace_once(
    'supabase/functions/story-generate/storySixMinuteEditorial.ts',
    "  if (context.isContinuation) {\n    const branch = branchFromChoice(context.choiceHistory.at(-1)?.choice_id ?? '')\n",
    "  if (context.isContinuation) {\n    if (context.canonState.beta_story_version !== 'child_first_v1') return null\n    const branch = branchFromChoice(context.choiceHistory.at(-1)?.choice_id ?? '')\n",
)
replace_once(
    'supabase/functions/story-generate/storySixMinuteEditorial.ts',
    "  return {\n    title: story.titleOne[language],\n",
    "  if (context.hasSeriesMemory || context.sessionIndex !== 1) return null\n\n  return {\n    title: story.titleOne[language],\n",
)

# Generic forest branch memory must not inject Nura/Topa into a later established series just because choice ids are choice-a/b.
replace_once(
    'supabase/functions/story-generate/storyCoreBranches.ts',
    "  if (branch) {\n    return {\n",
    "  if (branch && !context.hasSeriesMemory && context.sessionIndex === 1) {\n    return {\n",
)
replace_once(
    'supabase/functions/story-generate/storyCoreBranches.ts',
    "  if (branch && latestChoice) {\n    const friend = branch.friend[context.language]\n",
    "  const referenceBranch = context.canonState.fallback_reference_branch\n  const expectedReferenceBranch = branchId ? `cozy_forest_${branchId}` : ''\n  if (branch && latestChoice && referenceBranch === expectedReferenceBranch) {\n    const friend = branch.friend[context.language]\n",
)
# Mark only true reference-branch choice memory; generic later sessions stay generic.
replace_once(
    'supabase/functions/story-generate/storyCoreBranches.ts',
    "      statePatch: choicePatch(\n        context,\n        choiceId,\n        branch.friend[context.language],\n        branch.friendId,\n        branch.artifact[context.language],\n      ),\n",
    "      statePatch: {\n        ...choicePatch(\n          context,\n          choiceId,\n          branch.friend[context.language],\n          branch.friendId,\n          branch.artifact[context.language],\n        ),\n        canon_updates: [\n          ...choicePatch(context, choiceId, branch.friend[context.language], branch.friendId, branch.artifact[context.language]).canon_updates,\n          { key: 'fallback_reference_branch', value: `cozy_forest_${branchId}` },\n        ],\n      },\n",
)

# 6) Static regression coverage: enumerate mixed repair classes and immutable Architect checks before any live provider call.
replace_once(
    'scripts/check-story-ai-split.mjs',
    "import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'\n",
    "import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'\nimport { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite } from '../supabase/functions/story-generate/repair-routing.ts'\nimport { validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'\n",
)
# Avoid duplicate validateStoryBlueprint import by expanding existing architecture import instead.
text = read('scripts/check-story-ai-split.mjs')
text = text.replace("import { buildArchitectPrompts, enforceStoryBlueprintContextContract } from '../supabase/functions/story-generate/story-architecture.ts'", "import { buildArchitectPrompts, enforceStoryBlueprintContextContract, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'")
text = text.replace("\nimport { validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'\n", "\n")
write('scripts/check-story-ai-split.mjs', text)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ must accept Kazakh Cyrillic prose')\n",
    "requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ must accept Kazakh Cyrillic prose')\n\nconst repairRouteContext = { episodeIndex: 1 }\nfor (const errors of [\n  ['story_too_short'],\n  ['story_too_short', 'missing_hero_token'],\n  ['story_too_short', 'uzbek_child_language_requires_rewrite'],\n  ['story_too_short', 'story_language_mismatch'],\n  ['story_too_short', 'visible_safety_language'],\n  ['story_too_short', 'insufficient_narrative_beats'],\n  ['story_too_short', 'story_repeats_choice_menu'],\n  ['story_too_short', 'story_choice_menu_scaffolding'],\n  ['choice_resolution_too_short', 'choice_resolution_defers_to_future_session'],\n]) {\n  requireLanguageGuard(isTextRepairEligibleFailure(errors), `repair routing must cover mixed narration errors: ${errors.join(',')}`)\n}\nrequireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short', 'uzbek_child_language_requires_rewrite']), 'existing Uzbek language defects plus short text must use a full rewrite, not insertion')\nrequireLanguageGuard(!textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short']), 'pure Episode 1 short text should keep the cheaper insertion repair')\nrequireLanguageGuard(!isTextRepairEligibleFailure(['invalid_choice_count', 'story_too_short']), 'structural/Architect-owned failures must not be sent to prose repair')\n",
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "if (!switchedLanguageContext) {\n",
    "const badImmutableUzBlueprint = {\n  plan_version: 'split-v1', central_goal: 'Momiqqa sovg‘a tayyorlash', setting_anchor: 'o‘rmon', continuity_callbacks: [],\n  beats: ['Momiq do‘stlarini chaqiradi', 'Do‘stlar sovg‘a haqida gaplashadi', 'Ular birga tayyorlanadi', 'Malika qaror beradi'],\n  decision_point: 'Malika qaysi yo‘lni tanlaydi?',\n  choices: [\n    { choice_id: 'a', text: 'Ritm bilan qo‘shiq aytish', effect_summary: 'Do‘stlar qo‘shiq tayyorlaydi', resolution_goal: 'Qo‘shiq tayyor bo‘ladi', tomorrow_seed: 'Do‘stlar sovg‘ani ko‘rsatadi', choice_icon: '🎵', state_patch: { last_event: 'a', new_friend: null, hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] }, value_alignment: ['friendship'] },\n    { choice_id: 'b', text: 'Bargdan rasm yasash', effect_summary: 'Do‘stlar rasm tayyorlaydi', resolution_goal: 'Rasm tayyor bo‘ladi', tomorrow_seed: 'Do‘stlar sovg‘ani ko‘rsatadi', choice_icon: '🍃', state_patch: { last_event: 'b', new_friend: null, hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] }, value_alignment: ['kindness'] },\n  ],\n  state_patch: { last_event: 'start', new_friend: 'Momiq', hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] },\n  next_episode_preview: 'Momiq bilan keyingi epizod davom etadi.',\n}\nconst badBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', isFinalSeriesSession: false, recurringCharacters: [] }, badImmutableUzBlueprint)\nrequireLanguageGuard(badBlueprintErrors.includes('blueprint_uzbek_child_language_requires_rewrite'), 'immutable Uzbek choice/preview vocabulary must fail at Architect validation before Narrator')\nrequireLanguageGuard(badBlueprintErrors.includes('blueprint_technical_preview_language'), 'technical preview wording must fail at Architect validation before Narrator')\n\nif (!switchedLanguageContext) {\n",
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "  'isTextLengthRepairEligibleFailure',\n",
    "  'isTextRepairEligibleFailure',\n",
)
replace_once(
    'scripts/check-story-ai-split.mjs',
    "  'previous text repair failed deterministic validation',\n",
    "  'previous text repair failed deterministic validation',\n  'title_rewrite',\n  'vocabulary_rewrite',\n  'textRepairRequiresFullStoryRewrite',\n",
)

# Core proof: later sessions must not restart the flagship Uzbek cast merely because language is Uzbek.
replace_once(
    'scripts/check-story-core-proof.mjs',
    "  const spaceOne = buildSafeFallback({ ...baseContext, stylePackId: 'stars_and_space' })\n",
    "  const establishedUzSeries = buildSafeFallback({\n    ...uzForestContext,\n    sessionIndex: 2,\n    hasSeriesMemory: true,\n    recurringCharacters: ['Рыжик'],\n    activeArc: 'old_arc',\n    lastEpisodeSummary: 'Рыжик oldingi hikoyada qahramon bilan do‘stlashdi.',\n    canonState: { old_fact: 'saved' },\n  })\n  assert(!/Momiq|Oycha|Yong‘oqcha|Toshvoy/u.test(establishedUzSeries.story_text), 'Established Uzbek series fallback must not restart the fixed flagship cast after a language/session continuation.')\n\n  const spaceOne = buildSafeFallback({ ...baseContext, stylePackId: 'stars_and_space' })\n",
)

print('v73 preflight hardening patch applied')
