# QISSA v83 — new E1 rejected by production validator (2026-09-16)

**Status: technical FAIL / editorial NO-GO.** This is a genuine *failed* provider generation, not a successful E1 or a complete A/B session. It follows [the earlier economical successful E2 diagnostics](2026-09-16_v81_e2_ab_diagnostic_success.md) and PR #191's deployed editorial prompt changes.

## Verified provenance

- Production `story-generate` Edge v83 ACTIVE with JWT ON, imports exact `main` SHA `f725f4fb0376b07b10fe5a8dae95bd425f32726e` (PR #191). Story AI was OFF preflight and explicitly set ON briefly for the sole approved claim, then OFF before the job completed. The server's 180-second admission lease is a backup, not a replacement for explicit OFF.
- [Provider-free preflight run 35091303031](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35091303031) GREEN: no story requests, profiles or credentials.
- [One paid-attempt run 35092551269](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35092551269), job `104782056567`: **FAIL** by design after its single E1 response returned `safe-fallback`; no E2 requests permitted or attempted. Real production daily `story_generation_claims` 14→15. This is a request-claim count, not the number of external billable HTTP calls or dollar cost. Provider account balance/invoice not accessible from these tools.
- Synthetic selection: Uzbek Latin, age 5–7, bedtime series, `cozy_forest`, fictional custom hero `Malika`. No real child name, no story-state profile, no credential, no secrets in the runner's story logs. No TTS or escalation. Full successful E1 envelope does NOT exist because provider result was rejected.

## Actual response metadata (non-secret)

`HTTP 200; x-qissa-generation-source=safe-fallback; x-qissa-fallback-reason=generation-or-safety-failed; x-qissa-generation-failure-class=validation; x-qissa-runtime-ai=enabled; x-qissa-escalation-used=false; x-qissa-provider-calls=4; x-qissa-generation-repair=text-length; x-qissa-repair-retry-used=true; x-qissa-narrator-retry-used=false`.

Actual trace, in order:

1. `narrator-validation: story_too_short, choice_resolution_too_short, story_choice_menu_scaffolding` — `story_words=273`, choice bridges **24 / 18** words.
2. `repair-validation: story_choice_menu_scaffolding` — rewritten story **361** words, bridges **46 / 43** words. Word length and bridge length were repaired; alternative-menu scaffolding persisted.
3. `repair-retry-validation: uzbek_child_language_requires_rewrite, story_too_short, story_choice_menu_scaffolding` — rewritten story **278** words, bridges **38 / 40** words. This reintroduced short text and age-language defects.

The record proves validation exhaustion, not an OpenAI provider outage, a memory-reconstruction error, or Safety-agent rejection. The regex flags are evidence of the validator's classification; the actual rejected prose was not logged, so we cannot independently prove the narrative was in fact scaffolded or identify its exact offending passage. Do not disable the validator based on this trace alone. Debug `provider-calls=4` is a logical counter; avoid calling it exact billed requests.

## Mitigation and residual risks

- One-shot audit workflow, trigger and script were removed; audit branch compares to original `main` with `files=[]`. Production explicitly OFF; verify again before any future run. No synthetic DB profile was created.
- Offline prompt update instructs E1 Architect/Narrator to keep alternatives exclusively in structured choice cards, with one neutral ending cue, meaningful story-text length, and separately substantial resolution bridges. No safety, word-limit or retry allowances are weakened.
- **Separate latent issue identified in existing `prompt.ts`:** the Text Repair instruction “If there is no story length or Episode 2 bedtime-coda failure, return both story_rewrite and story_expansion as null” conflicts with `textRepairRequiresFullStoryRewrite` for a *standalone* story-choice-menu-scaffolding defect. This specific conflict did not trigger in this mixed-error run because `story_too_short` was present; do not cite it as the proven root cause here. It requires its own code correction and regression before claiming fixed.
- No further provider request until amended code is CI GREEN and a strict one-shot harness/persistence plan passes preflight. Even then, technical generation, actual A/B branch divergence and native Uzbek human editorial review are separate release gates.
