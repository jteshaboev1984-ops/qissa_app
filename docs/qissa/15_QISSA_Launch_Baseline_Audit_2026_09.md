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

Production functions confirmed active after the bedtime-duration hardening deployment:

- `story-generate` — **v16**, `verify_jwt=true`
- `story-state` — v5, `verify_jwt=true`
- `audio-request` — v1, `verify_jwt=true`

`story-generate` v16 contains the accepted 5–10 minute closed-beta Story Core expansion. Story AI remains intentionally disabled for normal launch hardening.

## Closed-beta production acceptance

A fresh provider-free production E2E run completed successfully on 2026-09-07 after deployment of `story-generate` v16.

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
8. complete-session 5–10 minute duration contract
9. persisted reload of Episode 2 state
10. profile deletion
11. absence of profile data after deletion

The preflight and all scenarios confirmed `safe-fallback` with Story AI disabled, so the acceptance run did not invoke a paid story provider.

Production E2E measurements at the 140 WPM release-acceptance pace:

- RU Cozy Forest A: 731 words · 5.22 min
- RU Cozy Forest B: 709 words · 5.06 min
- RU Magic Garden A: 784 words · 5.60 min
- RU Magic Garden B: 783 words · 5.59 min
- RU Stars & Space A: 730 words · 5.21 min
- RU Stars & Space B: 726 words · 5.19 min
- UZ Cozy Forest A: 708 words · 5.06 min
- UZ Cozy Forest B: 721 words · 5.15 min
- UZ Magic Garden A: 756 words · 5.40 min
- UZ Magic Garden B: 768 words · 5.49 min
- UZ Stars & Space A: 709 words · 5.06 min
- UZ Stars & Space B: 708 words · 5.06 min

After the run, database row counts returned exactly to the pre-smoke baseline, confirming that temporary E2E profiles/sessions were deleted successfully. The temporary push trigger used for the one-shot acceptance run was removed immediately afterwards; the persistent E2E workflow is manual-only again.

## Deterministic release gates

The release build includes a deterministic closed-beta content matrix check covering the same public matrix:

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

### 5–10 minute bedtime duration contract

The full child-facing bedtime session is an explicit release requirement: **5–10 minutes at a normal expressive bedtime-reading pace**.

For deterministic release engineering QISSA uses **140 words per minute** as the acceptance pace. This is an internal product acceptance assumption for expressive read-aloud, not a claim that every adult reads at exactly that speed. The resulting hard content band is:

- minimum: **700 words** = 5 minutes at 140 WPM;
- maximum: **1,400 words** = 10 minutes at 140 WPM.

The measured session includes the text the family actually experiences in the core flow:

`Episode 1 + confirmed choice resolution + Episode 2`.

The complete 12-branch RU/UZ closed-beta matrix now measures **708–784 words**. At the 140 WPM acceptance pace this equals approximately **5.06–5.60 minutes** of spoken story text. At a calmer 125 WPM pace the same sessions measure approximately **5.66–6.27 minutes**.

Current minimum Episode 1 length is **396 words** and minimum Episode 2 length remains **219 words**. The duration gate is blocking in both pull-request CI and the GitHub Pages release workflow, so a future change cannot shorten or lengthen any public beta branch outside the 700–1,400 word band without failing release validation.

The live production E2E smoke now independently checks the same 700–1,400 word contract against the deployed Edge Function, so duration is protected at both deterministic source-test and deployed-production levels.

A manual real-device timed read remains part of final UX regression because human pauses, interaction time and individual delivery vary; however, word count is no longer merely informational — the 5–10 minute requirement is both release-gated and production-proven.

The release build also includes dedicated guards for:

- backend contract parity;
- backend access boundary / RLS architecture;
- Story Core continuity;
- closed-beta public scope;
- 5–10 minute bedtime duration;
- Story AI cost guard;
- privacy consent and irreversible deletion ordering;
- listening playback contract;
- Story AI safety contract;
- story copy and localization, including the duration expansion copy;
- TypeScript/build health.

## Current data baseline

Exact row counts rechecked after the post-v16 production E2E cleanup:

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

These counts match the pre-smoke baseline. Existing rows were not modified or deleted by this acceptance run.

## Database access model

The current architecture intentionally keeps the public story tables behind RLS with no `anon`/`authenticated` policies. This matches the persistence design: browser clients call Edge Functions, while trusted persistence operations use the server-side service role.

The latest production security advisor reports only `RLS Enabled No Policy` INFO notices for the protected public tables. For the current closed-beta architecture this is an **accepted intentional state**, not a missing client-access policy. Adding permissive policies merely to remove the INFO notices would weaken the current security boundary.

The repository has an automated backend-access gate that prevents routine changes from silently adding direct browser table access, permissive public RLS policies, or removing the service-role boundary.

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

## Parent and language-flow hardening

Two additional user-flow inconsistencies were corrected during launch hardening:

1. The Parent Center previously implied that families could change world, format and mood for a new closed-beta story. In the actual beta contract only the world is selectable; series format and bedtime mode are fixed. RU/UZ/KZ copy now reflects the real product behavior, and the beta-scope gate blocks the old claim from returning.
2. The global language selector could previously change UI language while an already configured story still retained a different persisted story language. Language selection is now interactive only on Welcome/setup screens. Home, Library, Parent and Story show the active story language as a non-editable badge. Cancelling edit/new-story setup restores the existing story language and returns Home, preventing a cancelled language experiment from changing the active story session.

Both changes passed the full release build and GitHub Pages deployment gates.

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

The Story Core backend/persistence slice, content matrix and 5–10 minute duration requirement are now technically proven in both source validation and production E2E. Remaining work should focus on release readiness rather than feature expansion:

1. final browser/mobile UX regression of the deployed Pages build, including a real-device timed complete bedtime session;
2. consent/privacy copy and real parent-flow review;
3. manual deletion/recovery UX verification from the actual UI;
4. first deliberate paid Story AI acceptance decision and run when approved;
5. local legal/privacy review before public launch.

Do not enable additional worlds, age groups, public languages, provider TTS, family voice, payments, or runtime AI images as part of this baseline hardening step.
