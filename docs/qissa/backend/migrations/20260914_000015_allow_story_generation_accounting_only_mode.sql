-- QISSA Story AI development accounting-only mode.
--
-- A limit of zero means: count this provider-eligible request atomically, but do
-- not enforce a daily throttle. Positive limits preserve the existing closed-
-- beta quota behavior. Negative/out-of-range limits remain invalid.
--
-- This lets active prompt/validator development continue without an artificial
-- 3/6 request blocker while preserving first-party usage observability and the
-- same service-role-only security boundary. Re-enable positive plan/emergency
-- limits intentionally before external beta/launch.

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

  -- Zero is the explicit accounting-only sentinel. Positive installation limits
  -- retain the historical 1..20 validation range.
  if p_daily_limit < 0 or p_daily_limit > 20 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', 0,
      'global_limit', p_global_daily_limit
    );
  end if;

  -- Zero is also valid for the project-wide accounting-only path. Positive
  -- project limits retain the historical 1..1000 validation range.
  if p_global_daily_limit < 0 or p_global_daily_limit > 1000 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_global_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', 0,
      'global_limit', p_global_daily_limit
    );
  end if;

  -- Preserve the existing global-then-installation advisory lock order so both
  -- capped and accounting-only claims are atomic and race-safe.
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

  if p_global_daily_limit > 0 and v_global_used >= p_global_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'global_daily_limit',
      'used', 0,
      'limit', p_daily_limit,
      'global_used', v_global_used,
      'global_limit', p_global_daily_limit
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text, 0));

  select count(*)::integer
    into v_used
    from public.app_events
   where installation_id = p_installation_id
     and event_name = 'story_generation_started'
     and created_at >= v_day_start;

  if p_daily_limit > 0 and v_used >= p_daily_limit then
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
      'accounting_only', p_daily_limit = 0 and p_global_daily_limit = 0,
      'source', 'story-generate'
    )
  );

  return jsonb_build_object(
    'allowed', true,
    'reason', case
      when p_daily_limit = 0 and p_global_daily_limit = 0 then 'accounted'
      else 'claimed'
    end,
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
