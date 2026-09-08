# QISSA Launch Baseline Audit — September 2026

Status: launch hardening after provider-free closed-beta Story Core acceptance, Audio Agent integration, first-party observability, and device-bound installation authorization.

This record captures the deployed production baseline before any deliberate paid Story AI acceptance run or broader beta expansion.

## Production project

- Supabase project: `QISSA` (`phwakdpxxyncyslvnqht`)
- Region: `ap-south-1`
- Project status during latest audit: `ACTIVE_HEALTHY`
- Postgres: 17

## Active Edge Functions

Production functions currently deployed:

- `story-generate` — **v19**, `verify_jwt=true`
- `story-state` — **v6**, `verify_jwt=true`
- `audio-request` — **v4**, `verify_jwt=true`

Story AI remains intentionally disabled for routine launch hardening. Provider TTS also remains disabled. Normal CI and deterministic release validation therefore remain provider-free.

## Device-bound installation authorization

Persisted family state is no longer protected only by possession of the public installation UUID.

The production browser now keeps two separate local values:

1. `installationId` — public installation lookup identity;
2. `installationAuth` — an independent 256-bit device credential.

Only the SHA-256 hash of the device credential is stored in `public.installation_credentials`. The raw credential is not stored in Postgres.

Production authorization behavior:

- `story-state` requires the credential before persisted reads or mutations;
- the first valid persistence flow can bind a credential to a previously unbound installation;
- a wrong credential for an already-bound installation is rejected;
- `audio-request` requires the same credential before loading an owned episode or playback state;
- full profile deletion removes the installation credential as part of the deletion boundary;
- `installation_credentials` has RLS enabled;
- `anon` and `authenticated` have no direct table access;
- trusted Edge Functions use the server-side service role.

The browser-access/RLS boundary is protected by a deterministic CI/deploy gate.

## Latest provider-free production acceptance

After deploying device-bound authorization, a fresh one-shot production acceptance run completed successfully on **2026-09-08**.

GitHub Actions evidence:

- run ID: **34210445632**
- tested application baseline: merge commit `7ac5ad8e1a1b65c1c1f7fc8464ba5daac3e041c1`
- Story AI expected source: `safe-fallback`
- observed fallback reason: `ai-disabled`
- provider TTS remained disabled
- final conclusion: **success**

The one-shot workflow was isolated on a temporary branch and removed from the branch after the run; it was never merged into `main`.

### Story live smoke

Passed:

- RU Cozy Forest — `safe-fallback; ai-disabled`
- UZ Cozy Forest — `safe-fallback; ai-disabled`
- KZ Cozy Forest — `safe-fallback; ai-disabled`
- RU Stars & Space editorial path
- both RU space branches

No paid Story AI provider call was used.

### Audio Agent live smoke

Passed:

- installation credential isolation;
- self-contained persisted fixture;
- safe device fallback while provider TTS is disabled;
- no provider audio asset created;
- remote playback progress save/load.

### Closed-beta production E2E

Matrix:

- languages: RU, UZ
- worlds: Cozy Forest, Magic Garden, Stars & Space
- branches: choice A and choice B
- total scenarios: **12/12 passed**

Each scenario verified:

1. Episode 1 generation;
2. exactly two safe options representing one meaningful child decision;
3. state persistence under the device-bound credential;
4. confirmed choice persistence;
5. choice-specific memory/consequence;
6. Episode 2 continuation;
7. zero additional choice in Episode 2;
8. complete-session 5–10 minute hard duration contract;
9. persisted reload of Episode 2 state;
10. profile deletion;
11. absence of profile story data after deletion;
12. cleanup of the temporary device credential.

Measured full deterministic sessions at the internal **140 WPM** acceptance pace:

- minimum: **859 words / 6.14 minutes**;
- maximum: **966 words / 6.90 minutes**.

The current deterministic beta content therefore sits inside the intended **6–8 minute editorial target**, not merely above the 5-minute hard floor.

### Privacy live smoke

Passed:

- installation credential isolation;
- create;
- load;
- integrated private-audio cleanup boundary;
- irreversible profile deletion;
- confirmed absence after deletion;
- safely idempotent repeated deletion.

## Post-smoke production cleanup

A read-only production database check after the acceptance run returned to the pre-run baseline:

- `installation_credentials`: **0**
- `child_profiles`: **5**
- `story_sessions`: **7**
- `story_episodes`: **13**
- `audio_assets`: **0**
- `playback_progress`: **0**
- `app_events`: **0**

This confirms that the new provider-free acceptance run did not leave temporary family profiles, story rows, playback rows, audio assets, observability events, or installation credentials behind.

The remaining 5 profiles / 7 sessions / 13 episodes are historical development data predating this acceptance run and must not be blindly classified as new smoke residue.

## Bedtime duration policy

The hard product acceptance band remains:

- **minimum: 5 minutes**
- **maximum: 10 minutes**

