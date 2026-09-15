# QISSA Provider-Free Production Acceptance Evidence — 2026-09-15

## Scope

This evidence records the final provider-free production acceptance pass executed against GitHub `main` at commit:

`240eb40a35c9559806f590d73d1361da833f415a`

Production Supabase project: `phwakdpxxyncyslvnqht`.

Final deployed Story functions after the pass:

- `story-generate`: ACTIVE v48, `verify_jwt=true`, pinned to exact current `main` SHA `240eb40a35c9559806f590d73d1361da833f415a`.
- `story-state`: ACTIVE v11, `verify_jwt=true`, pinned to exact current `main` SHA `240eb40a35c9559806f590d73d1361da833f415a`.
- Story AI production rollout gate is code-disabled: `STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false`.
- Provider TTS remains disabled.

No paid Story AI or provider TTS call was part of the final acceptance run.

## Production hardening completed before the final pass

### Durable multi-session series

Migration `000016` was applied and verified in production before the final acceptance pass.

- existing story-session rows were preserved;
- existing sessions were backfilled into a stable series identity;
- series session index is constrained to the supported `1..10` range;
- supporting series indexes are present;
- the product can continue a series across sessions while enforcing the ten-session upper bound.

### Story generation source persistence

The exact episode generation path is preserved in `domain_payload.generationSource`.

The legacy operational database column `story_episodes.generation_source` remains inside its existing schema contract and stores `edge_story_agent` for remote Story Edge persistence. This avoids widening the production database constraint merely to duplicate the richer domain payload metadata.

### Story AI fail-closed rollout gate

A pre-final live smoke exposed that the previous runtime could enter the `openai-structured` path when a provider key was configured and the enable flag was not explicitly false.

The production response was hardened immediately:

- provider execution now requires a code-reviewed rollout gate;
- `STORY_AI_PRODUCTION_ROLLOUT_ENABLED` is currently `false` in both Story AI entrypoints;
- environment drift alone cannot enable paid Story AI;
- the normal production split pipeline was restored only after the hard gate was merged and validated.

## Final provider-free acceptance — PASS

GitHub Actions run: `34930895901`

Exact checked-out application SHA:

`240eb40a35c9559806f590d73d1361da833f415a`

### 1. Live Story smoke — PASS

Observed:

- RU Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- UZ Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- KZ Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- RU Stars & Space Episode 1 + both branch checks: PASS (`safe-fallback`)
- response body source stamp: PASS (`episode.generationSource = safe-fallback`)

The deployed Story endpoint therefore remained provider-free throughout the final acceptance pass.

### 2. Closed Beta production E2E — PASS 12/12

Provider-free preflight: `ai-disabled`.

| Language | World | Branch | Words | Minutes @ 140 WPM |
| --- | --- | --- | ---: | ---: |
| RU | Cozy Forest | A | 854 | 6.10 |
| RU | Cozy Forest | B | 844 | 6.03 |
| RU | Magic Garden | A | 880 | 6.29 |
| RU | Magic Garden | B | 866 | 6.19 |
| RU | Stars & Space | A | 857 | 6.12 |
| RU | Stars & Space | B | 874 | 6.24 |
| UZ | Cozy Forest | A | 862 | 6.16 |
| UZ | Cozy Forest | B | 846 | 6.04 |
| UZ | Magic Garden | A | 867 | 6.19 |
| UZ | Magic Garden | B | 867 | 6.19 |
| UZ | Stars & Space | A | 841 | 6.01 |
| UZ | Stars & Space | B | 846 | 6.04 |

Overall result:

`Closed-beta production E2E passed: 12/12 scenarios, all provider-free, within the 5–10 minute bedtime duration contract, and deleted after verification.`

The matrix exercised Episode 1, choice persistence, branch-specific Episode 2, reload, generation-source persistence and deletion through the production Story endpoints.

### 3. Privacy live smoke — PASS

Result:

- installation-auth isolation: PASS
- integrated audio cleanup: PASS
- create: PASS
- load: PASS
- delete: PASS
- confirmed absence after delete: PASS
- repeat delete: PASS

Log summary:

`Live privacy smoke passed: installation auth isolation, integrated audio cleanup, create, load, delete, absence, repeat delete.`

### 4. Audio live smoke — PASS

Result:

- installation-auth isolation: PASS
- self-contained fixture: PASS
- safe device fallback: PASS
- provider asset creation: NONE
- remote playback progress save/load: PASS

Log summary:

`Live Audio Agent smoke passed: installation auth isolation, self-contained fixture, safe device fallback, no provider asset, remote progress save/load passed.`

## Final Story repin smoke — PASS

After `story-generate` was repinned from the immediately preceding hard-gated main commit to the exact final `main` SHA, a final Story-only smoke was run.

GitHub Actions run: `34931260626`

Result: PASS with expected source `safe-fallback`.

This final repin did not change Story code; it only aligned both production Story Edge Functions to the same exact repository baseline.

## Production data audit

Immediately after the final acceptance pass, production counts were:

- `child_profiles`: 11
- `story_sessions`: 13
- `story_episodes`: 22
- `story_choices`: 24
- `story_choice_events`: 10
- `installation_credentials`: 6
- `audio_assets`: 0
- `playback_progress`: 2

The final 12-scenario E2E, privacy smoke and audio smoke cleaned their own fixtures successfully.

### Known pre-final smoke residue

One earlier failed E2E attempt, before the persistence fix, created a profile/session/installation credential before `story_episodes` rejected the incompatible generation-source value. Its cleanup guard had not yet been armed at that early failure point.

A read-only production audit confirms exactly one profile created in that failed-run window with a session and no episode.

This known orphan fixture has **not** been removed with manual production SQL. It must be removed only through an explicitly approved safe cleanup path. The E2E cleanup logic has been corrected so future partial sync failures arm cleanup before persistence begins.

## What this evidence proves

The current closed-beta backend baseline is technically green for provider-free operation:

- Story generation fallback contract works in RU/UZ/KZ;
- branch-specific continuation works;
- story persistence and reload work;
- durable series metadata works;
- privacy deletion works;
- installation authentication isolation works;
- audio device fallback works;
- no provider TTS asset is created;
- Story AI cannot be activated by environment drift because the production rollout gate is code-disabled.

## Remaining gates

### Real Story AI / GPT-5.6 Luna

Real Story AI remains intentionally OFF.

Issue `#116` remains open until deliberately bounded real-provider samples are generated and human-reviewed against the production editorial, continuity, safety, localization, latency and cost contract.

Provider-free acceptance is not proof that GPT-5.6 Luna output itself has passed production acceptance.

### Backup / recovery

Issue `#95` remains open. The production project is on the Supabase Free plan and still requires a private, tested recovery path before external-family launch under the current release contract.

### Physical iPhone/Safari

Issue `#101` remains open for the deferred physical iPhone/Safari acceptance leg. Android/Chrome physical acceptance and natural aloud timing have already been completed, but the current documented release gate still calls for the iPhone/Safari physical check.

### Legal/privacy human review

Technical privacy/deletion controls are green. Final local legal/privacy review remains a human compliance gate before broader external-family rollout.
