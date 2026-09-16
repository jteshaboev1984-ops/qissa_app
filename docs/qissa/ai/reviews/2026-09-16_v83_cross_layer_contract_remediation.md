# QISSA v83 — offline cross-layer remediation, 2026-09-16

**Result: C1–C11 source fixes and permanent regressions PASS offline. Family-beta Story AI remains NO-GO.** This is an engineering checkpoint, not proof that Luna will produce acceptable Uzbek fiction. No paid model, TTS, database or production-deploy calls were made during these audits/remediations.

## Evidence and exact changes

The first provider-free audit [run 35094936207](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35094936207) reproduced nine failures in five groups after the genuine failed E1 [run 35092551269](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35092551269). The remediation then closed:

- **C1**: Repair full-story-rewrite instruction now agrees with routing, strict schema and repair plan for standalone and mixed prose defects.
- **C2**: Architect rejects short `tomorrow_seed`, blank `choice_icon` and empty `value_alignment` before a Narrator request.
- **C3**: Narrator resolution mapping rejects duplicate, missing and extra choice IDs instead of silently overwriting a duplicate.
- **C4**: Architect rejects generic choice-menu scaffolding in immutable Episode 1 `decision_point`.
- **C5**: malformed non-string `nextEpisodePreview` returns `invalid_preview` rather than throwing.
- **C6**: choice-resolution-only Repair requests only affected `choice_resolutions`; it no longer asks for a story expansion forbidden by its strict schema.

A second provider-free audit [run 35100380811](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35100380811) then reproduced three further cross-layer mismatches before any new paid request:

- **C7**: Architect's minimum `effect_summary` length was weaker than the downstream Candidate validator even though the field is copied directly. The thresholds now match upstream.
- **C8**: `one_time` E1 previously required a non-empty Architect preview while the final Candidate contract requires no preview. Architect validation and prompt/output contract now require empty preview for one-time, while series E1 retains its branch-neutral preview.
- **C9**: immutable Russian Architect fields could contain invalid raw `{{HERO}}` grammar that later Repair cannot change. Architect now applies the existing Russian hero-token grammar check before Narrator spend. The provider-free source application [run 35100751690](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35100751690) passed Story AI split/safety checks and Story AI typecheck before committing these changes.

A third provider-free audit [run 35101207570](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101207570) found two more admission gaps:

- **C10**: stale series-shaped state (`episodeCount > 0` or old choice history) could normalize a `one_time` request as technical Episode 2. `isContinuation` is now gated by `storyMode === 'series'`, so one-time remains Episode 1.
- **C11**: Architect's generic menu-scaffolding regex did not reject a `decision_point` that directly repeated both structured choice labels. The same structured-choice overlap detector is now shared by the final Candidate check and Architect preflight, so direct menu duplication is rejected before Narrator. Provider-free application [run 35101359193](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101359193) passed Story AI split/safety checks, Story AI/app typechecks and build before committing and removing all third-pass temporary tooling.

Permanent offline regressions are `scripts/check-story-cross-layer-contracts.mjs` (C1–C5 and C7–C11) plus `scripts/check-story-resolution-only-repair.mjs` (C6), both wired into `npm run check:story-ai-split`. The deterministic safety validators remain enabled. No model, retry-budget, moderation/Safety-policy, RLS, database schema, secrets or TTS changes were introduced.

## Deployment checkpoint

Final PR #192 head `d2b2f82f20dd89ed1bc4b0b66def5b5c68ec4b87` passed [QISSA CI #437](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101589983) and [Story Core #267](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35101589548), with a clean permanent-only diff and no temporary audit/fixer workflow, trigger or script. PR #192 merged as `main` SHA `e9d369c1b8af4036c95734af28a1f89c89c7a8d6`.

Production `story-generate` was then deployed as **Edge v84 ACTIVE / verify_jwt=true**, importing exactly that merged SHA. Story AI was independently verified OFF after deployment. `qissa_provider_daily_usage` still showed **15** claims for 2026-09-16, unchanged from the prior failed E1, so the provider-free audits, remediations, CI, merge and deployment added zero Story-generation claims.

## Limits and remaining conditions

- These changes eliminate the **reproduced source-level contradictions** above. The rejected v83 E1 prose was not retained, so this does not prove those contradictions were the sole historical literary cause or that a future Luna story will be good.
- The audit compared important Architect-owned fields that flow into final Candidate validation and exercised Repair routing/schema, resolution IDs, preview semantics, one-time episode identity, choice-menu duplication and Russian immutable hero grammar. Strict provider JSON schema still supplies structural type guarantees before blueprint normalization; malformed-provider-schema defense beyond that remains a separate resilience topic.
- A fresh live check remains deliberately separate: one genuine E1 first and STOP on fallback; only a valid E1 may fan out to same-E1 A/B E2 persistence/reload/cleanup. Technical success still requires independent native Uzbek editor plus parent/child read-aloud before family-beta GO.
