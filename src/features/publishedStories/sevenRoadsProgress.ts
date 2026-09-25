import type { AuthoredStoryProgress } from '../authoredStory/types'

export type SeasonReadingState = 'new' | 'in_progress' | 'completed'

export const sevenRoadsStory1EpisodeNumber = (
  internalPartIndex: number,
): number => {
  if (internalPartIndex <= 1) return 1
  return Math.min(6, internalPartIndex)
}

export const sevenRoadsStory1ReadingState = (
  progress: AuthoredStoryProgress | null,
): {
  state: SeasonReadingState
  currentEpisode: number
  completedEpisodes: number
} => {
  if (!progress) {
    return { state: 'new', currentEpisode: 1, completedEpisodes: 0 }
  }

  if (progress.completed) {
    return { state: 'completed', currentEpisode: 6, completedEpisodes: 6 }
  }

  const currentEpisode = sevenRoadsStory1EpisodeNumber(progress.current_part_index)
  return {
    state: 'in_progress',
    currentEpisode,
    completedEpisodes: Math.max(0, currentEpisode - 1),
  }
}
