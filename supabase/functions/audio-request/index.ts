import { createClient } from 'npm:@supabase/supabase-js@2'

type Language = 'ru' | 'uz' | 'kz'
type VoicePresetId = 'soft_female' | 'calm_male' | 'neutral_storyteller' | 'cheerful_daytime'
type AudioSpeed = 0.8 | 1 | 1.2
type JsonRecord = Record<string, unknown>

type AudioRequestInput = {
  action?: 'request_audio' | 'save_progress'
  installationId?: string
  seriesId?: string
  episodeId?: string
  voicePresetId?: VoicePresetId
  speed?: AudioSpeed
  positionSeconds?: number
  completed?: boolean
  audioAssetId?: string
}

type OwnedEpisode = {
  profile: {
    id: string
    privacy_consent_version: string | null
    parent_or_guardian_confirmed: boolean
    ai_processing_consent: boolean
  }
  episode: {
    id: string
    story_text: string
    language: Language
    mood: 'bedtime' | 'kind_adventure'
    safety_status: string
  }
}

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const AUDIO_BUCKET = 'story-audio'
const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'
const MAX_TTS_TEXT_LENGTH = 4096
const SIGNED_URL_SECONDS = 3600
const GENERATIONS_PER_HOUR = 5

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
const ttsEnabled = Deno.env.get('QISSA_TTS_ENABLED') === 'true'
const ttsModel = Deno.env.get('OPENAI_TTS_MODEL')?.trim() || 'gpt-4o-mini-tts'

if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration.')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const isVoicePreset = (value: unknown): value is VoicePresetId =>
  value === 'soft_female' ||
  value === 'calm_male' ||
  value === 'neutral_storyteller' ||
  value === 'cheerful_daytime'

const isAudioSpeed = (value: unknown): value is AudioSpeed =>
  value === 0.8 || value === 1 || value === 1.2

const corsHeaders = (origin: string | null) => {
  const allowed =
    origin === 'https://jteshaboev1984-ops.github.io' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    Boolean(origin && /^https:\/\/[a-z0-9-]+\.app\.github\.dev$/.test(origin))

  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://jteshaboev1984-ops.github.io',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const json = (
  body: unknown,
  status: number,
  origin: string | null,
  metadata: Record<string, string> = {},
) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...corsHeaders(origin),
    'Content-Type': 'application/json; charset=utf-8',
    ...metadata,
  },
})

const fail = (error: string, status: number, origin: string | null) =>
  json({ error }, status, origin)

const deviceFallback = (errorCode: string, origin: string | null) =>
  json({
    audioStatus: 'failed',
    audioAssetId: null,
    audioUrl: null,
    durationSeconds: null,
    fallbackUsed: true,
    fallbackMode: 'device',
    errorCode,
    requiresAiVoiceDisclosure: false,
  }, 200, origin, {
    'X-QISSA-Audio-Source': 'device-fallback',
    'X-QISSA-Audio-Fallback-Reason': errorCode,
  })

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const findOwnedEpisode = async (
  installationId: string,
  seriesId: string,
  episodeId: string,
): Promise<OwnedEpisode | null> => {
  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .select('id,privacy_consent_version,parent_or_guardian_confirmed,ai_processing_consent')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (profileError) throw new Error('profile_load_failed')
  if (!profile) return null

  const { data: session, error: sessionError } = await admin
    .from('story_sessions')
    .select('id')
    .eq('child_profile_id', profile.id)
    .eq('client_session_id', seriesId)
    .maybeSingle()

  if (sessionError) throw new Error('session_load_failed')
  if (!session) return null

  const { data: episode, error: episodeError } = await admin
    .from('story_episodes')
    .select('id,story_text,language,mood,safety_status')
    .eq('session_id', session.id)
    .eq('client_episode_id', episodeId)
    .maybeSingle()

  if (episodeError) throw new Error('episode_load_failed')
  if (!episode) return null

  return { profile, episode: episode as OwnedEpisode['episode'] }
}

const hasValidAiConsent = (profile: OwnedEpisode['profile']) =>
  profile.privacy_consent_version === PRIVACY_CONSENT_VERSION &&
  profile.parent_or_guardian_confirmed === true &&
  profile.ai_processing_consent === true

