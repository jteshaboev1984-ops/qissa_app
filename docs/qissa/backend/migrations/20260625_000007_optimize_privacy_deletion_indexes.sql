drop index if exists public.ux_story_choice_events_session_episode;

create index if not exists idx_app_events_child_profile_id
  on public.app_events(child_profile_id);

create index if not exists idx_app_events_session_id
  on public.app_events(session_id);

create index if not exists idx_story_choice_events_episode_id
  on public.story_choice_events(episode_id);

create index if not exists idx_story_choice_events_story_choice_id
  on public.story_choice_events(story_choice_id);
