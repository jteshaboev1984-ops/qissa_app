-- QISSA closed-beta Story AI cost guard.
-- This migration extends the existing privacy-safe app event log with a
-- pseudonymous installation identifier so the Story Edge Function can enforce
-- a daily provider-call budget before any paid AI request is made.

alter table public.app_events
  add column if not exists installation_id uuid null;

create index if not exists idx_app_events_installation_name_created
  on public.app_events (installation_id, event_name, created_at desc)
  where installation_id is not null;

create or replace function public.qissa_claim_story_generation(
  p_installation_id uuid,
  p_daily_limit integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer := 0;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  if p_installation_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_installation_id');
  end if;

  if p_daily_limit < 1 or p_daily_limit > 20 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_daily_limit');
  end if;

  -- Serialize claims for the same installation so concurrent requests cannot
  -- bypass the daily limit with a count-then-insert race.
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text, 0));

  select count(*)::integer
    into v_used
    from public.app_events
   where installation_id = p_installation_id
     and event_name = 'story_generation_started'
     and created_at >= v_day_start;

  if v_used >= p_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'used', v_used,
      'limit', p_daily_limit
    );
  end if;

  insert into public.app_events (
    installation_id,
    event_name,
    event_payload
  ) values (
    p_installation_id,
    'story_generation_started',
    jsonb_build_object(
      'daily_limit', p_daily_limit,
      'source', 'story-generate'
    )
  );

  return jsonb_build_object(
    'allowed', true,
    'reason', 'claimed',
    'used', v_used + 1,
    'limit', p_daily_limit
  );
end;
$$;

revoke all on function public.qissa_claim_story_generation(uuid, integer) from public;
revoke all on function public.qissa_claim_story_generation(uuid, integer) from anon;
revoke all on function public.qissa_claim_story_generation(uuid, integer) from authenticated;
grant execute on function public.qissa_claim_story_generation(uuid, integer) to service_role;
