# QISSA Closed-Beta Provider-Free Acceptance Evidence — 2026-09-08

## Scope

This evidence records the manual production acceptance pass executed against GitHub `main` at commit:

`af39430ad82bfd13595d7afe06c340a237bfdbd1`

Production Supabase project: `phwakdpxxyncyslvnqht`.

At the time of the pass:

- `story-generate` was ACTIVE v19 with JWT verification enabled.
- `story-state` was ACTIVE v5 with JWT verification enabled.
- `audio-request` was ACTIVE v3 with JWT verification enabled.
- Story AI remained disabled.
- Provider TTS remained disabled.
- No paid Story AI or provider TTS acceptance call was part of this pass.

## Manual live gates

### 1. Story live smoke — PASS

GitHub Actions run: `34188586048`

Result:

- expected generation source: `safe-fallback`
- RU Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- UZ Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- KZ Cozy Forest: PASS (`safe-fallback`, `ai-disabled`)
- RU Stars & Space editorial Episode 1 + both branch checks: PASS
- overall: `Live story-generate smoke passed for RU/UZ/KZ cozy stories and both RU space branches.`

This proves the deployed Story endpoint remains provider-free when AI is disabled and returns the expected safe fallback contract.

### 2. Audio live smoke — PASS

GitHub Actions run: `34188641312`

Result:

- self-contained production fixture: PASS
- safe device fallback: PASS
- provider asset creation: NONE
- remote playback progress save: PASS
- remote playback progress load/resume: PASS
- cleanup: PASS

Log summary: `Live Audio Agent smoke passed: self-contained fixture, safe device fallback, no provider asset, remote progress save/load passed.`

### 3. Closed Beta production E2E — PASS 12/12

GitHub Actions run: `34188699941`

Provider-free preflight: `ai-disabled`.

| Language | World | Branch | Words | Minutes @ 140 WPM |
| --- | --- | --- | ---: | ---: |
| RU | Cozy Forest | A | 872 | 6.23 |
| RU | Cozy Forest | B | 859 | 6.14 |
| RU | Magic Garden | A | 966 | 6.90 |
| RU | Magic Garden | B | 951 | 6.79 |
| RU | Stars & Space | A | 898 | 6.41 |
| RU | Stars & Space | B | 894 | 6.39 |
| UZ | Cozy Forest | A | 896 | 6.40 |
| UZ | Cozy Forest | B | 902 | 6.44 |
| UZ | Magic Garden | A | 906 | 6.47 |
| UZ | Magic Garden | B | 908 | 6.49 |
| UZ | Stars & Space | A | 874 | 6.24 |
| UZ | Stars & Space | B | 873 | 6.24 |

Observed closed-beta range:

- 859–966 words
- 6.14–6.90 minutes at the 140 WPM acceptance pace

The E2E verified the production path through Episode 1, meaningful choice, persisted state, branch-specific Episode 2, closed bedtime ending, reload, and cleanup. All 12 scenarios stayed provider-free and inside the 5–10 minute hard release envelope while also meeting the preferred 6–8 minute editorial target.

### 4. Privacy live smoke — PASS

GitHub Actions run: `34188854291`

Result:

- integrated audio cleanup: PASS
- create: PASS
- load: PASS
- delete: PASS
- confirmed absence after delete: PASS
- repeat delete / idempotency: PASS

Log summary: `Live privacy smoke passed: integrated audio cleanup, create, load, delete, absence, repeat delete.`

## Post-run cleanup audit

Read-only Supabase audit after all four workflows:

- `child_profiles`: 5
- `story_sessions`: 7
- `story_episodes`: 13
- `story_choice_events`: 6
- `app_events`: 0
- `audio_assets`: 0
- `playback_progress`: 0
- `storage.objects`: 0
- legacy `client_session_id LIKE 'series-%'`: 7
- profiles created in the preceding 10 minutes: 0
- sessions created in the preceding 10 minutes: 0
- episodes created in the preceding 10 minutes: 0
- audio assets created in the preceding 10 minutes: 0
- playback rows updated in the preceding 10 minutes: 0

The counts returned to the pre-smoke baseline, so the manual acceptance run left no new smoke fixtures behind.

The seven `series-*` sessions are older June/July development records and are not residue from this acceptance run.

## Story observability contract

Four production DB triggers are installed and enabled:

- `story_session_started`
- `story_episode_persisted`
- `story_choice_confirmed`
- `story_session_completed`

The production trigger functions write metadata-only payloads:

- `story_session_started`: `story_mode`, `story_mood`, `style_pack_id`, `status`
- `story_episode_persisted`: `episode_no`, `language`, `mood`, `style_pack_id`, `generation_source`, `safety_status`
- `story_choice_confirmed`: `episode_id`, `choice_id`
- `story_session_completed`: `story_mode`, `story_mood`, `style_pack_id`, `current_episode_no`

They do not place story text, hero/custom child name, choice text, resolution text, free-form input, or audio content inside `event_payload`.

`app_events = 0` after the acceptance run is expected because the smoke fixtures are deleted and the profile-deletion privacy boundary removes the associated profile/session/installation-scoped events. Successful story writes while the enabled triggers were active also provide an execution-path check: a trigger failure would have failed the underlying write transaction.

## Remaining acceptance gap

Real Story AI (`X-QISSA-Generation-Source: openai-structured`) is **NOT TESTED** in this evidence set.

Do not treat provider-free acceptance as proof of real-model story quality, real-model safety behavior, token usage, latency, retry behavior, or cost. A deliberately bounded paid acceptance pass is still required before enabling Story AI for closed-beta families.

Provider TTS is also intentionally not enabled here. Current closed-beta baseline remains server Audio Agent first with safe device narration fallback and no paid provider audio generation.

## Toolchain note

`npm ci` currently reports vulnerabilities in the full dependency tree. The release pipeline separately runs `npm run audit:prod` (`npm audit --omit=dev --audit-level=high`) and the production dependency gate passes. Treat the remaining development/build-tool findings as hardening work, not as evidence of a production React runtime vulnerability.
