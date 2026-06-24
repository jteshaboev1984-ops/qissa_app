-- Add stable client identifiers and exact domain snapshots for remote resume.

alter table public.child_profiles
  add column if not exists installation_id uuid;

alter table public.story_sessions
  add column if not exists client_session_id text,
  add column if not exists client_state jsonb not null default '{}'::jsonb;

alter table public.story_episodes
  add column if not exists client_episode_id text,
  add column if not exists domain_payload jsonb not null default '{}'::jsonb;

update public.child_profiles
set installation_id = gen_random_uuid()
where installation_id is null;

alter table public.child_profiles
  alter column installation_id set not null;

alter table public.story_sessions
  alter column client_session_id set not null;

alter table public.story_episodes
  alter column client_episode_id set not null;

create unique index if not exists ux_child_profiles_installation_id
  on public.child_profiles(installation_id);

create unique index if not exists ux_story_sessions_profile_client_session
  on public.story_sessions(child_profile_id, client_session_id);

create unique index if not exists ux_story_episodes_session_client_episode
  on public.story_episodes(session_id, client_episode_id);
