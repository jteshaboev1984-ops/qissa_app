-- QISSA Azure Uzbek TTS: PREPARATORY ONLY.
-- Migration is NOT applied by this PR. It does not approve a voice, publish a
-- story, generate MP3s or allow browser writes to family/story data.
begin;

alter table public.voice_presets
  drop constraint if exists voice_presets_provider_check;
alter table public.voice_presets
  add constraint voice_presets_provider_check
  check (provider in ('openai', 'azure', 'device'));

-- Keep the original client IDs stable; never overwrite an active or approved
-- voice. Dormant device entries are only prepared for future human QA.
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

-- Exact speech text and its original literary provenance are private.
-- An operator-reviewed, source-hash-locked import will populate the table.
-- Rows are NOT published or approved by default.
create table if not exists public.authored_audio_sources (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  story_version text not null,
  source_literary_version text not null,
  source_file_sha256 text not null
    check (source_file_sha256 ~ '^[a-f0-9]{64}$'),
  language text not null check (language in ('ru', 'uz', 'kz')),
  part_id text not null,
  segment_id text not null,
  choice_id text null,
  spoken_text text not null
    check (char_length(spoken_text) between 1 and 2500),
  source_text_sha256 text not null
    check (source_text_sha256 ~ '^[a-f0-9]{64}$'),
  is_approved boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authored_audio_source_release_check
    check (not is_published or is_approved),
  unique (story_id, story_version, language, part_id, segment_id)
);

-- MP3s may be reused by different APPROVED story/route source rows when the
-- exact spoken text, language, voice, and engine model are identical.
create table if not exists public.authored_audio_assets (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  story_version text not null,
  source_literary_version text not null,
  language text not null check (language in ('ru', 'uz', 'kz')),
  part_id text not null,
  segment_id text not null,
  choice_id text null,
  source_text_sha256 text not null
    check (source_text_sha256 ~ '^[a-f0-9]{64}$'),
  voice_preset_id text not null
    references public.voice_presets(id) on delete restrict,
  voice_provider_id text not null,
  provider_model text not null,
  status text not null default 'queued'
    check (status in ('queued', 'ready', 'failed')),
  storage_path text null unique,
  duration_seconds numeric(10,2) null
    check (duration_seconds is null or duration_seconds >= 0),
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    language, source_text_sha256, voice_preset_id,
    voice_provider_id, provider_model
  ),
  constraint authored_audio_ready_has_file
    check (status <> 'ready' or storage_path is not null)
);

create index if not exists idx_authored_audio_assets_status
  on public.authored_audio_assets(status, created_at desc);
create index if not exists idx_authored_audio_sources_release
  on public.authored_audio_sources(story_id, story_version, language)
  where is_approved = true and is_published = true;

alter table public.authored_audio_sources enable row level security;
alter table public.authored_audio_assets enable row level security;

-- Defense in depth: no browser role can read unpublished text or manipulate
-- source/asset approval. A future server-side, gated worker must use its
-- own service access; no public read or write policies are created here.
revoke all on public.authored_audio_sources from anon, authenticated;
revoke all on public.authored_audio_assets from anon, authenticated;

commit;
