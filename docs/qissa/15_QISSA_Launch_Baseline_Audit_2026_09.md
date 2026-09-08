# QISSA Launch Baseline Audit — September 2026

Status: launch hardening after closed-beta Story Core acceptance, Audio Agent client integration, and first-party story-flow observability.

This record captures the deployed production baseline before any deliberate paid Story AI acceptance run or broader beta expansion.

## Production project

- Supabase project: `QISSA` (`phwakdpxxyncyslvnqht`)
- Region: `ap-south-1`
- Project status during latest audit: `ACTIVE_HEALTHY`
- Postgres: 17

## Active Edge Functions

Production functions currently deployed:

- `story-generate` — **v18**, `verify_jwt=true`
- `story-state` — **v5**, `verify_jwt=true`
- `audio-request` — **v2**, `verify_jwt=true`

Story AI remains intentionally disabled for routine launch hardening. Provider TTS also remains disabled. Normal CI and deterministic release validation therefore remain provider-free.

## Closed-beta Story Core acceptance

A provider-free production E2E acceptance run completed successfully on 2026-09-07.

Matrix:

- languages: RU, UZ
- worlds: Cozy Forest, Magic Garden, Stars & Space
- branches: choice A and choice B
- total scenarios: **12/12 passed**

Each scenario verified:

1. Episode 1 generation
2. exactly two safe options representing one meaningful child decision
3. state persistence
4. confirmed choice persistence
5. choice-specific memory/consequence
6. Episode 2 continuation
7. zero additional choice in Episode 2
8. complete-session 5–10 minute hard duration contract
9. persisted reload of Episode 2 state
10. profile deletion
11. absence of profile story data after deletion

The run used `safe-fallback`, so it did not invoke a paid Story AI provider.

Measured deterministic fallback sessions at the internal 140 WPM acceptance pace remain approximately **5.06–5.60 minutes** across the 12 accepted RU/UZ branches. These fall inside the hard release envelope but sit near its lower edge.

## Bedtime duration policy

The hard product acceptance band remains:

- **minimum: 5 minutes**
- **maximum: 10 minutes**

For deterministic release engineering, QISSA uses **140 words per minute** as the acceptance assumption, producing a hard full-session band of **700–1,400 words** for:

`Episode 1 + confirmed choice resolution + Episode 2`.

For Story AI generation, the primary editorial target has now been raised to **6–8 minutes**, approximately **840–1,080 words** at the same internal acceptance pace.

This is intentionally a target rather than a new hard boundary. Story quality and causal structure take priority over padding. Generated bedtime stories must follow one coherent arc:

`beginning → one understandable problem/goal → build-up → meaningful choice → visible consequence → resolution → calm coda`.

The model is explicitly instructed not to reach the target by adding unrelated problems, repeating exposition, or inventing a second adventure after the choice.

## Listening / Audio Agent baseline

The production Listening UI now prefers the backend Audio Agent instead of treating browser `speechSynthesis` as the primary path.

Current flow:

1. family presses Play;
2. client requests audio from `audio-request`;
3. backend validates ownership, safety approval, privacy consent and approved voice preset;
4. an existing cached provider asset is returned when available;
5. if provider TTS is unavailable/disabled, the client falls back safely to device/browser narration;
6. playback progress is saved server-side and can be restored;
7. local progress remains an offline safety net;
8. any provider-generated voice must expose the AI-voice disclosure state.

Production Pages is explicitly built with `VITE_QISSA_AUDIO_ENDPOINT` pointing to the deployed Audio Agent.

Provider TTS remains **disabled** at this baseline. Therefore the current production contract proves cache-first integration and safe device fallback, not paid provider voice quality.

## First-party story-flow observability

A minimal privacy-scoped event layer was added on 2026-09-08. It is emitted from trusted persistence writes in Postgres rather than from a third-party child analytics SDK.

The database now records these operational events for new flows:

- `story_session_started`
- `story_episode_persisted`
- `story_choice_confirmed`
- `story_session_completed`

Payloads are intentionally limited to structural metadata such as language, style pack, episode number, story mode/mood, safety status and selected internal choice id.

The telemetry contract explicitly excludes:

- story text
- child names
- custom hero names
- choice text
- resolution text
- free-form user input
- audio content

The event layer is protected by a deterministic CI/deploy guard and does not change the existing RLS/browser-access boundary.

Immediately after migration, `app_events` remains empty until a new story flow occurs; existing historical rows were not backfilled.

## Deterministic release gates

The release pipeline currently blocks regressions across:

- backend contract parity
- backend access boundary / RLS architecture
- Story Core choice continuity
- closed-beta public scope
- closed-beta content matrix
- 5–10 minute hard bedtime duration
- 6–8 minute Story AI editorial target contract
- Story AI cost guard
- first-party story observability
- privacy consent and irreversible deletion ordering
- Listening / Audio Agent client integration
- Story AI safety contract
- story copy and localization
- TypeScript/build health

## Database access model

The current architecture intentionally keeps public story tables behind RLS with no direct `anon`/`authenticated` table policies.

Browser clients call Edge Functions. Trusted persistence and audio operations use server-side service-role access. The existing `RLS Enabled No Policy` advisor notices are therefore accepted for this closed-beta architecture and should not be “fixed” by adding permissive browser policies.

## Storage

- bucket: `story-audio`
- public: `false`
- maximum file size: 25 MiB
- allowed MIME types: `audio/mpeg`, `audio/ogg`, `audio/wav`

No client storage policy is required for the current server-side signed-URL audio design.

## Cost and provider controls

- Story AI: intentionally disabled during routine hardening
- provider TTS: intentionally disabled
- Story AI claim limit once enabled: **5 generations/day per installation**
- normal CI: provider-free
- paid-capable Story smoke: manual-only
- provider audio smoke: manual-only

No project-wide global daily Story AI cap is part of the current closed-beta baseline.

## Public closed-beta scope

Automated scope checks continue to constrain the public beta to:

- age 5–7
- RU and UZ Beta
- Cozy Forest, Magic Garden and Stars & Space
- bedtime series
- one confirmed child decision in Episode 1 followed by Episode 2

Kazakh and non-beta worlds remain in internal contracts/content infrastructure but are not ordinary public beta selections.

## Current unresolved launch gates

The following items are still not considered proven until fresh manual production validation is returned:

1. current deployed Story live smoke against the latest production function;
2. current deployed Audio Agent live smoke, including fallback and server progress restoration;
3. deliberate paid Story AI acceptance run with `openai-structured` when explicitly approved;
4. provider TTS quality acceptance if/when TTS is deliberately enabled;
5. final browser/mobile UX regression of the deployed Pages build;
6. real-device timed complete bedtime session;
7. consent/privacy copy and parent-flow review;
8. manual deletion/recovery UX verification from the actual UI;
9. local legal/privacy review before public launch.

Do not enable additional worlds, age groups, public languages, provider TTS, family voice, payments, or runtime AI images as part of baseline launch hardening.
