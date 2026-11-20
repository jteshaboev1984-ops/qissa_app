-- PREPARATORY ONLY. Applying this migration does not enable paid TTS or publish audio.
-- These are candidate Uzbek voices; independent human QA is still required.
begin;

alter table public.voice_presets
  drop constraint if exists voice_presets_provider_check;
alter table public.voice_presets
  add constraint voice_presets_provider_check
  check (provider in ('openai', 'azure', 'device'));

-- Preserve stable client preset IDs and leave the voices disabled until approved.
-- Only migrate dormant device-only fallback records. Do not overwrite approved presets.
update public.voice_presets
set provider = 'azure',
    provider_voice_id = 'uz-UZ-MadinaNeural',
    quality_status = 'qa_pending',
    is_active = false
where language = 'uz'
  and client_preset_id = 'soft_female'
  and provider = 'device'
  and quality_status = 'device_only'
  and is_active = false;

update public.voice_presets
set provider = 'azure',
    provider_voice_id = 'uz-UZ-SardorNeural',
    quality_status = 'qa_pending',
    is_active = false
where language = 'uz'
  and client_preset_id = 'calm_male'
  and provider = 'device'
  and quality_status = 'device_only'
  and is_active = false;

-- Private source registry: server never accepts arbitrary browser TTS text.
-- Empty until an owner-reviewed publishing/import process explicitly populates it.
create table if not exists public.authored_audio_sources (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  story_version text not null,
  source_literary_version text not null,
  language text not null check (language in ('ru','uz','kz')),
  part_id text not null,
  segment_id text not null,
  choice_id text null,
  spoken_text text not null check (char_length(spoken_text) between 1 and 2500),
  source_text_sha256 text not null check (source_text_sha256 ~ '^[a-f0-9]{64}
-- Segment text must be loaded from server-controlled approved sources, never
-- accepted from an arbitrary browser-provided text field.
create table if not exists public.authored_audio_assets (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  story_version text not null,
  source_literary_version text not null,
  language text not null check (language in ('ru', 'uz', 'kz')),
  part_id text not null,
  segment_id text not null,
  choice_id text null,
  source_text_sha256 text not null check (source_text_sha256 ~ '^[a-f0-9]{64}$'),
  voice_preset_id text not null references public.voice_presets(id) on delete restrict,
  provider_model text not null,
  status text not null default 'queued' check (status in ('queued','ready','failed')),
  storage_path text null unique,
  duration_seconds numeric(10,2) null check (duration_seconds is null or duration_seconds >= 0),
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, source_text_sha256, voice_preset_id, provider_model)
);

create index if not exists idx_authored_audio_assets_status
  on public.authored_audio_assets(status, created_at desc);

alter table public.authored_audio_assets enable row level security;
-- Intentionally no anonymous/authenticated direct SELECT or INSERT policies.
-- Only a future authorized server handler may issue signed URLs for public,
-- approved story versions. Unpublished versions must remain inaccessible.
commit;
),
  is_approved boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authored_audio_source_release_check check (not is_published or is_approved),
  unique (story_id, story_version, language, part_id, segment_id)
);
alter table public.authored_audio_sources enable row level security;
-- No browser SELECT, INSERT or UPDATE policies; server verifies publication
-- and hashes against the stored approved text before signing any audio URL.

-- Shared by identical narration text, language, narrator and model across
-- different approved story routes. Original source identifiers are provenance.
-- Segment text must be loaded from server-controlled approved sources, never
-- accepted from an arbitrary browser-provided text field.
create table if not exists public.authored_audio_assets (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  story_version text not null,
  source_literary_version text not null,
  language text not null check (language in ('ru', 'uz', 'kz')),
  part_id text not null,
  segment_id text not null,
  choice_id text null,
  source_text_sha256 text not null check (source_text_sha256 ~ '^[a-f0-9]{64}$'),
  voice_preset_id text not null references public.voice_presets(id) on delete restrict,
  provider_model text not null,
  status text not null default 'queued' check (status in ('queued','ready','failed')),
  storage_path text null unique,
  duration_seconds numeric(10,2) null check (duration_seconds is null or duration_seconds >= 0),
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, story_version, language, segment_id, voice_preset_id, source_text_sha256, provider_model)
);

create index if not exists idx_authored_audio_assets_status
  on public.authored_audio_assets(status, created_at desc);

alter table public.authored_audio_assets enable row level security;
-- Intentionally no anonymous/authenticated direct SELECT or INSERT policies.
-- Only a future authorized server handler may issue signed URLs for public,
-- approved story versions. Unpublished versions must remain inaccessible.
commit;
