# 2026-09-17 — v94 dual-branch admission: semantic humiliation checkpoint

## Immutable evidence
- One-time GitHub Actions run: https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35226004474, job 105217637780; `storyPosts=1`.
- Production `story-generate` v94, runtime AI OFF after run; aggregate UTC September 17 admissions 6 -> 7. The aggregate is not a provider invoice.
- E1 returned HTTP 200 `safe-fallback`, `generation-or-safety-failed`. E2(A)=0, E2(B)=0. No synthetic state identities had been persisted; runner reported cleanup PASS.
- Pipeline trace: deterministic blueprint decision-point template repair; Narrator validation `story_too_short,choice_resolution_too_short` (249 story words, branches 24/20); first text repair failed `uzbek_child_language_requires_rewrite` (398 story words, branches 36/30); second repair ran; final story word count 354; general semantic evaluation flagged `humiliation` while moderation was clear. Header `X-QISSA-Provider-Calls=5` counts instrumented stages, not billable requests/tokens.

## What is proven versus unknown
- The semantic evaluator returned a humiliation flag and moderation did not flag the same output. Their scopes and thresholds differ; `mod=clear` does NOT disprove humiliation.
- Deterministic safety checks were clear at final safety stage. The rejected candidate's prose was intentionally not retained, so the truth of this individual humiliation classification and the text span that caused it cannot be recovered from the live run.
- It is **not** established whether the issue was caused by original Narrator prose, one or both repairs, a genuine humiliation scene, or a classifier false positive. Do not describe it as a false positive or clear the flag based on moderation.

## v95 diagnostic-only response
- Ask the general semantic evaluator for one exact excerpt copied from a single child-visible field when it flags humiliation, using an existing `notes` element (no extra model request, no new output schema field).
- Locally attribute that excerpt to a fixed field code only. Missing, invented, duplicated or cross-field evidence yields a fixed failure code. Location does not prove semantic correctness.
- Only the code may enter the bounded technical failure trace; never log excerpts, candidate JSON, children’s names, private state or provider credentials.
- `combineSafety`, moderation precedence, deterministic checks, risk policy, model choice, AI runtime flag and fallback behavior remain unchanged. An absent/mismatched excerpt NEVER auto-approves a story.
- Provider-free regression covers quote location, failure codes, independent field boundaries, and refusal to override flagged humiliation when moderation is clear.

## Next release gate
After CI GREEN, deploy only with Story AI OFF. A later separately authorized one-shot E1 may establish whether v95 yields a trace with a grounded field location, but cannot retrospectively resolve the v94 content judgment. Do not run E2 without a valid E1. Native Uzbek editorial review and full E1 -> E2 A/B acceptance remain outstanding; family AI beta NO-GO.
