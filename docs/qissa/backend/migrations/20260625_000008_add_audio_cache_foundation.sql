create table if not exists public.voice_presets (
  id text primary key,
  client_preset_id text not null constraint voice_presets_client_preset_check
    check (client_preset_id in ('soft_female', 'calm_male', 'neutral_storyteller', 'cheerful_daytime')),
  language text not null constraint voice_presets_language_check
    check (language in ('ru', 'uz', 'kz')),
  display_name jsonb not null default '{}'::jsonb,
  display_gender text not null constraint voice_presets_display_gender_check
    check (display_gender in ('female', 'male', 'neutral')),
  tone text not null constraint voice_presets_tone_check
    check (tone in ('calm', 'storyteller', 'cheerful', 'soft')),
  bedtime_safe boolean not null default false,
  provider text not null constraint voice_presets_provider_check
    check (provider in ('openai', 'device')),
  provider_voice_id text null,
  fallback_client_preset_id text null,
  quality_status text not null default 'qa_pending' constraint voice_presets_quality_status_check
    check (quality_status in ('approved', 'qa_pending', 'device_only', 'disabled')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, client_preset_id)
);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.story_episodes(id) on delete cascade,
  voice_preset_id text not null references public.voice_presets(id) on delete restrict,
  status text not null default 'queued' constraint audio_assets_status_check
    check (status in ('queued', 'ready', 'failed')),
  cache_key text not null unique,
  text_version text not null,
  speed numeric(3,1) not null default 1.0 constraint audio_assets_speed_check
    check (speed in (0.8, 1.0, 1.2)),
  requested_mode text not null constraint audio_assets_requested_mode_check
    check (requested_mode in ('bedtime', 'kind_adventure')),
  storage_path text null unique,
  duration_seconds numeric(10,2) null check (duration_seconds is null or duration_seconds >= 0),
  provider text not null,
  provider_model text null,
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playback_progress (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  episode_id uuid not null references public.story_episodes(id) on delete cascade,
  audio_asset_id uuid null references public.audio_assets(id) on delete set null,
  position_seconds numeric(10,2) not null default 0 check (position_seconds >= 0),
  speed numeric(3,1) not null default 1.0 constraint playback_progress_speed_check
    check (speed in (0.8, 1.0, 1.2)),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (child_profile_id, episode_id)
);

create index if not exists idx_audio_assets_episode_created
  on public.audio_assets(episode_id, created_at desc);
create index if not exists idx_audio_assets_status_updated
  on public.audio_assets(status, updated_at desc);
create index if not exists idx_playback_progress_profile_updated
  on public.playback_progress(child_profile_id, updated_at desc);
create index if not exists idx_playback_progress_episode
  on public.playback_progress(episode_id);

alter table public.voice_presets enable row level security;
alter table public.audio_assets enable row level security;
alter table public.playback_progress enable row level security;

drop trigger if exists trg_voice_presets_set_updated_at on public.voice_presets;
create trigger trg_voice_presets_set_updated_at
before update on public.voice_presets
for each row execute function public.set_updated_at();

drop trigger if exists trg_audio_assets_set_updated_at on public.audio_assets;
create trigger trg_audio_assets_set_updated_at
before update on public.audio_assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_playback_progress_set_updated_at on public.playback_progress;
create trigger trg_playback_progress_set_updated_at
before update on public.playback_progress
for each row execute function public.set_updated_at();

