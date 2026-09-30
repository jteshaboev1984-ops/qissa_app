import rawTaynaVostochnogoKaravanaV4 from './authored/taynaVostochnogoKaravanaV4.ru.json'
import { validateAuthoredStoryPackage } from '../features/authoredStory/engine'
import type { AuthoredStoryPackage } from '../features/authoredStory/types'

export const taynaVostochnogoKaravanaV4Ru =
  rawTaynaVostochnogoKaravanaV4 as AuthoredStoryPackage

const validationErrors = validateAuthoredStoryPackage(taynaVostochnogoKaravanaV4Ru)
if (validationErrors.length > 0) {
  throw new Error(
    `Invalid Story 2 authored package: ${validationErrors.join('; ')}`,
  )
}
