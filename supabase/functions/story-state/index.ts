import { createClient } from 'npm:@supabase/supabase-js@2'

type Language = 'ru' | 'uz' | 'kz'
type StoryMode = 'one_time' | 'series'
type StoryMood = 'bedtime' | 'kind_adventure'
type JsonRecord = Record<string, unknown>

const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'
const AUDIO_BUCKET = 'story-audio'

type StoryStateRequest = {
  action?: 'sync_generated' | 'confirm_choice' | 'save_preferences' | 'reset_current' | 'load_current' | 'delete_profile_data'
  installationId?: string
  selections?: {
    ageGroup?: string
    language?: Language
    heroType?: string
    customHeroName?: string
    stylePackId?: string
    storyMode?: StoryMode
    storyMood?: StoryMood
  }
  seriesState?: JsonRecord & {
    id?: string
    mainCharacter?: string
    lastEpisodeSummary?: string
    activeArc?: string
    canonState?: JsonRecord
    relationshipState?: JsonRecord
  }
  episode?: JsonRecord & {
    episode_id?: string
    title?: string
    story_text?: string
    choices?: Array<JsonRecord & {
      choice_id?: string
      text?: string
      effect_summary?: string
      resolution_text?: string
      tomorrow_seed?: string
      choice_icon?: string
      state_patch?: JsonRecord
      value_alignment?: string[]
    }>
    vocabulary?: unknown[]
    nextEpisodePreview?: string
    safety_self_check?: JsonRecord & {
      approved?: boolean
      risk_level?: string
      flags?: JsonRecord
      required_action?: string
    }
  }
  episodeId?: string
  choiceId?: string
  readerPreferences?: JsonRecord
  privacyConsent?: JsonRecord
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration.')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value)
const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const isValidPrivacyConsent = (value: unknown): value is JsonRecord =>
  isRecord(value) &&
  value.version === PRIVACY_CONSENT_VERSION &&
  value.parentOrGuardianConfirmed === true &&
  value.aiProcessingAccepted === true &&
  typeof value.acceptedAt === 'string' &&
  Number.isFinite(Date.parse(value.acceptedAt))

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

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  })

const fail = (message: string, status: number, origin: string | null) => json({ error: message }, status, origin)
const episodeNoFromId = (episodeId: string): number => episodeId.startsWith('ep-2') ? 2 : 1

const findProfile = async (installationId: string) =>
  admin.from('child_profiles').select('id').eq('installation_id', installationId).maybeSingle()

