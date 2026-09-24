import rawPrazdnikMuzhestvaV3 from './authored/prazdnikMuzhestvaV3.ru.json'
import { validateAuthoredStoryPackage } from '../features/authoredStory/engine'
import type { AuthoredStoryPackage } from '../features/authoredStory/types'

const coerce = (value: unknown): AuthoredStoryPackage => value as AuthoredStoryPackage

export const prazdnikMuzhestvaV3 = coerce(rawPrazdnikMuzhestvaV3)

const validationErrors = validateAuthoredStoryPackage(prazdnikMuzhestvaV3)
if (validationErrors.length > 0) {
  throw new Error(`Invalid authored story package: ${validationErrors.join('; ')}`)
}

export const authoredStories = [prazdnikMuzhestvaV3] as const

export const findAuthoredStory = (storyId: string): AuthoredStoryPackage | null =>
  authoredStories.find((story) => story.story_id === storyId) ?? null
