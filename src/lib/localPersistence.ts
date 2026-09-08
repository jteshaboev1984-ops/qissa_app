import { createInitialSeriesState } from './memoryAgent'
import type { Episode, Language, OnboardingSelections, ReaderPreferences, SeriesState } from '../types/qissa'

export type AppScreen = 'welcome' | 'onboarding' | 'home' | 'story'
export type PersistedStoryProvider = 'local' | 'remote'

export type RemotePersistenceSnapshot = {
  selections: OnboardingSelections
  seriesState: SeriesState
  episode: Episode
  readerPreferences: ReaderPreferences
}

type PendingChoiceSyncRequest = {
  seriesState: SeriesState
  episodeId: string
  choiceId: string
}

const KEY_PREFIX = 'qissa:v1'

const STORAGE_KEYS = {
  language: `${KEY_PREFIX}:language`,
  onboardingSelections: `${KEY_PREFIX}:onboardingSelections`,
  seriesState: `${KEY_PREFIX}:seriesState`,
  currentEpisode: `${KEY_PREFIX}:currentEpisode`,
  screen: `${KEY_PREFIX}:screen`,
  readerPreferences: `${KEY_PREFIX}:readerPreferences`,
  storyProvider: `${KEY_PREFIX}:storyProvider`,
  remoteResetRequired: `${KEY_PREFIX}:remoteResetRequired`,
  pendingChoiceSync: `${KEY_PREFIX}:pendingChoiceSync`,
} as const

const DEPRECATED_KEYS = ['qissa:language', 'qissa:onboardingSelections', 'qissa:seriesState', 'qissa:currentEpisode', 'qissa:screen']

let pendingRemoteReset: Promise<void> | null = null
let requestedRemoteResetGeneration = 0
let completedRemoteResetGeneration = 0
let pendingChoiceSync: Promise<void> | null = null
let pendingChoiceSyncRequest: PendingChoiceSyncRequest | null = null
let criticalSyncDeletionBarrier = false

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

const isPendingChoiceSyncRequest = (value: unknown): value is PendingChoiceSyncRequest =>
  isRecord(value) &&
  isSeriesState(value.seriesState) &&
  typeof value.episodeId === 'string' &&
  typeof value.choiceId === 'string'

const isAppScreen = (value: unknown): value is AppScreen =>
  value === 'welcome' || value === 'onboarding' || value === 'home' || value === 'story'

const isStoryProvider = (value: unknown): value is PersistedStoryProvider => value === 'local' || value === 'remote'

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

const safeRemove = (key: string) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore remove failures in prototype mode
  }
}

const startRemoteReset = () => {
  if (
    criticalSyncDeletionBarrier ||
    pendingRemoteReset ||
    pendingChoiceSync ||
    completedRemoteResetGeneration >= requestedRemoteResetGeneration
  ) return

  const targetGeneration = requestedRemoteResetGeneration
  const task = import('./storyStateService')
    .then(({ storyStateService }) => storyStateService.resetCurrent())
    .then(() => {
      completedRemoteResetGeneration = Math.max(completedRemoteResetGeneration, targetGeneration)
      if (completedRemoteResetGeneration >= requestedRemoteResetGeneration) {
        safeRemove(STORAGE_KEYS.remoteResetRequired)
      }
    })

  pendingRemoteReset = task
  void task.then(
    () => {
      if (pendingRemoteReset === task) pendingRemoteReset = null
      startRemoteReset()
    },
    (error) => {
      console.error('Failed to reset remote story state', error)
      if (pendingRemoteReset === task) pendingRemoteReset = null
    },
  )
}

const queueRemoteReset = () => {
  requestedRemoteResetGeneration += 1
  safeSet(STORAGE_KEYS.remoteResetRequired, true)

  // Reset supersedes any not-yet-persisted choice from the story being discarded.
  if (pendingChoiceSyncRequest) {
    pendingChoiceSyncRequest = null
    safeRemove(STORAGE_KEYS.pendingChoiceSync)
  }

  startRemoteReset()
}