async function syncGenerated(input: StoryStateRequest, origin: string | null) {
  const { installationId, selections, seriesState, episode, readerPreferences, privacyConsent } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!selections || !seriesState || !episode) return fail('missing_story_snapshot', 400, origin)
  if (!isValidPrivacyConsent(privacyConsent)) return fail('privacy_consent_required', 403, origin)

  const { ageGroup, language, heroType, customHeroName, stylePackId, storyMode, storyMood } = selections
  if (
    typeof ageGroup !== 'string' || !language || typeof heroType !== 'string' ||
    typeof stylePackId !== 'string' || !storyMode || !storyMood ||
    typeof seriesState.id !== 'string' || typeof episode.episode_id !== 'string' ||
    typeof episode.title !== 'string' || typeof episode.story_text !== 'string'
  ) return fail('invalid_story_snapshot', 422, origin)

  const validReaderPreferences = isRecord(readerPreferences) ? readerPreferences : {}

  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .upsert({
      installation_id: installationId,
      display_name: typeof seriesState.mainCharacter === 'string' ? seriesState.mainCharacter : null,
      age_group: ageGroup,
      language,
      hero_type: heroType,
      custom_hero_name: customHeroName ?? null,
      default_voice_preset_id: typeof validReaderPreferences.voicePresetId === 'string' ? validReaderPreferences.voicePresetId : null,
      reader_preferences: validReaderPreferences,
      privacy_consent_version: privacyConsent.version,
      privacy_consent_at: privacyConsent.acceptedAt,
      parent_or_guardian_confirmed: true,
      ai_processing_consent: true,
    }, { onConflict: 'installation_id' })
    .select('id')
    .single()

  if (profileError || !profile) {
    console.error('profile sync failed', profileError)
    return fail('profile_sync_failed', 500, origin)
  }

  const episodeNo = episodeNoFromId(episode.episode_id)
  const sessionStatus = episodeNo === 2 ? 'completed' : 'episode_1_active'

  const { data: session, error: sessionError } = await admin
    .from('story_sessions')
    .upsert({
      child_profile_id: profile.id,
      client_session_id: seriesState.id,
      story_mode: storyMode,
      story_mood: storyMood,
      style_pack_id: stylePackId,
      status: sessionStatus,
      current_episode_no: episodeNo,
      title: episode.title,
      summary: typeof seriesState.lastEpisodeSummary === 'string' ? seriesState.lastEpisodeSummary : null,
      canon_state: isRecord(seriesState.canonState) ? seriesState.canonState : {},
      relationship_state: isRecord(seriesState.relationshipState) ? seriesState.relationshipState : {},
      active_arc: typeof seriesState.activeArc === 'string' ? seriesState.activeArc : null,
      client_state: seriesState,
      is_archived: false,
      completed_at: sessionStatus === 'completed' ? new Date().toISOString() : null,
    }, { onConflict: 'child_profile_id,client_session_id' })
    .select('id')
    .single()

  if (sessionError || !session) {
    console.error('session sync failed', sessionError)
    return fail('session_sync_failed', 500, origin)
  }

  const safety = isRecord(episode.safety_self_check) ? episode.safety_self_check : {}
  const approved = safety.approved === true

  const { data: episodeRow, error: episodeError } = await admin
    .from('story_episodes')
    .upsert({
      session_id: session.id,
      client_episode_id: episode.episode_id,
      episode_no: episodeNo,
      title: episode.title,
      story_text: episode.story_text,
      language,
      mood: storyMood,
      style_pack_id: stylePackId,
      generation_source: 'edge_story_agent',
      safety_status: approved ? 'approved' : 'blocked',
      safety_result: safety,
      vocabulary: Array.isArray(episode.vocabulary) ? episode.vocabulary : [],
      next_episode_preview: typeof episode.nextEpisodePreview === 'string' ? episode.nextEpisodePreview : null,
      domain_payload: episode,
    }, { onConflict: 'session_id,client_episode_id' })
    .select('id')
    .single()

  if (episodeError || !episodeRow) {
    console.error('episode sync failed', episodeError)
    return fail('episode_sync_failed', 500, origin)
  }

  const choices = Array.isArray(episode.choices) ? episode.choices : []
  if (choices.length > 0) {
    const rows = choices.map((choice, index) => ({
      episode_id: episodeRow.id,
      choice_id: String(choice.choice_id ?? `choice-${index + 1}`),
      text: String(choice.text ?? ''),
      effect_summary: String(choice.effect_summary ?? ''),
      resolution_text: typeof choice.resolution_text === 'string' ? choice.resolution_text : null,
      tomorrow_seed: typeof choice.tomorrow_seed === 'string' ? choice.tomorrow_seed : null,
      choice_icon: typeof choice.choice_icon === 'string' ? choice.choice_icon : null,
      state_patch: isRecord(choice.state_patch) ? choice.state_patch : {},
      value_alignment: Array.isArray(choice.value_alignment) ? choice.value_alignment : [],
      display_order: index,
    }))

    const { error: choiceError } = await admin
      .from('story_choices')
      .upsert(rows, { onConflict: 'episode_id,choice_id' })

    if (choiceError) {
      console.error('choice sync failed', choiceError)
      return fail('choice_sync_failed', 500, origin)
    }
  }

  const { error: reviewError } = await admin.from('safety_reviews').upsert({
    episode_id: episodeRow.id,
    status: approved ? 'approved' : 'blocked',
    risk_level: typeof safety.risk_level === 'string' ? safety.risk_level : 'low',
    flags: isRecord(safety.flags) ? safety.flags : {},
    required_action: typeof safety.required_action === 'string' ? safety.required_action : approved ? 'publish' : 'block',
  }, { onConflict: 'episode_id' })

  if (reviewError) console.error('safety review upsert failed', reviewError)
  return json({ ok: true }, 200, origin)
}

