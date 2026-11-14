import {
  prazdnikMuzhestvaV3ByLanguage,
  taynaVostochnogoKaravanaV4ByLanguage,
} from './authoredStories'
import { getSeason2ReleaseCandidateStories } from './season2StagingAuthoredStories'
import { applyFourSeasonChronology } from './fourSeasonChronology'
import { withReadingSeries } from './sevenRoadsReadingSeries'
import type { PublishedSeason, PublishedSeasonStory } from '../features/publishedStories/types'
import {
  getSevenRoadsCopy,
  type SevenRoadsLanguage,
} from '../features/publishedStories/sevenRoadsCopy'

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
  const { story: authoredStory, episodes } = withReadingSeries(
    prazdnikMuzhestvaV3ByLanguage[language], 'festival', 0,
  )
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
      episodes,
    }],
  }
}

const singlePackageSeason = (
  language: SevenRoadsLanguage,
  number: 2,
  authoredStory: NonNullable<PublishedSeasonStory['authoredStory']>,
  coverAssetId: string,
): PublishedSeason => {
  const { story, episodes } = withReadingSeries(authoredStory, 'silver', 0)
  return ({
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
    authoredStory: story,
    completionScope: 'season',
    readerUnit: 'episode',
    episodes,
  }],
})
}

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

// All 30 series are presentation-only; the eight original literary packages remain intact.
export const getSevenRoadsSeason3 = (language: SevenRoadsLanguage): PublishedSeason => {
  const caravan = withReadingSeries(taynaVostochnogoKaravanaV4ByLanguage[language], 'caravan', 0)
  const towers = withReadingSeries(requireStagedStory(language, 'seven_roads_dve_bashni'), 'towers', 8)
  return {
    id: 'seven-roads-season-3',
    worldId: 'seven_roads',
    worldTitle: getSevenRoadsCopy(language).worldTitle,
    number: 3,
    title: caravan.story.title,
    status: 'published',
    presentation: 'single-cover-episode-list',
    coverAssetId: 'seven_roads_story2_cover_v1',
    stories: [caravan, towers].map((item, index) => ({
      id: `seven-roads-season-3-story-${index + 1}`,
      number: index + 1,
      title: item.story.title,
      status: 'published',
      authoredStory: item.story,
      completionScope: 'episode',
      readerUnit: 'episode',
      episodes: item.episodes,
    })),
  }
}

export const getSevenRoadsSeason4 = (language: SevenRoadsLanguage): PublishedSeason => {
  const entries = [
    { id: 'seven_roads_chelovek_kotorogo_zhdut', key: 'waited', offset: 0 },
    { id: 'seven_roads_lozhnaya_doroga', key: 'falseRoad', offset: 4 },
    { id: 'seven_roads_dve_podmogi', key: 'reinforcements', offset: 6 },
    { id: 'seven_roads_obratno_v_ordan', key: 'ordan', offset: 8 },
  ] as const
  const stories: PublishedSeasonStory[] = entries.map((entry, index) => {
    const { story, episodes } = withReadingSeries(requireStagedStory(language, entry.id), entry.key, entry.offset)
    return {
      id: `seven-roads-season-4-story-${index + 1}`,
      number: index + 1,
      title: story.title,
      status: 'published',
      authoredStory: story,
      completionScope: 'episode',
      readerUnit: 'episode',
      episodes,
    }
  })
  return {
    id: 'seven-roads-season-4',
    worldId: 'seven_roads',
    worldTitle: getSevenRoadsCopy(language).worldTitle,
    number: 4,
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
