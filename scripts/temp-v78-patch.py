from pathlib import Path

architecture_path = Path('supabase/functions/story-generate/story-architecture.ts')
orchestrator_path = Path('supabase/functions/story-generate/split-index.ts')
split_check_path = Path('scripts/check-story-ai-split.mjs')

architecture = architecture_path.read_text()
orchestrator = orchestrator_path.read_text()
split_check = split_check_path.read_text()

architecture_anchor = """const patchHasStableMemoryKeys = (context: NormalizedStoryContext, patch: CandidatePatch): boolean => {\n"""
if architecture.count(architecture_anchor) != 1:
    raise SystemExit('architecture normalization anchor mismatch')
architecture_normalizer = """export const normalizeStoryBlueprintHeroReferences = (\n  blueprint: StoryBlueprint,\n): { blueprint: StoryBlueprint; normalizedCount: number } => {\n  let normalizedCount = 0\n  const choices = blueprint.choices.map((choice) => {\n    if (textContainsHeroToken(choice.resolution_goal) || !textContainsHeroToken(choice.effect_summary)) return choice\n    normalizedCount += 1\n    return {\n      ...choice,\n      // effect_summary already owns the selected hero action. Reuse that immutable branch\n      // fact to anchor a result-centered resolution_goal without inventing a new action.\n      resolution_goal: `${choice.effect_summary} ${choice.resolution_goal}`.trim(),\n    }\n  })\n  return { blueprint: { ...blueprint, choices }, normalizedCount }\n}\n\n"""
architecture = architecture.replace(architecture_anchor, architecture_normalizer + architecture_anchor)

old_import = "import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'\n"
new_import = "import { enforceStoryBlueprintContextContract, narrationToCandidate, normalizeStoryBlueprintHeroReferences, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'\n"
if orchestrator.count(old_import) != 1:
    raise SystemExit('orchestrator import anchor mismatch')
orchestrator = orchestrator.replace(old_import, new_import)

old_flow = """  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)\n  blueprint = normalizedBlueprint.blueprint\n  blueprintKeysNormalized = normalizedBlueprint.normalizedCount\n  const blueprintErrors = validateStoryBlueprint(context, blueprint)\n"""
new_flow = """  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)\n  blueprint = normalizedBlueprint.blueprint\n  blueprintKeysNormalized = normalizedBlueprint.normalizedCount\n  blueprint = normalizeStoryBlueprintHeroReferences(blueprint).blueprint\n  const blueprintErrors = validateStoryBlueprint(context, blueprint)\n"""
if orchestrator.count(old_flow) != 1:
    raise SystemExit('orchestrator normalization flow anchor mismatch')
orchestrator = orchestrator.replace(old_flow, new_flow)

old_split_import = "import { normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'\n"
new_split_import = "import { normalizeStoryBlueprintHeroReferences, normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'\n"
if split_check.count(old_split_import) != 1:
    raise SystemExit('split-check import anchor mismatch')
split_check = split_check.replace(old_split_import, new_split_import)

regression_anchor = """requireLanguageGuard(duplicateHeroInStateErrors.includes('blueprint_generic_hero_alias_requires_rewrite'), 'generic qizaloq identity inside state memory must still fail before Narrator')\n\n"""
if split_check.count(regression_anchor) != 1:
    raise SystemExit('split-check v77 regression anchor mismatch')
regression = r"""requireLanguageGuard(duplicateHeroInStateErrors.includes('blueprint_generic_hero_alias_requires_rewrite'), 'generic qizaloq identity inside state memory must still fail before Narrator')

const resultCenteredResolutionBlueprint = structuredClone(heroNeutralStateBlueprint)
resultCenteredResolutionBlueprint.choices[0].resolution_goal = 'Momiq tayyor rasmni ikki panjasi bilan ehtiyotkor ushlaydi.'
const resultCenteredBefore = validateStoryBlueprint(heroNeutralStateContext, resultCenteredResolutionBlueprint)
requireLanguageGuard(resultCenteredBefore.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'result-centered resolution goal should expose the missing hero anchor before normalization')
const resultCenteredNormalized = normalizeStoryBlueprintHeroReferences(resultCenteredResolutionBlueprint)
const resultCenteredAfter = validateStoryBlueprint(heroNeutralStateContext, resultCenteredNormalized.blueprint)
requireLanguageGuard(resultCenteredNormalized.normalizedCount === 1, 'exactly one result-centered resolution goal should be deterministically hero-anchored')
requireLanguageGuard(!resultCenteredAfter.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'hero-bearing effect_summary must safely anchor a result-centered resolution_goal without another provider call')
requireLanguageGuard(resultCenteredNormalized.blueprint.choices[0].resolution_goal.includes('{{HERO}}'), 'normalized resolution_goal must inherit the canonical hero token from immutable effect_summary')

const missingBothHeroAnchorsBlueprint = structuredClone(heroNeutralStateBlueprint)
missingBothHeroAnchorsBlueprint.choices[0].effect_summary = 'Momiq tayyor rasmni ko‘radi.'
missingBothHeroAnchorsBlueprint.choices[0].resolution_goal = 'Momiq rasmni ikki panjasi bilan ushlaydi.'
const missingBothNormalized = normalizeStoryBlueprintHeroReferences(missingBothHeroAnchorsBlueprint)
const missingBothErrors = validateStoryBlueprint(heroNeutralStateContext, missingBothNormalized.blueprint)
requireLanguageGuard(missingBothNormalized.normalizedCount === 0, 'normalizer must not invent hero participation when both branch consequence fields omit the hero')
requireLanguageGuard(missingBothErrors.includes('blueprint_choice_effect_missing_hero_token') && missingBothErrors.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'missing hero in both branch consequence fields must remain fail-closed')

const aliasInResolutionBlueprint = structuredClone(resultCenteredResolutionBlueprint)
aliasInResolutionBlueprint.choices[0].resolution_goal = 'Qizaloq rasmni Momiqqa beradi.'
const aliasInResolutionNormalized = normalizeStoryBlueprintHeroReferences(aliasInResolutionBlueprint)
const aliasInResolutionErrors = validateStoryBlueprint(heroNeutralStateContext, aliasInResolutionNormalized.blueprint)
requireLanguageGuard(aliasInResolutionErrors.includes('blueprint_generic_hero_alias_requires_rewrite'), 'deterministic resolution-goal anchoring must not hide a generic qizaloq duplicate identity')

"""
split_check = split_check.replace(regression_anchor, regression)

architecture_fragment = "  'normalizeStoryBlueprintMemoryKeys',\n"
if split_check.count(architecture_fragment) != 1:
    raise SystemExit('architecture fragment anchor mismatch')
split_check = split_check.replace(architecture_fragment, architecture_fragment + "  'normalizeStoryBlueprintHeroReferences',\n")

orchestrator_fragment = "  'validateStoryBlueprint(context, blueprint)',\n"
if split_check.count(orchestrator_fragment) != 1:
    raise SystemExit('orchestrator fragment anchor mismatch')
split_check = split_check.replace(orchestrator_fragment, "  'normalizeStoryBlueprintHeroReferences(blueprint).blueprint',\n" + orchestrator_fragment)

architecture_path.write_text(architecture)
orchestrator_path.write_text(orchestrator)
split_check_path.write_text(split_check)
