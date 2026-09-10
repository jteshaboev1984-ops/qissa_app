import { betaScope, isPublicBetaLanguage, isPublicBetaStylePack } from '../config/betaScope'
import type { Language, OnboardingSelections } from '../types/qissa'

export const isClosedBetaSelections = (selections: OnboardingSelections): boolean =>
  selections.ageGroup === betaScope.ageGroup &&
  isPublicBetaLanguage(selections.language) &&
  isPublicBetaStylePack(selections.stylePackId) &&
  selections.storyMode === betaScope.defaultStoryMode &&
  selections.storyMood === betaScope.defaultStoryMood

export const normalizeSelectionsForClosedBeta = (
  selections: OnboardingSelections,
  preferredLanguage: Language = selections.language,
): OnboardingSelections => ({
  ...selections,
  ageGroup: betaScope.ageGroup,
  language: isPublicBetaLanguage(preferredLanguage) ? preferredLanguage : betaScope.primaryLanguage,
  stylePackId: isPublicBetaStylePack(selections.stylePackId) ? selections.stylePackId : 'cozy_forest',
  storyMode: betaScope.defaultStoryMode,
  storyMood: betaScope.defaultStoryMood,
})
