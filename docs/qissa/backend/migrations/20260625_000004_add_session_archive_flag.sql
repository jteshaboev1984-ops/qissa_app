-- Keep reset/new-story semantics safe when remote resume is enabled.

alter table public.story_sessions
  add column if not exists is_archived boolean not null default false;

create index if not exists idx_story_sessions_profile_active_updated
  on public.story_sessions(child_profile_id, is_archived, updated_at desc);
