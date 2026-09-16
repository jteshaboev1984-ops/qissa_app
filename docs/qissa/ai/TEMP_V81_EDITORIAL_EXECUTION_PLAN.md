# TEMPORARY WORK PLAN — QISSA v81 editorial quality

Status: IN PROGRESS. This is an execution checklist, not an approved release specification. Created 2026-09-16 on work/editorial-quality-v81-plan from main c96d2e9bbf5191bdb91e5fbbb98e572f923c9c38. Owner request: retain across chat limits, execute, and DELETE THIS TEMP FILE AFTER ALL ACCEPTANCE CONDITIONS ARE ACTUALLY SATISFIED. Do not delete while work remains. The permanent editorial scorecard and regression evidence should remain. Update this document each checkpoint with precise PR/SHA/run references. Read this file first in a resumed chat.

## Baseline evidence and interpretive constraints
- v80 main baseline: c96d2e9bbf5191bdb91e5fbbb98e572f923c9c38; PR #185; technical E2 test run 35062412722 GREEN. E1 from v79 run 35061371574, first run FAILED due to installationAuth; subsequent continuation harness successful. E1=357, E2=367 words after text-length repair; initial 255 and 280, respectively. Final v80 E2 on choice A only; B not live-qualified. Don't call this a single-session full v80 end-to-end test.
- Safety/continuity technical PASS does NOT imply family-beta editorial PASS. Existing permanent 09_FAMILY_BETA_EDITORIAL_SCORECARD.md has 12 dimensions (0–2), minimum 20/24 and specific hard fails; both branches must be reviewed. scripts/check-story-editorial-scorecard.mjs checks the rubric and renderer *text*, NOT real generated story quality.
- Maintain production runtime story_ai_enabled OFF except a preapproved, tightly scoped live window; verify OFF again on completion and on any error. Never expose keys. Do not change production manually or pay for broad tests before preflight. Preserve Story AI budget accounting, install-auth, privacy, fallback, name identity, choice continuity, safety and v80 phantom-choice protections. No casual main direct writes: PR+official CI, then separate explicit deployment and live evidence.

## Decisions from external expert: ACCEPT
- Fix slow/stagnant action: meaningful on-page change, discovery, reaction or consequence after setup rather than repeated deliberation. Small gentle event, preserve bedtime curve.
- Hero must have an on-page desire/reaction/initiative and consequential action; never infer real child's personality from name/profile.
- Honor explicit setup/payoff and clear goal closure within the 2-part session; do not invent third part to show the promised party. If a celebration is promised today, show a small satisfying celebration by E2 end, otherwise frame tomorrow honestly and resolve today's local goal.
- Concrete, earned humor and memorable image instead of solely saying 'funny'. Fix real species contradiction (chumchuq / chittak) without blanket bans on fantasy or a rabbit holding nuts.
- Make A and B visibly different in scenes, interactions and actual remembered outcome; check both real E2 branches before family-beta qualification. The observed different state_patch values alone aren't proof of child-visible branching.
- Make actual editorial scorecard review mandatory for each live qualification: read E1, both cards, selected bridge, E2, memory; record 12 dimension scores, notes, hard fails and PASS/ITERATE/REJECT. Minimum 20/24, zero on none of Story pull/Narrative roles/Choice quality/Language/Ending, no hard fail. No false retrospective PASS.
- Track initial/final lengths and repairs as diagnostic (E1 target 380–420, hard 320–470; E2 target 430–490, hard 355–520), but do not hard-reject a safe and substantive story simply because below target.
- Test multi-session structural repetition with editorial evidence; distinguish plausible risk from proven retention harm.

## Decisions: ADAPT / DEFER
- `core_problem`/`resolution` as conceptual setup-payoff constraints first; existing central_goal, resolution_goal, beats, continuity fields may suffice. No schema expansion until evidence demonstrates need. E1 must NOT resolve an unselected branch.
- More real beats, not a rigid minimum 2 physical actions; discovery, changing emotion or relationship can be meaningful narrative events. Protect quiet stories.
- Emotional beat / hero want initially prompt+review, no mandatory mistake every story.
- Refrain optional stylistic device, NOT required thrice, no mandatory new field.
- Sentence length diagnostics only, no hard 8–10/10–12 word thresholds without Uzbek native-speaker corpus and evidence. Avoid regex-only abstract-noun density and enormous loanword denylist. `lenta` vs `tasma` is contextual, not unconditionally forbidden.
- Narrative-structure signature later if repeated samples justify; do not invent schema overhead prematurely.
- Engagement is a separate editorial quality gate, never conflate with child-safety verdict or add an always-on paid Quality model without measured need.
- Optional post-story parent-led prompts outside story text only after UX/privacy/safety review; no mandatory leaf-collecting homework or phantom E2 selection.

## Explicit NON-GOALS
- No mandatory Episode 3; two-episode session contract remains.
- No mandatory protagonist mistake, no mandatory 3x refrain, no universal ten-word sentences, no automatic species/food prohibition, no bulk prohibited vocabulary list, no speculative retention/electability-style forecasts, no immediate heavy JSON redesign or new paid agent.
- No uncontrolled paid provider runs, no silent production enablement/deployment, no broad expansion of age/language scope from one Uzbek case.

