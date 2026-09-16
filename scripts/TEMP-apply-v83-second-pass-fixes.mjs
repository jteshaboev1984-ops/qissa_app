import fs from 'node:fs'

const path = 'supabase/functions/story-generate/story-architecture.ts'
let text = fs.readFileSync(path, 'utf8')
const replaceOnce = (from, to, label) => {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected exactly one match, got ${count}`)
  text = text.replace(from, to)
}

replaceOnce(
  "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
  "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
  'RU validator import',
)
replaceOnce(
  "  if (genericHeroAliasNeedsRewrite(context, naturalLanguageBlueprint)) errors.push('blueprint_generic_hero_alias_requires_rewrite')\n  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')",
  "  if (genericHeroAliasNeedsRewrite(context, naturalLanguageBlueprint)) errors.push('blueprint_generic_hero_alias_requires_rewrite')\n  if (context.language === 'ru' && russianHeroTokenNeedsRewrite(naturalLanguageBlueprint.join(' '), context.heroType)) errors.push('blueprint_russian_hero_requires_rewrite')\n  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')",
  'RU immutable grammar preflight',
)
replaceOnce(
  "      if (typeof typed.effect_summary !== 'string' || typed.effect_summary.trim().length < 5) errors.push('invalid_blueprint_effect_summary')",
  "      if (typeof typed.effect_summary !== 'string' || typed.effect_summary.trim().length < 8) errors.push('invalid_blueprint_effect_summary')",
  'effect summary threshold',
)
replaceOnce(
  "  if (context.episodeIndex === 1) {\n    if (!value.decision_point?.trim()) errors.push('missing_blueprint_decision_point')\n    if (typeof value.next_episode_preview !== 'string' || !value.next_episode_preview.trim()) errors.push('missing_blueprint_preview')\n  } else {\n    if (value.decision_point?.trim()) errors.push('continuation_blueprint_has_decision_point')\n    if (value.next_episode_preview?.trim()) errors.push('continuation_blueprint_has_preview')\n  }",
  "  if (context.episodeIndex === 1) {\n    if (!value.decision_point?.trim()) errors.push('missing_blueprint_decision_point')\n    if (context.storyMode === 'series') {\n      if (typeof value.next_episode_preview !== 'string' || !value.next_episode_preview.trim()) errors.push('missing_blueprint_preview')\n    } else if (typeof value.next_episode_preview === 'string' && value.next_episode_preview.trim()) {\n      errors.push('unexpected_blueprint_preview')\n    }\n  } else {\n    if (value.decision_point?.trim()) errors.push('continuation_blueprint_has_decision_point')\n    if (value.next_episode_preview?.trim()) errors.push('continuation_blueprint_has_preview')\n  }",
  'one-time preview validation',
)
replaceOnce(
  "    context.episodeIndex === 1\n      ? 'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.'\n      : 'For Episode 2 next_episode_preview must be exactly an empty string. Do not promise another segment or repeat the selected choice.',",
  "    context.storyMode === 'series' && context.episodeIndex === 1\n      ? 'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.'\n      : 'For one-time stories and Episode 2, next_episode_preview must be exactly an empty string. Do not promise another segment or repeat the selected choice.',",
  'one-time preview system prompt',
)
replaceOnce(
  "      next_episode_preview: context.episodeIndex === 1 ? 'one branch-neutral in-world sentence' : 'empty string',",
  "      next_episode_preview: context.storyMode === 'series' && context.episodeIndex === 1 ? 'one branch-neutral in-world sentence' : 'empty string',",
  'one-time preview output contract',
)

fs.writeFileSync(path, text)

const testPath = 'scripts/check-story-cross-layer-contracts.mjs'
let test = fs.readFileSync(testPath, 'utf8')
if (test.includes('C7: direct-copy effect_summary')) throw new Error('second-pass regressions already present')
const marker = "console.log('Cross-layer story contracts GREEN: C1–C5, standalone/mixed repair, insertion, pre-Narrator validation, exact bridge IDs, neutral decision and malformed preview; zero provider calls.')\n"
if (!test.includes(marker)) throw new Error('cross-layer test marker missing')
const extra = `\n// C7: direct-copy effect_summary must satisfy the downstream candidate threshold before Narrator spend.\nconst shortEffect = structuredClone(blueprint)\nshortEffect.choices[0].effect_summary = '1234567'\nassert.ok(validateStoryBlueprint(context, shortEffect).includes('invalid_blueprint_effect_summary'), 'C7 short effect_summary reached Narrator')\n\n// C8: one_time E1 is self-contained and must keep nextEpisodePreview empty at both layers.\nconst oneTimeContext = normalizeStoryRequest({\n  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'one_time', storyMood: 'bedtime' },\n  seriesState: { id: 'one-time-contract', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },\n})\nassert.ok(oneTimeContext && oneTimeContext.episodeIndex === 1)\nconst oneTimeBlueprint = structuredClone(blueprint)\noneTimeBlueprint.next_episode_preview = ''\nconst oneTimeBlueprintErrors = validateStoryBlueprint(oneTimeContext, oneTimeBlueprint)\nassert.ok(!oneTimeBlueprintErrors.includes('missing_blueprint_preview') && !oneTimeBlueprintErrors.includes('unexpected_blueprint_preview'), \\`C8 empty one_time preview rejected: \\${oneTimeBlueprintErrors.join(',')}\\`)\nconst oneTimeBadPreview = structuredClone(oneTimeBlueprint)\noneTimeBadPreview.next_episode_preview = 'Bu hikoya davom etadi.'\nassert.ok(validateStoryBlueprint(oneTimeContext, oneTimeBadPreview).includes('unexpected_blueprint_preview'), 'C8 non-empty one_time preview admitted upstream')\nconst oneTimeCandidate = { ...candidate, nextEpisodePreview: '' }\nconst oneTimeCandidateErrors = validateCandidate(oneTimeContext, oneTimeCandidate)\nassert.ok(!oneTimeCandidateErrors.includes('missing_preview') && !oneTimeCandidateErrors.includes('unexpected_preview'), 'C8 downstream one_time preview contract disagrees')\n\n// C9: immutable Russian blueprint fields must reject raw-token grammar Repair cannot change.\nconst ruContext = normalizeStoryRequest({\n  selections: { ageGroup: '5-7', language: 'ru', heroType: 'girl_hero', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },\n  seriesState: { id: 'ru-contract', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },\n})\nassert.ok(ruContext)\nconst ruBlueprint = structuredClone(blueprint)\nruBlueprint.central_goal = 'Подготовить подарок для друга'\nruBlueprint.setting_anchor = 'уютный лес'\nruBlueprint.beats = ['{{HERO}} говорит с другом', 'Друг показывает подарок', '{{HERO}} слушает идею', 'Друг ждёт ответа']\nruBlueprint.decision_point = 'Что сделать дальше?'\nruBlueprint.next_episode_preview = 'История о подарке продолжится.'\nruBlueprint.state_patch = { ...patch('Друг ждёт подарок.'), open_arc: 'Подарок для друга' }\nruBlueprint.choices = [\n  { choice_id: 'a', text: 'Сделать рисунок', effect_summary: 'Друг подходит к {{HERO}}.', resolution_goal: '{{HERO}} заканчивает рисунок.', tomorrow_seed: 'Друг покажет рисунок.', choice_icon: '🎁', state_patch: { ...patch('Рисунок готов.'), open_arc: 'Подарок для друга' }, value_alignment: ['kindness'] },\n  { choice_id: 'b', text: 'Спеть песню', effect_summary: '{{HERO}} поёт песню.', resolution_goal: '{{HERO}} заканчивает песню.', tomorrow_seed: 'Друг вспомнит песню.', choice_icon: '🎵', state_patch: { ...patch('Песня прозвучала.'), open_arc: 'Подарок для друга' }, value_alignment: ['friendship'] },\n]\nassert.ok(validateStoryBlueprint(ruContext, ruBlueprint).includes('blueprint_russian_hero_requires_rewrite'), 'C9 immutable RU token grammar reached Narrator/Repair')\n\nconsole.log('Cross-layer story contracts GREEN: C1–C9, including effect-summary alignment, one-time preview parity and immutable RU hero grammar; zero provider calls.')\n`
test = test.replace(marker, extra)
fs.writeFileSync(testPath, test)
console.log('Applied C7-C9 source fixes and permanent regressions.')
