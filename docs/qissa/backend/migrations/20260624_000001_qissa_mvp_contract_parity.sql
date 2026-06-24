-- QISSA MVP backend schema baseline aligned with src/contracts/storyContracts.ts.
-- Runtime remains local until the Supabase/Edge Function integration stage.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid null,
  display_name text null,
  age_group text not null constraint child_profiles_age_group_check
    check (age_group in ('3-4', '5-7', '8-9')),
  language text not null constraint child_profiles_language_check
    check (language in ('ru', 'uz', 'kz')),
  hero_type text not null constraint child_profiles_hero_type_check
    check (hero_type in ('girl_hero', 'boy_hero', 'animal', 'magical_hero', 'custom')),
  custom_hero_name text null,
  default_voice_preset_id text null,
  reader_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.child_profiles is 'Child/family story setup profile with minimal data.';

create table if not exists public.story_sessions (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  story_mode text not null constraint story_sessions_story_mode_check
    check (story_mode in ('one_time', 'series')),
  story_mood text not null constraint story_sessions_story_mood_check
    check (story_mood in ('bedtime', 'kind_adventure')),
  style_pack_id text not null constraint story_sessions_style_pack_id_check
    check (style_pack_id in (
      'cozy_forest',
      'magic_garden',
      'brave_adventure',
      'stars_and_space',
      'silk_road',
      'animal_world',
      'castle_mystery',
      'sea_islands'
    )),
  status text not null constraint story_sessions_status_check
    check (status in ('not_started', 'episode_1_active', 'episode_1_choice_saved', 'episode_2_active', 'completed')),
  current_episode_no int not null default 1 check (current_episode_no >= 1),
  title text null,
  summary text null,
  canon_state jsonb not null default '{}'::jsonb,
  relationship_state jsonb not null default '{}'::jsonb,
  active_arc text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);
comment on table public.story_sessions is 'One story session lifecycle, one-time or series.';

create table if not exists public.story_episodes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.story_sessions(id) on delete cascade,
  episode_no int not null check (episode_no >= 1),
  title text not null,
  story_text text not null,
  language text not null constraint story_episodes_language_check
    check (language in ('ru', 'uz', 'kz')),
  mood text not null constraint story_episodes_mood_check
    check (mood in ('bedtime', 'kind_adventure')),
  style_pack_id text not null constraint story_episodes_style_pack_id_check
    check (style_pack_id in (
      'cozy_forest',
      'magic_garden',
      'brave_adventure',
      'stars_and_space',
      'silk_road',
      'animal_world',
      'castle_mystery',
      'sea_islands'
    )),
  generation_source text not null default 'local_mock' constraint story_episodes_generation_source_check
    check (generation_source in ('local_mock', 'edge_story_agent')),
  safety_status text not null default 'approved' constraint story_episodes_safety_status_check
    check (safety_status in ('approved', 'needs_review', 'blocked')),
  safety_result jsonb not null default '{}'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  next_episode_preview text null,
  created_at timestamptz not null default now(),
  unique (session_id, episode_no)
);
comment on table public.story_episodes is 'Generated episode content storage.';

create table if not exists public.story_choices (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.story_episodes(id) on delete cascade,
  choice_id text not null,
  text text not null,
  effect_summary text not null,
  resolution_text text null,
  tomorrow_seed text null,
  choice_icon text null,
  state_patch jsonb not null default '{}'::jsonb,
  value_alignment text[] not null default '{}'::text[],
  display_order int not null default 0,
  unique (episode_id, choice_id)
);
comment on table public.story_choices is 'Choice options shown in each episode, including resolution and continuation memory.';

create table if not exists public.story_choice_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.story_sessions(id) on delete cascade,
  episode_id uuid not null references public.story_episodes(id) on delete cascade,
  story_choice_id uuid not null references public.story_choices(id) on delete restrict,
  selected_at timestamptz not null default now(),
  state_patch_applied jsonb not null default '{}'::jsonb,
  unique (session_id, episode_id)
);
comment on table public.story_choice_events is 'Confirmed selected choice per session/episode path.';

create table if not exists public.safety_reviews (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.story_episodes(id) on delete cascade,
  status text not null check (status in ('approved', 'needs_review', 'blocked')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  flags jsonb not null default '{}'::jsonb,
  required_action text not null check (required_action in ('publish', 'regenerate', 'fallback', 'block')),
  checked_at timestamptz not null default now()
);
comment on table public.safety_reviews is 'Recorded safety decisions for generated content.';

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid null references public.child_profiles(id) on delete set null,
  session_id uuid null references public.story_sessions(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
comment on table public.app_events is 'Minimal app diagnostics and event log.';

create index if not exists idx_story_sessions_child_profile_updated
  on public.story_sessions(child_profile_id, updated_at desc);
create index if not exists idx_story_episodes_session_episode
  on public.story_episodes(session_id, episode_no);
create index if not exists idx_story_choices_episode_order
  on public.story_choices(episode_id, display_order);
create index if not exists idx_story_choice_events_session_selected
  on public.story_choice_events(session_id, selected_at desc);
create index if not exists idx_safety_reviews_episode_checked
  on public.safety_reviews(episode_id, checked_at desc);
create index if not exists idx_app_events_name_created
  on public.app_events(event_name, created_at desc);

drop trigger if exists trg_child_profiles_set_updated_at on public.child_profiles;
create trigger trg_child_profiles_set_updated_at
before update on public.child_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_story_sessions_set_updated_at on public.story_sessions;
create trigger trg_story_sessions_set_updated_at
before update on public.story_sessions
for each row execute function public.set_updated_at();

-- RLS is intentionally not enabled in this baseline migration.
-- Before a real launch:
-- 1) parent_user_id must be bound to auth.uid() in trusted server code;
-- 2) parent-scoped RLS policies must be enabled for profiles and sessions;
-- 3) generation and safety writes must run through trusted Edge Functions;
-- 4) the public client must never receive the service-role key.
