-- QISSA post-restore read-only verification.
-- Run after a database restore and before reopening closed-beta traffic.
-- All rows with kind='integrity' must return value=0.

with counts as (
  select 'child_profiles' as name, count(*)::bigint as value from public.child_profiles
  union all select 'story_sessions', count(*) from public.story_sessions
  union all select 'story_episodes', count(*) from public.story_episodes
  union all select 'story_choices', count(*) from public.story_choices
  union all select 'story_choice_events', count(*) from public.story_choice_events
  union all select 'safety_reviews', count(*) from public.safety_reviews
  union all select 'app_events', count(*) from public.app_events
  union all select 'audio_assets', count(*) from public.audio_assets
  union all select 'playback_progress', count(*) from public.playback_progress
  union all select 'voice_presets', count(*) from public.voice_presets
), integrity as (
  select 'orphan_sessions' as name, count(*)::bigint as value
  from public.story_sessions s
  left join public.child_profiles p on p.id = s.child_profile_id
  where p.id is null

  union all

  select 'orphan_episodes', count(*)
  from public.story_episodes e
  left join public.story_sessions s on s.id = e.session_id
  where s.id is null

  union all

  select 'orphan_choices', count(*)
  from public.story_choices c
  left join public.story_episodes e on e.id = c.episode_id
  where e.id is null

  union all

  select 'orphan_choice_events', count(*)
  from public.story_choice_events ce
  left join public.story_sessions s on s.id = ce.session_id
  left join public.story_episodes e on e.id = ce.episode_id
  left join public.story_choices c on c.id = ce.story_choice_id
  where s.id is null or e.id is null or c.id is null

  union all

  select 'orphan_safety_reviews', count(*)
  from public.safety_reviews sr
  left join public.story_episodes e on e.id = sr.episode_id
  where e.id is null

  union all

  select 'privacy_consent_inconsistent', count(*)
  from public.child_profiles
  where parent_or_guardian_confirmed is distinct from true
     or ai_processing_consent is distinct from true
     or privacy_consent_version is null
     or privacy_consent_at is null

  union all

  select 'multiple_non_archived_sessions_per_profile', count(*)
  from (
    select child_profile_id
    from public.story_sessions
    where is_archived = false
    group by child_profile_id
    having count(*) > 1
  ) duplicates

  union all

  select 'episode_series_payload_mismatch', count(*)
  from public.story_episodes e
  join public.story_sessions s on s.id = e.session_id
  where e.domain_payload is not null
    and e.domain_payload ? 'series_id'
    and e.domain_payload->>'series_id' is distinct from s.client_session_id

  union all

  select 'choice_event_session_mismatch', count(*)
  from public.story_choice_events ce
  join public.story_episodes e on e.id = ce.episode_id
  where ce.session_id is distinct from e.session_id
)
select 'count' as kind, name, value from counts
union all
select 'integrity' as kind, name, value from integrity
order by kind, name;
