import { AZURE_TTS_MODEL, isSupportedAzureVoice } from '../audio-request/azure.ts'
import {
  AUDIO_BUCKET,
  admin,
  corsHeaders,
  fail,
  isRecord,
  isVoicePreset,
  json,
  sha256,
} from '../audio-request/shared.ts'

type LookupRequest = {
  storyId: string
  storyVersion: string
  sourceLiteraryVersion: string
  language: 'ru' | 'uz' | 'kz'
  partId: string
  segmentId: string
  sourceTextHash: string
  voicePresetId: 'soft_female' | 'calm_male' | 'neutral_storyteller' | 'cheerful_daytime'
}

const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)
const segmentIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,511}$/.test(value)
const sourceHash = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

const parseLookup = (value: unknown): LookupRequest | null => {
  if (!isRecord(value)) return null
  const { storyId, storyVersion, sourceLiteraryVersion, language, partId, segmentId, sourceTextHash, voicePresetId } = value
  if (!identifier(storyId) || !identifier(storyVersion) || !identifier(sourceLiteraryVersion) || !identifier(partId) ||
    !segmentIdentifier(segmentId) || !sourceHash(sourceTextHash) ||
    !isVoicePreset(voicePresetId) ||
    (language !== 'ru' && language !== 'uz' && language !== 'kz')) return null
  return { storyId, storyVersion, sourceLiteraryVersion, language, partId, segmentId, sourceTextHash, voicePresetId }
}

/** Publicly released authored text only; never read family-owned story rows. */
const lookup = async (input: LookupRequest, origin: string | null): Promise<Response> => {
  if (Deno.env.get('QISSA_AUTHORED_AUDIO_CATALOG_ENABLED') !== 'true') {
    return fail('authored_audio_catalog_disabled', 503, origin)
  }

  const { data: source, error: sourceError } = await admin
    .from('authored_audio_sources')
    .select('spoken_text,source_text_sha256,source_literary_version')
    .eq('story_id', input.storyId)
    .eq('story_version', input.storyVersion)
    .eq('source_literary_version', input.sourceLiteraryVersion)
    .eq('language', input.language)
    .eq('part_id', input.partId)
    .eq('segment_id', input.segmentId)
    .eq('is_approved', true)
    .eq('is_published', true)
    .maybeSingle()

  if (sourceError) return fail('audio_source_lookup_failed', 503, origin)
  if (!source) return fail('authored_source_not_released', 404, origin)
  // Client hash protects against stale UI/source drift. Server digest protects
  // against an incorrectly imported source record or stale stored bytes.
  if (source.source_text_sha256 !== input.sourceTextHash ||
    await sha256(source.spoken_text) !== source.source_text_sha256) {
    return fail('authored_source_hash_mismatch', 409, origin)
  }

  // This first rollout only proposes Uzbek Azure; RU and other modes fall back
  // to read/device narration until a separate approved voice adapter exists.
  if (input.language !== 'uz') return fail('azure_uz_only', 404, origin)
  const { data: voice, error: voiceError } = await admin
    .from('voice_presets')
    .select('id,provider,provider_voice_id')
    .eq('language', input.language)
    .eq('client_preset_id', input.voicePresetId)
    .eq('quality_status', 'approved')
    .eq('is_active', true)
    .maybeSingle()

  if (voiceError) return fail('audio_voice_lookup_failed', 503, origin)
  if (!voice || voice.provider !== 'azure' ||
    !isSupportedAzureVoice(input.language, voice.provider_voice_id ?? '')) {
    return fail('azure_voice_not_approved', 404, origin)
  }

  // Shared audio lookup intentionally excludes story/part identity: two
  // published routes with identical approved text can reuse one MP3.
  const { data: asset, error: assetError } = await admin
    .from('authored_audio_assets')
    .select('id,status,storage_path')
    .eq('language', input.language)
    .eq('source_text_sha256', source.source_text_sha256)
    .eq('voice_preset_id', voice.id)
    .eq('voice_provider_id', voice.provider_voice_id)
    .eq('provider_model', AZURE_TTS_MODEL)
    .maybeSingle()

  if (assetError) return fail('authored_audio_cache_failed', 503, origin)
  if (!asset || asset.status !== 'ready' || !asset.storage_path) {
    return json({
      audioStatus: 'failed', audioUrl: null,
      fallbackUsed: true, fallbackMode: 'device',
      errorCode: 'authored_audio_not_cached',
      requiresAiVoiceDisclosure: false,
    }, 200, origin, { 'X-QISSA-Audio-Source': 'device-fallback' })
  }

  const { data, error: signedError } = await admin.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(asset.storage_path, 900)

  if (signedError || !data?.signedUrl) {
    return fail('authored_audio_url_unavailable', 503, origin)
  }
  return json({
    audioStatus: 'ready',
    audioUrl: data.signedUrl,
    fallbackUsed: false,
    fallbackMode: null,
    errorCode: null,
    requiresAiVoiceDisclosure: true,
  }, 200, origin, { 'X-QISSA-Audio-Source': 'cache' })
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return fail('method_not_allowed', 405, origin)
  const rawBody = await request.text().catch(() => '')
  if (rawBody.length === 0 || rawBody.length > 2000) return fail('invalid_audio_request', 400, origin)

  let input: LookupRequest | null = null
  try {
    input = parseLookup(JSON.parse(rawBody))
  } catch {
    // Do not echo inputs or untrusted story text in error messages.
  }
  if (!input) return fail('invalid_audio_request', 400, origin)
  try {
    return await lookup(input, origin)
  } catch (error) {
    // Avoid leaking private source data, SQL errors or credentials to clients.
    console.error('authored audio lookup failed', error instanceof Error ? error.name : 'unexpected_error')
    return fail('authored_audio_unavailable', 503, origin)
  }
})
