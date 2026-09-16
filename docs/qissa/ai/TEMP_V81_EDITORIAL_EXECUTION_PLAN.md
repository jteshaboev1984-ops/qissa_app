# TEMPORARY EXECUTION PLAN — QISSA editorial v81

**Status: IN PROGRESS — NOT FAMILY-BETA GO.** Created 2026-09-16. User asked for a persistent plan across chat limits and deletion **only after every acceptance criterion is genuinely met**. START ANY RESUMED CHAT BY READING THIS FILE. Update status with exact evidence. Keep permanent editorial rubric, reviews and regression scripts; delete this temporary file later in a reviewed cleanup PR, NEVER while the plan remains unfinished.

## Current checkpoint — 2026-09-16
- Editorial work branch: `work/editorial-quality-v81-plan`, draft PR [#186](https://github.com/jteshaboev1984-ops/qissa_app/pull/186). Merged protective main into this branch with commit `d43798c859aac48133803888a2956b09a7eaca3e`; review shows exactly 7 editorial files versus main, both CI checks wired. Official [QISSA CI #386](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080515440) GREEN and [Story Core #222](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080515441) GREEN on this merge commit. This PLAN UPDATE creates a newer head: reverify checks on final head, not the old commit.
- Independent safety prerequisite [PR #187](https://github.com/jteshaboev1984-ops/qissa_app/pull/187) merged after [QISSA CI #385](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080044950) GREEN and [Story Core #221](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35080044831) GREEN. Current `main` SHA `cb483ddfc7e76dc368d825f8987a47a1e3d38396`; production `story-generate` Edge Function version **81 ACTIVE**, exact SHA import verified. Runtime `story_ai_enabled=false` verified after deployment. No paid provider requests in this safety/editorial work. Editorial PR #186 is NOT merged or deployed.
- New fail-closed provider admission lease: `runtime-lease.ts` denies new AI requests 180 seconds after `qissa_runtime_flags.updated_at` (future timestamp >30s, invalid/missing timestamp, expired lease all deny). Both entrypoints check through `usage.ts` before accounting/provider. Operator MUST set `updated_at=clock_timestamp()` when granting short ON window, MUST reset Boolean OFF in `finally`; expiry does NOT abort in-flight requests or physically clear stored enabled Boolean. Full runbook `docs/qissa/ai/10_STORY_AI_RUNTIME_LEASE_RUNBOOK.md`. Tests passed in CI; no paid end-to-end lease expiration test has occurred.

## Baseline / nonnegotiable interpretation
- v80 merge `c96d2e9bbf5191bdb91e5fbbb98e572f923c9c38`; v79 E1 and both choice cards/bridges from workflow run `35061371574`: E1 255→357 words after repair, workflow later failed `installationAuth` (not story). v80 selected-A E2 continuation run `35062412722`: E2 280→367 words after repair, technical GREEN. E1 was reused across builds, not a single-build complete E1→A/B E2 test. B has NO real E2.
- Permanent `09_FAMILY_BETA_EDITORIAL_SCORECARD.md`: 12 criteria scored 0–2, >=20/24 for EACH actual whole session, no hard fail or required-dimension 0, both branches checked. `check-story-editorial-scorecard.mjs` and new guidance test verify docs/prompt wiring only, do NOT grade any provider output. Provisional internal Malika review 14/24, Momentum=0, ITERATE, **not** independent approval. Evidence at `docs/qissa/ai/reviews/2026-09-16_malika_uz_v79-e1_v80-e2_baseline.md`.
- Never trade away child safety, privacy consent, immutable hero/name/canon, selection-only branch memory, immediate resolution bridge, no Episode-2 phantom choice, fallback, installation auth or cost guard. No direct main edits, broad paid provider/TTS calls, secret transfers, unbounded runtime ON, new schema or paid Quality Agent by default. Distinguish debug provider counters from actual invoice costs.

## Expert decisions ACCEPT
- Small meaningful causal change/attempt/discovery/reaction after setup; preserve gentle bedtime tone.
- Fictional protagonist shows own desire/reaction/initiative and consequential action; do not infer real child's personality.
- Pay off explicit story promises and obstacles within the TWO-part bedtime session. Tonight's local goal closes; tomorrow seeds belong to future sessions only.
- Earned, visible concrete humor; fix actual species/nickname inconsistency. An incidental nut need not recur; a missing required ribbon must be resolved or not set up.
- A/B must give visibly distinct downstream events and relevant canon, not merely different JSON strings. Review both actual E2 outcomes from SAME E1.
- Record real story-specific 12 scores, evidence, reviewer identity/independence, 2–4 notes, hard fail and verdict. Measure initial/final word count/repair without making target-length misses automatic hard fails. Treat structural repetition as a hypothesis to test, not claimed retention data.

## ADAPT / REJECT for now
- Use existing central_goal, beats, resolution_goal and memory first; no duplicative mandatory core_problem, climax_event, hero trait schema or extra providers until evidence requires them.
- Causal events include interpersonal changes; no rigid two-physical-actions quota. A hero mistake is optional. Refrains optional, not obligatory three repetitions. Two parts only; no third episode, compulsory homework, or new E2 child decision.
- Sentence length as diagnostic, not fixed 8–10-word cutoff for Uzbek. No automatic abstract-noun/loanword denylist or regex pretending to measure humor. A longer story alone does not guarantee story quality.

## P0-A baseline evidence and process
- [x] Preserve original E1/A E2 logs with version differences and missing B clearly noted.
- [x] Save provisional 14/24 ITERATE internal review and permanent evidence template `docs/qissa/ai/reviews/README.md`.
- [x] Add static evidence/prompt-wiring regression without claiming it judges actual literary quality.
- [ ] Obtain **independent native Uzbek editor and parent/child read-aloud assessment** on new real outputs. Do not invent external approval.

## P0-B editorial patch (draft PR #186, not deployed)
- [x] Use existing blueprint JSON; add pure `editorial-guidance.ts` focused on observable action, protagonist initiative, setup/payoff, concrete humor, distinct A/B consequences and no repeated bridge or pseudo-choice.
- [x] Wire through Architect and Narrator calls in `split-openai.ts`; no new AI request, safety policy, retry or JSON schema change.
- [x] Add `scripts/check-story-editorial-guidance.mjs` to CI; preserve and integrate runtime lease CI test in shared workflow.
- [x] Safety integration resolved via merge commit `d43798c...`; diff contains only seven editorial files; official CI #386 and Story Core #222 GREEN on that commit.
- [ ] Refresh final head + official checks after each edit; inspect final diff. Only then make PR ready/merge deliberately and deploy exact main SHA with runtime OFF.

## P1 controlled paid dual-branch qualification — NOT YET STARTED
- [x] Independent time-bound runtime permission implemented, PR #187 merged, deployed production version 81 with AI OFF; operator runbook documents limits. No live expiry test yet.
- [ ] Agree explicit paid scope/provider-call budget and approved harness. Guarantee `finally` OFF and test cleanup; lease is a backstop, not complete lifecycle cleanup. Never enable solely to await chat replies.
- [ ] After merged editorial SHA/deploy, generate **ONE NEW E1, two A/B choice bridges, two E2** from same E1 in isolated installation contexts, reusing E1 for B. No TTS, no escalation, no broad matrix; confirm actual billing separately if needed.
- [ ] Both branches: safety, name identity, selection-only canon, non-repeated resolution, no E2 phantom choice, actual local payoff, persistence/reload, cleanup of test profile and credential, eventual confirmed AI OFF.
- [ ] Independently evaluate both whole sessions on 12 editorial dimensions; each >=20/24, no hard fail, native Uzbek language reviewed, honest PASS/ITERATE/REJECT and release decision. No fabricated reviewer.
- [ ] Capture exact runs/SHAs, initial/final words, repair attempts, provider work, retention of no real test-data residue.

## P2 broader qualification — NOT YET STARTED
- [ ] Explicitly approve a wider RU/UZ age/world matrix and any costs; 20 samples per language/age is a proposal, not approved spend.
- [ ] Review multi-session structural repetition, actual memory payoff, calibrated Uzbek read-aloud/sentence length evidence. Do not claim retention results without real users.
- [ ] Consider structural signature/new schema or paid quality model only if repeated observed problems and ROI justify.

## Final acceptance and deletion
- [ ] Production exact editorial SHA, official CI and Story Core GREEN, reviewed clean diff, temporary workflow/helper cleanup.
- [ ] Runtime OFF by trusted DB check; lease deployed; safe short live window and `finally` OFF confirmed; no unapproved providers.
- [ ] Same-E1 A/B evidence, full safety/privacy/continuity/persistence/cleanup and both real sessions independently editorial-qualified (>=20/24). Explicitly mark other combinations NOT qualified.
- [ ] Store permanent reviews, evidence and final GO/NO-GO with all limitations. **ONLY THEN remove this file in a reviewed cleanup PR**; keep scorecard, scripts and review evidence.

## Execution log
- 2026-09-16: baseline and editorial prompt guidance developed in draft PR #186; initial CI #382/Story Core #218 GREEN, then #383/#219 GREEN after doc-only update.
- 2026-09-16: protected runtime lease developed separately. First QISSA CI #384 failed on old static cost-guard assumption; explicit OFF handling restored, then CI #385 / Story Core #221 GREEN. PR #187 merged `cb483dd...`; Edge Function v81 deployed and exact import/AI OFF verified. No paid AI calls.
- 2026-09-16: integrated safety main into editorial branch, retaining both CI checks. Combined CI #386 and Story Core #222 GREEN on merge commit `d43798c...`; editorial PR remains draft/unmerged. No paid AI calls.
