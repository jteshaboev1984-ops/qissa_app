# QISSA v83 — offline cross-layer remediation, 2026-09-16

**Result: C1–C6 source fixes and regressions PASS offline. Family-beta Story AI remains NO-GO.** This is an engineering checkpoint, not proof that Luna will produce acceptable Uzbek fiction; there were no paid calls during this remediation.

## Evidence and exact changes

Original [defect reproduction run 35094936207](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35094936207) established nine failures in five groups; see `2026-09-16_v83_prepaid_cross_layer_contradiction_audit.md`. Following the genuine failed E1 [run 35092551269](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35092551269), the remediation branch fixes:

- **C1**: Align `prompt.ts` full-story rewrite instruction with `repair-routing.ts`, strict JSON schema and `repair_plan`; independently test standalone menu, title and language failures plus historical mixed failures and pure-length insertion.
- **C2**: Architect now rejects short `tomorrow_seed`, whitespace-only `choice_icon` and empty `value_alignment` before incurring a Narrator request; the final candidate guard remains unchanged.
- **C3**: `narrationToCandidate` rejects duplicated, missing and extra resolution IDs instead of silently keeping the last duplicate; ordinary dynamic IDs remain supported.
- **C4**: Architect now applies the pre-existing choice-menu scaffolding check to its own Episode 1 `decision_point`; the child-facing validator remains in force and a neutral decision positive fixture passes.
- **C5**: Non-string `nextEpisodePreview` is classified as `invalid_preview` without `.trim()` exceptions. Strict provider JSON was already supposed to prevent this, so this is defense-in-depth.
- **C6 (found during remediation)**: When only a choice bridge needs repair, Repair now requests only the affected `choice_resolutions`; it no longer asks for a `story_expansion` that the strict JSON schema requires to be null. A dedicated regression verifies this case.

Permanent offline tests: `scripts/check-story-cross-layer-contracts.mjs` and `scripts/check-story-resolution-only-repair.mjs`, both invoked by the existing `npm run check:story-ai-split` step in official CI. No retry-budget increase, model changes, validator bypass, Safety relaxation, schema change, RLS/DB write, new paid stage or TTS.

Single-use provider-free application [run 35096574316](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35096574316) passed C1–C5, existing Story AI checks, TypeScript and build before committing the exact three changed production source files. C6 also passed its provider-free source-application job before its one-file commit. All temporary workflows, patch scripts and triggers were then removed. Final official [QISSA CI #414](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35097492190) and [Story Core #244](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35097492121) passed on commit `0a0882b72dc9da9c9e1f6a26b1527c624448c7bf`; report/plan follow-up commits require their own exact-SHA verification before merge.

## Limits and remaining conditions

- Fixes eliminate the reproduced **source-level contradictions**. The earlier rejected E1 prose was not retained, so these changes cannot be called a confirmed historical root-cause fix or literary improvement.
- Russian `{{HERO}}` grammatical screening of immutable Architect fields remains a separate unproven risk; investigate with a RU fixture before extending paid RU acceptance. A single Uzbek test cannot qualify Russian or other age/world combinations.
- Before another authorized paid request: review exact clean diff, official full CI and Story Core on final SHA, merge, deploy exact main SHA with AI OFF and JWT/180-second admission lease intact, and verify the runtime flag independently. Use one-shot E1 and STOP on fallback; no automatic user-orchestrated retry, TTS or escalation. Actual invoices cannot be derived from claim counters.
- Genuine one E1 + same-E1 two E2 A/B with native Story State persistence/reload/cleanup and independent native Uzbek editor plus parent/child read-aloud remain unfulfilled. Neither this report nor passing CI is family-beta authorization. Preserve temporary execution plan until all release gates pass.
