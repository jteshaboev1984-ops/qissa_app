import type { Episode, OnboardingSelections, SeriesState, StoryStatus } from '../types/qissa'

export function isSeriesEpisodeTwo(selections: OnboardingSelections | null, episode: Episode | null): boolean {
  return Boolean(selections?.storyMode === 'series' && episode?.episode_id.startsWith('ep-2'))
}

export function isOneTimeCompleted(selections: OnboardingSelections | null, seriesState: SeriesState | null): boolean {
  return Boolean(selections?.storyMode === 'one_time' && seriesState && seriesState.choiceHistory.length > 0)
}

export function isStoryCompleted(
  selections: OnboardingSelections | null,
  seriesState: SeriesState | null,
  episode: Episode | null,
): boolean {
  return isSeriesEpisodeTwo(selections, episode) || isOneTimeCompleted(selections, seriesState)
}

export function deriveStoryStatus(
  selections: OnboardingSelections | null,
  seriesState: SeriesState | null,
  episode: Episode | null,
): StoryStatus {
  if (!selections || !seriesState || !episode) return 'not_started'
  if (isStoryCompleted(selections, seriesState, episode)) return 'completed'
  if (episode.episode_id.startsWith('ep-2')) return 'episode_2_active'

  const hasSavedChoice = seriesState.choiceHistory.some((entry) => entry.episode_id === episode.episode_id)
  if (hasSavedChoice) return 'episode_1_choice_saved'

  return 'episode_1_active'
}
