import { authoredStoryPersistence } from '../../lib/authoredStoryPersistence'
import type { PublishedSeason } from './types'

export const isSeasonCompleted = (season: PublishedSeason): boolean =>
  season.stories.length > 0 &&
  season.stories.every((item) =>
    Boolean(item.authoredStory && authoredStoryPersistence.load(item.authoredStory)?.completed),
  )

export const isSeasonUnlocked = (seasons: readonly PublishedSeason[], number: number): boolean => {
  const target = seasons.find((item) => item.number === number)
  if (!target || target.status !== 'published') return false
  if (number === 1) return true

  // Resume already-started packages from the older two-season layout without
  // resetting local progress or blocking an existing reader on migration.
  if (target.stories.some((item) =>
    Boolean(item.authoredStory && authoredStoryPersistence.load(item.authoredStory)),
  )) return true

  return seasons
    .filter((season) => season.number < number)
    .every((season) => season.status === 'published' && isSeasonCompleted(season))
}
