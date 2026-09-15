from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1))

arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    "    'Both choices must be safe, understandable, meaningfully different hero actions. Neither choice may be a trick or a morally bad option.',",
    "    context.episodeIndex === 1\n      ? 'Both choices must be safe, understandable, meaningfully different hero actions. Neither choice may be a trick or a morally bad option.'\n      : 'Episode 2 has no child decision menu. Return choices as an empty array, decision_point as an empty string, and next_episode_preview as an empty string.',",
)
replace_once(
    arch,
    "    'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',",
    "    context.episodeIndex === 1\n      ? 'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.'\n      : 'Do not create, describe, compare or preview any new child choice in Episode 2. The already-confirmed choice is memory, not a new decision point.',",
)
replace_once(
    arch,
    "    'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.',",
    "    context.episodeIndex === 1\n      ? 'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.'\n      : 'For Episode 2 next_episode_preview must be exactly an empty string. Do not promise another segment or repeat the selected choice.',",
)
replace_once(
    arch,
    "      episode_1_choices: context.episodeIndex === 1 ? 2 : 0,\n      continuity_callbacks: '0-3 relevant remembered facts or relationships, maximum 5',",
    "      episode_1_choices: context.episodeIndex === 1 ? 2 : 0,\n      choices: context.episodeIndex === 1 ? 'exactly 2' : 'exactly 0',\n      decision_point: context.episodeIndex === 1 ? 'one non-empty child decision point' : 'empty string',\n      next_episode_preview: context.episodeIndex === 1 ? 'one branch-neutral in-world sentence' : 'empty string',\n      continuity_callbacks: '0-3 relevant remembered facts or relationships, maximum 5',",
)

p = Path(arch)
text = p.read_text()
marker = "export const validateStoryBlueprint = (context: NormalizedStoryContext, blueprint: unknown): string[] => {"
helper = """export const enforceStoryBlueprintContextContract = (\n  context: NormalizedStoryContext,\n  blueprint: StoryBlueprint,\n): StoryBlueprint => context.episodeIndex === 2\n  ? { ...blueprint, choices: [], decision_point: '', next_episode_preview: '' }\n  : blueprint\n\n"""
if text.count(marker) != 1:
    raise SystemExit('validateStoryBlueprint marker mismatch')
p.write_text(text.replace(marker, helper + marker, 1))

split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    "import { narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'",
    "import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'",
)
replace_once(
    split,
    "  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)",
    "  blueprint = enforceStoryBlueprintContextContract(context, blueprint)\n  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)",
)

check = Path('scripts/check-story-ai-split.mjs')
text = check.read_text()
old_import = "import { hasSingleLanguageMismatch } from '../supabase/functions/story-generate/language.ts'"
new_import = old_import + "\nimport { enforceStoryBlueprintContextContract } from '../supabase/functions/story-generate/story-architecture.ts'"
if text.count(old_import) != 1:
    raise SystemExit('split check import mismatch')
text = text.replace(old_import, new_import, 1)

arch_frag = "  'next_episode_preview is child-facing story copy',\n])"
new_arch_frag = "  'next_episode_preview is child-facing story copy',\n  'Episode 2 has no child decision menu',\n  \"choices: context.episodeIndex === 1 ? 'exactly 2' : 'exactly 0'\",\n  \"decision_point: context.episodeIndex === 1 ? 'one non-empty child decision point' : 'empty string'\",\n  'enforceStoryBlueprintContextContract',\n])"
if text.count(arch_frag) != 1:
    raise SystemExit('architecture fragment marker mismatch')
text = text.replace(arch_frag, new_arch_frag, 1)

marker = "const narrationSchemaStart = architecture.indexOf('export const storyNarrationSchema')"
regression = """const continuationBlueprint = enforceStoryBlueprintContextContract(\n  { episodeIndex: 2 },\n  {\n    plan_version: 'split-v1', central_goal: 'Продолжить историю', setting_anchor: 'лес', continuity_callbacks: [], beats: ['один спокойный шаг', 'второй спокойный шаг', 'третий спокойный шаг', 'тихий финал'],\n    decision_point: 'Ошибочный новый выбор',\n    choices: [{ choice_id: 'wrong', text: 'Новый выбор', effect_summary: 'ошибка', resolution_goal: 'ошибка', tomorrow_seed: '', choice_icon: '✨', state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }, value_alignment: ['kindness'] }],\n    state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },\n    next_episode_preview: 'Ошибочный preview',\n  },\n)\nif (continuationBlueprint.choices.length !== 0 || continuationBlueprint.decision_point !== '' || continuationBlueprint.next_episode_preview !== '') {\n  failures.push('Episode 2 context contract must deterministically remove choices, decision point and preview before blueprint validation')\n}\n\n"""
if text.count(marker) != 1:
    raise SystemExit('narration schema marker mismatch')
check.write_text(text.replace(marker, regression + marker, 1))
