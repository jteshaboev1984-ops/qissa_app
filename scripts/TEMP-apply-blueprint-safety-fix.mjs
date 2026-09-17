import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Temporary, exact-content patch tool. Only invoked by its one-shot branch workflow.
const replaceOnce = (path, before, after) => {
  const source = readFileSync(path, 'utf8')
  assert.equal(source.split(before).length, 2, `expected exactly one old fragment in ${path}`)
  writeFileSync(path, source.replace(before, after))
  console.log(`PATCH_OK:${path}`)
}
const safety = 'supabase/functions/story-generate/safety.ts'
replaceOnce(safety,
  "    'ovoz ber', 'siyosiy partiya', 'bizning rahbar doim haq',",
  "    'siyosiy partiya', 'bizning rahbar doim haq',")
replaceOnce(safety,
  `  ])\n  flags.religious_push = includesAny(text, [`,
  String.raw`  ])
  // Uzbek past-tense "ovoz berdi" can mean a bird or child made a sound;
  // match voting imperatives as whole forms, never prefixes of descriptive verbs.
  flags.political_push ||= /(?<![\p{L}\p{M}\p{N}_])ovoz\s+ber(?:ing(?:lar)?)?(?![\p{L}\p{M}\p{N}_])/u.test(text)
  flags.religious_push = includesAny(text, [`)
replaceOnce(safety,
  `export const scanRuleBasedSafetyValues = (
  context: NormalizedStoryContext,
  values: Array<string | null | undefined>,
): SafetyFlags => scanRuleBasedSafety(context, {
  title: '',
  story_text: values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(' '),
  choices: [],
  state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },
  vocabulary: [],
  nextEpisodePreview: '',
})`,
  `export const scanRuleBasedSafetyValues = (
  context: NormalizedStoryContext,
  values: Array<string | null | undefined>,
): SafetyFlags => mergeFlags(...values
  // Field boundaries are semantic boundaries: never synthesize forbidden phrases
  // by concatenating the end of one independent blueprint value with another.
  .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  .map((value) => scanRuleBasedSafety(context, {
    title: '',
    story_text: value,
    choices: [],
    state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },
    vocabulary: [],
    nextEpisodePreview: '',
  })),
)`)
const architecture = 'supabase/functions/story-generate/story-architecture.ts'
replaceOnce(architecture,
  `export const validateStoryBlueprint = (context: NormalizedStoryContext, blueprint: unknown): string[] => {`,
  `// Return fixed category identifiers only; never expose generated blueprint prose.
export const blueprintRuleSafetyCategories = (context: NormalizedStoryContext, blueprint: StoryBlueprint): string[] =>
  Object.entries(scanRuleBasedSafetyValues(context, blueprintNaturalLanguageValues(blueprint)))
    .filter(([, matched]) => matched)
    .map(([category]) => category)

export const validateStoryBlueprint = (context: NormalizedStoryContext, blueprint: unknown): string[] => {`)
replaceOnce(architecture,
  `if (Object.values(scanRuleBasedSafetyValues(context, naturalLanguageBlueprint)).some(Boolean)) errors.push('blueprint_rule_safety')`,
  `if (blueprintRuleSafetyCategories(context, value).length > 0) errors.push('blueprint_rule_safety')`)
const index = 'supabase/functions/story-generate/split-index.ts'
replaceOnce(index,
  `import { enforceStoryBlueprintContextContract, narrationToCandidate,`,
  `import { blueprintRuleSafetyCategories, enforceStoryBlueprintContextContract, narrationToCandidate,`)
replaceOnce(index,
  `  const blueprintErrors = validateStoryBlueprint(context, blueprint)
  if (blueprintErrors.length > 0) {
    lastFailureClass = 'blueprint-validation'
    trace.push(\`blueprint-validation:\${blueprintErrors.join(',')}\`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
    })
  }`,
  `  const blueprintErrors = validateStoryBlueprint(context, blueprint)
  if (blueprintErrors.length > 0) {
    lastFailureClass = 'blueprint-validation'
    trace.push(\`blueprint-validation:\${blueprintErrors.join(',')}\`)
    return safeFallback(context, origin, 'generation-or-safety-failed', {
      ...runtimeProviderMetadata,
      ...claimMetadata(claim),
      'X-QISSA-Generation-Failure-Class': lastFailureClass,
      'X-QISSA-Generation-Failure-Trace': compactFailureTrace(trace),
      'X-QISSA-Provider-Calls': String(providerCalls),
      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),
      ...(blueprintErrors.includes('blueprint_rule_safety') ? {
        'X-QISSA-Blueprint-Safety-Categories': blueprintRuleSafetyCategories(context, blueprint).join(','),
      } : {}),
    })
  }`)
console.log('PATCH_ALL_THREE_SOURCE_FILES_READY: category-only diagnostics, isolated scanner fields, Uzbek imperative matching; zero provider or database calls')
