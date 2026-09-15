-- Add durable series/session separation and per-session setup snapshots for Story Library.

alter table public.story_sessions
  add column if not exists client_series_id text,
  add column if not exists series_session_index integer not null default 1,
  add column if not exists selection_snapshot jsonb not null default '{}'::jsonb;

update public.story_sessions
set client_series_id = client_session_id
where client_series_id is null or btrim(client_series_id) = '';

alter table public.story_sessions
  alter column client_series_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'story_sessions_series_session_index_check'
      and conrelid = 'public.story_sessions'::regclass
  ) then
    alter table public.story_sessions
      add constraint story_sessions_series_session_index_check
      check (series_session_index between 1 and 10);
  end if;
end $$;

create unique index if not exists ux_story_sessions_profile_series_session_index
  on public.story_sessions(child_profile_id, client_series_id, series_session_index);

create index if not exists idx_story_sessions_profile_series_updated
  on public.story_sessions(child_profile_id, client_series_id, updated_at desc);
