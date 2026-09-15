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
  // Story AI is still being tuned. Do not expose a product-facing family quota
  // or let an operational daily throttle block validator/prompt acceptance work.
  // Provider-eligible calls remain privately counted server-side. Positive
  // emergency ceilings must be restored deliberately before external beta/launch.
  storyGenerationThrottleEnabled: false,
  providerAudioEnabledByDefault: false,
} as const

export const isPublicBetaLanguage = (language: Language) =>
  betaScope.publicLanguages.includes(language)

export const isPublicBetaStylePack = (stylePackId: StylePackId) =>
  betaScope.publicStylePackIds.includes(stylePackId)
