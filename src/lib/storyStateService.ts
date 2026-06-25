import type { Episode, OnboardingSelections, PrivacyConsent, ReaderPreferences, SeriesState } from '../types/qissa'
import { isEpisode, isOnboardingSelections, isReaderPreferences, isSeriesState } from './localPersistence'
import { getInstallationId } from './installationIdentity'
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

const requestState = async (payload: Record<string, unknown>): Promise<unknown> => {
  const config = getStoryProviderConfig()
  if (config.mode === 'local') return null

  const endpoint = getStateEndpoint()
  if (!endpoint || !config.publishableKey) throw new Error('Remote story state service is not configured.')

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(config.publishableKey),
      body: JSON.stringify({ installationId: getInstallationId(), ...payload }),
      signal: controller.signal,
      credentials: 'omit',
    })

    if (!response.ok) {
      const details = (await response.text()).trim().slice(0, 240)
      throw new Error(`Remote story state service returned ${response.status}${details ? `: ${details}` : ''}`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Remote story state service timed out after ${config.timeoutMs} ms.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
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
  savePreferences,
  resetCurrent,
  deleteProfileData,
  loadCurrent,
}
