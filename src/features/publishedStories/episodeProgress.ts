import { authoredStoryPersistence } from '../../lib/authoredStoryPersistence'
import type { AuthoredStoryProgress } from '../authoredStory/types'
import type { PublishedSeason, PublishedSeasonEpisode, PublishedSeasonStory } from './types'

export interface SeasonEpisodeState {
  entry: PublishedSeasonStory
  episode: PublishedSeasonEpisode
  progress: AuthoredStoryProgress | null
  completed: boolean
  started: boolean
  available: boolean
}

export const getSeasonEpisodeStates = (season: PublishedSeason): SeasonEpisodeState[] => {
  const entries = season.stories.flatMap((entry) => {
    const story = entry.authoredStory
    if (!story || entry.status !== 'published') return []
    const progress = authoredStoryPersistence.load(story)
    return entry.episodes.map((episode) => {
      const numbers = story.reader_layout?.episode_by_part ?? story.parts.map((_, index) => index + 1)
      const last = numbers.lastIndexOf(episode.number)
      const first = numbers.indexOf(episode.number)
      if (last < 0 || first < 0) throw new Error(`Missing episode boundary: ${story.story_id}/${episode.number}`)
      return {
        entry, episode, progress,
        completed: Boolean(progress?.completed || (progress && progress.current_part_index > last)),
        started: Boolean(progress && (progress.completed || progress.current_part_index >= first)),
        available: false,
      }
    })
  }).sort((a, b) => a.episode.seasonNumber - b.episode.seasonNumber)
  return entries.map((entry, index) => ({
    ...entry,
    available: entries.slice(0, index).every((previous) => previous.completed) ||
      entry.completed || entry.started,
  }))
}

export const activeSeasonEpisode = (states: SeasonEpisodeState[]): SeasonEpisodeState | null =>
  states.find((episode) => episode.started && !episode.completed) ??
  states.find((episode) => !episode.completed) ??
  states[states.length - 1] ?? null
