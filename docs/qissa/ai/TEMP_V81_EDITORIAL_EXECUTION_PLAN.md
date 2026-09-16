# TEMPORARY EXECUTION PLAN — QISSA editorial v81

**Status: IN PROGRESS / FAMILY-BETA AI NO-GO.** User requested a durable plan across chat limits; DELETE THIS TEMPORARY FILE ONLY AFTER ALL ACCEPTANCE CRITERIA ARE GENUINELY MET and permanent evidence retained, in a reviewed cleanup PR. START EVERY RESUMED CHAT BY READING THIS FILE AND the latest evidence in `docs/qissa/ai/reviews/`. Never falsely mark a failed run as a PASS or automatically repeat paid AI calls.

## Most recent checkpoint: 2026-09-16 (read this first)

- Editorial [PR #186](https://github.com/jteshaboev1984-ops/qissa_app/pull/186) **MERGED**, main SHA `1f59ef09128122ec0ccd430566a8a516be925fbf`; production `story-generate` Edge Function **v82 ACTIVE**, importing exact main SHA; `verify_jwt=true`. Full official editorial [QISSA CI #388](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080950252) and [Story Core #224](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080950253) GREEN on PR head. Prompt guidance and permanent scorecard are deployed; this does not establish literary quality.
- Independent safety [PR #187](https://github.com/jteshaboev1984-ops/qissa_app/pull/187) merged first; 180-second **server-side admission lease** enforced via `runtime-lease.ts`/`usage.ts` before provider. OFF, malformed/missing/future/expired permission denies NEW provider requests; it does not cancel admitted in-flight requests or change the DB Boolean to OFF. Operator must set `enabled=false` explicitly after testing. Runbook: `docs/qissa/ai/10_STORY_AI_RUNTIME_LEASE_RUNBOOK.md`.
- The user authorized exactly **one new UZ age 5–7 Malika cozy_forest bedtime-series E1 and one E2 per branch A/B**, no TTS or escalation. **THIS AUTHORIZED SCOPE IS EXHAUSTED**: 3 provider-eligible generation claims occurred. E1 succeeded (260→357 words, text-length repair). First runner failed only on its own invalid assumption `choice_id=a/b` instead of real `choice_song_circle` / `choice_song_echo`. E1 was reloaded verbatim for literary fields from its authenticated original Actions logs in provider-free preflight. E1 was then persisted independently with both actual branch choices, but BOTH E2 provider requests returned `safe-fallback` with `generation-or-safety-failed`; neither authentic E2 was produced. NO additional paid attempts without **new** user authorization; do not imply that permission to investigate offline authorizes another paid run.
- Detailed permanent evidence: `docs/qissa/ai/reviews/2026-09-16_v81_single_e1_dual_e2_live_attempt.md` (currently in pending evidence PR, merge after checks); real original E1 [run #35083106909](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083106909), provider-free log restoration [run #35083547583](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083547583) GREEN, failed dual-E2 [run #35083675997](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083675997). Production daily claim counter 9→10→12, not exact provider HTTP usage or bill. Distinct branch E1+choice persistence verified. Post-test `child_profiles=0`, `installation_credentials=0` for both synthetic installations, each `load_current=null`, all temporary audit script/workflow deleted and compare audit branch vs main has zero file diff. **Story AI authoritative OFF at 10:13:39.362516 UTC, rechecked OFF at 10:14:14 UTC.**
- Root-cause boundary: fallback is confirmed, but harness failed to capture actual `X-QISSA-Generation-Failure-Class` and `X-QISSA-Generation-Failure-Trace`. Branch B metadata diagnostic 2 provider calls, no narrator-model-used, no repair; A diagnostic 4 calls, narrator Luna, text-length repair. Do not assume a specific Architect, Narrator, Safety or repair cause absent headers/logs. Keep any next work provider-free unless separately authorized. An additional source-evidence limitation: previous run did not log E1's complete raw JSON envelope, only exact title/story/choices/state patch; the persisted envelope was reconstructed for each test installation (literary fields unchanged), so this was not one uninterrupted UI session.

## Expert decisions: ACCEPT
- Real causal scene changes, child-scale attempt/discovery/reaction after setup, while keeping calm bedtime tone without gratuitous danger.
- Fictional hero has a desire/reaction and initiative; never infer personality of real child.
- Resolve explicit setup and local plot promise within the existing TWO-part session; an event promised tomorrow is distinct from today's completed goal.
- Concrete earned humor; fix genuine species/name inconsistency contextually. Incidental nut need not return; explicit necessary missing ribbon must resolve or not be set up.
- A/B have visibly distinct scenes, meaningful consequences and memory; different labels/JSON keys alone cannot qualify them.
- Honest *real-output* editorial scores and evidence, both branches, independent native Uzbek editor and parent/child read-aloud assessment, 2–4 notes. Track initial/final words and repair, do not hard-fail on soft word target. Structural repetition is risk hypothesis, not proven retention data.

## ADAPT or REJECT
- Use existing `central_goal`, `beats`, `resolution_goal` and canon first; no redundant mandatory new `core_problem`, `climax_event`, hero-trait fields or always-paid Quality Agent without evidence.
- Causal events may be relational or discoveries; no hard quota of physical actions. Hero mistake and refrain optional, no compulsory triple refrain. No third episode, mandatory homework or pseudo E2 decision.
- Sentence length diagnostic only for Uzbek, no fixed 8–10 words hard reject, naive abstract-noun regex or broad loanword blacklist. More length does not itself imply quality.
- Keep Safety evaluation separate from literary editorial gate and preserve current privacy, fallback and identity controls.

## P0-A — baseline and independent editorial evidence
- [x] Preserve v79 E1 / v80 selected A E2 logs with versions distinguished; earlier Malika provisional self-review **14/24, ITERATE**, Momentum=0 at `docs/qissa/ai/reviews/2026-09-16_malika_uz_v79-e1_v80-e2_baseline.md`; does not qualify for family beta.
- [x] Permanent human rubric `docs/qissa/ai/09_FAMILY_BETA_EDITORIAL_SCORECARD.md` is 12 criteria scored 0–2, >=20/24 **for each full real session**, no hard fail or required dimension 0. Review evidence template `docs/qissa/ai/reviews/README.md`. Static CI checks rubric and prompt wiring, NOT literary content.
- [x] Record new v81 attempt honestly, including one full real E1 and two fallback E2, missing failure header data, and no session score.
- [ ] Obtain an independent native Uzbek editor and parent/child read-aloud review on **actual complete E1→A/B E2** outputs before family-beta GO. These outputs do not yet exist for v81.

## P0-B — editorial prompt patch
- [x] Add `editorial-guidance.ts` for hero agency, real causal progress, setup/payoff, concrete humor, branch differentiation and no bridge replay/phantom choice.
- [x] Wire prompts in Architect + Narrator `split-openai.ts`, no extra model call, schema, safety or retry change. Wire `check-story-editorial-guidance.mjs` into official CI alongside runtime lease regression.
- [x] PR #186 merged, exact SHA deployed, AI OFF. Official CI #388 and Story Core #224 GREEN on editorial head; actual v81 E1 newly generated, but it needed length repair and full branch continuity remains unqualified.

## P1 — controlled live dual-branch qualification: ATTEMPTED, FAILED, SCOPE EXHAUSTED
- [x] Obtain original user approval for 1 E1+2 E2; short runtime grant, no TTS/escalation. Auth and separate synthetic installations fixed; E1 top-level `state_patch` applied via actual product Memory Agent before per-choice patch. Two distinct E1+choice states persisted/reloaded. Three total requests issued; no retries.
- [x] Return DB AI OFF; check exactly zero test profiles/credentials; remove temporary script and workflow (audit branch zero diff against main). Full links and results retained in permanent evidence file.
- [ ] Investigate the exact E2 fallback failures **without any new provider requests**. Capture in future audit tooling ALL non-secret `X-QISSA-Generation-Failure-Class`, `X-QISSA-Generation-Failure-Trace`, and validation metrics; current trace not stored, so don't invent an exact cause. Improve offline validation of story continuation inputs and real dynamic IDs. Record initial/final text and safe diagnostic metadata if a separately authorized new test occurs.
- [ ] A/B each return actual `openai-structured` E2 rather than safe-fallback, preserve selected-only canon, hero identity, no bridge replay/phantom decision; persist/reload and clean BOTH synthetic branches. Current condition FAILED and must not be marked complete based on the two fallback outputs.
- [ ] Independent editor/parent review of BOTH completed child-visible sessions with >=20/24 each, no hard fail and appropriate Uzbek language. No internal fabricated approval.

## P2 — broader qualification (NOT STARTED; requires separate scope/spend)
- [ ] Approve RU/UZ age/world sample matrix costs explicitly (expert's 20 stories per language-age is unapproved suggestion), monitor structure repetition over long series and genuine memory payoff.
- [ ] Evaluate natural Uzbek read-aloud/sentence diagnostics with native reviewers; no arbitrary hard grammar regex. Add schema/structure signature or paid Quality Agent only after measured evidence and cost case.

## Final release gate AND deletion rule
- [ ] Main and exact production version match; official CI/Story Core GREEN; temp workflows/helpers removed; independent AI lease and explicit OFF verified; positive launch emergency limits considered separately from development accounting-only mode.
- [ ] Same-E1 real A/B complete technical acceptance, consent, safety, identity, two choices, branch-canon, persistence and cleanup; both independent literary reviews >=20/24 and no hard fail; specify untested combinations as unqualified.
- [ ] Permanent logs/reviews/release GO evidence saved and reviewed. Only once **all** complete, delete this TEMP plan in a reviewed cleanup PR; keep permanent rubric, checks and evidence.

## Execution log (append on each meaningful step)
- 2026-09-16: baseline E1/A E2 review 14/24 provisional; PR #186 editorial guidance work CI GREEN. PR #187 lease fix merged, Edge v81 deployed OFF; CI #385 and Story Core #221 GREEN.
- 2026-09-16: editorial PR #186 merged after CI #388 / Story Core #224 GREEN; deployed main `1f59ef09128122ec0ccd430566a8a516be925fbf` as Edge v82 with AI OFF.
- 2026-09-16: new live E1 #35083106909 valid provider story, harness choice ID bug stopped before persistence. Provider-free E1 restoration #35083547583 GREEN. Continuation #35083675997 persisted both E1 choices but BOTH E2 returned safe-fallback. Exactly three paid-eligible generation claims total; no more user-authorized paid calls. AI OFF, synthetic profiles/credentials removed, temporary script/workflow deleted. Editorial release remains NO-GO. Pending evidence PR to merge the permanent record and this checkpoint.
