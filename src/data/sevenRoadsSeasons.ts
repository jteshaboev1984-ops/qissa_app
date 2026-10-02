import { prazdnikMuzhestvaV3ByLanguage } from './authoredStories'
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
): PublishedSeason => ({
  id: 'seven-roads-season-2',
  worldId: 'seven_roads',
  worldTitle: getSevenRoadsCopy(language).worldTitle,
  number: 2,
  title: null,
  status: 'coming_soon',
  // Do not ship unpublished story metadata in the public production bundle.
  // Season 2 is intentionally an empty public collection until individual
  // stories pass their own release gates.
  stories: [],
})

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
