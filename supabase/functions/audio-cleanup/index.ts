import { createClient } from 'npm:@supabase/supabase-js@2'

type AudioCleanupInput = {
  action?: 'delete_profile_audio'
  installationId?: string
}

const AUDIO_BUCKET = 'story-audio'
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration.')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

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

const fail = (error: string, status: number, origin: string | null) =>
  json({ error }, status, origin)

const loadAudioPaths = async (profileId: string): Promise<string[]> => {
  const { data: sessions, error: sessionError } = await admin
    .from('story_sessions')
    .select('id')
    .eq('child_profile_id', profileId)

  if (sessionError) throw new Error('audio_session_lookup_failed')
  const sessionIds = (sessions ?? []).map((session) => session.id).filter(Boolean)
  if (sessionIds.length === 0) return []

  const { data: episodes, error: episodeError } = await admin
    .from('story_episodes')
    .select('id')
    .in('session_id', sessionIds)

  if (episodeError) throw new Error('audio_episode_lookup_failed')
  const episodeIds = (episodes ?? []).map((episode) => episode.id).filter(Boolean)
  if (episodeIds.length === 0) return []

  const { data: assets, error: assetError } = await admin
    .from('audio_assets')
    .select('storage_path')
    .in('episode_id', episodeIds)
    .not('storage_path', 'is', null)

  if (assetError) throw new Error('audio_asset_lookup_failed')
  return [...new Set((assets ?? [])
    .map((asset) => typeof asset.storage_path === 'string' ? asset.storage_path : '')
    .filter(Boolean))]
}

const deleteProfileAudio = async (installationId: string, origin: string | null) => {
  const { data: profile, error: profileError } = await admin
    .from('child_profiles')
    .select('id')
    .eq('installation_id', installationId)
    .maybeSingle()

  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ ok: true, deletedObjectCount: 0 }, 200, origin)

  let paths: string[]
  try {
    paths = await loadAudioPaths(profile.id)
  } catch (error) {
    console.error('audio cleanup lookup failed', error)
    return fail('audio_cleanup_lookup_failed', 500, origin)
  }

  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100)
    const { error } = await admin.storage.from(AUDIO_BUCKET).remove(chunk)
    if (error) {
      console.error('audio storage cleanup failed', error)
      return fail('audio_storage_cleanup_failed', 500, origin)
    }
  }

  return json({ ok: true, deletedObjectCount: paths.length }, 200, origin)
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return fail('method_not_allowed', 405, origin)

  let input: AudioCleanupInput
  try {
    input = await request.json()
  } catch {
    return fail('invalid_json', 400, origin)
  }

  if (input.action !== 'delete_profile_audio') return fail('unsupported_action', 400, origin)
  if (!isUuid(input.installationId)) return fail('invalid_installation_id', 422, origin)
  return deleteProfileAudio(input.installationId, origin)
})
