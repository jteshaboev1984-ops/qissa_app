import type { AuthoredStoryProgress } from '../authoredStory/types'

export type SeasonReadingState = 'new' | 'in_progress' | 'completed'

export const sevenRoadsStory1EpisodeNumber = (
  internalPartIndex: number,
  episodeByPart?: number[],
): number => {
  if (episodeByPart?.[internalPartIndex] != null) return episodeByPart[internalPartIndex]
  if (internalPartIndex <= 1) return 1
  return Math.min(6, internalPartIndex)
}

export const sevenRoadsStory1ReadingState = (
  progress: AuthoredStoryProgress | null,
  episodeByPart?: number[],
): {
  state: SeasonReadingState
  currentEpisode: number
  completedEpisodes: number
} => {
  const totalEpisodes = episodeByPart?.length ? Math.max(...episodeByPart) : 6
  if (!progress) {
    return { state: 'new', currentEpisode: 1, completedEpisodes: 0 }
  }

  if (progress.completed) {
    return { state: 'completed', currentEpisode: totalEpisodes, completedEpisodes: totalEpisodes }
  }

  const currentEpisode = sevenRoadsStory1EpisodeNumber(progress.current_part_index, episodeByPart)
  return {
    state: 'in_progress',
    currentEpisode,
    completedEpisodes: Math.max(0, currentEpisode - 1),
  }
}
