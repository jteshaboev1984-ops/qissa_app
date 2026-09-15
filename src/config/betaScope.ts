import type { AgeGroup, Language, StoryMode, StoryMood, StylePackId } from '../types/qissa'

const publicLanguages: Language[] = ['ru', 'uz']
const publicStylePackIds: StylePackId[] = ['cozy_forest', 'magic_garden', 'stars_and_space']

export const betaScope = {
  ageGroup: '5-7' as AgeGroup,
  primaryLanguage: 'ru' as Language,
  publicLanguages,
  betaLanguages: ['uz'] as Language[],
  publicStylePackIds,
  nextStylePackId: 'silk_road' as StylePackId,
  defaultStoryMode: 'series' as StoryMode,
  defaultStoryMood: 'bedtime' as StoryMood,
  // Do not expose a product-facing family quota during the closed beta. The
  // backend still enforces a conservative emergency provider-spend ceiling and
  // keeps private aggregate accounting. Any future visible quota is a product
  // decision and should remain separate from this operational safety guard.
  storyGenerationThrottleEnabled: false,
  providerAudioEnabledByDefault: false,
} as const

export const isPublicBetaLanguage = (language: Language) =>
  betaScope.publicLanguages.includes(language)

export const isPublicBetaStylePack = (stylePackId: StylePackId) =>
  betaScope.publicStylePackIds.includes(stylePackId)
