from pathlib import Path

arch_path = Path('supabase/functions/story-generate/story-architecture.ts')
provider_path = Path('supabase/functions/story-generate/split-openai.ts')
check_path = Path('scripts/check-story-ai-split.mjs')

arch = arch_path.read_text()
arch = arch.replace(
"const textContainsHeroToken = (value: string): boolean => value.includes('{{HERO}}') || value.includes('QISSA_HERO')\n",
"const textContainsHeroToken = (value: string): boolean => value.includes('{{HERO}}') || value.includes('QISSA_HERO')\n\nconst stableMemoryKey = /^[a-z][a-z0-9_.-]{0,47}$/u\n\nconst patchHasStableMemoryKeys = (context: NormalizedStoryContext, patch: CandidatePatch): boolean => {\n  const existingCanon = new Set(Object.keys(context.canonState))\n  const existingRelationships = new Set(Object.keys(context.relationshipState))\n  return patch.canon_updates.every((entry) => existingCanon.has(entry.key) || stableMemoryKey.test(entry.key)) &&\n    patch.relationship_updates.every((entry) => existingRelationships.has(entry.key) || stableMemoryKey.test(entry.key))\n}\n"
)
arch = arch.replace(
"    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')\n    if (duplicateEntryKeys(value.state_patch.canon_updates)) errors.push('duplicate_blueprint_canon_keys')\n",
"    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')\n    if (duplicateEntryKeys(value.state_patch.canon_updates)) errors.push('duplicate_blueprint_canon_keys')\n    if (!patchHasStableMemoryKeys(context, value.state_patch)) errors.push('unstable_blueprint_memory_key')\n"
)
arch = arch.replace(
"        if (typed.state_patch.canon_updates.length > 4) errors.push('blueprint_choice_state_too_large')\n        if (duplicateEntryKeys(typed.state_patch.canon_updates)) errors.push('duplicate_blueprint_choice_canon_keys')\n",
"        if (typed.state_patch.canon_updates.length > 4) errors.push('blueprint_choice_state_too_large')\n        if (duplicateEntryKeys(typed.state_patch.canon_updates)) errors.push('duplicate_blueprint_choice_canon_keys')\n        if (!patchHasStableMemoryKeys(context, typed.state_patch)) errors.push('unstable_blueprint_choice_memory_key')\n"
)
arch = arch.replace(
"    'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',\n",
"    'All natural-language blueprint values, including effect summaries, state values, arc text and preview text, must be in the requested story language. Memory keys are machine identifiers and are the only exception.',\n    'New canon and relationship keys must be stable lowercase ASCII semantic identifiers using letters, digits, underscore, dot or hyphen. Reuse an existing memory key exactly when updating an existing fact instead of creating a synonym.',\n    'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',\n"
)
arch = arch.replace(
"    age_group: context.ageGroup,\n    style_pack: context.stylePackId,\n",
"    age_group: context.ageGroup,\n    hero: {\n      type: context.heroType,\n      note: 'Plan actions physically and socially appropriate for this hero type without inferring gender stereotypes or inventing child identity facts.',\n    },\n    style_pack: context.stylePackId,\n"
)
arch_path.write_text(arch)

provider = provider_path.read_text()
provider = provider.replace(
"  const prompts = buildArchitectPrompts(context)\n  return requestStructured<StoryBlueprint>(\n",
"  const prompts = buildArchitectPrompts(context)\n  const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)}`\n  return requestStructured<StoryBlueprint>(\n"
)
provider = provider.replace(
"    storyBlueprintSchema,\n    prompts.system,\n    prompts.user,\n",
"    storyBlueprintSchema,\n    localizedSystem,\n    prompts.user,\n"
)
provider_path.write_text(provider)

check = check_path.read_text()
check = check.replace(
"  'Prefer updating an existing canon key when a persistent fact changes.',\n",
"  'Prefer updating an existing canon key when a persistent fact changes.',\n  'New canon and relationship keys must be stable lowercase ASCII semantic identifiers',\n  'type: context.heroType',\n  'patchHasStableMemoryKeys',\n"
)
check = check.replace(
"requireFragments('split provider', provider, [\n",
"if ((provider.match(/storyLocalizationSystem\\(context\\)/g) ?? []).length < 2) {\n  failures.push('Architect and Narrator must both use storyLocalizationSystem')\n}\n\nrequireFragments('split provider', provider, [\n"
)
check_path.write_text(check)