insert into public.voice_presets (
  id,
  client_preset_id,
  language,
  display_name,
  display_gender,
  tone,
  bedtime_safe,
  provider,
  provider_voice_id,
  fallback_client_preset_id,
  quality_status,
  is_active
)
values
  ('ru_soft_female_v1', 'soft_female', 'ru', '{"ru":"Мягкий женский голос","uz":"Yumshoq ayol ovozi","kz":"Жұмсақ әйел дауысы"}'::jsonb, 'female', 'soft', true, 'openai', 'coral', 'neutral_storyteller', 'qa_pending', false),
  ('ru_calm_male_v1', 'calm_male', 'ru', '{"ru":"Спокойный мужской голос","uz":"Sokin erkak ovozi","kz":"Сабырлы ер адам дауысы"}'::jsonb, 'male', 'calm', true, 'openai', 'cedar', 'neutral_storyteller', 'qa_pending', false),
  ('ru_neutral_storyteller_v1', 'neutral_storyteller', 'ru', '{"ru":"Сказочный рассказчик","uz":"Ertakchi ovozi","kz":"Ертегіші дауысы"}'::jsonb, 'neutral', 'storyteller', true, 'openai', 'marin', null, 'qa_pending', false),
  ('ru_cheerful_daytime_v1', 'cheerful_daytime', 'ru', '{"ru":"Бодрый дневной голос","uz":"Quvnoq kunduzgi ovoz","kz":"Көңілді күндізгі дауыс"}'::jsonb, 'neutral', 'cheerful', false, 'openai', 'verse', 'neutral_storyteller', 'qa_pending', false),
  ('uz_soft_female_device_v1', 'soft_female', 'uz', '{"ru":"Мягкий женский голос","uz":"Yumshoq ayol ovozi","kz":"Жұмсақ әйел дауысы"}'::jsonb, 'female', 'soft', true, 'device', null, 'neutral_storyteller', 'device_only', false),
  ('uz_calm_male_device_v1', 'calm_male', 'uz', '{"ru":"Спокойный мужской голос","uz":"Sokin erkak ovozi","kz":"Сабырлы ер адам дауысы"}'::jsonb, 'male', 'calm', true, 'device', null, 'neutral_storyteller', 'device_only', false),
  ('uz_neutral_storyteller_device_v1', 'neutral_storyteller', 'uz', '{"ru":"Сказочный рассказчик","uz":"Ertakchi ovozi","kz":"Ертегіші дауысы"}'::jsonb, 'neutral', 'storyteller', true, 'device', null, null, 'device_only', false),
  ('uz_cheerful_daytime_device_v1', 'cheerful_daytime', 'uz', '{"ru":"Бодрый дневной голос","uz":"Quvnoq kunduzgi ovoz","kz":"Көңілді күндізгі дауыс"}'::jsonb, 'neutral', 'cheerful', false, 'device', null, 'neutral_storyteller', 'device_only', false),
  ('kz_soft_female_v1', 'soft_female', 'kz', '{"ru":"Мягкий женский голос","uz":"Yumshoq ayol ovozi","kz":"Жұмсақ әйел дауысы"}'::jsonb, 'female', 'soft', true, 'openai', 'coral', 'neutral_storyteller', 'qa_pending', false),
  ('kz_calm_male_v1', 'calm_male', 'kz', '{"ru":"Спокойный мужской голос","uz":"Sokin erkak ovozi","kz":"Сабырлы ер адам дауысы"}'::jsonb, 'male', 'calm', true, 'openai', 'cedar', 'neutral_storyteller', 'qa_pending', false),
  ('kz_neutral_storyteller_v1', 'neutral_storyteller', 'kz', '{"ru":"Сказочный рассказчик","uz":"Ertakchi ovozi","kz":"Ертегіші дауысы"}'::jsonb, 'neutral', 'storyteller', true, 'openai', 'marin', null, 'qa_pending', false),
  ('kz_cheerful_daytime_v1', 'cheerful_daytime', 'kz', '{"ru":"Бодрый дневной голос","uz":"Quvnoq kunduzgi ovoz","kz":"Көңілді күндізгі дауыс"}'::jsonb, 'neutral', 'cheerful', false, 'openai', 'verse', 'neutral_storyteller', 'qa_pending', false)
on conflict (id) do update set
  display_name = excluded.display_name,
  display_gender = excluded.display_gender,
  tone = excluded.tone,
  bedtime_safe = excluded.bedtime_safe,
  provider = excluded.provider,
  provider_voice_id = excluded.provider_voice_id,
  fallback_client_preset_id = excluded.fallback_client_preset_id,
  quality_status = excluded.quality_status;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-audio', 'story-audio', false, 26214400, array['audio/mpeg', 'audio/ogg', 'audio/wav'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
