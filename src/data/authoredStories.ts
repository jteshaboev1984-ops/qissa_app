import rawPrazdnikMuzhestvaV3 from './authored/prazdnikMuzhestvaV3.ru.json'
import rawPrazdnikMuzhestvaV3Uz from './authored/prazdnikMuzhestvaV3.uz.json'
import rawTaynaVostochnogoKaravanaV4 from './authored/taynaVostochnogoKaravanaV4.ru.json'
import { validateAuthoredStoryPackage } from '../features/authoredStory/engine'
import {
  localizeAuthoredStoryPackage,
  type AuthoredStoryLocalizationOverlay,
} from '../features/authoredStory/localizePackage'
import type { AuthoredStoryPackage } from '../features/authoredStory/types'

const coerce = (value: unknown): AuthoredStoryPackage => value as AuthoredStoryPackage

export const prazdnikMuzhestvaV3Ru = coerce(rawPrazdnikMuzhestvaV3)
export const prazdnikMuzhestvaV3Uz = localizeAuthoredStoryPackage(
  prazdnikMuzhestvaV3Ru,
  rawPrazdnikMuzhestvaV3Uz as AuthoredStoryLocalizationOverlay,
)

// Backward-compatible Russian export for older internal tooling.
export const prazdnikMuzhestvaV3 = prazdnikMuzhestvaV3Ru

export const prazdnikMuzhestvaV3ByLanguage = {
  ru: prazdnikMuzhestvaV3Ru,
  uz: prazdnikMuzhestvaV3Uz,
} as const

export const taynaVostochnogoKaravanaV4Ru = coerce(rawTaynaVostochnogoKaravanaV4)

for (const story of [
  ...Object.values(prazdnikMuzhestvaV3ByLanguage),
  taynaVostochnogoKaravanaV4Ru,
]) {
  const validationErrors = validateAuthoredStoryPackage(story)
  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid authored story package (${story.language}): ${validationErrors.join('; ')}`,
    )
  }
}

export const authoredStories = Object.values(prazdnikMuzhestvaV3ByLanguage)

export const findAuthoredStory = (
  storyId: string,
  language: keyof typeof prazdnikMuzhestvaV3ByLanguage = 'ru',
): AuthoredStoryPackage | null =>
  authoredStories.find(
    (story) => story.story_id === storyId && story.language === language,
  ) ?? null
