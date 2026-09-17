# QISSA v90 — one-shot live E1 Architect timeout checkpoint (2026-09-17)

## Scope and pinned implementation

- Functional `main`/deployed source: `01f2c45ffeb5d454bdd589dc3013f5070d0bb9dd` (PR #204: isolated deterministic decision-point repair). Supabase `story-generate` v90 ACTIVE, `verify_jwt=true`, entrypoint imports the exact functional SHA.
- Authorized scope: **one** synthetic Uzbek-Latin, age 5–7, Malika, cozy forest, bedtime series Episode 1. No E2 A/B, TTS, provider/model setting changes or code edits. Real user data were not sent; the synthetic request includes the smoke privacy-consent envelope.
- Offline preflight: [run 35203828055](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35203828055) SUCCESS, including memory-event, blueprint safety, split choice-menu diagnostics, predicate precision, deterministic decision-point repair and remote audit HEAD checks. No Story AI requests in the preflight.

## Actual live evidence

- [One-shot live run 35203934718](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35203934718), job `105145029802`. Job outcome FAILURE by design: it rejected a safe fallback as an AI generation. Exactly one POST, no automatic re-request or E2.
- HTTP `200`; `x-qissa-generation-source=safe-fallback`, `x-qissa-fallback-reason=generation-or-safety-failed`.
- `x-qissa-generation-failure-class=provider-timeout`, trace `architect:provider-timeout`, `x-qissa-provider-calls=1` (attempt counter, **not a billing statement**), pipeline `split-v1`, Architect/Narrator configured `gpt-5.6-luna`, escalation `disabled`.
- Failure happened inside Architect's request. No usable AI Blueprint reached blueprint validation or decision-point repair; Narrator, Repair, final memory checks and E2 were **not exercised**. The returned full Uzbek Episode 1 is the pre-existing safe fallback, **not an AI success**; do not score it as new model output.
- Before the test: runtime AI OFF, 2026-09-17 UTC admissions `2`. A single admission changed the counter to `3`; runtime flag set OFF at `2026-09-17 09:15:23 UTC`, then independently read as OFF with counter `3` at `09:15:32 UTC`. A short-lived permit was used. Actual provider invoice/tokens are not verified.
- All temporary workflow, runner and trigger files were deleted from `audit/v90-e1-once-20260917`. Comparison from the functional main SHA to cleaned branch `36e99dd8abda1b3c4fc4e901e35668aa61cd83e6` returned **zero changed files**. Historical paid workflow must never be rerun.

## Provider-free failure analysis

The app's `generateStoryBlueprint` in `split-openai.ts` calls the Responses API with a local **18,000 ms** timeout (1800 output-token cap, reasoning effort `none`). `postJson` sets an `AbortController` timer and translates `AbortError` into `openai_timeout`; `split-index.ts` maps that to `provider-timeout` and fails closed without retry. The job's one-shot step began about `09:15:01 UTC` and produced the fallback near `09:15:22 UTC`, consistent with the configured 18 s local deadline plus request/runner overhead. This is evidence of **our local request deadline firing**, not proof of a provider outage or proof that a longer deadline would have yielded an acceptable Blueprint.

A naive timeout increase is not an isolated fix: `scripts/check-story-cost-guard.mjs` explicitly guards the 128-second theoretical envelope (18 Architect + 30 Narrator + 30 bounded narrator retry + 30 text repair + 12 safety + 8 consistency-only safety retry), against browser default 130 seconds/max 140 and the documented hosted Edge 150-second ceiling. Any latency-budget change requires an end-to-end redesign and GREEN contract tests; do not simply increase Architect time, alter reasoning settings, or automatically retry a possibly billable request based on this single observation.

## Gate and next work

- This live test neither invalidates nor confirms P2 decision-point repair on real model output; its isolated provider-free contract and CI remain GREEN.
- **NO-GO for family-beta Story AI**. Before a further paid E1, analyze provider timing using available privacy-safe metrics or a separately approved bounded experiment; preserve no-retry and short-lived OFF-by-default behavior.
- If a new E1 later genuinely publishes, verify hero, causality, natural Uzbek, two meaningful branches and **top/A/B `last_event` complete sentences**; only after editorial acceptability run independently selected E2 A and B. Family qualification additionally needs both full sessions, score >=20/24 each, no hard failures and independent Uzbek/parent read-aloud review.