async function confirmChoice(input: StoryStateRequest, origin: string | null) {
  const { installationId, seriesState, episodeId, choiceId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!seriesState || typeof seriesState.id !== 'string' || typeof episodeId !== 'string' || typeof choiceId !== 'string') {
    return fail('invalid_choice_snapshot', 422, origin)
  }

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return fail('profile_not_found', 404, origin)

  const { data: session, error: sessionError } = await admin
    .from('story_sessions')
    .select('id,story_mode')
    .eq('child_profile_id', profile.id)
    .eq('client_session_id', seriesState.id)
    .maybeSingle()

  if (sessionError || !session) return fail('session_not_found', 404, origin)

  const { data: episodeRow, error: episodeError } = await admin
    .from('story_episodes')
    .select('id')
    .eq('session_id', session.id)
    .eq('client_episode_id', episodeId)
    .maybeSingle()

  if (episodeError || !episodeRow) return fail('episode_not_found', 404, origin)

  const { data: choiceRow, error: choiceError } = await admin
    .from('story_choices')
    .select('id,state_patch')
    .eq('episode_id', episodeRow.id)
    .eq('choice_id', choiceId)
    .maybeSingle()

  if (choiceError || !choiceRow) return fail('choice_not_found', 404, origin)

  const { error: eventError } = await admin
    .from('story_choice_events')
    .upsert({
      session_id: session.id,
      episode_id: episodeRow.id,
      story_choice_id: choiceRow.id,
      state_patch_applied: isRecord(choiceRow.state_patch) ? choiceRow.state_patch : {},
    }, { onConflict: 'session_id,episode_id' })

  if (eventError) {
    console.error('choice event sync failed', eventError)
    return fail('choice_event_sync_failed', 500, origin)
  }

  const completed = session.story_mode === 'one_time'
  const { error: updateError } = await admin
    .from('story_sessions')
    .update({
      status: completed ? 'completed' : 'episode_1_choice_saved',
      client_state: seriesState,
      summary: typeof seriesState.lastEpisodeSummary === 'string' ? seriesState.lastEpisodeSummary : null,
      canon_state: isRecord(seriesState.canonState) ? seriesState.canonState : {},
      relationship_state: isRecord(seriesState.relationshipState) ? seriesState.relationshipState : {},
      active_arc: typeof seriesState.activeArc === 'string' ? seriesState.activeArc : null,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', session.id)

  if (updateError) return fail('session_choice_update_failed', 500, origin)
  return json({ ok: true }, 200, origin)
}

async function savePreferences(input: StoryStateRequest, origin: string | null) {
  const { installationId, readerPreferences } = input
  if (!isUuid(installationId) || !isRecord(readerPreferences)) return fail('invalid_preferences_snapshot', 422, origin)

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ ok: true, skipped: true }, 200, origin)

  const { error } = await admin
    .from('child_profiles')
    .update({
      reader_preferences: readerPreferences,
      default_voice_preset_id: typeof readerPreferences.voicePresetId === 'string' ? readerPreferences.voicePresetId : null,
    })
    .eq('id', profile.id)

  if (error) return fail('preferences_sync_failed', 500, origin)
  return json({ ok: true }, 200, origin)
}

async function resetCurrent(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ ok: true, skipped: true }, 200, origin)

  const { error } = await admin
    .from('story_sessions')
    .update({ is_archived: true })
    .eq('child_profile_id', profile.id)
    .eq('is_archived', false)

  if (error) return fail('story_reset_failed', 500, origin)
  return json({ ok: true }, 200, origin)
}

type IdRow = { id?: unknown }
type AudioPathRow = { storage_path?: unknown }

const stringIds = (rows: IdRow[] | null | undefined): string[] =>
  (rows ?? []).flatMap((row) => typeof row.id === 'string' ? [row.id] : [])

const stringPaths = (rows: AudioPathRow[] | null | undefined): string[] =>
  [...new Set((rows ?? []).flatMap((row) =>
    typeof row.storage_path === 'string' ? [row.storage_path] : [],
  ))]

