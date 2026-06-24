import { createClient } from 'npm:@supabase/supabase-js@2'

type Language = 'ru' | 'uz' | 'kz'
type StoryMode = 'one_time' | 'series'
type StoryMood = 'bedtime' | 'kind_adventure'

type StoryStateRequest = {
  action?: 'sync_generated' | 'load_current'
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
  seriesState?: Record<string, unknown> & {
    id?: string
    mainCharacter?: string
    lastEpisodeSummary?: string
    activeArc?: string
    canonState?: Record<string, unknown>
    relationshipState?: Record<string, unknown>
  }
  episode?: Record<string, unknown> & {
    episode_id?: string
    title?: string
    story_text?: string
    mode?: StoryMode
    mood?: StoryMood
    stylePackId?: string
    choices?: Array<Record<string, unknown> & {
      choice_id?: string
      text?: string
      effect_summary?: string
      resolution_text?: string
      tomorrow_seed?: string
      choice_icon?: string
      state_patch?: Record<string, unknown>
      value_alignment?: string[]
    }>
    vocabulary?: unknown[]
    nextEpisodePreview?: string
    safety_self_check?: Record<string, unknown> & {
      approved?: boolean
      risk_level?: string
      flags?: Record<string, unknown>
      required_action?: string
    }
  }
  readerPreferences?: Record<string, unknown>
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase service configuration.')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

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

const fail = (message: string, status: number, origin: string | null) =>
  json({ error: message }, status, origin)

const getEpisodeNo = (episodeId: string): number => episodeId.startsWith('ep-2') ? 2 : 1

const getSessionStatus = (mode: StoryMode, episodeId: string): string => {
  if (episodeId.startsWith('ep-2')) return 'completed'
  return mode === 'series' ? 'episode_1_active' : 'episode_1_active'
}

async function syncGenerated(input: StoryStateRequest, origin: string | null) {
  const { installationId, selections, seriesState, episode, readerPreferences } = input

  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)
  if (!selections || !seriesState || !episode) return fail('missing_story_snapshot', 400, origin)

  const {
    ageGroup,
    language,
    heroType,
    customHeroName,
    stylePackId,
    storyMode,
    storyMood,
  } = selections

  if (
    typeof ageGroup !== 'string' ||
    !language ||
    typeof heroType !== 'string' ||
    typeof stylePackId !== 'string' ||
    !storyMode ||
    !storyMood ||
    typeof seriesState.id !== 'string' ||
    typeof episode.episode_id !== 'string' ||
    typeof episode.title !== 'string' ||
    typeof episode.story_text !== 'string'
  ) {
    return fail('invalid_story_snapshot', 422, origin)
  }

  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .upsert({
      installation_id: installationId,
      display_name: typeof seriesState.mainCharacter === 'string' ? seriesState.mainCharacter : null,
      age_group: ageGroup,
      language,
      hero_type: heroType,
      custom_hero_name: customHeroName ?? null,
      default_voice_preset_id:
        typeof readerPreferences?.voicePresetId === 'string' ? readerPreferences.voicePresetId : null,
      reader_preferences: readerPreferences ?? {},
    }, { onConflict: 'installation_id' })
    .select('id')
    .single()

  if (profileError || !profile) {
    console.error('profile sync failed', profileError)
    return fail('profile_sync_failed', 500, origin)
  }

  const episodeNo = getEpisodeNo(episode.episode_id)
  const sessionStatus = getSessionStatus(storyMode, episode.episode_id)

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
      next_episode_preview:
        typeof episode.nextEpisodePreview === 'string' ? episode.nextEpisodePreview : null,
      domain_payload: episode,
    }, { onConflict: 'session_id,client_episode_id' })
    .select('id')
    .single()

  if (episodeError || !episodeRow) {
    console.error('episode sync failed', episodeError)
    return fail('episode_sync_failed', 500, origin)
  }

  const { error: deleteChoicesError } = await admin
    .from('story_choices')
    .delete()
    .eq('episode_id', episodeRow.id)

  if (deleteChoicesError) {
    console.error('choice cleanup failed', deleteChoicesError)
    return fail('choice_sync_failed', 500, origin)
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

    const { error: choiceError } = await admin.from('story_choices').insert(rows)
    if (choiceError) {
      console.error('choice insert failed', choiceError)
      return fail('choice_sync_failed', 500, origin)
    }
  }

  const { error: reviewError } = await admin.from('safety_reviews').insert({
    episode_id: episodeRow.id,
    status: approved ? 'approved' : 'blocked',
    risk_level: typeof safety.risk_level === 'string' ? safety.risk_level : 'low',
    flags: isRecord(safety.flags) ? safety.flags : {},
    required_action:
      typeof safety.required_action === 'string' ? safety.required_action : approved ? 'publish' : 'block',
  })

  if (reviewError) console.error('safety review insert failed', reviewError)

  return json({ ok: true }, 200, origin)
}

async function loadCurrent(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .select('id,age_group,language,hero_type,custom_hero_name,reader_preferences')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (profileError) {
    console.error('profile load failed', profileError)
    return fail('profile_load_failed', 500, origin)
  }

  if (!profile) return json({ snapshot: null }, 200, origin)

  const { data: session, error: sessionError } = await admin
    .from('story_sessions')
    .select('id,story_mode,story_mood,style_pack_id,client_state,updated_at')
    .eq('child_profile_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) {
    console.error('session load failed', sessionError)
    return fail('session_load_failed', 500, origin)
  }

  if (!session) return json({ snapshot: null }, 200, origin)

  const { data: episode, error: episodeError } = await admin
    .from('story_episodes')
    .select('domain_payload,episode_no')
    .eq('session_id', session.id)
    .order('episode_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (episodeError) {
    console.error('episode load failed', episodeError)
    return fail('episode_load_failed', 500, origin)
  }

  if (!episode || !isRecord(episode.domain_payload)) {
    return json({ snapshot: null }, 200, origin)
  }

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

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (request.method !== 'POST') return fail('method_not_allowed', 405, origin)

  let input: StoryStateRequest
  try {
    input = await request.json()
  } catch {
    return fail('invalid_json', 400, origin)
  }

  if (input.action === 'sync_generated') return syncGenerated(input, origin)
  if (input.action === 'load_current') return loadCurrent(input, origin)

  return fail('unsupported_action', 400, origin)
})
