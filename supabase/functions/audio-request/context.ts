import {
  GENERATIONS_PER_HOUR,
  PRIVACY_CONSENT_VERSION,
  admin,
  type JsonRecord,
  type OwnedEpisode,
  type VoicePresetId,
} from './shared.ts'

export const findOwnedEpisode = async (
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

export const hasValidAiConsent = (profile: OwnedEpisode['profile']) =>
  profile.privacy_consent_version === PRIVACY_CONSENT_VERSION &&
  profile.parent_or_guardian_confirmed === true &&
  profile.ai_processing_consent === true

export const loadApprovedVoice = async (
  language: OwnedEpisode['episode']['language'],
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

export const logEvent = async (profileId: string, eventName: string, payload: JsonRecord) => {
  const { error } = await admin.from('app_events').insert({
    child_profile_id: profileId,
    event_name: eventName,
    event_payload: payload,
  })
  if (error) console.error('audio event log failed', error)
}

export const rateLimitReached = async (profileId: string): Promise<boolean> => {
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
