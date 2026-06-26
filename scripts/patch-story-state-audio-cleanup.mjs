import { readFileSync, writeFileSync } from 'node:fs'

const path = 'supabase/functions/story-state/index.ts'
let source = readFileSync(path, 'utf8')

const replaceOnce = (before, after, label) => {
  const index = source.indexOf(before)
  if (index < 0) throw new Error(`Missing anchor: ${label}`)
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Duplicate anchor: ${label}`)
  source = source.slice(0, index) + after + source.slice(index + before.length)
}

replaceOnce(
  "const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'\n",
  "const PRIVACY_CONSENT_VERSION = '2026-06-25-v1'\nconst AUDIO_BUCKET = 'story-audio'\n",
  'audio bucket',
)

const helpers = `type IdRow = { id?: unknown }
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

`
replaceOnce(
  'async function deleteProfileData(input: StoryStateRequest, origin: string | null) {',
  helpers + 'async function deleteProfileData(input: StoryStateRequest, origin: string | null) {',
  'delete helper insertion',
)

const oldBlock = `async function deleteProfileData(input: StoryStateRequest, origin: string | null) {
  const { installationId } = input
  if (!isUuid(installationId)) return fail('invalid_installation_id', 422, origin)

  const { data: profile, error: profileError } = await findProfile(installationId)
  if (profileError) return fail('profile_load_failed', 500, origin)
  if (!profile) return json({ ok: true, deleted: false }, 200, origin)

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

  return json({ ok: true, deleted: true }, 200, origin)
}`

const newBlock = `async function deleteProfileData(input: StoryStateRequest, origin: string | null) {
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
}`

replaceOnce(oldBlock, newBlock, 'delete action')
writeFileSync(path, source)
console.log('story-state audio cleanup patch applied')
