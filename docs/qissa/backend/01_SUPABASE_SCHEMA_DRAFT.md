# QISSA MVP Supabase Schema Draft

Status: historical/core schema design aligned to the current contract values. Production has since been implemented and extended by the ordered SQL migrations in `docs/qissa/backend/migrations/`; use those migrations plus the live launch-baseline audit for deployed details.

## Scope
This core schema supports:
- child profile setup;
- story session state;
- generated episode storage;
- in-episode choices and confirmed choice events;
- safety review records;
- minimal app events.

Later migrations add remote persistence keys, archive state, privacy-consent evidence, deletion indexes, audio-cache foundations and Story AI cost controls.

## Core Tables

### 1) `child_profiles`
Purpose: persist onboarding/setup profile for one child story context with minimal data.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `parent_user_id uuid null` (future auth ownership)
- `display_name text null`
- `age_group text not null`
- `language text not null`
- `hero_type text not null`
- `custom_hero_name text null`
- `default_voice_preset_id text null`
- `reader_preferences jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:
- keep personal data minimal; no birthdate, school, address, exact identity data;
- `parent_user_id` remains future account-ownership scope and nullable in the current architecture;
- privacy-consent evidence is added by a later migration.

### 2) `story_sessions`
Purpose: one one-time or series session lifecycle.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `child_profile_id uuid not null references child_profiles(id) on delete cascade`
- `story_mode text not null`
- `story_mood text not null`
- `style_pack_id text not null`
- `status text not null`
- `current_episode_no int not null default 1`
- `title text null`
- `summary text null`
- `canon_state jsonb not null default '{}'::jsonb`
- `relationship_state jsonb not null default '{}'::jsonb`
- `active_arc text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `completed_at timestamptz null`

Remote client-session identity and archive fields are added by later migrations.

### 3) `story_episodes`
Purpose: persist generated episode payloads.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references story_sessions(id) on delete cascade`
- `episode_no int not null`
- `title text not null`
- `story_text text not null`
- `language text not null`
- `mood text not null`
- `style_pack_id text not null`
- `generation_source text not null default 'local_mock'`
- `safety_status text not null default 'approved'`
- `safety_result jsonb not null default '{}'::jsonb`
- `vocabulary jsonb not null default '[]'::jsonb`
- `next_episode_preview text null`
- `created_at timestamptz not null default now()`

Remote client-episode identity and full domain payload fields are added by later migrations.

### 4) `story_choices`
Purpose: store displayed choice options per episode.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `episode_id uuid not null references story_episodes(id) on delete cascade`
- `choice_id text not null`
- `text text not null`
- `effect_summary text not null`
- `resolution_text text null`
- `tomorrow_seed text null`
- `choice_icon text null`
- `state_patch jsonb not null default '{}'::jsonb`
- `value_alignment text[] not null default '{}'::text[]`
- `display_order int not null default 0`

### 5) `story_choice_events`
Purpose: persisted confirmed selection event.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `session_id uuid not null references story_sessions(id) on delete cascade`
- `episode_id uuid not null references story_episodes(id) on delete cascade`
- `story_choice_id uuid not null references story_choices(id) on delete restrict`
- `selected_at timestamptz not null default now()`
- `state_patch_applied jsonb not null default '{}'::jsonb`

### 6) `safety_reviews`
Purpose: record explicit safety checks/actions for episodes.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `episode_id uuid not null references story_episodes(id) on delete cascade`
- `status text not null`
- `risk_level text not null`
- `flags jsonb not null default '{}'::jsonb`
- `required_action text not null`
- `checked_at timestamptz not null default now()`

### 7) `app_events`
Purpose: minimal diagnostics/audit events for backend stages.

Suggested/core columns:
- `id uuid primary key default gen_random_uuid()`
- `child_profile_id uuid null references child_profiles(id) on delete set null`
- `session_id uuid null references story_sessions(id) on delete set null`
- `event_name text not null`
- `event_payload jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

## Enum-like Check Constraint Recommendations
The implemented MVP uses `text + check` for flexibility.

Current canonical contract values:
- `child_profiles.age_group in ('3-4','5-7','8-9')`
- `child_profiles.language in ('ru','uz','kz')`
- `child_profiles.hero_type in ('girl_hero','boy_hero','animal','magical_hero','custom')`
- `story_sessions.story_mode in ('one_time','series')`
- `story_sessions.story_mood in ('bedtime','kind_adventure')`
- `story_sessions.status in ('not_started','episode_1_active','episode_1_choice_saved','episode_2_active','completed')`
- `story_episodes.generation_source in ('local_mock','edge_story_agent')`
- `story_episodes.safety_status in ('approved','needs_review','blocked')`
- `safety_reviews.status in ('approved','needs_review','blocked')`
- `safety_reviews.risk_level in ('low','medium','high')`
- `safety_reviews.required_action in ('publish','regenerate','fallback','block')`

Legacy client values `3-5`, `6-8`, `9-10` are migration inputs only and are normalized client-side to `3-4`, `5-7`, `8-9`; they are not current backend contract values.

## Unique Constraints
- `story_episodes`: unique episode identity within a session (see current migrations for deployed client/server ID constraints).
- `story_choices`: unique `(episode_id, choice_id)`.
- `story_choice_events`: unique `(session_id, episode_id)` to enforce one confirmed choice per episode path.
- `safety_reviews`: later migration makes `episode_id` idempotent/unique for upsert behavior.

## Index Recommendations
- `story_sessions(child_profile_id, updated_at desc)`
- `story_episodes(session_id, episode_no)`
- `story_choices(episode_id, display_order)`
- `story_choice_events(session_id, selected_at desc)`
- `safety_reviews(episode_id, checked_at desc)`
- `app_events(event_name, created_at desc)`

Later migrations contain the deployed privacy/audio indexes. Do not remove production indexes solely because they are currently reported as unused before beta traffic exists.

## `updated_at` Trigger Recommendation
Use a shared `set_updated_at()` trigger function and add it to:
- `child_profiles`
- `story_sessions`

The production hardening migration fixes the function `search_path`; RLS remains enabled on exposed public tables.

## Intentionally Excluded from Core Story Schema
- parent auth/account implementation;
- billing/subscriptions/payments;
- social features;
- voice cloning assets;
- AI image generation assets;
- full analytics warehouse.

The audio-cache foundation is implemented separately and is not part of this original core-story table list.

## Choice identifier note
- `story_choices.choice_id` is the visible/story choice key (`choice_id text`) in episode payloads.
- `story_choice_events.story_choice_id` is the database UUID foreign key to `story_choices.id`.
