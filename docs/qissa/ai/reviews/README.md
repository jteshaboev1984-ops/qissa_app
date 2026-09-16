# Real-provider QISSA editorial review evidence

This directory holds **actual story-specific reviews**. The permanent 12-dimension rubric remains `../09_FAMILY_BETA_EDITORIAL_SCORECARD.md`. Static CI checking that rubric's text exists is **not** a content-quality evaluation, and a GitHub GREEN is never sufficient to claim family-beta editorial PASS.

## Required record for each qualification candidate

1. Immutable model/source/version: exact production SHA and Edge Function version, model and `generationSource`, generation timestamp and environment; real run IDs and URLs. Distinguish stories assembled from two software versions from same-version sessions.
2. The complete child-visible reading order: E1, both choice cards and resolution bridges, E2 for selected choice, remembered consequences; for world/language qualification, E2 for BOTH A and B from the same E1. Do not put real child names, tokens, credential or secrets into this repository.
3. Initial and final word counts, text-repair/retry metadata, and observed provider work. Provider header counters are not invoice totals.
4. All 12 rubric dimensions individually scored 0, 1 or 2 with one verifiable textual observation each. Record numerical total. Note the identity of the reviewer and whether native-language/editor/parent review was actually done. An AI-assisted self-review must say so.
5. Hard-fail assessment, including whether any condition is unknown because a branch was never generated. An unknown is not a PASS.
6. Difference between A/B child-visible consequences and retained state; judge scenes and interaction, not only labels and `state_patch` JSON.
7. 2–4 actionable editorial notes and explicit decision (`PASS`, `ITERATE`, `REJECT` or `NOT QUALIFIED — EVIDENCE MISSING`). A sample may be family-beta qualified only if >=20/24, no hard fail, no zero in Story pull/Narrative roles/Choice quality/Language/Ending, both branches reviewed, and independent editorial review obtained.
8. Confirm precise cleanup and runtime AI OFF independently of the generated prose before saying the acceptance process ended safely.

## Reusable blank template

```
Story and conditions:
Production SHA / Edge version:
Run IDs (E1, A bridge/E2, B bridge/E2):
Source/model/escalation:
Initial → final words E1 / A-E2 / B-E2; repairs:
Reviewer and review independence:
Reading order verified? [ ]
12 dimension scores and specific observations (use the exact permanent scorecard names):
Total /24:
Hard fails: none / present / unknown, with rationale:
A/B child-visible divergence and memory consequence:
Safety and continuity evidence:
Editorial notes (2–4):
Decision: PASS / ITERATE / REJECT / NOT QUALIFIED — EVIDENCE MISSING
Test data cleanup and runtime OFF evidence:
```

For an incomplete review, explicitly say what was not tested. Do not invent a B continuation or retrospectively claim independent approval. Never auto-publish based on a regex, artificial word-count target or an unreviewed model-generated score.
