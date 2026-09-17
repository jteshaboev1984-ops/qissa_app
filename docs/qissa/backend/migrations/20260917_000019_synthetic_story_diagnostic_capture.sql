-- Operator-only, synthetic-only, single-use diagnostics. NEVER store production family stories here.
-- Migrate only after provider-free PR CI passes, with Story AI OFF.
create table if not exists public.qissa_synthetic_story_diagnostics (
  capture_id uuid primary key,
  installation_id uuid not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  captured_at timestamptz,
  payload jsonb,
  constraint qissa_synthetic_diagnostics_short_lived check (
    expires_at > created_at and expires_at <= created_at + interval '2 hours'
  ),
  constraint qissa_synthetic_diagnostics_bounded_payload check (
    payload is null or octet_length(payload::text) <= 180000
  ),
  constraint qissa_synthetic_diagnostics_capture_requires_claim check (
    captured_at is null or claimed_at is not null
  )
);

alter table public.qissa_synthetic_story_diagnostics enable row level security;
revoke all on table public.qissa_synthetic_story_diagnostics from public;
revoke all on table public.qissa_synthetic_story_diagnostics from anon;
revoke all on table public.qissa_synthetic_story_diagnostics from authenticated;
grant select, insert, update, delete on table public.qissa_synthetic_story_diagnostics to service_role;

-- No RLS policies: even authenticated browser roles cannot read rejected story content.
-- The operator inserts a fresh (capture_id, installation_id, expires_at) for ONE
-- synthetic request; capture is claimed atomically and written at most once.
-- After reading the test transcript: DELETE by capture_id and verify 0 rows.
-- Expiration prevents use after the deadline but does not physically erase bytes;
-- pg_cron is unavailable on this project, so explicit deletion is REQUIRED.
-- Never write raw story text to logs, headers, Git commits, or Actions artifacts.
