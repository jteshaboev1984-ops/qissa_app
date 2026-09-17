import { isRecord, type NormalizedStoryContext, type StoryCandidate } from './contracts.ts'
import { hasSingleLanguageMismatch } from './language.ts'

/**
 * Diagnostic ONLY. The release validator remains the authoritative aggregate language gate.
 * All returned values are fixed field identifiers, never story text, names, or fragments.
 */
export const candidateLanguageMismatchFieldCodes = (
  context: Pick<NormalizedStoryContext, 'language' | 'recurringCharacters'>,
  candidate: StoryCandidate,
): string[] => {
  const fields: Array<{ code: string; value: string }> = []
  const add = (code: string, value: unknown) => {
    if (typeof value === 'string' && value.length > 0) fields.push({ code, value })
  }
  const addPatch = (code: string, patch: unknown) => {
    if (!isRecord(patch)) return
    for (const key of ['last_event', 'new_friend', 'hero_trait', 'open_arc']) add(code, patch[key])
    for (const key of ['relationship_updates', 'canon_updates']) {
      const entries = patch[key]
      if (Array.isArray(entries)) for (const entry of entries) if (isRecord(entry)) add(code, entry.value)
    }
  }

  add('title', candidate.title)
  add('story_text', candidate.story_text)
  add('preview', candidate.nextEpisodePreview)
  addPatch('state_patch', candidate.state_patch)
  if (Array.isArray(candidate.choices)) candidate.choices.forEach((choice, index) => {
    if (!isRecord(choice)) return
    const prefix = index === 0 ? 'choice_1' : index === 1 ? 'choice_2' : 'choice_other'
    add(`${prefix}_text`, choice.text)
    add(`${prefix}_effect`, choice.effect_summary)
    add(`${prefix}_resolution`, choice.resolution_text)
    add(`${prefix}_seed`, choice.tomorrow_seed)
    addPatch(`${prefix}_state_patch`, choice.state_patch)
  })
  if (Array.isArray(candidate.vocabulary)) for (const entry of candidate.vocabulary) {
    if (!isRecord(entry)) continue
    add('vocabulary_word', entry.word)
    add('vocabulary_example', entry.example)
  }

  const allValues = fields.map(({ value }) => value)
  if (!hasSingleLanguageMismatch(context.language, allValues, context.recurringCharacters)) return []
  const codes = fields
    .filter(({ value }) => hasSingleLanguageMismatch(context.language, [value], context.recurringCharacters))
    .map(({ code }) => code)
  // A long-text aggregate heuristic can trigger even when no individual short field does.
  return codes.length > 0 ? [...new Set(codes)] : ['aggregate_only']
}
