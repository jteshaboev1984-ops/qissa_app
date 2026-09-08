-- Closed-beta device-bound access credential.
-- The public installation UUID remains a lookup key, while possession of the
-- separate 256-bit client secret is required to read or mutate persisted family
-- state. Only the SHA-256 hash is stored server-side.

create table if not exists public.installation_credentials (
  installation_id uuid primary key,
  auth_hash text not null,
  created_at timestamptz not null default now(),
  constraint installation_credentials_auth_hash_format
    check (auth_hash ~ '^[0-9a-f]{64}$')
);

alter table public.installation_credentials enable row level security;

-- Browser clients must never access credentials directly. Edge Functions use
-- the service role and enforce the possession check before touching profile,
-- story or playback data.
revoke all on table public.installation_credentials from anon, authenticated;
grant all on table public.installation_credentials to service_role;
