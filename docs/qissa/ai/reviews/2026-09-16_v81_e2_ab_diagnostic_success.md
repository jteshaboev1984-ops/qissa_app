# v81: one recovered authentic E1, two separate genuine E2 diagnostic successes

**Date:** 2026-09-16 UTC. **Verdict:** provider generation A/B diagnostic SUCCESS; full product end-to-end and independent editorial acceptance **NOT QUALIFIED / AI family beta NO-GO**. This is distinct from the earlier 2026-09-16 failed A/B attempt. No suggestion that earlier failed output somehow succeeded or was retroactively repaired.

## Source and careful limits

- Production `story-generate` Edge Function **v82**, ACTIVE, `verify_jwt=true`, importing exact story source SHA `1f59ef09128122ec0ccd430566a8a516be925fbf`. Repository main before this audit was `06b8e462c561da21a33ef3938620661a42592edd` (latter commits were docs/offline tests only). No production deployment, schema/secret changes, TTS or escalation during these probes.
- Original genuine E1: [run 35083106909 / job 104751515156](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083106909), title `Tikan uchun quvnoq qo‘shiq`, 357 words, two authentic choices `choice_song_circle` and `choice_song_echo`. Only authenticated exact E1 literary fields and patch from its previously logged source were used; full original HTTP response envelope was **not captured in that old run**, and the offline memory fixture reconstructed a minimal envelope. This is NOT one uninterrupted original client session and the original E1 was NOT regenerated or paid for again.
- The audit took an economical two-step approach: first one E2(A) provider-eligible request, then one E2(B) after reviewing A. Explicit separate 180-second admission windows; each closed by authoritative SQL setting `story_ai_enabled=false` after claim admission. There is **no automatic retry at audit-runner level**. Internal Story Agent repair may make extra HTTP calls. Preflight was provider-free.
- E2(A) [run 35089384717 / job 104771806143](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089384717), completed success. E2(B) [run 35089754120 / job 104773016151](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089754120), completed success. Both full child-visible E2 prose and state patches are in these GitHub job logs, along with safe allowlisted complete response diagnostics. Preflight A [run 35089264517](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089264517) and preflight B [run 35089635976](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089635976) GREEN without provider requests.

## Exact measured results

| Measurement | E2 A: `choice_song_circle` | E2 B: `choice_song_echo` |
|---|---|---|
| `X-QISSA-Generation-Source` | `openai-structured` | `openai-structured` |
| HTTP | 200 | 200 |
| Safety approved | true | true |
| Model | Luna Architect/Narrator/Safety | Luna Architect/Narrator/Safety |
| Initial story words | 346 | 296 |
| Final story words | **376** | **360** |
| `generation-repair` | `text-length` | `text-length` |
| `repair-retry-used` | false | true |
| Reported `provider-calls` | 4 | 5 |
| Escalation | false | false |
| E2 structured choices | 0 | 0 |
| Hero identity | Malika visible; no `{{HERO}}` leak | Malika visible; no `{{HERO}}` leak |
| E2 series identifier | matched its own isolated state | matched its own isolated state |

Both E2 accepted the hard minimum of 355 words but **both undershot the 430–490 soft target** (A by 54, B by 70 against target minimum). Do not treat their GREEN status as literary success. Diagnostic `provider-calls` is **neither a complete number of HTTP calls nor a bill**; actual cost and remaining provider balance could not be verified from this connector. Global production generation claims for 2026-09-16 changed **12 → 13 → 14**; exactly two new provider-eligible generation admissions were used. No new E1 calls.

## Literary assessment: internal observations ONLY, no independent score

- A develops a turn-taking song, funny misheard lyric and small song-sharing moment, then a calm forest coda. It repeatedly returns to the same singing mechanics; Malika provides a solution but still has little emotional agency. Natural Uzbek requires revision, e.g. `Tikaning` and `qo‘shiqka` appear. The apparent local goal is completed.
- B develops animal-sound play and Tikan's name as a refrain, then closes gently. However its *confirmed branch* was an echo/call-and-response game, while its new central action says `bir-birimizni kutmay, birga aytamiz` (sing together without waiting). This undercuts the difference from A's turn-taking rather than clearly continuing the echo method. B also repeats song mechanics and contains `qo‘shiqka` and `Tikaning` forms that warrant Uzbek editorial correction.
- B `state_patch.last_event` ends `... quvonch`, and `hero_trait` ends `... qo‘shishga`, leaving unfinished semantic fragments in durable memory. This is a concrete quality defect despite passing current schema validation; do not store it as evidence of good durable memory phrasing. A state patch is more coherent.
- Differences in sound effects and immediate scenes exist, so the strings are not identical, but that alone is insufficient to establish meaningful A/B narrative divergence. A native Uzbek editor and parent/child read-aloud assessment have NOT occurred; do not fabricate rubric scores or release PASS.

## What this does and does not establish

Established: The same previously authenticated E1 can feed independently normalized selected-only A and B memory to v82 and, in this later attempt, return genuine valid `openai-structured` E2 for both. Thus there is no demonstrated deterministic blocker in these specific E2 inputs. The **exact causes of the earlier two `safe-fallback` responses remain UNKNOWN** because their historical Failure-Class/Trace headers were not captured. A later success is not a retrospective diagnosis.

Not established: continuity through an uninterrupted browser client, complete original E1 response envelope, production `story-state` persistence/reload of these two newly generated E2, independently evaluated literary quality >=20/24 on both child-facing sessions, broader age/world/language or 10-session stability. The new diagnostic deliberately made no `story-state` calls and created **no synthetic child profile or installation credential**. It did create normal anonymous per-installation generation accounting through the two UUIDs; no manual production data cleanup was attempted. Historical old test profiles were previously deleted.

## Cleanup / guard

- Runtime AI OFF confirmed at **11:21:38 UTC**, updated OFF at **11:20:39.338162 UTC**; later read-only verification at **11:24:10 UTC** also OFF with global claims **14**. 180-second lease was active throughout and blocks new admissions after expiry; it does not interrupt in-flight jobs or independently flip the Boolean.
- Temporary workflow, A/B runner scripts and push trigger were deleted from `audit/v81-diagnose-one-e2-20260916`; comparison against base main `06b8e462c561da21a33ef3938620661a42592edd` returned **files=[]**. No live paid trigger remains in audit branch; GitHub historical run logs remain evidence.
- **Next action should be provider-free:** target the specific semantic A/B method drift, weak hero agency, Uzbek proofreading and incomplete memory phrasing without adding paid Quality Agent or hardcoded language blacklists. Test regression/CI and deploy only from a reviewed GREEN PR with AI OFF. Any future live attempt needs a deliberate scope and cost check; do not start a broad matrix just because user allowed reasonable spending.
