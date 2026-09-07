import type { NormalizedStoryContext } from './contracts.ts'
import { bedtimeEpisodeOneExpansion } from './storyBedtimeExpansion.ts'
import { cozyForestBedtimeContinuation, cozyForestBedtimeEpisodeOne } from './storyCozyForestBedtime.ts'
import { magicGardenContinuation, magicGardenEpisodeOne, magicGardenTitle } from './storyMagicGardenBedtime.ts'
import { spaceBedtimeContinuation, spaceBedtimeEpisodeOne, spaceBedtimeTitle } from './storySpaceBedtime.ts'

type ClosedBetaLanguage = 'ru' | 'uz'

const getClosedBetaLanguage = (
  context: NormalizedStoryContext,
  stylePackId: 'cozy_forest' | 'magic_garden' | 'stars_and_space',
): ClosedBetaLanguage | null => {
  if (context.stylePackId !== stylePackId) return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const branchFromChoice = (choiceId: string) => choiceId === 'choice-a' || choiceId === 'path_a'
  ? 'choice-a'
  : choiceId === 'choice-b' || choiceId === 'path_b'
    ? 'choice-b'
    : null

const withBedtimeExpansion = (
  baseStory: string,
  world: 'cozy_forest' | 'magic_garden' | 'stars_and_space',
  language: ClosedBetaLanguage,
) => `${baseStory}\n\n${bedtimeEpisodeOneExpansion[world][language]}`

export const referenceEpisodeOneStory = (
  context: NormalizedStoryContext,
  fallbackText: string,
): string => {
  const cozyLanguage = getClosedBetaLanguage(context, 'cozy_forest')
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

  if (cozyLanguage) return withBedtimeExpansion(cozyForestBedtimeEpisodeOne[cozyLanguage], 'cozy_forest', cozyLanguage)
  if (magicLanguage) return withBedtimeExpansion(magicGardenEpisodeOne[magicLanguage], 'magic_garden', magicLanguage)
  if (spaceLanguage) return withBedtimeExpansion(spaceBedtimeEpisodeOne[spaceLanguage], 'stars_and_space', spaceLanguage)
  return fallbackText
}

export const referenceContinuationStory = (
  context: NormalizedStoryContext,
  choiceId: string,
  fallbackText: string,
): string => {
  const branch = branchFromChoice(choiceId)
  if (!branch) return fallbackText

  const cozyLanguage = getClosedBetaLanguage(context, 'cozy_forest')
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

  if (cozyLanguage) return cozyForestBedtimeContinuation[cozyLanguage][branch]
  if (magicLanguage) return magicGardenContinuation[magicLanguage][branch]
  if (spaceLanguage) return spaceBedtimeContinuation[spaceLanguage][branch]
  return fallbackText
}

export const referenceEpisodeTitle = (
  context: NormalizedStoryContext,
  fallbackTitle: string,
): string => {
  const magicLanguage = getClosedBetaLanguage(context, 'magic_garden')
  const spaceLanguage = getClosedBetaLanguage(context, 'stars_and_space')

  if (spaceLanguage) {
    if (!context.isContinuation) return spaceBedtimeTitle[spaceLanguage].one
    const branch = branchFromChoice(context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? '')
    return branch === 'choice-b' ? spaceBedtimeTitle[spaceLanguage].b : spaceBedtimeTitle[spaceLanguage].a
  }

  if (magicLanguage) {
    if (!context.isContinuation) return magicGardenTitle[magicLanguage].one
    const branch = branchFromChoice(context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? '')
    return branch === 'choice-b' ? magicGardenTitle[magicLanguage].b : magicGardenTitle[magicLanguage].a
  }

  return fallbackTitle
}
