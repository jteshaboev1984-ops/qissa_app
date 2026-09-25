import type { AuthoredStoryPackage } from '../authoredStory/types'

export type PublishedSeasonStatus = 'published' | 'coming_soon'

export interface PublishedSeasonEpisode {
  number: number
  title: string
}

export interface PublishedSeason {
  id: string
  worldId: string
  worldTitle: string
  number: number
  title: string | null
  status: PublishedSeasonStatus
  story: AuthoredStoryPackage | null
  episodes: PublishedSeasonEpisode[]
}