const startChoiceSync = () => {
  if (
    criticalSyncDeletionBarrier ||
    pendingChoiceSync ||
    !pendingChoiceSyncRequest ||
    completedRemoteResetGeneration < requestedRemoteResetGeneration
  ) return

  const request = pendingChoiceSyncRequest
  const task = import('./storyStateService')
    .then(({ storyStateService }) => storyStateService.confirmChoice(request))
    .then(() => {
      if (pendingChoiceSyncRequest === request) {
        pendingChoiceSyncRequest = null
        safeRemove(STORAGE_KEYS.pendingChoiceSync)
      }
    })

  pendingChoiceSync = task
  void task.then(
    () => {
      if (pendingChoiceSync === task) pendingChoiceSync = null
      startRemoteReset()
    },
    (error) => {
      console.error('Failed to sync story choice', error)
      if (pendingChoiceSync === task) pendingChoiceSync = null
      startRemoteReset()
    },
  )
}

const queueChoiceSync = (previous: SeriesState | null, next: SeriesState) => {
  if (!previous || next.choiceHistory.length !== previous.choiceHistory.length + 1) return
  const latest = next.choiceHistory[next.choiceHistory.length - 1]
  if (!latest) return

  pendingChoiceSyncRequest = {
    seriesState: next,
    episodeId: latest.episode_id,
    choiceId: latest.choice_id,
  }
  safeSet(STORAGE_KEYS.pendingChoiceSync, pendingChoiceSyncRequest)
  startChoiceSync()
}

const queuePreferencesSync = (value: ReaderPreferences) => {
  void import('./storyStateService')
    .then(({ storyStateService }) => storyStateService.savePreferences(value))
    .catch((error) => console.error('Failed to sync reader preferences', error))
}

const clearEpisodeAndScreen = () => {
  queueRemoteReset()
  safeRemove(STORAGE_KEYS.currentEpisode)
  safeRemove(STORAGE_KEYS.screen)
}

const clearAllLocalData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
    DEPRECATED_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Ignore local storage failures during privacy deletion.
  }
}

const clearAllQissaStorage = () => {
  clearAllLocalData()
  queueRemoteReset()
}

const clearStoryProgressOnly = () => {
  // Provider migration is a local compatibility boundary, not a user-requested
  // server reset. Queuing reset_current here can create a stale durable reset on
  // a brand-new installation before its credential has ever been bound.
  safeRemove(STORAGE_KEYS.seriesState)
  safeRemove(STORAGE_KEYS.currentEpisode)
  safeRemove(STORAGE_KEYS.screen)
}

const prepareForStoryProvider = (mode: PersistedStoryProvider): boolean => {
  const storedValue = safeGet<unknown>(STORAGE_KEYS.storyProvider)
  const previousMode = isStoryProvider(storedValue) ? storedValue : null
  const shouldResetLegacyProgress = previousMode === null && mode === 'remote'
  const shouldResetChangedProvider = previousMode !== null && previousMode !== mode
  const didReset = shouldResetLegacyProgress || shouldResetChangedProvider

  if (didReset) clearStoryProgressOnly()
  safeSet(STORAGE_KEYS.storyProvider, mode)
  return didReset
}

const hydrateCriticalSyncOutbox = () => {
  if (safeGet<unknown>(STORAGE_KEYS.remoteResetRequired) === true) {
    requestedRemoteResetGeneration = 1
    completedRemoteResetGeneration = 0
  }

  const storedChoice = safeGet<unknown>(STORAGE_KEYS.pendingChoiceSync)
  if (isPendingChoiceSyncRequest(storedChoice)) {
    pendingChoiceSyncRequest = storedChoice
  } else if (storedChoice !== null) {
    safeRemove(STORAGE_KEYS.pendingChoiceSync)
  }

  // A durable reset means the previous story was discarded, so a stale unsynced
  // choice from that story must not be replayed after reload.
  if (requestedRemoteResetGeneration > completedRemoteResetGeneration && pendingChoiceSyncRequest) {
    pendingChoiceSyncRequest = null
    safeRemove(STORAGE_KEYS.pendingChoiceSync)
  }
}

hydrateCriticalSyncOutbox()

