import { createClient } from 'npm:@supabase/supabase-js@2'

export type Language = 'ru' | 'uz' | 'kz'
export type VoicePresetId = 'soft_female' | 'calm_male' | 'neutral_storyteller' | 'cheerful_daytime'
export type AudioSpeed = 0.8 | 1 | 1.2
export type JsonRecord = Record<string, unknown>

export type AudioRequestInput = {
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

export type OwnedEpisode = {
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

export const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
export const AUDIO_BUCKET = 'story-audio'
export const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'
export const MAX_TTS_TEXT_LENGTH = 4096
export const SIGNED_URL_SECONDS = 3600
export const GENERATIONS_PER_HOUR = 5

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration.')

export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const openAiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim() || ''
export const ttsEnabled = Deno.env.get('QISSA_TTS_ENABLED') === 'true'
export const ttsModel = Deno.env.get('OPENAI_TTS_MODEL')?.trim() || 'gpt-4o-mini-tts'

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export const isClientStoryId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)

export const isVoicePreset = (value: unknown): value is VoicePresetId =>
  value === 'soft_female' ||
  value === 'calm_male' ||
  value === 'neutral_storyteller' ||
  value === 'cheerful_daytime'

export const isAudioSpeed = (value: unknown): value is AudioSpeed =>
  value === 0.8 || value === 1 || value === 1.2

export const corsHeaders = (origin: string | null) => {
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

export const json = (
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

export const fail = (error: string, status: number, origin: string | null) =>
  json({ error }, status, origin)

export const deviceFallback = (errorCode: string, origin: string | null) =>
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

export const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