const loadApprovedVoice = async (
  language: Language,
  requestedPreset: VoicePresetId,
  mood: OwnedEpisode['episode']['mood'],
) => {
  const loadPreset = async (clientPresetId: VoicePresetId) => {
    const { data, error } = await admin
      .from('voice_presets')
      .select('id,client_preset_id,provider,provider_voice_id,bedtime_safe,quality_status,is_active')
      .eq('language', language)
      .eq('client_preset_id', clientPresetId)
      .eq('quality_status', 'approved')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw new Error('voice_preset_load_failed')
    return data
  }

  const requested = await loadPreset(requestedPreset)
  if (requested && (mood !== 'bedtime' || requested.bedtime_safe === true)) return requested
  if (requestedPreset === 'neutral_storyteller') return null
  return loadPreset('neutral_storyteller')
}

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

const cachedAudioResponse = async (
  asset: JsonRecord,
  origin: string | null,
) => {
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

const logEvent = async (profileId: string, eventName: string, payload: JsonRecord) => {
  const { error } = await admin.from('app_events').insert({
    child_profile_id: profileId,
    event_name: eventName,
    event_payload: payload,
  })
  if (error) console.error('audio event log failed', error)
}

const rateLimitReached = async (profileId: string): Promise<boolean> => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error } = await admin
    .from('app_events')
    .select('id', { count: 'exact', head: true })
    .eq('child_profile_id', profileId)
    .eq('event_name', 'audio_generated')
    .gte('created_at', oneHourAgo)

  if (error) throw new Error('audio_rate_limit_check_failed')
  return (count ?? 0) >= GENERATIONS_PER_HOUR
}

const speechInstructions = (language: Language, mood: OwnedEpisode['episode']['mood']) => {
  const languageName = language === 'ru' ? 'Russian' : language === 'kz' ? 'Kazakh' : 'Uzbek'
  if (mood === 'bedtime') {
    return `Narrate in ${languageName}. Use a calm, warm storyteller tone, low emotional intensity, gentle pauses, and no sudden loudness or frightening delivery.`
  }
  return `Narrate in ${languageName}. Use a warm, clear storyteller tone with moderate energy and no shouting or exaggerated character voices.`
}

const generateAudio = async (
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
        instructions: speechInstructions(owned.episode.language, owned.episode.mood),
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
        upsert: false,
      })

    if (uploadError) throw new Error('audio_upload_failed')

    const { data: readyAsset, error: readyError } = await admin
      .from('audio_assets')
      .update({
        status: 'ready',
        storage_path: storagePath,
        error_code: null,
      })
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
      durationSeconds: null,
      fallbackUsed: false,
      fallbackMode: null,
      errorCode: null,
      requiresAiVoiceDisclosure: true,
    }, 200, origin, {
      'X-QISSA-Audio-Source': 'openai-generated',
    })
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 80) : 'audio_generation_failed'
    console.error('audio generation failed', { errorCode })
    await admin
      .from('audio_assets')
      .update({ status: 'failed', error_code: errorCode })
      .eq('id', createdAsset.id)
    await logEvent(owned.profile.id, 'audio_failed', {
      episode_id: owned.episode.id,
      voice_preset_id: voice.id,
      error_code: errorCode,
    })
    return deviceFallback('audio_generation_failed', origin)
  }
}

const requestAudio = async (input: AudioRequestInput, origin: string | null) => {
  const { installationId, seriesId, episodeId, voicePresetId, speed = 1 } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!isUuid(seriesId) || typeof episodeId !== 'string' || !episodeId.trim()) {
    return fail('invalid_episode_identity', 422, origin)
  }
  if (!isVoicePreset(voicePresetId) || !isAudioSpeed(speed)) return fail('invalid_audio_preferences', 422, origin)

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

  let voice: JsonRecord | null
  try {
    voice = await loadApprovedVoice(owned.episode.language, voicePresetId, owned.episode.mood)
  } catch (error) {
    console.error('voice preset load failed', error)
    return deviceFallback('voice_preset_load_failed', origin)
  }

  if (!voice) return deviceFallback('provider_voice_not_approved', origin)

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
    await logEvent(owned.profile.id, 'audio_cache_hit', {
      episode_id: owned.episode.id,
      audio_asset_id: existing.id,
      status: existing.status,
    })
    return cachedAudioResponse(existing, origin)
  }

  return generateAudio(owned, voice, speed, cacheKey, textVersion, origin)
}

const saveProgress = async (input: AudioRequestInput, origin: string | null) => {
  const { installationId, seriesId, episodeId, speed = 1, positionSeconds, completed, audioAssetId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!isUuid(seriesId) || typeof episodeId !== 'string' || !episodeId.trim()) return fail('invalid_episode_identity', 422, origin)
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
