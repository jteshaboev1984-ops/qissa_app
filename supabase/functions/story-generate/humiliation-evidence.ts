import type { SafetyEvaluation, StoryCandidate } from './contracts.ts'

// Evidence is diagnostic only. A missing, unsupported or ambiguous quote NEVER clears
// a semantic safety flag or changes a publish/fallback decision.
export type HumiliationEvidenceLocation =
  | 'not_flagged' | 'missing' | 'invalid' | 'unmatched' | 'multiple'
  | 'title' | 'story_text' | 'next_episode_preview'
  | 'choice_1_text' | 'choice_1_effect_summary' | 'choice_1_resolution'
  | 'choice_2_text' | 'choice_2_effect_summary' | 'choice_2_resolution'
  | 'vocabulary_word' | 'vocabulary_translation' | 'vocabulary_example'

const prefix = 'humiliation_evidence:'

export const locateHumiliationEvidence = (
  candidate: StoryCandidate,
  evaluation: SafetyEvaluation,
): HumiliationEvidenceLocation => {
  if (evaluation.flags.humiliation !== true) return 'not_flagged'
  const evidenceNotes = Array.isArray(evaluation.notes)
    ? evaluation.notes.filter((note): note is string => typeof note === 'string' && note.startsWith(prefix))
    : []
  if (evidenceNotes.length === 0) return 'missing'
  if (evidenceNotes.length !== 1) return 'invalid'
  const quote = evidenceNotes[0].slice(prefix.length).trim()
  if (quote.length < 8 || quote.length > 160 || /[\r\n]/u.test(quote)) return 'invalid'

  const fields: Array<[HumiliationEvidenceLocation, string]> = [
    ['title', candidate.title],
    ['story_text', candidate.story_text],
    ['next_episode_preview', candidate.nextEpisodePreview],
  ]
  candidate.choices.forEach((choice, index) => {
    if (index > 1) return
    const n = index === 0 ? '1' : '2'
    fields.push([`choice_${n}_text` as HumiliationEvidenceLocation, choice.text])
    fields.push([`choice_${n}_effect_summary` as HumiliationEvidenceLocation, choice.effect_summary])
    fields.push([`choice_${n}_resolution` as HumiliationEvidenceLocation, choice.resolution_text])
  })
  candidate.vocabulary.forEach((item) => {
    fields.push(['vocabulary_word', item.word])
    fields.push(['vocabulary_translation', item.translation])
    fields.push(['vocabulary_example', item.example])
  })
  const matches = fields.filter(([, value]) => typeof value === 'string' && value.includes(quote))
  if (matches.length === 0) return 'unmatched'
  if (matches.length > 1) return 'multiple'
  return matches[0][0]
}
