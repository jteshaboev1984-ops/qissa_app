import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const audioAgent = read('supabase/functions/audio-request/index.ts')
const migration = read('docs/qissa/backend/migrations/20260625_000008_add_audio_cache_foundation.sql')
const failures = []

const requireCondition = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const table of ['voice_presets', 'audio_assets', 'playback_progress']) {
  requireCondition(
    migration.includes(`create table if not exists public.${table}`),
    `Audio migration must create ${table}.`,
  )
}

requireCondition(
  /cache_key text not null unique/.test(migration) &&
    /text_version text not null/.test(migration) &&
    /speed numeric/.test(migration),
  'Audio assets must be uniquely cached by text version, voice, model, and speed inputs.',
)

requireCondition(
  /references public\.story_episodes\(id\) on delete cascade/.test(migration) &&
    /references public\.child_profiles\(id\) on delete cascade/.test(migration),
  'Audio assets and playback progress must be deleted with their episode or profile.',
)

requireCondition(
  /insert into storage\.buckets/.test(migration) &&
    /'story-audio'/.test(migration) &&
    /public, file_size_limit/.test(migration) &&
    /values \('story-audio', 'story-audio', false/.test(migration),
  'Generated audio must use a private, size-limited storage bucket.',
)

requireCondition(
  /quality_status[^\n]+qa_pending/.test(migration) &&
    /device_only/.test(migration) &&
    !/quality_status[^\n]+approved[^\n]+true/.test(migration),
  'Provider voices must remain inactive until language and bedtime QA approves them.',
)

requireCondition(
  /QISSA_TTS_ENABLED/.test(audioAgent) &&
    /ttsEnabled/.test(audioAgent) &&
    /!ttsEnabled \|\| !openAiApiKey/.test(audioAgent),
  'Provider TTS must be disabled by default and gated by an explicit server flag.',
)

requireCondition(
  /privacy_consent_version/.test(audioAgent) &&
    /ai_processing_consent/.test(audioAgent) &&
    /privacy_consent_required/.test(audioAgent),
  'External audio processing must require the stored parent AI-processing consent.',
)

requireCondition(
  /story_text,language,mood,safety_status/.test(audioAgent) &&
    /episode_not_approved/.test(audioAgent) &&
    !/storyText\?:/.test(audioAgent),
  'Audio must be generated only from approved episode text loaded by the backend, never client-supplied text.',
)

const cacheLookupPosition = audioAgent.indexOf(".from('audio_assets')")
const providerFetchPosition = audioAgent.indexOf('fetch(OPENAI_SPEECH_URL')
requireCondition(
  cacheLookupPosition >= 0 && providerFetchPosition > cacheLookupPosition,
  'The Audio Agent must check the cache before any provider request.',
)

requireCondition(
  /quality_status', 'approved'/.test(audioAgent) &&
    /is_active', true/.test(audioAgent) &&
    /bedtime_safe/.test(audioAgent),
  'Only active, QA-approved, bedtime-safe voices may be used for bedtime generation.',
)

requireCondition(
  /MAX_TTS_TEXT_LENGTH = 4096/.test(audioAgent) &&
    /text_too_long/.test(audioAgent) &&
    /deviceFallback/.test(audioAgent),
  'Oversized or unavailable TTS requests must fall back to device narration.',
)

requireCondition(
  /gpt-4o-mini-tts/.test(audioAgent) &&
    /response_format: 'mp3'/.test(audioAgent) &&
    /speed,/.test(audioAgent),
  'The provider request must use the approved speech endpoint contract and cache-affecting speed.',
)

requireCondition(
  /requiresAiVoiceDisclosure: true/.test(audioAgent) &&
    /requiresAiVoiceDisclosure: false/.test(audioAgent),
  'The client response must distinguish AI-generated audio from device fallback for disclosure.',
)

requireCondition(
  /GENERATIONS_PER_HOUR/.test(audioAgent) &&
    /audio_rate_limit_reached/.test(audioAgent),
  'New provider generations must have a per-profile hourly rate limit.',
)

requireCondition(
  /createSignedUrl/.test(audioAgent) &&
    /SIGNED_URL_SECONDS/.test(audioAgent),
  'Private audio assets must be returned through expiring signed URLs.',
)

requireCondition(
  /save_progress/.test(audioAgent) &&
    /child_profile_id,episode_id/.test(audioAgent) &&
    /audio_asset_not_found/.test(audioAgent),
  'Playback progress must be owner-scoped and validate any attached audio asset.',
)

requireCondition(
  !/getUserMedia|MediaRecorder|custom voice|voice sample/i.test(audioAgent),
  'The MVP Audio Agent must not capture voice samples or implement voice cloning.',
)

if (failures.length > 0) {
  console.error('audio agent contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('cache-first Audio Agent contract check passed.')