## Stage P0-A — baseline real editorial acceptance, NO production code change
- [ ] Retrieve the exact E1, both choice cards and resolutions, actual selected A E2 from archived GitHub logs. Verify which generation produced each and log word counts; no claim of live B E2.
- [ ] Fill all 12 rubric dimensions for the exact whole E1→A bridge→E2 with evidence snippets, hard fails and explicit ITERATE/PASS/REJECT. At least one independent human/editor review still required for actual family-beta qualification; our review is internal, not independent.
- [ ] Persist structured review in a permanent evidence file under docs/qissa/ai/reviews with source run IDs, version split and distinction technical/editorial outcome; avoid putting actual child PII or keys into repo. Malika here is an artificial test name.
- [ ] Set up an auditable review template/checklist that blocks *qualification decisions* without real score + two branch review; avoid misrepresenting existing static CI as live content rating. No automatic user-facing hard rejection from heuristic scoring.

## Stage P0-B — isolated Architect/Narrator quality patch, existing JSON contract preferred
- [ ] Inspect exact current prompts, story blueprint contract, validators, tests and fallback before edits. Confirm how current v80 rules interact with bedtime, no phantom choice, heroic identity and branch isolation.
- [ ] Add concise, non-brittle instructions for a child-scale story goal plus observable change/action/discovery, personal hero want/reaction, concrete earned delight, clear payoff of explicitly promised local objective, no debate-only E1/E2 and no filler. E2 must start after selected resolution and end warmly without creating new decision.
- [ ] Require choices to imply distinctly perceivable follow-on scenes/consequences while pursuing same goal, not merely different strings/patches. Preserve no shaming and non-moralized options.
- [ ] Add targeted regression tests for prompt/contract and representative positive/negative patterns without hard-coding 'must have a flag/party' or requiring dangerous escalation. Keep schema unchanged unless tests demonstrate specific need.
- [ ] Run local deterministic relevant checks, typechecks and production build (through approved tools); official PR CI and Story Core must be GREEN before merge; no direct main edits.

## Stage P1 — controlled live qualification of both branches
- [ ] Only after GREEN preflight and confirmed exact production SHA, obtain one new real E1 with matching A/B bridge and two authentic E2 continuations from same E1 with isolated identities; reuse E1, never rerun it for B. No provider TTS; no escalation without explicit approval.
- [ ] Verify both branches' continuity, no replay, canon/hero, selected-only memory, absence of phantom choice, cleanup of test data and installation credentials, and source `openai-structured`. Verify OFF even if job fails/times out, preferably independent TTL/watchdog before paid runs.
- [ ] Score both complete child-visible sessions with 12-criterion scorecard, concrete passages, evidence of meaningfully different outcomes, no hard fail, >=20/24 each; obtain independent editor approval before declaring family-beta PASS.
- [ ] Measure initial/final word counts, repair patterns, provider request accounting separately from actual invoice cost. Record run IDs and release/hold decision.

## Stage P2 — measured broad quality
- [ ] Evaluate a deliberate RU/UZ sample matrix across age/story modes/worlds; scope and cost approved before paid calls. Collect editor scores and genuine native-language review. Expert suggestion 20 samples per language/age is a proposal, NOT established evidence/automatic spend authorization.
- [ ] Sample longer series (up to 10 sessions if justified), detect repeated plot structures and unearned repeated character role, avoid pointless mandatory difference on every episode; capture qualitative feedback and repeat patterns.
- [ ] Collect Uzbek sentence length distributions, read-aloud notes, lexical/grammar issues. Set soft diagnostics; choose any hard thresholds only after corpus-based validation.
- [ ] Consider structure signature / compact schema extensions / separate model quality evaluation only after observed persistent gaps and known incremental cost.

## Final release gate and deletion conditions
- [ ] Exact final GitHub main SHA and PR(s), official QISSA CI and Story Core Proof GREEN; no extraneous temporary workflow/helpers.
- [ ] Production deploy only intentionally after merge and approved, exact source SHA verified, AI OFF outside paid acceptance window.
- [ ] No regressions: child safety/moderation, consent, identity `{{HERO}}`, canon, choices A/B, persistence, installationAuth, provider cost safeguards, fallback, E2 no false decision, soothing bedtime closure.
- [ ] Both branches have real E2 proof and independent editorial qualification >=20/24/no hard fails, evidence linked; other scope separately labeled unqualified.
- [ ] Clean up temporary profiles and credentials, temporary triggers/workflows and confirm runtime OFF via authoritative state.
- [ ] Record permanent evidence and release decision, then delete THIS TEMP FILE through reviewed cleanup PR and optionally delete the dedicated work branch. Never delete while any unchecked gate remains.

## Execution log
- 2026-09-16: Created plan from v80 baseline. No provider calls or production changes authorized by writing this plan.
