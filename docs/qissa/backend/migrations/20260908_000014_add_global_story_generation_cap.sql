-- QISSA closed-beta aggregate Story AI cost ceiling.
--
-- The existing 5/day installation budget limits normal family usage, but a public
-- client can mint another installation UUID. This migration adds a second,
-- privacy-safe project-wide daily claim ceiling so rotating UUIDs cannot create
-- unbounded provider spend once Story AI is deliberately enabled.
--
-- The aggregate table intentionally contains no child/profile/installation
-- identifier. Full profile deletion may remove installation-scoped app_events,
-- but it must not rewind money that has already been budgeted for the day.

create table if not exists public.qissa_provider_daily_usage (
  usage_date date primary key,
  story_generation_claims integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint qissa_provider_daily_usage_claims_nonnegative
    check (story_generation_claims >= 0)
);

alter table public.qissa_provider_daily_usage enable row level security;
revoke all on table public.qissa_provider_daily_usage from public;
revoke all on table public.qissa_provider_daily_usage from anon;
revoke all on table public.qissa_provider_daily_usage from authenticated;
grant all on table public.qissa_provider_daily_usage to service_role;

create or replace function public.qissa_claim_story_generation_budget(
  p_installation_id uuid,
  p_daily_limit integer default 5,
  p_global_daily_limit integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer := 0;
  v_global_used integer := 0;
  v_usage_date date := (now() at time zone 'utc')::date;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  if p_installation_id is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_installation_id',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', 0,
      'global_limit', p_global_daily_limit
    );
  end if;

  if p_daily_limit < 1 or p_daily_limit > 20 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', 0,
      'global_limit', p_global_daily_limit
    );
  end if;

  if p_global_daily_limit < 1 or p_global_daily_limit > 1000 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_global_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', 0,
      'global_limit', p_global_daily_limit
    );
  end if;

  -- Lock the whole day's aggregate budget first. Every claim follows this lock
  -- order, avoiding races between different installations at the global ceiling.
  perform pg_advisory_xact_lock(
    hashtextextended('qissa:story-generation:global:' || v_usage_date::text, 0)
  );

  insert into public.qissa_provider_daily_usage (
    usage_date,
    story_generation_claims,
    updated_at
  ) values (
    v_usage_date,
    0,
    now()
  )
  on conflict (usage_date) do nothing;

  select story_generation_claims
    into v_global_used
    from public.qissa_provider_daily_usage
   where usage_date = v_usage_date;

  if v_global_used >= p_global_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'global_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', v_global_used,
      'global_limit', p_global_daily_limit
    );
  end if;

  -- Serialize claims for this installation after the global lock so concurrent
  -- requests cannot bypass either limit and lock ordering remains consistent.
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
      'limit', p_daily_limit,
      'global_used', v_global_used,
      'global_limit', p_global_daily_limit
    );
  end if;

  update public.qissa_provider_daily_usage
     set story_generation_claims = story_generation_claims + 1,
         updated_at = now()
   where usage_date = v_usage_date
  returning story_generation_claims into v_global_used;

  insert into public.app_events (
    installation_id,
    event_name,
    event_payload
  ) values (
    p_installation_id,
    'story_generation_started',
    jsonb_build_object(
      'daily_limit', p_daily_limit,
      'global_daily_limit', p_global_daily_limit,
      'source', 'story-generate'
    )
  );

  return jsonb_build_object(
    'allowed', true,
    'reason', 'claimed',
    'used', v_used + 1,
    'limit', p_daily_limit,
    'global_used', v_global_used,
    'global_limit', p_global_daily_limit
  );
end;
$$;

revoke all on function public.qissa_claim_story_generation_budget(uuid, integer, integer) from public;
revoke all on function public.qissa_claim_story_generation_budget(uuid, integer, integer) from anon;
revoke all on function public.qissa_claim_story_generation_budget(uuid, integer, integer) from authenticated;
grant execute on function public.qissa_claim_story_generation_budget(uuid, integer, integer) to service_role;

-- Compatibility wrapper: deploying this migration protects the currently live
-- Story Edge Function immediately, even before its next code version is rolled
-- out, because v19 still calls qissa_claim_story_generation(uuid, integer).
create or replace function public.qissa_claim_story_generation(
  p_installation_id uuid,
  p_daily_limit integer default 5
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.qissa_claim_story_generation_budget(
    p_installation_id,
    p_daily_limit,
    30
  );
$$;

revoke all on function public.qissa_claim_story_generation(uuid, integer) from public;
revoke all on function public.qissa_claim_story_generation(uuid, integer) from anon;
revoke all on function public.qissa_claim_story_generation(uuid, integer) from authenticated;
grant execute on function public.qissa_claim_story_generation(uuid, integer) to service_role;
