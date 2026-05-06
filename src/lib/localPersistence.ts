import type { Episode, Language, OnboardingSelections, SeriesState } from '../types/qissa'

export type AppScreen = 'welcome' | 'onboarding' | 'home' | 'story'

const KEY_PREFIX = 'qissa:v1'

const STORAGE_KEYS = {
  language: `${KEY_PREFIX}:language`,
  onboardingSelections: `${KEY_PREFIX}:onboardingSelections`,
  seriesState: `${KEY_PREFIX}:seriesState`,
  currentEpisode: `${KEY_PREFIX}:currentEpisode`,
  screen: `${KEY_PREFIX}:screen`,
} as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const isLanguage = (value: unknown): value is Language => value === 'ru' || value === 'uz' || value === 'kz'

export const isOnboardingSelections = (value: unknown): value is OnboardingSelections => {
  if (!isRecord(value)) return false
  return typeof value.ageGroup === 'string' &&
    isLanguage(value.language) &&
    typeof value.heroType === 'string' &&
    typeof value.stylePackId === 'string' &&
    typeof value.storyMode === 'string' &&
    typeof value.storyMood === 'string' &&
    (value.customHeroName === undefined || typeof value.customHeroName === 'string')
}

export const isSeriesState = (value: unknown): value is SeriesState => {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' &&
    typeof value.childProfileId === 'string' &&
    typeof value.stylePackId === 'string' &&
    typeof value.mainCharacter === 'string' &&
    Array.isArray(value.recurringCharacters) &&
    typeof value.lastEpisodeSummary === 'string' &&
    typeof value.activeArc === 'string' &&
    isRecord(value.relationshipState) &&
    Array.isArray(value.choiceHistory) &&
    isRecord(value.canonState) &&
    typeof value.episodeCount === 'number'
}

export const isEpisode = (value: unknown): value is Episode => {
  if (!isRecord(value)) return false
  return typeof value.episode_id === 'string' &&
    typeof value.series_id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.story_text === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.mood === 'string' &&
    typeof value.stylePackId === 'string' &&
    Array.isArray(value.choices) &&
    isRecord(value.state_patch) &&
    Array.isArray(value.vocabulary) &&
    typeof value.nextEpisodePreview === 'string' &&
    isRecord(value.safety_self_check)
}

const isAppScreen = (value: unknown): value is AppScreen =>
  value === 'welcome' || value === 'onboarding' || value === 'home' || value === 'story'

const safeSet = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore write failures in prototype mode
  }
}

const safeGet = <T>(key: string): T | null => {
  try {
    return safeParseJSON<T>(window.localStorage.getItem(key))
  } catch {
    return null
  }
}

export const localPersistence = {
  keys: STORAGE_KEYS,
  saveLanguage: (language: Language) => safeSet(STORAGE_KEYS.language, language),
  loadLanguage: (): Language | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.language)
    return isLanguage(value) ? value : null
  },
  saveOnboardingSelections: (value: OnboardingSelections) => safeSet(STORAGE_KEYS.onboardingSelections, value),
  loadOnboardingSelections: (): OnboardingSelections | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.onboardingSelections)
    return isOnboardingSelections(value) ? value : null
  },
  saveSeriesState: (value: SeriesState) => safeSet(STORAGE_KEYS.seriesState, value),
  loadSeriesState: (): SeriesState | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.seriesState)
    return isSeriesState(value) ? value : null
  },
  saveCurrentEpisode: (value: Episode) => safeSet(STORAGE_KEYS.currentEpisode, value),
  loadCurrentEpisode: (): Episode | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.currentEpisode)
    return isEpisode(value) ? value : null
  },
  saveScreen: (value: AppScreen) => safeSet(STORAGE_KEYS.screen, value),
  loadScreen: (): AppScreen | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.screen)
    return isAppScreen(value) ? value : null
  },

  clearEpisodeAndScreen: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.currentEpisode)
      window.localStorage.removeItem(STORAGE_KEYS.screen)
    } catch {
      // ignore clear failures
    }
  },
  clearQissaStorage: () => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
    } catch {
      // ignore clear failures
    }
  },
}
