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
  // Story AI remains under active development. Do not impose a product-facing
  // daily quota while prompts, validators and continuity are still being tuned.
  // Provider-eligible requests are still counted server-side for observability.
  // Re-enable plan-aware quotas plus an emergency spend ceiling before launch.
  storyGenerationThrottleEnabled: false,
  providerAudioEnabledByDefault: false,
} as const

export const isPublicBetaLanguage = (language: Language) =>
  betaScope.publicLanguages.includes(language)

export const isPublicBetaStylePack = (stylePackId: StylePackId) =>
  betaScope.publicStylePackIds.includes(stylePackId)
