import rawSeason2Story1RoyalSilverRu from './authored/staging/season2Story1RoyalSilver.ru.json'
import rawSeason2Story1RoyalSilverUz from './authored/staging/season2Story1RoyalSilver.uz.json'
import rawSeason2Story3TwoTowersRu from './authored/staging/season2Story3TwoTowers.ru.json'
import rawSeason2Story4WaitedManRu from './authored/staging/season2Story4WaitedMan.ru.json'
import rawSeason2Story5FalseRoadRu from './authored/staging/season2Story5FalseRoad.ru.json'
import rawSeason2Story6TwoReinforcementsRu from './authored/staging/season2Story6TwoReinforcements.ru.json'
import rawSeason2Story7BackToOrdanRu from './authored/staging/season2Story7BackToOrdan.ru.json'
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


const season2Story1Uz = localizeAuthoredStoryPackage(
  coerce(rawSeason2Story1RoyalSilverRu),
  rawSeason2Story1RoyalSilverUz as AuthoredStoryLocalizationOverlay,
)

const season2Story1UzValidationErrors =
  validateAuthoredStoryPackage(season2Story1Uz)
if (season2Story1UzValidationErrors.length > 0) {
  throw new Error(
    `Invalid Season 2 Episode 1 Uzbek staging package: ${season2Story1UzValidationErrors.join('; ')}`,
  )
}

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
    story.cover_illustration.status !== 'approved-master-runtime-prepared-not-hosted' ||
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
 * hosted+verified shared Season 2 cover and Uzbek localization overlays.
 */
export const season2StagingAuthoredStoriesRu =
  season2StagingRussianStories

export const season2StagingStory1Uz = season2Story1Uz

export const findSeason2StagingAuthoredStoryRu = (
  storyId: string,
): AuthoredStoryPackage | null =>
  season2StagingAuthoredStoriesRu.find(
    (story) => story.story_id === storyId,
  ) ?? null
