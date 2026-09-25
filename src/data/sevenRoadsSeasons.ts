import { prazdnikMuzhestvaV3 } from './authoredStories'
import type { PublishedSeason } from '../features/publishedStories/types'

export const sevenRoadsSeason1: PublishedSeason = {
  id: 'seven-roads-season-1',
  worldId: 'seven_roads',
  worldTitle: 'Королевство семи дорог',
  number: 1,
  title: 'Праздник мужества',
  status: 'published',
  story: prazdnikMuzhestvaV3,
  episodes: [
    { number: 1, title: 'Праздник мужества' },
    { number: 2, title: 'Восточный лес' },
    { number: 3, title: 'Дорога Самиры' },
    { number: 4, title: 'Заран' },
    { number: 5, title: 'Обратная дорога' },
    { number: 6, title: 'Возвращение' },
  ],
}

export const sevenRoadsSeason2: PublishedSeason = {
  id: 'seven-roads-season-2',
  worldId: 'seven_roads',
  worldTitle: 'Королевство семи дорог',
  number: 2,
  title: null,
  status: 'coming_soon',
  story: null,
  episodes: [],
}

export const sevenRoadsSeasons = [sevenRoadsSeason1, sevenRoadsSeason2] as const
