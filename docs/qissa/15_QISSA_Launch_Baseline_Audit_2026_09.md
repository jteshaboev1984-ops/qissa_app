# QISSA Launch Baseline Audit — September 2026

Status: launch-hardening baseline after closed-beta Story Core production acceptance.

This record captures the deployed production baseline before any paid Story AI rollout or broader beta expansion.

## Production project

- Supabase project: `QISSA` (`phwakdpxxyncyslvnqht`)
- Region: `ap-south-1`
- Project status during latest audit: `ACTIVE_HEALTHY`
- Postgres: 17
- Supabase development branches: none

## Edge Functions

Production functions confirmed active:

- `story-generate` — v15, `verify_jwt=true`
- `story-state` — v5, `verify_jwt=true`
- `audio-request` — v1, `verify_jwt=true`

`story-generate` v15 remains the accepted closed-beta Story Core deployment. Story AI is still intentionally disabled for normal launch hardening.

## Closed-beta production acceptance

A provider-free production E2E run completed successfully on 2026-09-07.

Matrix:

- Languages: RU, UZ
- Worlds: Cozy Forest, Magic Garden, Stars & Space
- Branches: choice A and choice B
- Total scenarios: **12/12 passed**

Each scenario verified:

1. Episode 1 generation
2. exactly two child-facing options for one meaningful child choice
3. state persistence
4. confirmed choice persistence
5. choice-specific memory/consequence
6. Episode 2 continuation
7. zero additional choice in Episode 2
8. persisted reload of Episode 2 state
9. profile deletion
10. absence of profile data after deletion

The preflight and all scenarios confirmed `safe-fallback` with Story AI disabled, so the acceptance run did not invoke a paid story provider.

After the run, database verification found zero recent smoke profiles and zero recent smoke sessions. The temporary one-shot workflow was removed from the repository; a permanent manual provider-free E2E workflow now exists for repeatable release checks.

## Deterministic release gates

The release build now includes a deterministic closed-beta content matrix check covering the same public matrix:

- RU + UZ
- Cozy Forest + Magic Garden + Stars & Space
- both Episode 1 choice branches
- Episode 1 bedtime length floor
- distinct A/B consequences
- choice-specific Episode 2 continuation
- no Episode 3 promise
- closed bedtime ending
- vocabulary contract
- no technical-copy leakage

The gate is wired into both CI and GitHub Pages release deployment and currently passes.

The release build also includes dedicated guards for:

- backend contract parity;
- backend access boundary / RLS architecture;
- Story Core continuity;
- closed-beta public scope;
- Story AI cost guard;
- privacy consent and irreversible deletion ordering;
- listening playback contract;
- Story AI safety contract;
- story copy and localization;
- TypeScript/build health.

## Current data baseline

Exact row counts rechecked after the latest hardening work:

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

The current architecture intentionally keeps the public story tables behind RLS with no `anon`/`authenticated` policies. This matches the persistence design: browser clients call Edge Functions, while trusted persistence operations use the server-side service role.

The latest production security advisor still reports only `RLS Enabled No Policy` INFO notices for the protected public tables. For the current closed-beta architecture this is an **accepted intentional state**, not a missing client-access policy. Adding permissive policies merely to remove the INFO notices would weaken the current security boundary.

The repository now has an automated backend-access gate that prevents routine changes from silently adding direct browser table access, permissive public RLS policies, or removing the service-role boundary.

## Storage

- Bucket: `story-audio`
- Public: `false`
- File size limit: 25 MiB
- Allowed MIME types: `audio/mpeg`, `audio/ogg`, `audio/wav`
- No client storage policies are present in the current baseline.

This matches the current provider-audio architecture: audio storage access is server-side through the Audio Agent foundation. The closed beta itself still uses browser/device narration by default.

## Performance advisor

The latest performance advisor reports only unused-index INFO notices. No index is removed at this stage. The project has very low production traffic and some indexes support later audio/operations paths, so an unused-index signal before beta traffic is not evidence that an index is unnecessary.

## Persistence copy correction

A launch-hardening review found one stale user-facing Library statement that said the story was stored only on the device. That was no longer accurate after remote state persistence was introduced.

The RU/UZ/KZ Library copy now states that the story is **bound to the current device** and that QISSA saves its state so continuation can be restored after reopening. A story-copy regression guard now blocks the old local-only wording from returning.

## Cost and provider state

- Story AI remains intentionally disabled during launch hardening.
- Normal CI and product validation remain provider-free.
- Installation-scoped Story AI claim limit is **5 generations/day** once real AI is enabled.
- No project-wide/global daily cap is part of the approved closed-beta scope.
- Provider TTS remains disabled by default for the beta baseline.

## Public scope verification

Automated scope checks confirm the closed-beta setup remains constrained to:

- age 5–7;
- RU and UZ Beta as public languages;
- Cozy Forest, Magic Garden and Stars & Space as public worlds;
- bedtime series;
- one confirmed child choice in Episode 1 followed by Episode 2.

Kazakh and non-beta worlds remain in internal contracts/content infrastructure but are not exposed as ordinary public beta choices.

## Remaining launch-hardening gates

The Story Core backend/persistence slice and deterministic content matrix are technically proven. Remaining work should now focus on release readiness rather than feature expansion:

1. final browser/mobile UX regression of the deployed Pages build;
2. consent/privacy copy and real parent-flow review;
3. manual deletion/recovery UX verification from the actual UI;
4. first deliberate paid Story AI acceptance decision and run when approved;
5. local legal/privacy review before public launch.

Do not enable additional worlds, age groups, public languages, provider TTS, family voice, payments, or runtime AI images as part of this baseline hardening step.
