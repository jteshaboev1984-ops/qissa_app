#!/usr/bin/env python3
"""Temporary exact-match source patch; executed only by a read-only-provider GitHub job.
No model, production, database, account credential or external API access.
"""
from pathlib import Path


def replace_once(name: str, before: str, after: str) -> None:
    path = Path(name)
    data = path.read_text(encoding='utf-8')
    count = data.count(before)
    if count != 1:
        raise SystemExit(f'ABORT {name}: expected 1 exact match, found {count}: {before[:70]}')
    path.write_text(data.replace(before, after, 1), encoding='utf-8')
    print(f'PATCHED {name}: {before[:65]}')

root = 'supabase/functions/story-generate/'
# C1: precedence must follow the executable routing decision, including single-code defects.
replace_once(root + 'prompt.ts',
    "    'If there is no story length or Episode 2 bedtime-coda failure, return both story_rewrite and story_expansion as null.',",
    "    'If full-story rewrite takes precedence according to repair_plan, always return a complete non-null story_rewrite and title_rewrite, with story_expansion null, even if there is no story-length or bedtime-coda failure. Otherwise, for a pure insertion return only story_expansion. Only when neither rewriting nor insertion is required may both story_rewrite and story_expansion be null.',")

# C2: Architect-owned values must obey the same minimums as the final candidate.
replace_once(root + 'story-architecture.ts',
    "      if (typeof typed.tomorrow_seed !== 'string') errors.push('invalid_blueprint_tomorrow_seed')",
    "      if (typeof typed.tomorrow_seed !== 'string' || typed.tomorrow_seed.length < 8) errors.push('invalid_blueprint_tomorrow_seed')")
replace_once(root + 'story-architecture.ts',
    "      if (typeof typed.choice_icon !== 'string' || typed.choice_icon.length > 8) errors.push('invalid_blueprint_choice_icon')",
    "      if (typeof typed.choice_icon !== 'string' || !typed.choice_icon.trim() || typed.choice_icon.length > 8) errors.push('invalid_blueprint_choice_icon')")
replace_once(root + 'story-architecture.ts',
    "      if (!Array.isArray(typed.value_alignment) || typed.value_alignment.some((item) => !positiveValues.has(item as PositiveValue))) {",
    "      if (!Array.isArray(typed.value_alignment) || typed.value_alignment.length === 0 || typed.value_alignment.some((item) => !positiveValues.has(item as PositiveValue))) {")

# C3: reject extra/duplicate Narrator bridge entries rather than silently overwriting.
replace_once(root + 'story-architecture.ts',
    "  const resolutionById = new Map(narration.choice_resolutions.map((item) => [item.choice_id, item.resolution_text]))",
    "  if (narration.choice_resolutions.length !== blueprint.choices.length) throw new Error('narration_resolution_contract_mismatch')\n  const resolutionById = new Map(narration.choice_resolutions.map((item) => [item.choice_id, item.resolution_text]))")

# C4: refuse forbidden decision-point menu before paying the Narrator to follow it.
replace_once(root + 'story-architecture.ts',
    "import { branchingPreviewNeedsRewrite, genericHeroAliasNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
    "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'")
replace_once(root + 'story-architecture.ts',
    "  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')",
    "  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')\n  else if (context.episodeIndex === 1 && choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point)) errors.push('blueprint_choice_menu_scaffolding')")

# C5: do not call trim() on an invalid preview; return structured errors.
replace_once(root + 'safety.ts',
    "  if (context.storyMode === 'series' && context.episodeIndex === 1 && !value.nextEpisodePreview.trim()) errors.push('missing_preview')",
    "  if (context.storyMode === 'series' && context.episodeIndex === 1 && typeof value.nextEpisodePreview === 'string' && !value.nextEpisodePreview.trim()) errors.push('missing_preview')")
replace_once(root + 'safety.ts',
    "  if ((context.storyMode === 'one_time' || context.episodeIndex === 2) && value.nextEpisodePreview.trim()) errors.push('unexpected_preview')",
    "  if ((context.storyMode === 'one_time' || context.episodeIndex === 2) && typeof value.nextEpisodePreview === 'string' && value.nextEpisodePreview.trim()) errors.push('unexpected_preview')")

print('C1-C5 exact-match patch complete; all files require regression, TypeScript, CI and review.')
