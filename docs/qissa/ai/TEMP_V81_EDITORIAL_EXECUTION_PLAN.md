# TEMPORARY WORK PLAN — QISSA v81 editorial quality

**Status: IN PROGRESS.** Created 2026-09-16 from `main` `c96d2e9bbf5191bdb91e5fbbb98e572f923c9c38`. This is the user's persistent executable work plan, not a permanent release specification. **Read this file first in any resumed chat.** Update status with actual evidence; do not fabricate completion. After *all* acceptance criteria are met and permanent evidence is stored, remove this temporary file via reviewed cleanup PR and optionally delete the work branch. Until then DO NOT DELETE.

**Current checkpoint (2026-09-16):** Work branch `work/editorial-quality-v81-plan`; draft [PR #186](https://github.com/jteshaboev1984-ops/qissa_app/pull/186). Head before this documentation update: `1495cb6adedfe0e27bcf1f6961315f2a24cc48b1`; [QISSA CI #382](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35070618759) GREEN; [Story Core Proof #218](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35070618717) GREEN. Subsequent doc-only update requires refreshed HEAD and preferably official PR rerun. **No merge, no deployment, no new AI provider calls, no new B story; current baseline v80 remains production.** Never claim v81 editorial PASS until independent review and branch evidence exist.

## Baseline and interpretive constraints
- v80 merge baseline `c96d2e9bbf5191bdb91e5fbbb98e572f923c9c38`, PR #185; technical E2 run `35062412722` GREEN. E1 + two cards/bridges from v79 run `35061371574` (the workflow later FAILED on missing installationAuth, not on story validation). v79 E1=255 initial→357 final; v80 E2=280 initial→367 final words. E1 reused; no single v80 same-session end-to-end or live B E2. Both went through text-length repair. `openai-structured`/Luna technical PASS is not editorial PASS.
- Permanent `09_FAMILY_BETA_EDITORIAL_SCORECARD.md`: 12 dimensions, 0–2, >=20/24, no hard fail/required-dimension zero; BOTH branches required. Static `check-story-editorial-scorecard.mjs` only checks rubric text and renderer, not individual real output. Never present static CI as proof of literary quality.
- All operations should preserve consent, user names/canon, A/B memory isolation, fallback, safety and v80 no-phantom-choice. Runtime AI must stay OFF outside deliberately bounded windows. Never expose keys, silently change main/production, open broad paid tests or infer provider invoices from debug counters. Test data and credentials must be cleaned. Production deploy only after PR GREEN and explicit scope.

## Decisions from external expert: ACCEPT
- After setup, actual causal change, discovery, action/reaction or interpersonal consequence; keep calm bedtime tone, no danger for the sake of action.
- Hero has a fictional want, reaction and self-initiated meaningful action; never profile the actual child.
- An explicit problem and story promise earn a payoff and local closure within the 2-part session; if tomorrow's event is promised, distinguish it from tonight's finished goal.
- Concrete earned humor; correct genuine bird species/nickname inconsistency without forbidding harmless whimsical food/props. Close a genuine missing-ribbon obstacle, but incidental nut need not recur mechanically.
- A/B must create visible different scenes and remembered consequences. Different JSON fields alone do not prove branching.
- For every actual qualification record 12 scores, hard-fail status, evidence, 2–4 notes, reviewer independence, outcome and both branches, using the permanent scorecard.
- Diagnose initial/final word counts and repair use (E1 target 380–420/hard 320–470; E2 target 430–490/hard 355–520); missing target is a soft signal, not automatic rejection.
- Evaluate structural repetition over longer series as a possible risk, not a proven retention forecast.

## ADAPT / DEFER
- Existing `central_goal`, `resolution_goal`, `beats`, canon and continuity first; do not add duplicate `core_problem`, `climax_event` or other schema fields before evidence. E1 cannot resolve unselected branch.
- Real causal beats include discovery or relationship change, not just mandatory physical motions. No hard quota of two `action` events.
- Hero may have a small mistake, but not compulsory. Optional refrain, never fixed three repeats. No third episode or compulsory homework/phantom E2 questions.
- Sentence lengths are diagnostics only; no blanket 8–10/10–12 word cutoffs for agglutinative Uzbek without native review. No naive abstract-noun regex or enlarged loanword denylist. `lenta` vs `tasma` is contextual.
- A compact structure signature or always-on paid engagement model only after repeated evidence justifies schema/cost. Keep safety and editorial evaluation separate.

## P0-A — baseline editorial evidence and review process (NO production code change)
- [x] Obtain real E1 and both choice cards/bridges from run `35061371574`, selected-A E2 from run `35062412722`; distinguish software versions and missing B; record word counts and source.
- [x] Create provisional internal twelve-dimension review with concrete rationale: **14/24, Momentum=0, ITERATE**, NOT family-beta qualified; review at `docs/qissa/ai/reviews/2026-09-16_malika_uz_v79-e1_v80-e2_baseline.md`. This is not independent Uzbek editor/parent review.
- [x] Preserve permanent evidence template under `docs/qissa/ai/reviews/README.md`, requiring actual review, both branches and independent reviewer before any family-beta qualification decision. Never claim template validation equals model content scoring.
- [x] Add `scripts/check-story-editorial-guidance.mjs` validating explicit prompt wiring and honest baseline evidence; official CI #382 GREEN. Static contract test only, no automatic literary scoring.
- [ ] Obtain independent Uzbek editorial and parent/child read-aloud assessment of new outputs before claiming family-beta quality; cannot be inferred from self-review.

## P0-B — scoped Architect/Narrator quality patch (existing JSON contract)
- [x] Inspect v80 architecture, safety, repair, prompt and editorial rubric; identify existing fields rather than invent new schema.
- [x] Add pure `editorial-guidance.ts`: goal→payoff, actual causal change, protagonist initiative, human-visible A/B divergence, concrete gentle delight and E2 continuation after bridge with resolved local goal; no mandatory mistakes/refrain/third episode.
- [x] Wire guidance into existing Architect and Narrator prompts in `split-openai.ts` without new provider request, schema, safety changes, or retry.
- [x] Add targeted `scripts/check-story-editorial-guidance.mjs`, wired in `.github/workflows/ci.yml`.
- [x] Official Story Core #218 and QISSA CI #382 GREEN (all including typecheck/build) on head `1495cb6...`, prior to this plan status edit. Refresh checks on final PR head.
- [ ] Review final PR diff, confirm exact head and no unwanted change. Final PR ready/merge only after green checks and agreed release controls. No direct main writes.

## P1 — controlled live dual-branch qualification (NOT STARTED)
- [ ] Agree bounded production-live cost and run scope before any paid call; choose fail-safe AI-OFF mechanism independent of chat (the previous chat timeout left flag ON for ~8 min). Verify current runtime OFF authoritatively.
- [ ] After green PR, merge deliberately, deploy exact SHA with AI OFF, then one new E1, both A/B bridge and two real E2 continuations from that SAME E1 with isolated installation IDs; E1 must not be regenerated for B. No provider TTS or escalation.
- [ ] Verify A/B continuity, selected-only canon, no repeated bridge, no phantom choice, hero identity, local payoff, technical safety, persistence/reload, test-profile + credential cleanup and immediate OFF even on failed run.
- [ ] Both completed child-visible sessions evaluated on full 12 dimensions, >=20/24 each, no hard fail, and independent editor approval. Otherwise ITERATE/NO-GO and preserve evidence.
- [ ] Log initial/final word counts, repairs and actual provider work, keeping internal X-QISSA counters separate from invoice cost. Record exact SHA/run IDs.

## P2 — broader measured qualification (NOT STARTED)
- [ ] Scope and approve a paid RU/UZ (then others) language/age/world sample matrix and independent human rubric. Expert suggested 20 per language/age, which is a proposal rather than approved spend.
- [ ] Test longer series for structural repetition, repeated character role and real memory payoff. Do not infer retention data without user outcomes.
- [ ] Collect Uzbek read-aloud and sentence-length observations; prefer calibrated diagnostics to hard regex vocabulary and sentence gates.
- [ ] Consider structure signature, new schema fields or separate paid Quality Agent only when repeated flaws and marginal costs justify them.

## Final release gate, then deletion
- [ ] Final main SHA, official QISSA CI and Story Core GREEN, expected diff, temporary workflow/helpers removed.
- [ ] Exact deployment verified, AI OFF except short approved live window with independent fail-safe OFF.
- [ ] Safety, consent, hero, canon, A/B persistence, cost/fallback/no phantom choice and soothing ending regression-free.
- [ ] Real SAME-E1 A/B E2 evidence and >=20/24 independent editorial quality for both; other scope explicitly unqualified.
- [ ] Confirm test-profile/credential/trigger cleanup and authoritative runtime OFF; permanent evidence/release decision saved.
- [ ] Only then DELETE THIS TEMP FILE in reviewed cleanup PR and optionally remove work branch. Keep permanent rubric, regressions and review evidence.

## Execution log
- 2026-09-16: created plan; baseline review and review template committed; editorial guidance+CI test drafted in PR #186; official QISSA CI #382 and Story Core #218 GREEN on `1495cb6...`. No provider calls, merge or deploy during this work.
