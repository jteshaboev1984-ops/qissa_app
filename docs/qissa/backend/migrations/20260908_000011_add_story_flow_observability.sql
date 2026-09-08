-- QISSA launch hardening: minimal first-party story-flow observability.
--
-- Privacy rule: event payloads contain operational metadata only. They must not
-- contain story text, child names, choice text, free-form user input, or audio.
-- Events are emitted by trusted persistence writes; no browser table access is
-- introduced and existing RLS boundaries remain unchanged.

create index if not exists idx_app_events_profile_created
  on public.app_events(child_profile_id, created_at desc)
  where child_profile_id is not null;

create or replace function public.qissa_log_story_session_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.app_events (
    child_profile_id,
    session_id,
    event_name,
    event_payload
  ) values (
    new.child_profile_id,
    new.id,
    'story_session_started',
    jsonb_build_object(
      'story_mode', new.story_mode,
      'story_mood', new.story_mood,
      'style_pack_id', new.style_pack_id,
      'status', new.status
    )
  );
  return new;
end;
$$;

create or replace function public.qissa_log_story_session_completed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status = 'completed' then
    insert into public.app_events (
      child_profile_id,
      session_id,
      event_name,
      event_payload
    ) values (
      new.child_profile_id,
      new.id,
      'story_session_completed',
      jsonb_build_object(
        'story_mode', new.story_mode,
        'story_mood', new.story_mood,
        'style_pack_id', new.style_pack_id,
        'current_episode_no', new.current_episode_no
      )
    );
  end if;
  return new;
end;
$$;

create or replace function public.qissa_log_story_episode_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  select child_profile_id
    into v_profile_id
    from public.story_sessions
   where id = new.session_id;

  insert into public.app_events (
    child_profile_id,
    session_id,
    event_name,
    event_payload
  ) values (
    v_profile_id,
    new.session_id,
    'story_episode_persisted',
    jsonb_build_object(
      'episode_no', new.episode_no,
      'language', new.language,
      'mood', new.mood,
      'style_pack_id', new.style_pack_id,
      'generation_source', new.generation_source,
      'safety_status', new.safety_status
    )
  );
  return new;
end;
$$;

create or replace function public.qissa_log_story_choice_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_choice_id text;
begin
  select child_profile_id
    into v_profile_id
    from public.story_sessions
   where id = new.session_id;

  select choice_id
    into v_choice_id
    from public.story_choices
   where id = new.story_choice_id;

  insert into public.app_events (
    child_profile_id,
    session_id,
    event_name,
    event_payload
  ) values (
    v_profile_id,
    new.session_id,
    'story_choice_confirmed',
    jsonb_build_object(
      'episode_id', new.episode_id,
      'choice_id', v_choice_id
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_qissa_story_session_started on public.story_sessions;
create trigger trg_qissa_story_session_started
after insert on public.story_sessions
for each row execute function public.qissa_log_story_session_insert();

drop trigger if exists trg_qissa_story_session_completed on public.story_sessions;
create trigger trg_qissa_story_session_completed
after update of status on public.story_sessions
for each row execute function public.qissa_log_story_session_completed();

drop trigger if exists trg_qissa_story_episode_persisted on public.story_episodes;
create trigger trg_qissa_story_episode_persisted
after insert on public.story_episodes
for each row execute function public.qissa_log_story_episode_insert();

drop trigger if exists trg_qissa_story_choice_confirmed on public.story_choice_events;
create trigger trg_qissa_story_choice_confirmed
after insert on public.story_choice_events
for each row execute function public.qissa_log_story_choice_insert();
