import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const audio = [
  'supabase/functions/audio-request/index.ts',
  'supabase/functions/audio-request/shared.ts',
  'supabase/functions/audio-request/context.ts',
  'supabase/functions/audio-request/generation.ts',
].map(read).join('\n')
const cleanup = read('supabase/functions/audio-cleanup/index.ts')
const memory = read('src/lib/memoryAgent.ts')
const state = read('src/lib/storyStateService.ts')
const migration = read('docs/qissa/backend/migrations/20260625_000008_add_audio_cache_foundation.sql')
const persistenceMigration = read('docs/qissa/backend/migrations/20260624_000003_add_remote_persistence_keys.sql')

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
  'Audio assets must use a versioned cache key.',
)

requireCondition(
  /references public\.story_episodes\(id\) on delete cascade/.test(migration) &&
    /references public\.child_profiles\(id\) on delete cascade/.test(migration),
  'Audio rows must cascade with episode or profile deletion.',
)

requireCondition(
  /values \('story-audio', 'story-audio', false/.test(migration) &&
    /file_size_limit/.test(migration),
  'Generated audio must use a private, size-limited bucket.',
)

requireCondition(
  /qa_pending/.test(migration) &&
    /device_only/.test(migration) &&
    !/quality_status[^\n]+approved[^\n]+true/.test(migration),
  'Provider voices must remain inactive until QA approval.',
)

requireCondition(
  /ux_child_profiles_installation_id/.test(persistenceMigration),
  'Current MVP ownership must keep one profile per installation identity.',
)

requireCondition(
  /QISSA_TTS_ENABLED/.test(audio) && /!ttsEnabled \|\| !openAiApiKey/.test(audio),
  'Provider TTS must be disabled by default.',
)

requireCondition(
  /privacy_consent_version/.test(audio) &&
    /ai_processing_consent/.test(audio) &&
    /privacy_consent_required/.test(audio),
  'External audio processing must require parent consent.',
)

requireCondition(
  /story_text,language,mood,safety_status/.test(audio) &&
    /episode_not_approved/.test(audio) &&
    !/storyText\?:/.test(audio),
  'Audio must use approved backend-loaded episode text only.',
)

requireCondition(
  /id:\s*`series-\$\{selections\.stylePackId\}-\$\{selections\.language\}`/.test(memory) &&
    /isClientStoryId\(seriesId\)/.test(audio) &&
    /isClientStoryId\(episodeId\)/.test(audio),
  'Audio identity must accept app client story IDs.',
)

const requestStart = audio.indexOf('const requestAudio')
const requestEnd = audio.indexOf('const saveProgress', requestStart)
const requestBody = audio.slice(requestStart, requestEnd)
requireCondition(
  requestStart >= 0 &&
    requestBody.indexOf(".from('audio_assets')") >= 0 &&
    requestBody.indexOf('return generateAudio') > requestBody.indexOf(".from('audio_assets')"),
  'Cache lookup must happen before provider generation.',
)

requireCondition(
  /existing\.status === 'failed'/.test(requestBody) &&
    /audio_failed_cache_reset_failed/.test(requestBody),
  'Failed cache rows must be removable so temporary failures can retry.',
)

requireCondition(
  /quality_status', 'approved'/.test(audio) &&
    /is_active', true/.test(audio) &&
    /bedtime_safe/.test(audio),
  'Only active QA-approved bedtime-safe voices may generate audio.',
)

requireCondition(
  /MAX_TTS_TEXT_LENGTH = 4096/.test(audio) &&
    /text_too_long/.test(audio) &&
    /deviceFallback/.test(audio),
  'Oversized or unavailable TTS requests must use device fallback.',
)

requireCondition(
  /gpt-4o-mini-tts/.test(audio) &&
    /instructions: speechInstructions/.test(audio) &&
    /response_format: 'mp3'/.test(audio),
  'Speech generation must use the approved prompted TTS contract.',
)

requireCondition(
  /requiresAiVoiceDisclosure: true/.test(audio) &&
    /requiresAiVoiceDisclosure: false/.test(audio),
  'Responses must expose AI voice disclosure state.',
)

requireCondition(
  /GENERATIONS_PER_HOUR/.test(audio) &&
    /audio_rate_limit_reached/.test(audio) &&
    /createSignedUrl/.test(audio),
  'Audio generation must be rate-limited and returned with signed URLs.',
)

requireCondition(
  /upsert: true/.test(audio) &&
    /let uploadedStoragePath:\s*string \| null = null/.test(audio) &&
    /remove\(\[uploadedStoragePath\]\)/.test(audio) &&
    /storage_path: null/.test(audio),
  'Uploads must be idempotent and rollback after downstream failure.',
)

requireCondition(
  /save_progress/.test(audio) &&
    /child_profile_id,episode_id/.test(audio) &&
    /audio_asset_not_found/.test(audio),
  'Playback progress must be owner-scoped.',
)

requireCondition(
  /delete_profile_audio/.test(cleanup) &&
    /storage\.from\(AUDIO_BUCKET\)\.remove\(chunk\)/.test(cleanup) &&
    /await requestAudioCleanup\(\)/.test(state),
  'Profile deletion must remove private audio objects first.',
)

requireCondition(
  !/getUserMedia|MediaRecorder|custom voice|voice sample/i.test(audio),
  'The MVP Audio Agent must not capture voice samples or clone voices.',
)

if (failures.length > 0) {
  console.error('audio agent contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('cache-first Audio Agent contract check passed.')
