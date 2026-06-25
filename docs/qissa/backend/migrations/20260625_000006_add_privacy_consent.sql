alter table public.child_profiles
  add column if not exists privacy_consent_version text,
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists parent_or_guardian_confirmed boolean not null default false,
  add column if not exists ai_processing_consent boolean not null default false;

alter table public.child_profiles
  drop constraint if exists child_profiles_privacy_consent_consistent;

alter table public.child_profiles
  add constraint child_profiles_privacy_consent_consistent
  check (
    (parent_or_guardian_confirmed = false and ai_processing_consent = false)
    or
    (
      parent_or_guardian_confirmed = true
      and ai_processing_consent = true
      and privacy_consent_version is not null
      and privacy_consent_at is not null
    )
  );
