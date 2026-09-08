import type { VoicePresetId } from '../types/qissa'
import { getInstallationAuth, getInstallationId } from './installationIdentity'
import type { NarrationSpeed } from './narrationPlan'
import { getStoryProviderConfig } from './storyRemoteClient'

export type AudioDeliverySource = 'cache' | 'openai-generated' | 'device-fallback' | null

export type AudioAssetResponse = {
  audioStatus: 'ready' | 'queued' | 'failed'
  audioAssetId: string | null
  audioUrl: string | null
  durationSeconds: number | null
  fallbackUsed: boolean
  fallbackMode: 'device' | null
  errorCode: string | null
  requiresAiVoiceDisclosure: boolean
  source: AudioDeliverySource
}

export type RemotePlaybackProgress = {
  audioAssetId: string | null
  positionSeconds: number
  speed: NarrationSpeed
  completed: boolean
  updatedAt: string | null
}

type EpisodeIdentity = {
  seriesId: string
  episodeId: string
}

type RequestAudioInput = EpisodeIdentity & {
  voicePresetId: VoicePresetId
  speed: NarrationSpeed
}

type SaveProgressInput = EpisodeIdentity & {
  audioAssetId?: string | null
  positionSeconds: number
  speed: NarrationSpeed
  completed: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSpeed = (value: unknown): value is NarrationSpeed =>
  value === 0.8 || value === 1 || value === 1.2

const getAudioEndpoint = (): string | null => {
  const explicit = import.meta.env.VITE_QISSA_AUDIO_ENDPOINT?.trim()
  if (explicit) return explicit

  const storyEndpoint = getStoryProviderConfig().endpoint
  return storyEndpoint?.replace(/\/story-generate\/?$/, '/audio-request') ?? null
}

const buildHeaders = (publishableKey: string): Headers => {
  const headers = new Headers()
  headers.set('content-type', 'application/json')
  headers.set('apikey', publishableKey)
  headers.set('authorization', `Bearer ${publishableKey}`)
  return headers
}

const requestRemote = async (payload: Record<string, unknown>): Promise<{ body: unknown; response: Response }> => {
  const config = getStoryProviderConfig()
  const endpoint = getAudioEndpoint()
  if (config.mode !== 'remote' || !endpoint || !config.publishableKey) {
    throw new Error('Remote audio service is not configured.')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(config.publishableKey),
      body: JSON.stringify({
        installationId: getInstallationId(),
        installationAuth: getInstallationAuth(),
        ...payload,
      }),
      signal: controller.signal,
      credentials: 'omit',
    })

    const responseText = await response.text()
    if (!response.ok) {
      throw new Error(`Remote audio service returned ${response.status}${responseText ? `: ${responseText.slice(0, 240)}` : ''}`)
    }

    let body: unknown = null
    if (responseText) {
      try {
        body = JSON.parse(responseText)
      } catch {
        throw new Error('Remote audio service returned invalid JSON.')
      }
    }

    return { body, response }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Remote audio service timed out after ${config.timeoutMs} ms.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const requestAudio = async ({ seriesId, episodeId, voicePresetId, speed }: RequestAudioInput): Promise<AudioAssetResponse> => {
  const { body, response } = await requestRemote({
    action: 'request_audio',
    seriesId,
    episodeId,
    voicePresetId,
    speed,
  })

  if (!isRecord(body)) throw new Error('Remote audio service returned an invalid audio payload.')
  const audioStatus = body.audioStatus
  if (audioStatus !== 'ready' && audioStatus !== 'queued' && audioStatus !== 'failed') {
    throw new Error('Remote audio service returned an invalid audio status.')
  }

  return {
    audioStatus,
    audioAssetId: typeof body.audioAssetId === 'string' ? body.audioAssetId : null,
    audioUrl: typeof body.audioUrl === 'string' ? body.audioUrl : null,
    durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : null,
    fallbackUsed: body.fallbackUsed === true,
    fallbackMode: body.fallbackMode === 'device' ? 'device' : null,
    errorCode: typeof body.errorCode === 'string' ? body.errorCode : null,
    requiresAiVoiceDisclosure: body.requiresAiVoiceDisclosure === true,
    source: (['cache', 'openai-generated', 'device-fallback'] as const).includes(
      response.headers.get('x-qissa-audio-source') as 'cache' | 'openai-generated' | 'device-fallback',
    )
      ? response.headers.get('x-qissa-audio-source') as AudioDeliverySource
      : null,
  }
}

export const loadPlaybackProgress = async ({ seriesId, episodeId }: EpisodeIdentity): Promise<RemotePlaybackProgress | null> => {
  const { body } = await requestRemote({ action: 'load_progress', seriesId, episodeId })
  if (!isRecord(body)) throw new Error('Remote audio service returned an invalid progress payload.')
  const progress = body.progress
  if (progress === null || progress === undefined) return null
  if (!isRecord(progress)) throw new Error('Remote audio service returned invalid playback progress.')

  const positionSeconds = typeof progress.positionSeconds === 'number' && Number.isFinite(progress.positionSeconds)
    ? Math.max(0, progress.positionSeconds)
    : 0
  const speed = isSpeed(progress.speed) ? progress.speed : 1

  return {
    audioAssetId: typeof progress.audioAssetId === 'string' ? progress.audioAssetId : null,
    positionSeconds,
    speed,
    completed: progress.completed === true,
    updatedAt: typeof progress.updatedAt === 'string' ? progress.updatedAt : null,
  }
}

export const savePlaybackProgress = async ({
  seriesId,
  episodeId,
  audioAssetId,
  positionSeconds,
  speed,
  completed,
}: SaveProgressInput): Promise<void> => {
  await requestRemote({
    action: 'save_progress',
    seriesId,
    episodeId,
    ...(audioAssetId ? { audioAssetId } : {}),
    positionSeconds: Math.max(0, Number.isFinite(positionSeconds) ? positionSeconds : 0),
    speed,
    completed,
  })
}

export const audioRemoteClient = {
  requestAudio,
  loadPlaybackProgress,
  savePlaybackProgress,
}
