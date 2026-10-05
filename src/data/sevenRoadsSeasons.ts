import {
  prazdnikMuzhestvaV3ByLanguage,
  taynaVostochnogoKaravanaV4ByLanguage,
} from './authoredStories'
import { getSeason2ReleaseCandidateStories } from './season2StagingAuthoredStories'
import type {
  PublishedSeason,
  PublishedSeasonStory,
} from '../features/publishedStories/types'
import {
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'

const episodeTitles: Record<SevenRoadsLanguage, string[]> = {
  ru: [
    'Праздник мужества',
    'Восточный лес',
    'Дорога Самиры',
    'Заран',
    'Обратная дорога',
    'Возвращение',
  ],
  uz: [
    'Jasorat bayrami',
    'Sharqiy o‘rmon',
    'Samiraning yo‘li',
    'Zaran',
    'Qaytish yo‘li',
    'Qaytish',
  ],
}

export const getPublishedSeasonStories = (
  season: PublishedSeason,
): PublishedSeasonStory[] =>
  season.stories.filter(
    (story) => story.status === 'published' && Boolean(story.authoredStory),
  )

export const getSeasonStoryByNumber = (
  season: PublishedSeason,
  storyNumber: number,
): PublishedSeasonStory | null =>
  season.stories.find((story) => story.number === storyNumber) ?? null

export const getPrimaryPublishedSeasonStory = (
  season: PublishedSeason,
): PublishedSeasonStory | null =>
  getPublishedSeasonStories(season)[0] ?? null

export const getSevenRoadsSeason1 = (
  language: SevenRoadsLanguage,
): PublishedSeason => {
  const copy = getSevenRoadsCopy(language)
  const authoredStory = prazdnikMuzhestvaV3ByLanguage[language]
  const publishedStory: PublishedSeasonStory = {
    id: 'seven-roads-season-1-story-1',
    number: 1,
    title: authoredStory.title,
    status: 'published',
    authoredStory,
    completionScope: 'season',
    readerUnit: 'episode',
    episodes: episodeTitles[language].map((title, index) => ({
      number: index + 1,
      title,
    })),
  }

  return {
    id: 'seven-roads-season-1',
    worldId: 'seven_roads',
    worldTitle: copy.worldTitle,
    number: 1,
    title: authoredStory.title,
    status: 'published',
    stories: [publishedStory],
  }
}

export const getSevenRoadsSeason2 = (
  language: SevenRoadsLanguage,
): PublishedSeason => {
  const staged = getSeason2ReleaseCandidateStories(language)
  const stagedById = new Map(staged.map((story) => [story.story_id, story]))
  const episode2 = taynaVostochnogoKaravanaV4ByLanguage[language]

  const episodePackages = [
    stagedById.get('seven_roads_korolevskoe_serebro'),
    episode2,
    stagedById.get('seven_roads_dve_bashni'),
    stagedById.get('seven_roads_chelovek_kotorogo_zhdut'),
    stagedById.get('seven_roads_lozhnaya_doroga'),
    stagedById.get('seven_roads_dve_podmogi'),
    stagedById.get('seven_roads_obratno_v_ordan'),
  ]

  if (episodePackages.some((story) => !story)) {
    throw new Error('Season 2 release wiring is missing one or more episode packages.')
  }

  const stories: PublishedSeasonStory[] = episodePackages.map(
    (authoredStory, index) => {
      if (!authoredStory) {
        throw new Error('Season 2 episode package is missing.')
      }

      return {
        id: `seven-roads-season-2-story-${index + 1}`,
        number: index + 1,
        title: authoredStory.title,
        status: 'published',
        authoredStory,
        completionScope: 'episode',
        readerUnit: 'part',
        episodes: authoredStory.parts.map((part, partIndex) => ({
          number: partIndex + 1,
          title: part.title,
        })),
      }
    },
  )

  return {
    id: 'seven-roads-season-2',
    worldId: 'seven_roads',
    worldTitle: getSevenRoadsCopy(language).worldTitle,
    number: 2,
    title: null,
    status: 'published',
    presentation: 'single-cover-episode-list',
    coverAssetId: 'seven_roads_season2_cover_v1',
    stories,
  }
}

export const getSevenRoadsSeasons = (
  language: SevenRoadsLanguage,
): PublishedSeason[] => [
  getSevenRoadsSeason1(language),
  getSevenRoadsSeason2(language),
]

// Russian aliases remain available for older internal checks and previews.
export const sevenRoadsSeason1 = getSevenRoadsSeason1('ru')
export const sevenRoadsSeason2 = getSevenRoadsSeason2('ru')
export const sevenRoadsSeasons = getSevenRoadsSeasons('ru')
