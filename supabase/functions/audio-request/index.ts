import { findOwnedEpisode, hasValidAiConsent, loadApprovedVoice, logEvent } from './context.ts'
import { cachedAudioResponse, generateAudio } from './generation.ts'
import {
  admin,
  corsHeaders,
  fail,
  isAudioSpeed,
  isClientStoryId,
  isRecord,
  isUuid,
  isVoicePreset,
  json,
  sha256,
  ttsModel,
  type AudioRequestInput,
  type OwnedEpisode,
} from './shared.ts'

const requestAudio = async (input: AudioRequestInput, origin: string | null) => {
  const { installationId, seriesId, episodeId, voicePresetId, speed = 1 } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!isClientStoryId(seriesId) || !isClientStoryId(episodeId)) {
    return fail('invalid_episode_identity', 422, origin)
  }
  if (!isVoicePreset(voicePresetId) || !isAudioSpeed(speed)) {
    return fail('invalid_audio_preferences', 422, origin)
  }

  let owned: OwnedEpisode | null
  try {
    owned = await findOwnedEpisode(installationId, seriesId, episodeId)
  } catch (error) {
    console.error('owned episode load failed', error)
    return fail('audio_context_load_failed', 500, origin)
  }

  if (!owned) return fail('episode_not_found', 404, origin)
  if (owned.episode.safety_status !== 'approved') return fail('episode_not_approved', 409, origin)
  if (!hasValidAiConsent(owned.profile)) return fail('privacy_consent_required', 403, origin)

  let voice
  try {
    voice = await loadApprovedVoice(owned.episode.language, voicePresetId, owned.episode.mood)
  } catch (error) {
    console.error('voice preset load failed', error)
    return cachedAudioResponse({ status: 'failed', error_code: 'voice_preset_load_failed' }, origin)
  }

  if (!voice) return cachedAudioResponse({ status: 'failed', error_code: 'provider_voice_not_approved' }, origin)

  const textVersion = await sha256(owned.episode.story_text)
  const cacheKey = await sha256([
    owned.episode.id,
    owned.episode.language,
    voice.id,
    speed,
    textVersion,
    ttsModel,
  ].join(':'))

  const { data: existing, error: cacheError } = await admin
    .from('audio_assets')
    .select('id,status,storage_path,duration_seconds,error_code')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (cacheError) return fail('audio_cache_lookup_failed', 500, origin)
  if (existing) {
    if (existing.status === 'failed') {
      const { error: failedDeleteError } = await admin
        .from('audio_assets')
        .delete()
        .eq('id', existing.id)
      if (failedDeleteError) return fail('audio_failed_cache_reset_failed', 500, origin)
    } else {
      await logEvent(owned.profile.id, 'audio_cache_hit', {
        episode_id: owned.episode.id,
        audio_asset_id: existing.id,
        status: existing.status,
      })
      return cachedAudioResponse(existing, origin)
    }
  }

  return generateAudio(owned, voice, speed, cacheKey, textVersion, origin)
}

const saveProgress = async (input: AudioRequestInput, origin: string | null) => {
  const { installationId, seriesId, episodeId, speed = 1, positionSeconds, completed, audioAssetId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!isClientStoryId(seriesId) || !isClientStoryId(episodeId)) {
    return fail('invalid_episode_identity', 422, origin)
  }
  if (!isAudioSpeed(speed) || typeof positionSeconds !== 'number' || !Number.isFinite(positionSeconds) || positionSeconds < 0) {
    return fail('invalid_playback_progress', 422, origin)
  }
  if (typeof completed !== 'boolean') return fail('invalid_playback_progress', 422, origin)
  if (audioAssetId !== undefined && !isUuid(audioAssetId)) return fail('invalid_audio_asset_id', 422, origin)

  let owned: OwnedEpisode | null
  try {
    owned = await findOwnedEpisode(installationId, seriesId, episodeId)
  } catch (error) {
    console.error('progress context load failed', error)
    return fail('audio_context_load_failed', 500, origin)
  }
  if (!owned) return fail('episode_not_found', 404, origin)

  if (audioAssetId) {
    const { data: asset, error: assetError } = await admin
      .from('audio_assets')
      .select('id')
      .eq('id', audioAssetId)
      .eq('episode_id', owned.episode.id)
      .maybeSingle()
    if (assetError) return fail('audio_asset_load_failed', 500, origin)
    if (!asset) return fail('audio_asset_not_found', 404, origin)
  }

  const { error } = await admin.from('playback_progress').upsert({
    child_profile_id: owned.profile.id,
    episode_id: owned.episode.id,
    audio_asset_id: audioAssetId ?? null,
    position_seconds: positionSeconds,
    speed,
    completed,
  }, { onConflict: 'child_profile_id,episode_id' })

  if (error) {
    console.error('playback progress save failed', error)
    return fail('playback_progress_save_failed', 500, origin)
  }

  return json({ ok: true }, 200, origin)
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return fail('method_not_allowed', 405, origin)

  let input: AudioRequestInput
  try {
    const parsed: unknown = await request.json()
    if (!isRecord(parsed)) return fail('invalid_json', 400, origin)
    input = parsed as AudioRequestInput
  } catch {
    return fail('invalid_json', 400, origin)
  }

  if (input.action === 'request_audio') return requestAudio(input, origin)
  if (input.action === 'save_progress') return saveProgress(input, origin)
  return fail('unsupported_action', 400, origin)
})