For deterministic release engineering, QISSA uses **140 words per minute** as the acceptance assumption, producing a hard full-session band of **700–1,400 words** for:

`Episode 1 + confirmed choice resolution + Episode 2`.

The primary editorial target is **6–8 minutes**. Story quality and causal structure take priority over padding.

Every bedtime story should preserve one coherent arc:

`beginning → one understandable problem/goal → build-up → meaningful choice → visible consequence → resolution → calm coda`.

The story must not reach the target by adding an unrelated second problem, repeating exposition, or starting a new adventure after the choice.

## Listening / Audio Agent baseline

The production Listening UI prefers the backend Audio Agent and retains browser/device narration as its safe no-provider fallback.

Current flow:

1. family presses Play;
2. client requests audio from `audio-request` with the installation credential;
3. backend validates device ownership, episode ownership, safety approval, privacy consent and approved voice preset;
4. an existing cached provider asset is returned when available;
5. if provider TTS is unavailable/disabled, the client falls back safely to device/browser narration;
6. playback progress is saved server-side and can be restored;
7. local progress remains an offline safety net;
8. any provider-generated voice must expose the AI-voice disclosure state.

Provider TTS remains **disabled** at this baseline. Therefore production currently proves integration, authorization, cache/fallback behavior and remote resume — not paid provider voice quality.

## First-party story-flow observability

A minimal privacy-scoped event layer is emitted from trusted persistence writes in Postgres rather than from a third-party child analytics SDK.

The database records these operational events for new flows:

- `story_session_started`
- `story_episode_persisted`
- `story_choice_confirmed`
- `story_session_completed`

Payloads are limited to structural metadata. The telemetry contract excludes:

- story text;
- child names;
- custom hero names;
- choice text;
- resolution text;
- free-form user input;
- audio content.

Smoke-created observability rows disappear when the corresponding temporary profile/session is deleted, so `app_events=0` after a fully cleaned acceptance run is expected behavior.

## Deterministic release gates

The release pipeline currently blocks regressions across:

- repository secret hygiene;
- backend contract parity;
- backend access boundary / RLS architecture;
- device-bound installation authorization;
- critical offline/reload synchronization;
- Story Core choice continuity;
- closed-beta public scope;
- closed-beta content matrix;
- 5–10 minute hard bedtime duration;
- 6–8 minute Story AI editorial target contract;
- Story AI cost guard;
- first-party story observability;
- privacy consent and irreversible deletion ordering;
- Listening / Audio Agent client integration;
- Story AI safety contract;
- story copy and localization;
- TypeScript/build health;
- production dependency audit.

## Database access model

Public story tables remain behind RLS with no direct `anon`/`authenticated` table policies.

Browser clients call Edge Functions. Trusted persistence and audio operations use server-side service-role access. The Supabase `RLS Enabled No Policy` advisor notices are therefore expected for this closed-beta architecture and must not be “fixed” by adding permissive browser policies.

The same fail-closed rule applies to `installation_credentials`.

## Storage

- bucket: `story-audio`
- public: `false`
- maximum file size: 25 MiB
- allowed MIME types: `audio/mpeg`, `audio/ogg`, `audio/wav`

No client storage policy is required for the current server-side signed-URL audio design.

## Cost and provider controls

- Story AI: intentionally disabled during routine hardening;
- provider TTS: intentionally disabled;
- Story AI claim limit once enabled: **5 generations/day per installation**;
- normal CI: provider-free;
- normal production release acceptance can be run provider-free;
- paid-capable Story AI acceptance remains deliberate/manual only.

No project-wide global daily Story AI cap is part of the current closed-beta baseline.

## Public closed-beta scope

Automated scope checks continue to constrain the public beta to:

- age 5–7;
- RU and UZ Beta;
- Cozy Forest, Magic Garden and Stars & Space;
- bedtime series;
- one confirmed child decision in Episode 1 followed by Episode 2.

Kazakh and non-beta worlds remain in internal contracts/content infrastructure but are not ordinary public beta selections.

## Current unresolved launch gates

The following remain open before admitting external closed-beta families:

1. **protect the GitHub `main` branch** with mandatory PR/status checks and no ordinary force-push/delete path (tracked in issue #91);
2. deliberate paid Story AI acceptance with `openai-structured` when explicitly approved;
3. provider TTS quality acceptance only if/when provider TTS is deliberately enabled;
4. final browser/mobile UX regression of the deployed Pages build;
5. real-device timed complete bedtime session with natural expressive reading and the child-choice pause included;
6. consent/privacy copy and parent-flow review;
7. manual deletion/recovery UX verification from the actual UI;
8. backup/recovery operating checklist for beta support;
9. local legal/privacy review before broader public launch.

Do not enable additional worlds, age groups, public languages, provider TTS, family voice, payments, or runtime AI images as part of baseline launch hardening.
