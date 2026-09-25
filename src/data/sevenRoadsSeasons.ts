import { prazdnikMuzhestvaV3ByLanguage } from './authoredStories'
import type { PublishedSeason } from '../features/publishedStories/types'
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

export const getSevenRoadsSeason1 = (
  language: SevenRoadsLanguage,
): PublishedSeason => {
  const copy = getSevenRoadsCopy(language)
  const story = prazdnikMuzhestvaV3ByLanguage[language]

  return {
    id: 'seven-roads-season-1',
    worldId: 'seven_roads',
    worldTitle: copy.worldTitle,
    number: 1,
    title: story.title,
    status: 'published',
    story,
    episodes: episodeTitles[language].map((title, index) => ({
      number: index + 1,
      title,
    })),
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
  story: null,
  episodes: [],
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
