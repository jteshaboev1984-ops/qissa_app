import { logEvent, rateLimitReached } from './context.ts'
import {
  AUDIO_BUCKET,
  MAX_TTS_TEXT_LENGTH,
  OPENAI_SPEECH_URL,
  SIGNED_URL_SECONDS,
  admin,
  deviceFallback,
  fail,
  json,
  openAiApiKey,
  ttsEnabled,
  ttsModel,
  type AudioSpeed,
  type JsonRecord,
  type OwnedEpisode,
} from './shared.ts'

const createSignedAudioUrl = async (storagePath: string): Promise<string | null> => {
  const { data, error } = await admin.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

  if (error) {
    console.error('audio signed URL failed', error)
    return null
  }
  return data.signedUrl
}

export const cachedAudioResponse = async (asset: JsonRecord, origin: string | null) => {
  const status = typeof asset.status === 'string' ? asset.status : 'failed'
  const storagePath = typeof asset.storage_path === 'string' ? asset.storage_path : null
  const audioUrl = status === 'ready' && storagePath ? await createSignedAudioUrl(storagePath) : null

  return json({
    audioStatus: status,
    audioAssetId: typeof asset.id === 'string' ? asset.id : null,
    audioUrl,
    durationSeconds: typeof asset.duration_seconds === 'number' ? asset.duration_seconds : null,
    fallbackUsed: status !== 'ready' || !audioUrl,
    fallbackMode: status === 'ready' && audioUrl ? null : 'device',
    errorCode: typeof asset.error_code === 'string' ? asset.error_code : null,
    requiresAiVoiceDisclosure: status === 'ready' && audioUrl !== null,
  }, 200, origin, {
    'X-QISSA-Audio-Source': status === 'ready' && audioUrl ? 'cache' : 'device-fallback',
  })
}

const speechInstructions = (owned: OwnedEpisode) => {
  const languageName = owned.episode.language === 'ru'
    ? 'Russian'
    : owned.episode.language === 'kz'
      ? 'Kazakh'
      : 'Uzbek'

  if (owned.episode.mood === 'bedtime') {
    return `Narrate in ${languageName}. Use a calm, warm storyteller tone, low emotional intensity, gentle pauses, and no sudden loudness or frightening delivery.`
  }
  return `Narrate in ${languageName}. Use a warm, clear storyteller tone with moderate energy and no shouting or exaggerated character voices.`
}

export const generateAudio = async (
  owned: OwnedEpisode,
  voice: JsonRecord,
  speed: AudioSpeed,
  cacheKey: string,
  textVersion: string,
  origin: string | null,
) => {
  const providerVoiceId = typeof voice.provider_voice_id === 'string' ? voice.provider_voice_id : ''
  if (!ttsEnabled || !openAiApiKey) return deviceFallback('tts_disabled', origin)
  if (voice.provider !== 'openai' || !providerVoiceId) return deviceFallback('provider_voice_unavailable', origin)
  if (owned.episode.story_text.length > MAX_TTS_TEXT_LENGTH) return deviceFallback('text_too_long', origin)
  if (await rateLimitReached(owned.profile.id)) return fail('audio_rate_limit_reached', 429, origin)

  const { data: createdAsset, error: createError } = await admin
    .from('audio_assets')
    .insert({
      episode_id: owned.episode.id,
      voice_preset_id: voice.id,
      status: 'queued',
      cache_key: cacheKey,
      text_version: textVersion,
      speed,
      requested_mode: owned.episode.mood,
      provider: 'openai',
      provider_model: ttsModel,
    })
    .select('id,status,storage_path,duration_seconds,error_code')
    .single()

  if (createError) {
    if (createError.code === '23505') {
      const { data: existing } = await admin
        .from('audio_assets')
        .select('id,status,storage_path,duration_seconds,error_code')
        .eq('cache_key', cacheKey)
        .maybeSingle()
      if (existing) return cachedAudioResponse(existing, origin)
    }
    console.error('audio asset reservation failed', createError)
    return deviceFallback('audio_reservation_failed', origin)
  }

  let uploadedStoragePath: string | null = null

  try {
    const providerResponse = await fetch(OPENAI_SPEECH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ttsModel,
        input: owned.episode.story_text,
        voice: providerVoiceId,
        instructions: speechInstructions(owned),
        response_format: 'mp3',
        speed,
      }),
    })

    if (!providerResponse.ok) throw new Error(`provider_http_${providerResponse.status}`)
    const audioBytes = new Uint8Array(await providerResponse.arrayBuffer())
    if (audioBytes.byteLength === 0) throw new Error('provider_empty_audio')

    const storagePath = `${owned.profile.id}/${owned.episode.id}/${cacheKey}.mp3`
    const { error: uploadError } = await admin.storage
      .from(AUDIO_BUCKET)
      .upload(storagePath, audioBytes, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',
        upsert: true,
      })

    if (uploadError) throw new Error('audio_upload_failed')
    uploadedStoragePath = storagePath

    const { data: readyAsset, error: readyError } = await admin
      .from('audio_assets')
      .update({ status: 'ready', storage_path: storagePath, error_code: null })
      .eq('id', createdAsset.id)
      .select('id,status,storage_path,duration_seconds,error_code')
      .single()

    if (readyError || !readyAsset) throw new Error('audio_ready_update_failed')

    await logEvent(owned.profile.id, 'audio_generated', {
      episode_id: owned.episode.id,
      voice_preset_id: voice.id,
      speed,
      provider: 'openai',
      model: ttsModel,
    })

    const audioUrl = await createSignedAudioUrl(storagePath)
    if (!audioUrl) throw new Error('audio_signed_url_failed')

    return json({
      audioStatus: 'ready',
      audioAssetId: readyAsset.id,
      audioUrl,
      durationSeconds: typeof readyAsset.duration_seconds === 'number' ? readyAsset.duration_seconds : null,
      fallbackUsed: false,
      fallbackMode: null,
      errorCode: null,
      requiresAiVoiceDisclosure: true,
    }, 200, origin, { 'X-QISSA-Audio-Source': 'openai-generated' })
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 80) : 'audio_generation_failed'
    console.error('audio generation failed', { errorCode })

    if (uploadedStoragePath) {
      const { error: cleanupError } = await admin.storage
        .from(AUDIO_BUCKET)
        .remove([uploadedStoragePath])
      if (cleanupError) console.error('failed audio upload rollback failed', cleanupError)
    }

    await admin
      .from('audio_assets')
      .update({ status: 'failed', storage_path: null, error_code: errorCode })
      .eq('id', createdAsset.id)

    await logEvent(owned.profile.id, 'audio_failed', {
      episode_id: owned.episode.id,
      voice_preset_id: voice.id,
      error_code: errorCode,
    })

    return deviceFallback('audio_generation_failed', origin)
  }
}
