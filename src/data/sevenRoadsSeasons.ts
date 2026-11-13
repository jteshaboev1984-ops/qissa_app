import {
  prazdnikMuzhestvaV3ByLanguage,
  taynaVostochnogoKaravanaV4ByLanguage,
} from './authoredStories'
import { getSeason2ReleaseCandidateStories } from './season2StagingAuthoredStories'
import { applyFourSeasonChronology } from './fourSeasonChronology'
import type { PublishedSeason, PublishedSeasonStory } from '../features/publishedStories/types'
import {
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'

const episodeTitles: Record<SevenRoadsLanguage, string[]> = {
  ru: ['Праздник мужества', 'Восточный лес', 'Дорога Самиры', 'Заран', 'Обратная дорога', 'Возвращение'],
  uz: ['Jasorat bayrami', 'Sharqiy o‘rmon', 'Samiraning yo‘li', 'Zaran', 'Qaytish yo‘li', 'Qaytish'],
}

export const getPublishedSeasonStories = (season: PublishedSeason): PublishedSeasonStory[] =>
  season.stories.filter((story) => story.status === 'published' && Boolean(story.authoredStory))

export const getSeasonStoryByNumber = (
  season: PublishedSeason,
  storyNumber: number,
): PublishedSeasonStory | null =>
  season.stories.find((story) => story.number === storyNumber) ?? null

export const getPrimaryPublishedSeasonStory = (
  season: PublishedSeason,
): PublishedSeasonStory | null => getPublishedSeasonStories(season)[0] ?? null

export const getSevenRoadsSeason1 = (language: SevenRoadsLanguage): PublishedSeason => {
  const copy = getSevenRoadsCopy(language)
  const authoredStory = prazdnikMuzhestvaV3ByLanguage[language]
  return {
    id: 'seven-roads-season-1',
    worldId: 'seven_roads',
    worldTitle: copy.worldTitle,
    number: 1,
    title: authoredStory.title,
    status: 'published',
    stories: [{
      id: 'seven-roads-season-1-story-1',
      number: 1,
      title: authoredStory.title,
      status: 'published',
      authoredStory,
      completionScope: 'season',
      readerUnit: 'episode',
      episodes: episodeTitles[language].map((title, index) => ({ number: index + 1, title })),
    }],
  }
}

const singlePackageSeason = (
  language: SevenRoadsLanguage,
  number: 2 | 3,
  authoredStory: NonNullable<PublishedSeasonStory['authoredStory']>,
  coverAssetId: string,
): PublishedSeason => ({
  id: `seven-roads-season-${number}`,
  worldId: 'seven_roads',
  worldTitle: getSevenRoadsCopy(language).worldTitle,
  number,
  title: authoredStory.title,
  status: 'published',
  coverAssetId,
  stories: [{
    id: `seven-roads-season-${number}-story-1`,
    number: 1,
    title: authoredStory.title,
    status: 'published',
    authoredStory,
    completionScope: 'season',
    readerUnit: 'part',
    episodes: authoredStory.parts.map((part, index) => ({ number: index + 1, title: part.title })),
  }],
})

const getStagedStoriesById = (language: SevenRoadsLanguage) =>
  new Map(getSeason2ReleaseCandidateStories(language).map((story) => [story.story_id, story]))

const requireStagedStory = (
  language: SevenRoadsLanguage,
  storyId: string,
): NonNullable<PublishedSeasonStory['authoredStory']> => {
  const story = getStagedStoriesById(language).get(storyId)
  if (!story) throw new Error(`Missing Four Seasons story package: ${storyId}`)
  return applyFourSeasonChronology(story)
}

// Royal Silver happens around one week after the Festival. The later caravan
// story takes place several weeks after it and supplies the seal-imprint clue.
export const getSevenRoadsSeason2 = (language: SevenRoadsLanguage): PublishedSeason =>
  singlePackageSeason(
    language,
    2,
    requireStagedStory(language, 'seven_roads_korolevskoe_serebro'),
    // Approved shared artwork; a dedicated Season 2 cover is still an art follow-up.
    'seven_roads_season2_cover_v1',
  )

export const getSevenRoadsSeason3 = (language: SevenRoadsLanguage): PublishedSeason =>
  singlePackageSeason(
    language,
    3,
    taynaVostochnogoKaravanaV4ByLanguage[language],
    // Preserve the caravan's own verified illustration; unchanged story progress keys.
    'seven_roads_story2_cover_v1',
  )

export const getSevenRoadsSeason4 = (language: SevenRoadsLanguage): PublishedSeason => {
  const storyIds = [
    'seven_roads_dve_bashni',
    'seven_roads_chelovek_kotorogo_zhdut',
    'seven_roads_lozhnaya_doroga',
    'seven_roads_dve_podmogi',
    'seven_roads_obratno_v_ordan',
  ]
  const stories: PublishedSeasonStory[] = storyIds.map((id, index) => {
    const authoredStory = requireStagedStory(language, id)
    return {
      id: `seven-roads-season-4-story-${index + 1}`,
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
  })
  return {
    id: 'seven-roads-season-4',
    worldId: 'seven_roads',
    worldTitle: getSevenRoadsCopy(language).worldTitle,
    number: 4,
    // Owner-approved Season 4 title in both reading languages.
    title: language === 'uz' ? 'Qirollik asiri' : 'Королевский пленник',
    status: 'published',
    presentation: 'single-cover-episode-list',
    coverAssetId: 'seven_roads_season2_cover_v1',
    stories,
  }
}

export const getSevenRoadsSeasons = (language: SevenRoadsLanguage): PublishedSeason[] => [
  getSevenRoadsSeason1(language),
  getSevenRoadsSeason2(language),
  getSevenRoadsSeason3(language),
  getSevenRoadsSeason4(language),
]

export const sevenRoadsSeason1 = getSevenRoadsSeason1('ru')
export const sevenRoadsSeason2 = getSevenRoadsSeason2('ru')
export const sevenRoadsSeason3 = getSevenRoadsSeason3('ru')
export const sevenRoadsSeason4 = getSevenRoadsSeason4('ru')
export const sevenRoadsSeasons = getSevenRoadsSeasons('ru')