async function deleteProfileAudioObjects(profileId: string): Promise<number> {
  const { data: sessions, error: sessionError } = await admin
    .from('story_sessions')
    .select('id')
    .eq('child_profile_id', profileId)
  if (sessionError) throw new Error('audio_session_lookup_failed')

  const sessionIds = stringIds(sessions as IdRow[] | null)
  if (sessionIds.length === 0) return 0

  const { data: episodes, error: episodeError } = await admin
    .from('story_episodes')
    .select('id')
    .in('session_id', sessionIds)
  if (episodeError) throw new Error('audio_episode_lookup_failed')

  const episodeIds = stringIds(episodes as IdRow[] | null)
  if (episodeIds.length === 0) return 0

  const { data: assets, error: assetError } = await admin
    .from('audio_assets')
    .select('storage_path')
    .in('episode_id', episodeIds)
    .not('storage_path', 'is', null)
  if (assetError) throw new Error('audio_asset_lookup_failed')

  const paths = stringPaths(assets as AudioPathRow[] | null)
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage
      .from(AUDIO_BUCKET)
      .remove(paths.slice(index, index + 100))
    if (error) throw new Error('audio_storage_cleanup_failed')
  }

  return paths.length
}

async function deleteProfileData(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ ok: true, deleted: false, deletedAudioObjectCount: 0 }, 200, origin)

  let deletedAudioObjectCount = 0
  try {
    deletedAudioObjectCount = await deleteProfileAudioObjects(profile.id)
  } catch (error) {
    console.error('profile audio cleanup failed', error)
    return fail(error instanceof Error ? error.message : 'audio_storage_cleanup_failed', 500, origin)
  }

  const { error: eventDeleteError } = await admin
    .from('app_events')
    .delete()
    .eq('child_profile_id', profile.id)

  if (eventDeleteError) {
    console.error('profile event deletion failed', eventDeleteError)
    return fail('profile_event_delete_failed', 500, origin)
  }

  const { error: profileDeleteError } = await admin
    .from('child_profiles')
    .delete()
    .eq('id', profile.id)

  if (profileDeleteError) {
    console.error('profile deletion failed', profileDeleteError)
    return fail('profile_delete_failed', 500, origin)
  }

  return json({ ok: true, deleted: true, deletedAudioObjectCount }, 200, origin)
}

async function loadCurrent(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .select('id,age_group,language,hero_type,custom_hero_name,reader_preferences')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ snapshot: null }, 200, origin)

  const { data: session, error: sessionError } = await admin
    .from('story_sessions')
    .select('id,story_mode,story_mood,style_pack_id,client_state,updated_at')
    .eq('child_profile_id', profile.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) return fail('session_load_failed', 500, origin)
  if (!session) return json({ snapshot: null }, 200, origin)

  const { data: episode, error: episodeError } = await admin
    .from('story_episodes')
    .select('domain_payload,episode_no')
    .eq('session_id', session.id)
    .order('episode_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (episodeError) return fail('episode_load_failed', 500, origin)
  if (!episode || !isRecord(episode.domain_payload)) return json({ snapshot: null }, 200, origin)

  return json({
    snapshot: {
      selections: {
        ageGroup: profile.age_group,
        language: profile.language,
        heroType: profile.hero_type,
        ...(profile.custom_hero_name ? { customHeroName: profile.custom_hero_name } : {}),
        stylePackId: session.style_pack_id,
        storyMode: session.story_mode,
        storyMood: session.story_mood,
      },
      seriesState: session.client_state,
      episode: episode.domain_payload,
      readerPreferences: profile.reader_preferences,
    },
  }, 200, origin)
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return fail('method_not_allowed', 405, origin)

  let input: StoryStateRequest
  try {
    input = await request.json()
  } catch {
    return fail('invalid_json', 400, origin)
  }

  if (input.action === 'sync_generated') return syncGenerated(input, origin)
  if (input.action === 'confirm_choice') return confirmChoice(input, origin)
  if (input.action === 'save_preferences') return savePreferences(input, origin)
  if (input.action === 'reset_current') return resetCurrent(input, origin)
  if (input.action === 'delete_profile_data') return deleteProfileData(input, origin)
  if (input.action === 'load_current') return loadCurrent(input, origin)
  return fail('unsupported_action', 400, origin)
})
