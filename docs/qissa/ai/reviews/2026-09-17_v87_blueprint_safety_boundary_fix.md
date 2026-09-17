# QISSA v87: Architect rule-safety boundary fix

**Observed:** 2026-09-17 UTC. **Release status:** Story AI remains OFF; family-beta Story AI remains NO-GO pending a fresh successful live E1 and A/B continuation evidence.

## What was known from the v86 live stop

The one-shot v86 E1 attempt returned HTTP 200 `safe-fallback` with `failure-trace=blueprint-validation:blueprint_rule_safety` after one Architect provider call. No Narrator, Repair, Sol, E2 or TTS call occurred. The raw rejected Architect blueprint was intentionally not logged, so the exact historical phrase/category cannot be reconstructed or claimed.

## Reproduced implementation defects

Provider-free regression work found two deterministic false-positive paths in the rule scanner:

1. `scanRuleBasedSafetyValues` concatenated independent blueprint fields before scanning. Separate values such as `siyosiy` and `partiya` could therefore synthesize the forbidden phrase `siyosiy partiya` across a field boundary even though no individual field contained it. QISSA CI #452 reproduced this on the pre-fix implementation.
2. Uzbek political-push matching used raw substring `ovoz ber`, so ordinary forms such as `ovoz berdi` could be classified as a voting imperative. The fix keeps explicit imperative forms (`ovoz ber`, `ovoz bering`, `ovoz beringlar`) blocked while descriptive/past-tense continuations are not matched by that rule.

These are proven defects in the production code path. Because the historical rejected blueprint is unavailable, neither defect is claimed as the exact cause of the specific v86 rejection.

## Fix and regression gates

PR #200 (`fix: prevent cross-field and Uzbek speech false positives in Architect safety`) makes five scoped repository changes:

- scans each independent blueprint natural-language value separately and merges flags afterward, preserving semantic field boundaries;
- replaces the broad Uzbek `ovoz ber` substring with bounded imperative-form matching;
- keeps real single-field political phrases, humiliation, fear/blood and other existing safety categories fail-closed;
- adds `blueprintRuleSafetyCategories`, returning only fixed category identifiers;
- exposes category names only in `X-QISSA-Blueprint-Safety-Categories` when `blueprint_rule_safety` rejects a plan, without logging or returning raw blueprint prose.

The new provider-free regression covers cross-field political/humiliation synthesis, benign Uzbek `ovoz berdi`/`ovoz beradigan`, explicit voting imperatives, real fear, a harmless blueprint and a real synthetic unsafe blueprint. Temporary write workflow/script/trigger were removed before merge; final PR diff contains only `package.json`, the regression script and the three Story AI source files.

Final head `6af2c4f7a742fe196f5b8d6378263f4a79e9e9ec` passed QISSA CI #459 and Story Core Proof #275. PR #200 merged to `main` as `659233c920784eca5ac425992064011b016bf9a1`.

## Production deployment

Production `story-generate` was deployed as **v87**, ACTIVE, `verify_jwt=true`, importing exactly:

`https://raw.githubusercontent.com/jteshaboev1984-ops/qissa_app/659233c920784eca5ac425992064011b016bf9a1/supabase/functions/story-generate/split-index.ts`

Post-deploy verification at 2026-09-17 05:37 UTC confirmed `story_ai_enabled=false` and `qissa_provider_daily_usage.story_generation_claims=1` for 2026-09-17. No paid AI call was made during diagnosis, patching, CI, merge or deployment.

## Next evidence gate

A fresh v87 E1 is required to determine whether the previous fallback class disappears. If another `blueprint_rule_safety` rejection occurs, category-only diagnostics can now identify the matched rule without retaining generated child-story prose. A passing E1 must also verify complete top/A/B `last_event` memory and acceptable story quality before any E2 A/B live continuation is attempted.
