# TEMPORARY EXECUTION PLAN — QISSA editorial acceptance

**STATUS: IN PROGRESS / FAMILY-BETA STORY AI NO-GO.** This repository-backed plan must survive chat limits. Read this file AND latest `docs/qissa/ai/reviews/` evidence before continuing. Delete this TEMP file ONLY after ALL acceptance gates pass, through a separately reviewed cleanup PR. Keep permanent audits, tests and evidence. CI GREEN is engineering evidence, never editorial approval.

## Latest checkpoint — 2026-09-16, C1–C11 DEPLOYED as v84 / AI OFF (READ FIRST)

- PR [#192](https://github.com/jteshaboev1984-ops/qissa_app/pull/192) was reviewed against exact head `d2b2f82f20dd89ed1bc4b0b66def5b5c68ec4b87`, with [QISSA CI #437](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101589983) and [Story Core #267](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101589548) GREEN. It was merged to exact `main` SHA **`e9d369c1b8af4036c95734af28a1f89c89c7a8d6`**.
- Production Edge `story-generate` is now **v84 ACTIVE / JWT ON**, and its entrypoint imports exactly `e9d369c1b8af4036c95734af28a1f89c89c7a8d6/supabase/functions/story-generate/split-index.ts`. Story AI remained OFF throughout merge/deploy; independently verified after deployment at 2026-09-16 13:26 UTC. `qissa_provider_daily_usage` still reports **15** story-generation claims for 2026-09-16, unchanged from before the offline audit/remediation/deploy. Therefore C1–C11 investigation, fixes, CI, merge and deploy added zero Story claims. Claim counts are not invoice dollars.
- Genuine v83 E1 [run 35092551269](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35092551269) remains the most recent paid story attempt: one claim (14→15), validation fallback, zero E2, no TTS/escalation. Rejected prose was not retained, so v84 hardening is prevention of reproduced source contradictions, not proof of the historical literary root cause.
- Three provider-free audits preceded v84: [35094936207](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35094936207) reproduced C1–C5 and remediation found C6; [35100380811](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35100380811) reproduced C7–C9; [35101207570](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101207570) reproduced C10–C11. Provider-free apply runs [35100751690](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35100751690) and [35101359193](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101359193) passed affected checks/typechecks/build before commits. All temporary audit/fixer workflows, scripts and triggers were removed before final PR review.
- Permanent regressions: `scripts/check-story-cross-layer-contracts.mjs` covers C1–C5 and C7–C11; `scripts/check-story-resolution-only-repair.mjs` covers C6; both are wired into `npm run check:story-ai-split`. Permanent engineering record: `reviews/2026-09-16_v83_cross_layer_contract_remediation.md`. No validator/Safety relaxation, model change, retry-budget increase, RLS/DB schema/secrets/TTS change.
- C1–C11 include: Repair routing/schema agreement; pre-Narrator validation of copied choice fields; exact resolution IDs; generic and direct structured-choice menu rejection; malformed preview handling; resolution-only Repair schema; `effect_summary` threshold parity; one-time preview parity and forced Episode 1 identity; immutable Russian `{{HERO}}` grammar preflight.
- **Next paid gate is now technically eligible for a fresh one-shot E1**, under the user's existing sensible-spend authorization. Start with ONE E1 only and STOP on fallback. A technical PASS is still not family-beta GO.

## Previous genuine production evidence (preserve)

- PRs #186 editorial, #187 180-second runtime lease, #188 original live failed-trial report, #189 safe diagnostic headers and offline memory test, #190 corrected inference about missing Narrator header, #191 branch/Uzbek memory instructions and #192 C1–C11 cross-layer hardening are merged. Technical success and scorecard files do not grade literary quality.
- Older mixed-version v79 E1/v80 A E2 baseline is **14/24 ITERATE**, `reviews/2026-09-16_malika_uz_v79-e1_v80-e2_baseline.md`; never copy this score to later stories or call it native-editor approval.
- Original `Tikan uchun quvnoq qo‘shiq` E1: 357 words, dynamic choices `choice_song_circle` / `choice_song_echo`. Initial runner wrongly expected a/b; both initial persisted E2 later failed without enough diagnostic headers. E1 [35083106909](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083106909), E2 [35083675997](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35083675997), report `reviews/2026-09-16_v81_single_e1_dual_e2_live_attempt.md`. Synthetic profiles/credentials were deleted; claims 9→12.
- Reuse of SAME historical E1 yielded authentic separate E2 A/B without persistence: [A 35089384717](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089384717) 346→376 words, [B 35089754120](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35089754120) 296→360 words. Both technical/Safety PASS, no TTS/escalation, claims 12→14, but both over-converged on group singing; B lost selected echo and had Uzbek/memory quality defects. Not beta-qualified.

## Editorial principles and forbidden shortcuts

Keep one concrete child-scale goal, causal action, hero initiative without profiling a real child, earned humor, setup/payoff, consistent cast/canon, calm closed ending, two genuinely different choices and selected-only memory, fluent native Uzbek. Safety and editorial gates remain independent. Do NOT add a third episode, forced mistakes/refrains, rigid sentence quotas, huge borrowed-word blacklist, paid Quality Agent, or weaken validators merely to force GREEN.

## NEXT WORK — strict order

- [x] Failed v83 E1 captured honestly; Story AI OFF; paid trigger removed; zero synthetic profile residue.
- [x] Three provider-free cross-layer audit passes completed. C1–C11 repaired with permanent regressions; temporary tooling removed; exact-head CI/Story Core GREEN; PR #192 merged; exact merged SHA deployed as Edge v84 with JWT ON and runtime OFF; claim count unchanged at 15.
- [ ] Before the next live request, re-verify exact production v84 SHA/JWT, runtime OFF and claim count. Build a one-shot harness that records allowlisted diagnostics and has independent `finally` OFF cleanup; no historical paid workflow reuse.
- [ ] Use the already-authorized sensible-spend scope for **one fresh E1 first**. STOP on fallback. If valid, preserve the original complete E1 envelope and fan out the SAME E1 into two isolated A/B installations using native story-state sync→confirm→reload; generate one E2 each, then persist/reload, cleanup in `finally`, independently verify zero synthetic residue and runtime OFF. Dynamic choice IDs only; no TTS or escalation; no user-orchestrated retry storm.
- [ ] Native Uzbek editor plus parent/child read-aloud independently assess EACH real E1 + selected bridge + E2 branch. Official 12×(0–2) scorecard: EACH ≥20/24, no mandatory zero/hard fail. Without independent review, technical PASS is still family-beta NO-GO.
- [ ] Wider RU/UZ age/world and 10-session matrix plus positive emergency spend caps are a later separately scoped acceptance phase.

## ALL release and deletion gates

- [x] Exact reviewed C1–C11 source deployed as production v84; full PR CI/Story Core GREEN; 180-second lease code retained; runtime OFF after deployment; no temporary audit/fixer tools.
- [ ] Positive production spend controls before public rollout.
- [ ] SAME real E1 with two genuine selected E2 through persistence/reload/deletion; correct consent, Safety, privacy, identity, canon and branch isolation; no phantom choices, branch replay or unresolved bedtime goal.
- [ ] Independent native editorial/read-aloud acceptance for BOTH complete sessions with tested scope explicit.
- [ ] Permanent provenance, actual invoice limitations and human release GO recorded. ONLY THEN delete this TEMP plan via separate reviewed PR; retain permanent reports/tests.
