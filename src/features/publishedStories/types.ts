import type { AuthoredStoryPackage } from '../authoredStory/types'

export type PublishedSeasonStatus = 'published' | 'coming_soon'
export type PublishedStoryStatus = 'published' | 'coming_soon'

export interface PublishedSeasonEpisode {
  number: number
  title: string
}

export interface PublishedSeasonStory {
  id: string
  number: number
  title: string | null
  status: PublishedStoryStatus
  authoredStory: AuthoredStoryPackage | null
  episodes: PublishedSeasonEpisode[]
  completionScope: 'season' | 'story'
  readerUnit: 'episode' | 'part'
}

export type PublishedSeasonPresentation =
  | 'default'
  | 'single-cover-episode-list'

export interface PublishedSeason {
  id: string
  worldId: string
  worldTitle: string
  number: number
  title: string | null
  status: PublishedSeasonStatus
  stories: PublishedSeasonStory[]
  presentation?: PublishedSeasonPresentation
  coverAssetId?: string | null
}
