import type { Episode, OnboardingSelections, PrivacyConsent, ReaderPreferences, SeriesState } from '../types/qissa'
import type { AuthoredStoryPackage, AuthoredStoryProgress } from '../features/authoredStory/types'
import { isEpisode, isOnboardingSelections, isReaderPreferences, isSeriesState } from './localPersistence'
import { isAuthoredStoryProgress } from './authoredStoryPersistence'
import { getInstallationAuth, getInstallationId } from './installationIdentity'
import { getStoryProviderConfig } from './storyRemoteClient'

export type RemoteStorySnapshot = {
  selections: OnboardingSelections
  seriesState: SeriesState
  episode: Episode
  readerPreferences: ReaderPreferences
}

type SyncGeneratedInput = {
  selections: OnboardingSelections
  seriesState: SeriesState
  episode: Episode
  readerPreferences: ReaderPreferences
  privacyConsent: PrivacyConsent
}

type ConfirmChoiceInput = {
  seriesState: SeriesState
  episodeId: string
  choiceId: string
}

const getStateEndpoint = (): string | null => {
  const explicit = import.meta.env.VITE_QISSA_STATE_ENDPOINT?.trim()
  if (explicit) return explicit

  const storyEndpoint = getStoryProviderConfig().endpoint
  return storyEndpoint?.replace(/\/story-generate\/?$/, '/story-state') ?? null
}

const buildHeaders = (publishableKey: string): Headers => {
  const headers = new Headers()
  headers.set('content-type', 'application/json')
  headers.set('apikey', publishableKey)
  headers.set('authorization', `Bearer ${publishableKey}`)
  return headers
}

const requestRemote = async (
  endpoint: string,
  publishableKey: string,
  timeoutMs: number,
  payload: Record<string, unknown>,
  serviceName: string,
): Promise<unknown> => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(publishableKey),
      body: JSON.stringify({
        installationId: getInstallationId(),
        installationAuth: getInstallationAuth(),
        ...payload,
      }),
      signal: controller.signal,
      credentials: 'omit',
    })

    if (!response.ok) {
      const details = (await response.text()).trim().slice(0, 240)
      throw new Error(`${serviceName} returned ${response.status}${details ? `: ${details}` : ''}`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`${serviceName} timed out after ${timeoutMs} ms.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const requestState = async (payload: Record<string, unknown>): Promise<unknown> => {
  const config = getStoryProviderConfig()
  if (config.mode === 'local') return null

  const endpoint = getStateEndpoint()
  if (!endpoint || !config.publishableKey) throw new Error('Remote story state service is not configured.')

  return requestRemote(endpoint, config.publishableKey, config.timeoutMs, payload, 'Remote story state service')
}

const syncGenerated = async ({ selections, seriesState, episode, readerPreferences, privacyConsent }: SyncGeneratedInput): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return

  await requestState({
    action: 'sync_generated',
    selections,
    seriesState,
    episode,
    readerPreferences,
    privacyConsent,
  })
}

const confirmChoice = async ({ seriesState, episodeId, choiceId }: ConfirmChoiceInput): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return

  await requestState({
    action: 'confirm_choice',
    seriesState,
    episodeId,
    choiceId,
  })
}

const saveAuthoredProgress = async (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
  progress: AuthoredStoryProgress,
): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return

  await requestState({
    action: 'save_authored_progress',
    storyId: story.story_id,
    storyVersion: story.story_version,
    authoredProgress: progress,
  })
}

const loadAuthoredProgress = async (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): Promise<AuthoredStoryProgress | null> => {
  if (getStoryProviderConfig().mode === 'local') return null

  const response = await requestState({
    action: 'load_authored_progress',
    storyId: story.story_id,
    storyVersion: story.story_version,
  })
  if (!response || typeof response !== 'object') return null

  const progress = (response as { progress?: unknown }).progress
  if (progress === null || progress === undefined) return null
  if (!isAuthoredStoryProgress(progress, story)) {
    throw new Error('Remote story state service returned invalid authored progress.')
  }
  return progress
}

const clearAuthoredProgress = async (
  story: Pick<AuthoredStoryPackage, 'story_id' | 'story_version'>,
): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return

  await requestState({
    action: 'clear_authored_progress',
    storyId: story.story_id,
    storyVersion: story.story_version,
  })
}

const savePreferences = async (readerPreferences: ReaderPreferences): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return
  await requestState({ action: 'save_preferences', readerPreferences })
}

const resetCurrent = async (): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return
  await requestState({ action: 'reset_current' })
}

const deleteProfileData = async (): Promise<void> => {
  if (getStoryProviderConfig().mode === 'local') return
  await requestState({ action: 'delete_profile_data' })
}

const loadCurrent = async (): Promise<RemoteStorySnapshot | null> => {
  if (getStoryProviderConfig().mode === 'local') return null

  const response = await requestState({ action: 'load_current' })
  if (!response || typeof response !== 'object') return null

  const snapshot = (response as { snapshot?: unknown }).snapshot
  if (!snapshot || typeof snapshot !== 'object') return null

  const candidate = snapshot as Partial<RemoteStorySnapshot>
  if (
    !isOnboardingSelections(candidate.selections) ||
    !isSeriesState(candidate.seriesState) ||
    !isEpisode(candidate.episode) ||
    !isReaderPreferences(candidate.readerPreferences)
  ) {
    throw new Error('Remote story state service returned an invalid snapshot.')
  }

  return candidate as RemoteStorySnapshot
}

export const storyStateService = {
  syncGenerated,
  confirmChoice,
  saveAuthoredProgress,
  loadAuthoredProgress,
  clearAuthoredProgress,
  savePreferences,
  resetCurrent,
  deleteProfileData,
  loadCurrent,
}
