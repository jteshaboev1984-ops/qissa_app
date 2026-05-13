import { createInitialSeriesState } from './memoryAgent'
import type { Episode, Language, OnboardingSelections, ReaderPreferences, SeriesState } from '../types/qissa'

export type AppScreen = 'welcome' | 'onboarding' | 'home' | 'story'

const KEY_PREFIX = 'qissa:v1'

const STORAGE_KEYS = {
  language: `${KEY_PREFIX}:language`,
  onboardingSelections: `${KEY_PREFIX}:onboardingSelections`,
  seriesState: `${KEY_PREFIX}:seriesState`,
  currentEpisode: `${KEY_PREFIX}:currentEpisode`,
  screen: `${KEY_PREFIX}:screen`,
  readerPreferences: `${KEY_PREFIX}:readerPreferences`,
} as const

const DEPRECATED_KEYS = ['qissa:language', 'qissa:onboardingSelections', 'qissa:seriesState', 'qissa:currentEpisode', 'qissa:screen']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

// Corrupted JSON is ignored by design for prototype resilience.
const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const isLanguage = (value: unknown): value is Language => value === 'ru' || value === 'uz' || value === 'kz'

const normalizeAgeGroup = (ageGroup: string): OnboardingSelections['ageGroup'] => {
  if (ageGroup === '3-5') return '3-4'
  if (ageGroup === '6-8') return '5-7'
  if (ageGroup === '9-10') return '8-9'
  if (ageGroup === '3-4' || ageGroup === '5-7' || ageGroup === '8-9') return ageGroup
  return '5-7'
}

const normalizeOnboardingSelections = (value: OnboardingSelections): OnboardingSelections => ({
  ...value,
  ageGroup: normalizeAgeGroup(value.ageGroup),
})
export const getStorageVersion = () => KEY_PREFIX

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

export const isReaderPreferences = (value: unknown): value is ReaderPreferences => {
  if (!isRecord(value)) return false
  return (value.textSize === 'small' || value.textSize === 'medium' || value.textSize === 'large' || value.textSize === 'extra_large') &&
    (value.fontMode === 'standard' || value.fontMode === 'soft' || value.fontMode === 'dyslexia_friendly') &&
    (value.lineSpacing === 'normal' || value.lineSpacing === 'relaxed' || value.lineSpacing === 'wide') &&
    (value.theme === 'light' || value.theme === 'warm' || value.theme === 'night') &&
    typeof value.showTextWithAudio === 'boolean' &&
    typeof value.audioOnlyNightMode === 'boolean' &&
    (value.voicePresetId === 'soft_female' || value.voicePresetId === 'calm_male' || value.voicePresetId === 'neutral_storyteller' || value.voicePresetId === 'cheerful_daytime') &&
    (value.defaultPlaybackMode === 'read' || value.defaultPlaybackMode === 'listen')
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

const clearEpisodeAndScreen = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.currentEpisode)
    window.localStorage.removeItem(STORAGE_KEYS.screen)
  } catch {
    // ignore clear failures
  }
}

const clearAllQissaStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // ignore clear failures
  }
}

const clearStoryProgressOnly = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.seriesState)
    clearEpisodeAndScreen()
  } catch {
    // ignore clear failures
  }
}

const clearDeprecatedKeys = () => {
  try {
    DEPRECATED_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // ignore clear failures
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
    if (!isOnboardingSelections(value)) return null
    const normalized = normalizeOnboardingSelections(value)
    if (normalized.ageGroup !== value.ageGroup) safeSet(STORAGE_KEYS.onboardingSelections, normalized)
    return normalized
  },
  saveSeriesState: (value: SeriesState) => safeSet(STORAGE_KEYS.seriesState, value),
  loadSeriesState: (): SeriesState | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.seriesState)
    return isSeriesState(value) ? value : null
  },
  loadSeriesStateOrRepair: (selections: OnboardingSelections | null): SeriesState | null => {
    const loaded = localPersistence.loadSeriesState()
    if (loaded || !selections) return loaded

    // Repair missing series state when onboarding selections are present.
    const repaired = createInitialSeriesState(selections)
    localPersistence.saveSeriesState(repaired)
    return repaired
  },
  saveCurrentEpisode: (value: Episode) => safeSet(STORAGE_KEYS.currentEpisode, value),
  loadCurrentEpisode: (): Episode | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.currentEpisode)
    return isEpisode(value) ? value : null
  },
  saveScreen: (value: AppScreen) => safeSet(STORAGE_KEYS.screen, value),
  saveReaderPreferences: (value: ReaderPreferences) => safeSet(STORAGE_KEYS.readerPreferences, value),
  loadScreen: (): AppScreen | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.screen)
    return isAppScreen(value) ? value : null
  },
  loadReaderPreferences: (): ReaderPreferences | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.readerPreferences)
    return isReaderPreferences(value) ? value : null
  },
  getStorageVersion,
  clearStoryProgressOnly,
  clearAllQissaStorage,
  clearEpisodeAndScreen,
  clearDeprecatedKeys,
  clearQissaStorage: clearAllQissaStorage,
}