const activeStoryProvider: PersistedStoryProvider =
  import.meta.env.VITE_QISSA_STORY_PROVIDER === 'remote' ? 'remote' : 'local'

prepareForStoryProvider(activeStoryProvider)

const clearDeprecatedKeys = () => {
  try {
    DEPRECATED_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // ignore clear failures
  }
}

const waitForPendingRemoteReset = async () => {
  while (completedRemoteResetGeneration < requestedRemoteResetGeneration) {
    // A reset supersedes the choice. If a choice request was already in flight,
    // let it settle first so the reset is the final remote mutation.
    if (pendingChoiceSync) {
      await Promise.allSettled([pendingChoiceSync])
      continue
    }

    if (!pendingRemoteReset) startRemoteReset()
    const task = pendingRemoteReset
    if (!task) throw new Error('Remote story reset could not be started.')
    await task
  }
}

const waitForPendingChoiceSync = async () => {
  while (pendingChoiceSyncRequest) {
    if (!pendingChoiceSync) startChoiceSync()
    const task = pendingChoiceSync
    if (!task) throw new Error('Remote story choice sync could not be started.')
    await task
  }
}

const settleActiveCriticalSyncForDeletion = async () => {
  criticalSyncDeletionBarrier = true
  try {
    const activeTasks = [pendingChoiceSync, pendingRemoteReset].filter(
      (task): task is Promise<void> => task !== null,
    )
    if (activeTasks.length > 0) await Promise.allSettled(activeTasks)
  } finally {
    criticalSyncDeletionBarrier = false
  }
}

const clearCriticalSyncAfterProfileDeletion = () => {
  pendingRemoteReset = null
  requestedRemoteResetGeneration = 0
  completedRemoteResetGeneration = 0
  pendingChoiceSync = null
  pendingChoiceSyncRequest = null
  criticalSyncDeletionBarrier = false
  safeRemove(STORAGE_KEYS.remoteResetRequired)
  safeRemove(STORAGE_KEYS.pendingChoiceSync)
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
  saveSeriesState: (value: SeriesState) => {
    const previousValue = safeGet<unknown>(STORAGE_KEYS.seriesState)
    const previous = isSeriesState(previousValue) ? previousValue : null
    safeSet(STORAGE_KEYS.seriesState, value)
    queueChoiceSync(previous, value)
  },
  loadSeriesState: (): SeriesState | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.seriesState)
    return isSeriesState(value) ? value : null
  },
  loadSeriesStateOrRepair: (selections: OnboardingSelections | null): SeriesState | null => {
    const loaded = localPersistence.loadSeriesState()
    if (loaded || !selections) return loaded

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
  saveReaderPreferences: (value: ReaderPreferences) => {
    safeSet(STORAGE_KEYS.readerPreferences, value)
    queuePreferencesSync(value)
  },
  loadScreen: (): AppScreen | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.screen)
    return isAppScreen(value) ? value : null
  },
  loadReaderPreferences: (): ReaderPreferences | null => {
    const value = safeGet<unknown>(STORAGE_KEYS.readerPreferences)
    return isReaderPreferences(value) ? value : null
  },
  restoreRemoteSnapshot: (snapshot: RemotePersistenceSnapshot) => {
    safeSet(STORAGE_KEYS.language, snapshot.selections.language)
    safeSet(STORAGE_KEYS.onboardingSelections, normalizeOnboardingSelections(snapshot.selections))
    safeSet(STORAGE_KEYS.seriesState, snapshot.seriesState)
    safeSet(STORAGE_KEYS.currentEpisode, snapshot.episode)
    safeSet(STORAGE_KEYS.readerPreferences, snapshot.readerPreferences)
    safeSet(STORAGE_KEYS.screen, 'home')
  },
  waitForPendingRemoteReset,
  waitForPendingChoiceSync,
  settleActiveCriticalSyncForDeletion,
  clearCriticalSyncAfterProfileDeletion,
  getStorageVersion,
  prepareForStoryProvider,
  clearStoryProgressOnly,
  clearAllLocalData,
  clearAllQissaStorage,
  clearEpisodeAndScreen,
  clearDeprecatedKeys,
  clearQissaStorage: clearAllQissaStorage,
}
