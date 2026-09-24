import {
  getCurrentAuthoredStoryPart,
  getSelectedChoiceForPart,
  isCurrentResolutionShown,
} from './engine'
import type { AuthoredStoryPackage, AuthoredStoryProgress } from './types'

export interface AuthoredNarrationSegment {
  id: string
  kind: 'story' | 'resolution' | 'continuation'
  text: string
}

export const buildCurrentAuthoredNarration = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredNarrationSegment[] => {
  if (progress.completed) return []

  const part = getCurrentAuthoredStoryPart(story, progress)
  const segments: AuthoredNarrationSegment[] = []

  if (part.story_text.trim()) {
    segments.push({
      id: `${part.part_id}:story`,
      kind: 'story',
      text: part.story_text.trim(),
    })
  }

  if (part.decision) {
    const selected = getSelectedChoiceForPart(part, progress)
    if (!selected || !isCurrentResolutionShown(part, progress)) return segments

    segments.push({
      id: `${part.part_id}:${selected.choice_id}:resolution`,
      kind: 'resolution',
      text: selected.resolution_text.trim(),
    })
  }

  if (part.post_choice_text.trim()) {
    segments.push({
      id: `${part.part_id}:continuation`,
      kind: 'continuation',
      text: part.post_choice_text.trim(),
    })
  }

  return segments
}

export const authoredNarrationText = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): string =>
  buildCurrentAuthoredNarration(story, progress)
    .map((segment) => segment.text)
    .join('\n\n')
