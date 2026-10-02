import rawTaynaVostochnogoKaravanaV4 from './authored/taynaVostochnogoKaravanaV4.ru.json'
import rawTaynaVostochnogoKaravanaV4Uz from './authored/taynaVostochnogoKaravanaV4.uz.json'
import { validateAuthoredStoryPackage } from '../features/authoredStory/engine'
import {
  localizeAuthoredStoryPackage,
  type AuthoredStoryLocalizationOverlay,
} from '../features/authoredStory/localizePackage'
import type { AuthoredStoryPackage } from '../features/authoredStory/types'

export const taynaVostochnogoKaravanaV4Ru =
  rawTaynaVostochnogoKaravanaV4 as AuthoredStoryPackage

export const taynaVostochnogoKaravanaV4Uz = localizeAuthoredStoryPackage(
  taynaVostochnogoKaravanaV4Ru,
  rawTaynaVostochnogoKaravanaV4Uz as AuthoredStoryLocalizationOverlay,
)

export const taynaVostochnogoKaravanaV4ByLanguage = {
  ru: taynaVostochnogoKaravanaV4Ru,
  uz: taynaVostochnogoKaravanaV4Uz,
} as const

for (const story of Object.values(taynaVostochnogoKaravanaV4ByLanguage)) {
  const validationErrors = validateAuthoredStoryPackage(story)
  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid Story 2 authored package (${story.language}): ${validationErrors.join('; ')}`,
    )
  }
}
