import {
  buildAuthoredNarrativeBlocks,
  getCurrentAuthoredStoryPart,
  getSelectedChoiceForPart,
} from './engine'
import type { AuthoredStoryPackage, AuthoredStoryProgress, AuthoredStoryPhase } from './types'

export type AuthoredAudioSegment = {
  segmentId: string
  phase: 'before_choice' | 'choice_resolution' | 'after_choice'
  partId: string
  choiceId: string | null
  text: string
}

export type AuthoredAudioPlan = {
  storyId: string
  storyVersion: string
  sourceLiteraryVersion: string
  language: AuthoredStoryPackage['language']
  partId: string
  segments: AuthoredAudioSegment[]
  pauseForChoice: boolean
  decisionId: string | null
  nextSegmentAfterChoice: string | null
}

const MAX_CHUNK_CHARACTERS = 2500

/** Speech-only normalization: never writes back to the literary source. */
const spokenText = (text: string): string =>
  text.replace(/\*\*([^*]+)\*\*/g, '$1').trim()

const fromBlocks = (blocks: ReturnType<typeof buildAuthoredNarrativeBlocks>): string =>
  blocks.filter((block): block is Extract<typeof block, { kind: 'text' }> => block.kind === 'text')
    .map((block) => spokenText(block.text))
    .filter(Boolean)
    .join('\n\n')

/** Keep voice requests bounded without dropping any content or punctuation. */
export const chunkNarrationText = (text: string, maxLength = MAX_CHUNK_CHARACTERS): string[] => {
  if (!Number.isInteger(maxLength) || maxLength < 100) throw new Error('Invalid narration chunk limit.')
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  for (const paragraph of paragraphs) {
    let rest = paragraph
    while (rest.length > maxLength) {
      const window = rest.slice(0, maxLength + 1)
      const breakAt = window.lastIndexOf(' ')
      const take = breakAt >= Math.floor(maxLength / 2) ? breakAt : maxLength
      chunks.push(rest.slice(0, take).trim())
      rest = rest.slice(take).trim()
    }
    if (!rest) continue
    const last = chunks.length - 1
    if (last >= 0 && chunks[last].length + 2 + rest.length <= maxLength) {
      chunks[last] += '\n\n' + rest
    } else {
      chunks.push(rest)
    }
  }
  return chunks
}

const fnv1a = (value: string): string => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const inheritedVariant = (
  part: AuthoredStoryPackage['parts'][number],
  phase: AuthoredStoryPhase,
  selectedChoices: Record<string, string>,
): string => {
  const conditions = (part.conditional_segments ?? [])
    .filter((s) => s.phase === phase)
    .map((s) => [s.segment_id, s.when.decision_id, selectedChoices[s.when.decision_id] ?? 'unselected'])
  if (conditions.length === 0) return 'shared'
  return fnv1a(JSON.stringify(conditions))
}

/**
 * Match the actual reader's conditional narrative block sequence.
 * No voice request should contain unchosen branch text or image/UI metadata.
 */
export const buildAuthoredAudioPlan = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredAudioPlan => {
  if (progress.story_id !== story.story_id || progress.story_version !== story.story_version) {
    throw new Error('Narration source and reader progress must match.')
  }
  if (progress.completed) {
    throw new Error('Completed stories have no current narration segment.')
  }
  const part = getCurrentAuthoredStoryPart(story, progress)
  const choice = getSelectedChoiceForPart(part, progress)
  const confirmed = Boolean(
    choice && part.decision &&
    progress.shown_resolution_decisions.includes(part.decision.decision_id),
  )
  const prefix = `${story.story_id}:${story.story_version}:${story.language}:${part.part_id}`
  const segments: AuthoredAudioSegment[] = []
  const add = (
    phase: AuthoredAudioSegment['phase'],
    text: string,
    choiceId: string | null = null,
    variant = 'shared',
  ) => {
    const chunks = chunkNarrationText(spokenText(text))
    for (const [index, chunk] of chunks.entries()) {
      segments.push({
        segmentId: `${prefix}:${phase}:${choiceId ?? variant}:chunk-${index + 1}`,
        phase,
        partId: part.part_id,
        choiceId,
        text: chunk,
      })
    }
  }

  add(
    'before_choice',
    fromBlocks(buildAuthoredNarrativeBlocks(part, 'story_text', progress.selected_choices)),
    null,
    inheritedVariant(part, 'story_text', progress.selected_choices),
  )

  if (!part.decision || confirmed) {
    if (choice && confirmed) add('choice_resolution', choice.resolution_text, choice.choice_id)
    add(
      'after_choice',
      fromBlocks(buildAuthoredNarrativeBlocks(part, 'post_choice_text', progress.selected_choices)),
      null,
      inheritedVariant(part, 'post_choice_text', progress.selected_choices),
    )
  }

  return {
    storyId: story.story_id,
    storyVersion: story.story_version,
    sourceLiteraryVersion: story.source_literary_version,
    language: story.language,
    partId: part.part_id,
    segments,
    pauseForChoice: Boolean(part.decision && !confirmed),
    decisionId: part.decision?.decision_id ?? null,
    nextSegmentAfterChoice: part.decision && confirmed && choice
      ? segments.find((segment) => segment.phase === 'choice_resolution')?.segmentId ?? null
      : null,
  }
}

/**
 * When a choice is confirmed, lastPlayedSegmentId remains the last common
 * chunk. The updated plan advances directly to the chosen resolution.
 * Unknown IDs (new part/version) reset to the first available chunk.
 */
export const nextAuthoredAudioSegment = (
  plan: AuthoredAudioPlan,
  lastPlayedSegmentId: string | null,
): AuthoredAudioSegment | null => {
  const index = plan.segments.findIndex((segment) => segment.segmentId === lastPlayedSegmentId)
  if (index < 0) return plan.segments[0] ?? null
  return plan.segments[index + 1] ?? null
}
