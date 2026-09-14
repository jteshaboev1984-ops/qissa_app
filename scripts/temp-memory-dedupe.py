from pathlib import Path

root = Path('.')
arch_path = root / 'supabase/functions/story-generate/story-architecture.ts'
arch = arch_path.read_text(encoding='utf-8')

old = r'''const canonicalizePatchMemoryKeys = (
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
'''
new = r'''type MemoryUpdateEntry = { key: string; value: string }

const canonicalizeMemoryEntries = (
  entries: MemoryUpdateEntry[],
  existingKeys: Set<string>,
  prefix: 'canon' | 'rel',
): { entries: MemoryUpdateEntry[]; normalizedCount: number } => {
  const byKey = new Map<string, MemoryUpdateEntry>()
  let normalizedCount = 0

  for (const entry of entries) {
    const key = existingKeys.has(entry.key) ? entry.key : canonicalNewMemoryKey(entry.key, prefix)
    if (key !== entry.key) normalizedCount += 1
    if (byKey.has(key)) normalizedCount += 1
    byKey.set(key, { ...entry, key })
  }

  return { entries: [...byKey.values()], normalizedCount }
}

const canonicalizePatchMemoryKeys = (
  context: NormalizedStoryContext,
  patch: CandidatePatch,
): { patch: CandidatePatch; normalizedCount: number } => {
  const existingCanon = new Set(Object.keys(context.canonState))
  const existingRelationships = new Set(Object.keys(context.relationshipState))
  const canon = canonicalizeMemoryEntries(patch.canon_updates, existingCanon, 'canon')
  const relationships = canonicalizeMemoryEntries(patch.relationship_updates, existingRelationships, 'rel')

  return {
    patch: {
      ...patch,
      canon_updates: canon.entries,
      relationship_updates: relationships.entries,
    },
    normalizedCount: canon.normalizedCount + relationships.normalizedCount,
  }
}
'''
if old not in arch:
    raise SystemExit('canonicalizePatchMemoryKeys block not found')
arch = arch.replace(old, new)
arch_path.write_text(arch, encoding='utf-8')

check_path = root / 'scripts/check-story-ai-split.mjs'
check = check_path.read_text(encoding='utf-8')
needle = "  'canonicalNewMemoryKey',\n"
addition = "  'canonicalizeMemoryEntries',\n  'byKey.has(key)',\n"
if addition not in check:
    check = check.replace(needle, needle + addition)
check_path.write_text(check, encoding='utf-8')
