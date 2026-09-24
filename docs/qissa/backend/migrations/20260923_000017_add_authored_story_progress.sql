-- Additive persistence for authored multi-choice stories.
-- This table is intentionally separate from story_sessions/story_choice_events,
-- whose current contract remains split-v1 / generated-story specific.

create table if not exists public.authored_story_progress (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  story_id text not null check (char_length(story_id) between 1 and 120),
  story_version text not null check (char_length(story_version) between 1 and 80),
  progress_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(progress_payload) = 'object'),
  current_part_index int not null default 0 check (current_part_index >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_profile_id, story_id, story_version)
);

comment on table public.authored_story_progress is
  'Durable progress for authored multi-choice stories, isolated from generated split-v1 story sessions.';

create index if not exists idx_authored_story_progress_profile_updated
  on public.authored_story_progress(child_profile_id, updated_at desc);

drop trigger if exists trg_authored_story_progress_set_updated_at on public.authored_story_progress;
create trigger trg_authored_story_progress_set_updated_at
before update on public.authored_story_progress
for each row execute function public.set_updated_at();

alter table public.authored_story_progress enable row level security;

-- Browser clients never write this table directly. Trusted Edge Functions use
-- the service role after installation authorization.
revoke all on table public.authored_story_progress from anon, authenticated;
