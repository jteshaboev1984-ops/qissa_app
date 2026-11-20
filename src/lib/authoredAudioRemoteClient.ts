import type { AuthoredAudioPlan, AuthoredAudioSegment } from '../features/authoredStory/authoredAudioPlan'
import type { VoicePresetId } from '../types/qissa'
import { getStoryProviderConfig } from './storyRemoteClient'

type SourceIdentity = Pick<AuthoredAudioPlan,
  'storyId' | 'storyVersion' | 'sourceLiteraryVersion' | 'language' | 'partId'>

/**
 * Read-only cached audio lookup. The browser sends only immutable identifiers
 * and a digest of the exact visible narration, never arbitrary TTS text.
 * No request is made unless the server endpoint is explicitly configured.
 */
export const requestCachedAuthoredAudio = async (
  story: SourceIdentity,
  segment: AuthoredAudioSegment,
  voicePresetId: VoicePresetId,
): Promise<string | null> => {
  const endpoint = import.meta.env.VITE_QISSA_AUTHORED_AUDIO_ENDPOINT?.trim()
  const config = getStoryProviderConfig()
  if (!endpoint || !endpoint.startsWith('https://') || !config.publishableKey) return null
  if (!crypto?.subtle || !segment.text.trim()) return null

  const digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(segment.text),
  )
  const sourceTextHash = Array.from(new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0')).join('')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.publishableKey,
        authorization: `Bearer ${config.publishableKey}`,
      },
      credentials: 'omit',
      signal: controller.signal,
      body: JSON.stringify({
        storyId: story.storyId,
        storyVersion: story.storyVersion,
        sourceLiteraryVersion: story.sourceLiteraryVersion,
        language: story.language,
        partId: story.partId,
        segmentId: segment.segmentId,
        sourceTextHash,
        voicePresetId,
      }),
    })
    if (!response.ok) return null
    const result: unknown = await response.json()
    if (typeof result !== 'object' || !result || !('audioStatus' in result) ||
      result.audioStatus !== 'ready' || !('audioUrl' in result) ||
      typeof result.audioUrl !== 'string' ||
      !result.audioUrl.startsWith('https://')) return null
    return result.audioUrl
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}
