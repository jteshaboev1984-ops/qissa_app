import type { NormalizedStoryContext } from './contracts.ts'

// Narrow, deterministic canon gate. It deliberately does NOT judge whether
// prose is beautiful, whether an item should return, or whether two choices
// are narratively equivalent. Those require whole-branch editorial review.
type RecordEntry = { key: string; value: string }
type PatchLike = { canon_updates?: RecordEntry[] }
type CandidateLike = {
  state_patch?: PatchLike
  choices?: Array<{ state_patch?: PatchLike }>
}

const immutableIdentityKeys = new Set([
  'hero_name',
  'main_character',
  'hero_type',
  'hero_identity',
  'world_name',
  'world_id',
  'style_pack_id',
])

const entryMap = (patch?: PatchLike): Map<string, string> =>
  new Map(
    Array.isArray(patch?.canon_updates)
      ? patch.canon_updates
          .filter((item): item is RecordEntry =>
            Boolean(item) && typeof item.key === 'string' && typeof item.value === 'string')
          .map((item) => [item.key, item.value])
      : [],
  )

export const auditCanonTransitions = (
  context: Pick<NormalizedStoryContext, 'canonState' | 'heroName' | 'heroType' | 'stylePackId'>,
  candidate: CandidateLike,
): string[] => {
  const errors: string[] = []
  const patches = [candidate.state_patch, ...(candidate.choices ?? []).map((choice) => choice.state_patch)]
  const known: Record<string, string> = {
    ...context.canonState,
    // The normalized series identity wins over any stale/conflicting canon record.
    hero_name: context.heroName,
    main_character: context.heroName,
    hero_type: context.heroType,
    style_pack_id: context.stylePackId,
  }

  for (const patch of patches) {
    for (const [key, proposed] of entryMap(patch)) {
      if (!immutableIdentityKeys.has(key)) continue
      if (Object.hasOwn(known, key) && known[key] !== proposed) {
        errors.push('canon_immutable_identity_conflict:' + key)
      }
    }
  }

  // Common state is applied regardless of which option was selected. It must
  // not erase a choice's own method/location/status/relationship memory.
  const common = entryMap(candidate.state_patch)
  for (const choice of candidate.choices ?? []) {
    for (const [key, selected] of entryMap(choice.state_patch)) {
      if (common.has(key) && common.get(key) !== selected) {
        errors.push('canon_common_overwrites_choice:' + key)
      }
    }
  }
  return [...new Set(errors)]
}
