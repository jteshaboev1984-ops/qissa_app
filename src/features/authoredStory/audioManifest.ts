import { buildAuthoredAudioPlan, type AuthoredAudioSegment } from './authoredAudioPlan'
import type { AuthoredStoryPackage, AuthoredStoryProgress } from './types'

export interface DraftAudioManifest {
  storyId: string
  storyVersion: string
  sourceLiteraryVersion: string
  language: AuthoredStoryPackage['language']
  /** Every unique, source-derived segment, including every valid choice branch. */
  segments: AuthoredAudioSegment[]
  /** Number of enumerated part/choice combinations, not all story-wide paths. */
  scenariosChecked: number
  /** This draft cannot publish or approve any source/audio. */
  isApproved: false
  isPublished: false
}

const MAX_INHERITED_SCENARIOS_PER_PART = 64

const allowedChoices = (
  story: AuthoredStoryPackage,
  decisionId: string,
): string[] => {
  const local = story.parts.find((part) => part.decision?.decision_id === decisionId)
    ?.decision?.choices.map((choice) => choice.choice_id)
  const external = story.external_choice_context?.find(
    (context) => context.decision_id === decisionId,
  )?.allowed_choice_ids
  const ids = local ?? external
  if (!ids || ids.length === 0 || ids.some((choice) => !choice?.trim())) {
    throw new Error(`Unknown inherited decision ${decisionId}; explicit allowed choices required.`)
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Duplicate allowed choices for ${decisionId}.`)
  }
  return ids
}

/**
 * Exhaustively enumerate ONLY the choices influencing a given source part.
 * Avoid 2^N enumeration of irrelevant, previously made decisions.
 * This is a source compiler: never infer branch boundaries semantically.
 */
const inheritedStatesForPart = (
  story: AuthoredStoryPackage,
  partIndex: number,
): Record<string, string>[] => {
  const part = story.parts[partIndex]
  const currentDecisionId = part.decision?.decision_id ?? null
  const ids = [...new Set((part.conditional_segments ?? []).map(
    (segment) => segment.when.decision_id,
  ))].filter((decisionId) => decisionId !== currentDecisionId)

  let states: Record<string, string>[] = [{}]
  for (const decisionId of ids) {
    const choices = allowedChoices(story, decisionId)
    for (const conditional of (part.conditional_segments ?? []).filter(
      (segment) => segment.when.decision_id === decisionId,
    )) {
      if (!choices.includes(conditional.when.choice_id)) {
        throw new Error(`Unrecognized inherited choice ${conditional.when.choice_id}.`)
      }
    }
    if (states.length * choices.length > MAX_INHERITED_SCENARIOS_PER_PART) {
      throw new Error('Audio source has too many inherited variants for automatic compilation.')
    }
    states = states.flatMap((state) => choices.map(
      (choiceId) => ({ ...state, [decisionId]: choiceId }),
    ))
  }
  // A preceding story/episode must never see a future decision as inherited.
  for (const decisionId of ids) {
    const decidedAt = story.parts.findIndex((part) =>
      part.decision?.decision_id === decisionId)
    if (decidedAt >= partIndex && decidedAt !== -1) {
      throw new Error(`Part depends on a future decision: ${decisionId}.`)
    }
  }
  if (currentDecisionId && (part.conditional_segments ?? []).some(
    (segment) => segment.when.decision_id === currentDecisionId &&
      segment.phase === 'story_text',
  )) {
    throw new Error('Pre-choice narration cannot depend on its own unresolved decision.')
  }
  return states
}

const progressFor = (
  story: AuthoredStoryPackage,
  partIndex: number,
  selected: Record<string, string>,
  confirmedChoiceId: string | null,
): AuthoredStoryProgress => {
  const decisionId = story.parts[partIndex].decision?.decision_id
  if (confirmedChoiceId && !decisionId) throw new Error('Unexpected choice.')
  return {
    story_id: story.story_id,
    story_version: story.story_version,
    current_part_index: partIndex,
    selected_choices: confirmedChoiceId && decisionId
      ? { ...selected, [decisionId]: confirmedChoiceId } : selected,
    shown_resolution_decisions: confirmedChoiceId && decisionId ? [decisionId] : [],
    choice_history: [],
    memory: { lastEvent: '', canonState: {}, relationshipState: {} },
    completed: false,
    updated_at: '1970-01-01T00:00:00.000Z',
  }
}

/**
 * Compile reusable spoken chunks automatically from the approved story schema.
 * It never rewrites original RU/UZ prose, choices, IDs or approval state.
 * Every ambiguous/unrecognized inherited decision fails closed.
 */
export const compileDraftAuthoredAudioManifest = (
  story: AuthoredStoryPackage,
): DraftAudioManifest => {
  if (!story.story_id || !story.story_version || !story.source_literary_version ||
    !['ru', 'uz', 'kz'].includes(story.language)) {
    throw new Error('Complete literary source identity is required.')
  }
  const segments = new Map<string, AuthoredAudioSegment>()
  let scenariosChecked = 0
  for (const [partIndex, part] of story.parts.entries()) {
    const states = inheritedStatesForPart(story, partIndex)
    const currentChoiceOptions: (string | null)[] = part.decision
      ? [null, ...part.decision.choices.map((choice) => choice.choice_id)]
      : [null]
    for (const incoming of states) {
      for (const choiceId of currentChoiceOptions) {
        const plan = buildAuthoredAudioPlan(
          story, progressFor(story, partIndex, incoming, choiceId),
        )
        scenariosChecked += 1
        for (const segment of plan.segments) {
          const previous = segments.get(segment.segmentId)
          if (previous && (previous.text !== segment.text ||
            previous.phase !== segment.phase || previous.choiceId !== segment.choiceId)) {
            throw new Error(`Segment identity collision: ${segment.segmentId}`)
          }
          segments.set(segment.segmentId, segment)
        }
      }
    }
  }
  return {
    storyId: story.story_id,
    storyVersion: story.story_version,
    sourceLiteraryVersion: story.source_literary_version,
    language: story.language,
    segments: [...segments.values()],
    scenariosChecked,
    isApproved: false,
    isPublished: false,
  }
}
