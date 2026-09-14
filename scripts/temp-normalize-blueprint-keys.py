from pathlib import Path

arch_path = Path('supabase/functions/story-generate/story-architecture.ts')
index_path = Path('supabase/functions/story-generate/split-index.ts')
check_path = Path('scripts/check-story-ai-split.mjs')

arch = arch_path.read_text()
needle = "const stableMemoryKey = /^[a-z][a-z0-9_.-]{0,47}$/u\n\nconst patchHasStableMemoryKeys"
replacement = """const stableMemoryKey = /^[a-z][a-z0-9_.-]{0,47}$/u

const memoryKeyHash = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const canonicalNewMemoryKey = (rawKey: string, prefix: 'canon' | 'rel'): string => {
  const lowered = rawKey.trim().toLocaleLowerCase('en-US')
  if (stableMemoryKey.test(lowered)) return lowered

  const asciiSlug = lowered
    .normalize('NFKD')
    .replace(/[^\\x00-\\x7F]/gu, '')
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
  const prefixed = asciiSlug && /^[a-z]/u.test(asciiSlug) ? asciiSlug : `${prefix}_${asciiSlug}`.replace(/_+$/u, '')
  const candidate = prefixed || prefix
  if (stableMemoryKey.test(candidate)) return candidate

  const suffix = memoryKeyHash(lowered || rawKey)
  const stem = candidate.replace(/[^a-z0-9_.-]/gu, '').slice(0, Math.max(1, 47 - suffix.length - 1)) || prefix
  const withHash = `${/^[a-z]/u.test(stem) ? stem : `${prefix}_${stem}`}_${suffix}`.slice(0, 48)
  return stableMemoryKey.test(withHash) ? withHash : `${prefix}_${suffix}`.slice(0, 48)
}

const canonicalizePatchMemoryKeys = (
  context: NormalizedStoryContext,
  patch: CandidatePatch,
): { patch: CandidatePatch; normalizedCount: number } => {
  const existingCanon = new Set(Object.keys(context.canonState))
  const existingRelationships = new Set(Object.keys(context.relationshipState))
  let normalizedCount = 0

  const canon_updates = patch.canon_updates.map((entry) => {
    const key = existingCanon.has(entry.key) ? entry.key : canonicalNewMemoryKey(entry.key, 'canon')
    if (key !== entry.key) normalizedCount += 1
    return { ...entry, key }
  })
  const relationship_updates = patch.relationship_updates.map((entry) => {
    const key = existingRelationships.has(entry.key) ? entry.key : canonicalNewMemoryKey(entry.key, 'rel')
    if (key !== entry.key) normalizedCount += 1
    return { ...entry, key }
  })

  return { patch: { ...patch, canon_updates, relationship_updates }, normalizedCount }
}

export const normalizeStoryBlueprintMemoryKeys = (
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
): { blueprint: StoryBlueprint; normalizedCount: number } => {
  const topLevel = canonicalizePatchMemoryKeys(context, blueprint.state_patch)
  let normalizedCount = topLevel.normalizedCount
  const choices = blueprint.choices.map((choice) => {
    const normalized = canonicalizePatchMemoryKeys(context, choice.state_patch)
    normalizedCount += normalized.normalizedCount
    return { ...choice, state_patch: normalized.patch }
  })
  return {
    blueprint: { ...blueprint, state_patch: topLevel.patch, choices },
    normalizedCount,
  }
}

const patchHasStableMemoryKeys"""
if needle not in arch:
    raise SystemExit('architecture insertion point missing')
arch = arch.replace(needle, replacement)
arch_path.write_text(arch)

index = index_path.read_text()
index = index.replace(
"import { narrationToCandidate, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'",
"import { narrationToCandidate, normalizeStoryBlueprintMemoryKeys, validateStoryBlueprint, type StoryBlueprint } from './story-architecture.ts'"
)
index = index.replace(
"  let blueprint: StoryBlueprint\n  let candidate: StoryCandidate | null = null\n",
"  let blueprint: StoryBlueprint\n  let blueprintKeysNormalized = 0\n  let candidate: StoryCandidate | null = null\n"
)
index = index.replace(
"  const blueprintErrors = validateStoryBlueprint(context, blueprint)\n",
"  const normalizedBlueprint = normalizeStoryBlueprintMemoryKeys(context, blueprint)\n  blueprint = normalizedBlueprint.blueprint\n  blueprintKeysNormalized = normalizedBlueprint.normalizedCount\n  const blueprintErrors = validateStoryBlueprint(context, blueprint)\n"
)
index = index.replace(
"      'X-QISSA-Provider-Calls': String(providerCalls),\n    })\n  }\n\n  try {\n    providerCalls += 1\n    const narration",
"      'X-QISSA-Provider-Calls': String(providerCalls),\n      'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n    })\n  }\n\n  try {\n    providerCalls += 1\n    const narration",
1
)
# Add normalization count to successful publish metadata.
index = index.replace(
"        'X-QISSA-Provider-Calls': String(providerCalls),\n      },\n    )\n",
"        'X-QISSA-Provider-Calls': String(providerCalls),\n        'X-QISSA-Blueprint-Keys-Normalized': String(blueprintKeysNormalized),\n      },\n    )\n",
1
)
index_path.write_text(index)

check = check_path.read_text()
check = check.replace(
"  'patchHasStableMemoryKeys',\n",
"  'patchHasStableMemoryKeys',\n  'normalizeStoryBlueprintMemoryKeys',\n  'canonicalNewMemoryKey',\n  'existingCanon.has(entry.key)',\n  'existingRelationships.has(entry.key)',\n"
)
check_path.write_text(check)
