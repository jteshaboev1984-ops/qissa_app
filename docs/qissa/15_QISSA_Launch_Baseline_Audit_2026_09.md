# QISSA Launch Baseline Audit — September 2026

Status: launch-hardening baseline after closed-beta Story Core production acceptance.

This record captures the deployed production baseline before any paid Story AI rollout or broader beta expansion.

## Production project

- Supabase project: `QISSA` (`phwakdpxxyncyslvnqht`)
- Region: `ap-south-1`
- Project status during audit: `ACTIVE_HEALTHY`
- Postgres: 17
- Supabase development branches: none

## Edge Functions

Production functions confirmed active:

- `story-generate` — v15, `verify_jwt=true`
- `story-state` — v5, `verify_jwt=true`
- `audio-request` — v1, `verify_jwt=true`

`story-generate` v15 is pinned to the accepted closed-beta Story Core source commit used for the production E2E acceptance run.

## Closed-beta production acceptance

A provider-free production E2E run completed successfully on 2026-09-07.

Matrix:

- Languages: RU, UZ
- Worlds: Cozy Forest, Magic Garden, Stars & Space
- Branches: choice A and choice B
- Total scenarios: **12/12 passed**

Each scenario verified:

1. Episode 1 generation
2. exactly two child choices
3. state persistence
4. confirmed choice persistence
5. choice-specific memory/consequence
6. Episode 2 continuation
7. zero additional choice in Episode 2
8. persisted reload of Episode 2 state
9. profile deletion
10. absence of profile data after deletion

The preflight and all scenarios confirmed `safe-fallback` with Story AI disabled, so the acceptance run did not invoke a paid story provider.

After the run, database verification found zero recent smoke profiles and zero recent smoke sessions. The temporary one-shot workflow was removed from the repository.

## Current data baseline

Row counts observed after cleanup:

- `child_profiles`: 5
- `story_sessions`: 7
- `story_episodes`: 13
- `story_choices`: 14
- `story_choice_events`: 6
- `safety_reviews`: 13
- `voice_presets`: 12
- `audio_assets`: 0
- `playback_progress`: 0
- `app_events`: 0

These counts are recorded only as a baseline. Existing rows were not modified or deleted by this audit.

## Database access model

The current architecture intentionally keeps the public story tables behind RLS with no `anon`/`authenticated` policies. This matches the original persistence design: browser clients use authenticated Edge Function entry points, while trusted persistence operations use the server-side service role.

The production security advisor reports `RLS Enabled No Policy` as INFO for:

- `app_events`
- `audio_assets`
- `child_profiles`
- `playback_progress`
- `safety_reviews`
- `story_choice_events`
- `story_choices`
- `story_episodes`
- `story_sessions`
- `voice_presets`

For the current closed-beta architecture this is an **accepted intentional state**, not a missing client-access policy. Adding permissive policies merely to remove the INFO notices would weaken the current security boundary.

The schema still has default role grants for `anon` and `authenticated`, but with RLS enabled and no policies those roles cannot read or write rows through the normal data API. The frontend repository contains no direct Supabase table client; persistence is routed through Edge Functions.

## Storage

- Bucket: `story-audio`
- Public: `false`
- File size limit: 25 MiB
- Allowed MIME types: `audio/mpeg`, `audio/ogg`, `audio/wav`
- No client storage policies are present in the current baseline.

This matches the current provider-audio architecture: audio storage access is server-side through the Audio Agent foundation. The closed beta itself still uses browser/device narration by default.

## Performance advisor

The performance advisor currently reports only unused-index INFO notices:

- `idx_audio_assets_status_updated`
- `idx_audio_assets_voice_preset`
- `idx_playback_progress_audio_asset`
- `idx_story_sessions_status`
- `idx_safety_reviews_episode_checked`

No index is removed at this stage. The project has very low production traffic and some of these indexes support later audio/operations paths, so an unused-index signal before beta traffic is not evidence that an index is unnecessary.

## Cost and provider state

- Story AI remains intentionally disabled during launch hardening.
- Normal CI and product validation remain provider-free.
- Installation-scoped Story AI claim limit is **5 generations/day** once real AI is enabled.
- No project-wide/global daily cap is part of the approved closed-beta scope.
- Provider TTS remains disabled by default for the beta baseline.

## Remaining launch-hardening gates

The Story Core backend/persistence slice is now technically proven for the approved closed-beta matrix. Remaining work should focus on release readiness rather than feature expansion:

1. final browser/mobile UX regression of the deployed Pages build;
2. consent/privacy copy and real parent-flow review;
3. manual deletion/recovery UX verification from the actual UI;
4. confirm all non-beta worlds/languages remain hidden from public setup;
5. resolve remaining contract/document naming drift without broadening scope;
6. decide when to perform the first deliberately paid Story AI acceptance run;
7. local legal/privacy review before a public launch.

Do not enable additional worlds, age groups, public languages, provider TTS, family voice, payments, or runtime AI images as part of this baseline hardening step.
