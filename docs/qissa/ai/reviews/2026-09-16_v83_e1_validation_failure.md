# QISSA v83 — new E1 rejected by production validator (2026-09-16)

**Status: technical FAIL / editorial NO-GO.** Genuine failed provider generation, not a successful E1 or complete A/B session. It follows [the earlier economical successful E2 diagnostics](2026-09-16_v81_e2_ab_diagnostic_success.md) and deployed PR #191.

## Verified provenance

- Production `story-generate` Edge v83 ACTIVE with JWT ON, imports exact `main` SHA `f725f4fb0376b07b10fe5a8dae95bd425f32726e` (PR #191). Story AI OFF at preflight, briefly ON for a single authorized admission, then explicitly OFF before completion. Server's 180-second lease is a backup, not an operator OFF substitute.
- [Provider-free preflight run #35091303031](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35091303031) GREEN: zero story requests, profiles or credentials.
- [One paid-attempt run #35092551269](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35092551269), job `104782056567`: **FAIL** after its only E1 response was `safe-fallback`; E2 never requested. Daily `story_generation_claims` 14→15. This is an admission count, not billed external requests or dollar cost. Account balance and invoice are not accessible from these tools.
- Synthetic selections: Uzbek Latin, age 5–7, bedtime series, `cozy_forest`, fictional custom hero `Malika`. No actual child name, story-state profile, credential or secret logged. No TTS/escalation. A complete successful E1 envelope cannot be reconstructed because no E1 passed validation.

## Authentic non-secret response metadata and trace

`HTTP 200; generation-source=safe-fallback; fallback-reason=generation-or-safety-failed; failure-class=validation; runtime-ai=enabled; escalation-used=false; provider-calls=4; generation-repair=text-length; repair-retry-used=true; narrator-retry-used=false`.

1. `narrator-validation: story_too_short, choice_resolution_too_short, story_choice_menu_scaffolding` — `story_words=273`, choice bridges **24 / 18** words.
2. `repair-validation: story_choice_menu_scaffolding` — rewritten text **361** words, bridges **46 / 43**. Length was repaired; scaffolding persisted.
3. `repair-retry-validation: uzbek_child_language_requires_rewrite, story_too_short, story_choice_menu_scaffolding` — rewritten text **278** words, bridges **38 / 40**. Shortness and age-language defects recurred.

The trace proves deterministic validation exhaustion, not provider outage, reconstructed-memory failure or Safety-agent rejection. It records a regex classification, but rejected prose was not logged: exact offending wording and whether the matcher had a false positive are UNKNOWN. Do not weaken the validator on this evidence alone. `provider-calls=4` is a logical debug counter, not necessarily exact billed requests.

## Containment, mitigation and outstanding blockers

- AI explicitly switched OFF, independently confirmed in SQL after the failed run; claim count 15. No story-state writes. One-shot paid workflow, trigger and script deleted; audit branch final HEAD `a4bd22dd4fbe98057ad9f36bab40fe76fe122ed2` differs from original main by `files=[]`, with no residual executable triggers.
- Dedicated remediation branch `fix/v83-e1-choice-scaffolding-repair` adds E1 Architect/Narrator instructions for a single neutral decision cue, options solely in structured cards, 350–390 useful story words and independently complete 30–45-word choice bridges; deterministic safety and hard word bounds unchanged. Adds exact-trace regression plus this permanent report and updates the temporary cross-chat plan.
- [Provider-free proof #35093721258](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35093721258) **GREEN**: existing Safety and split-repair routing tests, new editorial/evidence regression, Story AI and app TypeScript checks, build. Read-only workflow had NO API secrets and NO live provider step. Its temporary workflow/trigger were deleted afterward. This is NOT full official pull-request CI and does not demonstrate any new story output.
- Creating the review PR returned a GitHub connection safety-status block. **No PR exists from that attempted action; no merge and no production deployment of this branch have been claimed.** The branch is saved for later review.
- **Separate pre-existing Text Repair prompt contradiction:** `prompt.ts` says `story_rewrite`/`story_expansion` must be null when no story-length/coda error, but `textRepairRequiresFullStoryRewrite` requires a full rewrite when `story_choice_menu_scaffolding` is the sole error. The observed run included shortness, so this separate bug is NOT established as its cause. Fix this contradiction and add a targeted provider-free assertion before asserting complete repair reliability. The current branch does NOT fix this yet.
- No additional paid attempt until code/review gate and full official CI pass, exact reviewed SHA is deployed with AI OFF, and a restricted single-use harness passes preflight. A complete same-E1 A/B with actual persistence/reload, distinct narratives, independent native Uzbek human review and parent/child read-aloud assessment remain NO-GO.
