import rawSeason2Story1RoyalSilverRu from './authored/staging/season2Story1RoyalSilver.ru.json'
import rawSeason2Story1RoyalSilverUz from './authored/staging/season2Story1RoyalSilver.uz.json'
import rawSeason2Story3TwoTowersRu from './authored/staging/season2Story3TwoTowers.ru.json'
import rawSeason2Story4WaitedManRu from './authored/staging/season2Story4WaitedMan.ru.json'
import rawSeason2Story5FalseRoadRu from './authored/staging/season2Story5FalseRoad.ru.json'
import rawSeason2Story6TwoReinforcementsRu from './authored/staging/season2Story6TwoReinforcements.ru.json'
import rawSeason2Story7BackToOrdanRu from './authored/staging/season2Story7BackToOrdan.ru.json'
import rawSeason2Story7BackToOrdanUz from './authored/staging/season2Story7BackToOrdan.uz.json'
import rawSeason2Story6TwoReinforcementsUz from './authored/staging/season2Story6TwoReinforcements.uz.json'
import rawSeason2Story5FalseRoadUz from './authored/staging/season2Story5FalseRoad.uz.json'
import rawSeason2Story4WaitedManUz from './authored/staging/season2Story4WaitedMan.uz.json'
import rawSeason2Story3TwoTowersUz from './authored/staging/season2Story3TwoTowers.uz.json'
import { validateAuthoredStoryPackage } from '../features/authoredStory/engine'
import {
  localizeAuthoredStoryPackage,
  type AuthoredStoryLocalizationOverlay,
} from '../features/authoredStory/localizePackage'
import type { AuthoredStoryPackage } from '../features/authoredStory/types'

const coerce = (value: unknown): AuthoredStoryPackage =>
  value as AuthoredStoryPackage

const season2StagingRussianStories: readonly AuthoredStoryPackage[] = [
  coerce(rawSeason2Story1RoyalSilverRu),
  coerce(rawSeason2Story3TwoTowersRu),
  coerce(rawSeason2Story4WaitedManRu),
  coerce(rawSeason2Story5FalseRoadRu),
  coerce(rawSeason2Story6TwoReinforcementsRu),
  coerce(rawSeason2Story7BackToOrdanRu),
]


const season2StagingUzPairs = [
  [rawSeason2Story1RoyalSilverRu, rawSeason2Story1RoyalSilverUz],
  [rawSeason2Story3TwoTowersRu, rawSeason2Story3TwoTowersUz],
  [rawSeason2Story4WaitedManRu, rawSeason2Story4WaitedManUz],
  [rawSeason2Story5FalseRoadRu, rawSeason2Story5FalseRoadUz],
  [rawSeason2Story6TwoReinforcementsRu, rawSeason2Story6TwoReinforcementsUz],
  [rawSeason2Story7BackToOrdanRu, rawSeason2Story7BackToOrdanUz],
] as const

const season2StagingUzbekStories: readonly AuthoredStoryPackage[] =
  season2StagingUzPairs.map(([rawBase, rawOverlay]) => {
    const localized = localizeAuthoredStoryPackage(
      coerce(rawBase),
      rawOverlay as AuthoredStoryLocalizationOverlay,
    )
    const validationErrors = validateAuthoredStoryPackage(localized)
    if (validationErrors.length > 0) {
      throw new Error(
        `Invalid Season 2 Uzbek staging package (${localized.story_id}): ${validationErrors.join('; ')}`,
      )
    }
    return localized
  })

for (const story of season2StagingRussianStories) {
  const validationErrors = validateAuthoredStoryPackage(story)
  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid Season 2 staging authored story package (${story.story_id}): ${validationErrors.join('; ')}`,
    )
  }

  if (story.language !== 'ru') {
    throw new Error(
      `Season 2 staging package must remain Russian until localization is approved: ${story.story_id}`,
    )
  }

  if (
    story.cover_illustration.status !== 'hosted_verified' ||
    story.cover_illustration.asset_id !== 'seven_roads_season2_cover_v1'
  ) {
    throw new Error(
      `Season 2 episode package must use the approved shared season-cover gate: ${story.story_id}`,
    )
  }
}

/**
 * Internal pre-release registry only.
 *
 * Do not import this collection into authoredStories.ts or any published shell.
 * Product model: one Season 2 cover + seven episode rows. These episode
 * packages do not get separate cover cards. Publication still waits for the
 * shared Season 2 cover and Uzbek localization overlays.
 */
export const season2StagingAuthoredStoriesRu =
  season2StagingRussianStories

export const season2StagingAuthoredStoriesUz =
  season2StagingUzbekStories

export const findSeason2StagingAuthoredStoryUz = (
  storyId: string,
): AuthoredStoryPackage | null =>
  season2StagingAuthoredStoriesUz.find(
    (story) => story.story_id === storyId,
  ) ?? null

export const findSeason2StagingAuthoredStoryRu = (
  storyId: string,
): AuthoredStoryPackage | null =>
  season2StagingAuthoredStoriesRu.find(
    (story) => story.story_id === storyId,
  ) ?? null
