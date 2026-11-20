import {
  buildAuthoredNarrativeBlocks,
  getCurrentAuthoredStoryPart,
  getSelectedChoiceForPart,
} from './engine'
import type { AuthoredStoryPackage, AuthoredStoryProgress } from './types'

/**
 * One approved literary segment per reusable synthesized audio asset.
 * The server must derive the same text from a locked story source and check its
 * SHA-256 before serving a signed URL; never trust client-submitted text.
 */
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
  language: AuthoredStoryPackage['language']
  partId: string
  segments: AuthoredAudioSegment[]
  pauseForChoice: boolean
  decisionId: string | null
  nextSegmentAfterChoice: string | null
}

const spokenText = (text: string): string =>
  text.replace(/\*\*([^*]+)\*\*/g, '$1').trim()

const fromBlocks = (blocks: ReturnType<typeof buildAuthoredNarrativeBlocks>): string =>
  blocks.filter((block): block is Extract<typeof block, { kind: 'text' }> => block.kind === 'text')
    .map((block) => spokenText(block.text))
    .filter(Boolean)
    .join('\n\n')

/**
 * Read exactly the part the child currently sees, without unselected
 * resolutions or visual/editorial UI copy. Call again after a confirmed choice.
 * UI playback must advance by segmentId and keep consumed IDs on choice;
 * rebuilding the plan does not mean replaying the before-choice narration.
 */
export const buildAuthoredAudioPlan = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredAudioPlan => {
  if (progress.story_id !== story.story_id || progress.story_version !== story.story_version) {
    throw new Error('Narration source and reader progress must match.')
  }
  const part = getCurrentAuthoredStoryPart(story, progress)
  const choice = getSelectedChoiceForPart(part, progress)
  const confirmed = Boolean(
    choice && part.decision &&
    progress.shown_resolution_decisions.includes(part.decision.decision_id),
  )
  const prefix = `${story.story_id}:${story.story_version}:${story.language}:${part.part_id}`
  const segments: AuthoredAudioSegment[] = []
  const add = (phase: AuthoredAudioSegment['phase'], text: string, choiceId: string | null = null) => {
    const normalizedText = spokenText(text)
    if (!normalizedText) return
    segments.push({
      segmentId: `${prefix}:${phase}${choiceId ? ':' + choiceId : ''}`,
      phase,
      partId: part.part_id,
      choiceId,
      text: normalizedText,
    })
  }

  add('before_choice', fromBlocks(buildAuthoredNarrativeBlocks(part, 'story_text')))

  if (!part.decision || confirmed) {
    if (choice && confirmed) add('choice_resolution', choice.resolution_text, choice.choice_id)
    add('after_choice', fromBlocks(buildAuthoredNarrativeBlocks(part, 'post_choice_text')))
  }

  return {
    storyId: story.story_id,
    storyVersion: story.story_version,
    language: story.language,
    partId: part.part_id,
    segments,
    pauseForChoice: Boolean(part.decision && !confirmed),
    decisionId: part.decision?.decision_id ?? null,
    nextSegmentAfterChoice: part.decision && confirmed && choice
      ? `${prefix}:choice_resolution:${choice.choice_id}`
      : null,
  }
}
