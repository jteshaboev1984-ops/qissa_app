# v93 E1 acceptance checkpoint — 2026-09-17

**Status:** NO-GO for generated AI family beta. This was a test-operator synchronization miss, **not** evidence that Narrator, language diagnostics, or Repair passed or failed.

## Immutable context

- Deployed `story-generate` v93 ACTIVE, JWT verified, entrypoint pinned to `main` SHA `a5f6e8dd8c7e2c6884ec5be0d4d7b17ae756feac`; no production code change was made for this test.
- One-shot audit branch `audit/v93-e1-once-20260917`. Dry provider-free preflight GREEN: workflow [35212104954](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35212104954), including field diagnostics, memory continuity, choice repair and safety boundaries.
- Live audit [35212224857](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35212224857), **one synthetic POST**, no retry. The 75-second workflow waiting step completed at 10:47:44 UTC; the request returned at 10:47:47 UTC with HTTP 200, `x-qissa-generation-source=safe-fallback`, `x-qissa-fallback-reason=runtime-disabled`, `x-qissa-runtime-ai=runtime-disabled`, and no reported provider calls. The operator's SQL authorization occurred later, at 10:47:52 UTC. Therefore this was a missed admission window, NOT a generated Luna story.
- Operator set `story_ai_enabled=false` at 10:48:28 UTC. A subsequent read at 10:48:59 UTC confirmed OFF and daily generation admissions remained 4 before/after. Accounting claims are not invoices, but the lease denied this request before claims or provider calls.
- Temporary workflow, runner script and trigger were all deleted from the audit branch. Comparing cleanup HEAD `059a18f7460c13b425a0fc8e497d0f84205fa990` to original `main` gives no net file differences; do not replay historical workflow/POST.
- No E2, Sol escalation, TTS, model changes, secrets, RLS, schema, or user-data cleanup executed.

## Cause and corrective launch sequencing

The error was human/operator coordination of the short lease and a time-based sleep. The SQL update was eight seconds later than the POST; delaying until near the end of a 75-second pause is brittle when API tools and chat turn execution have unpredictable latency. Do **not** fix by lengthening Architect timeouts, relaxing validator/safety, or repeating this workflow.

For any separately authorized future one-shot run: finish offline preflight first; verify exact deployed SHA, flag OFF and accounting; prepare the one-shot runner with a single immutable request and no automatic retries; open a fresh maximum-180-second lease **before dispatching the exact live trigger**, verifying ON and its timestamp immediately; trigger right away with no long fixed sleep; if runner startup exceeds lease, accept fail-closed and do not renew automatically; turn OFF as soon as the admission is observed (or immediately on any failure) and independently confirm OFF and claim delta. A short authorization window is an admission gate, not a hard provider-billing cap. Do not expose child prose in public CI logs.

## Still outstanding

A fresh genuine E1 from v93 with 320–470 words and completed top/A/B memory; whether the language mismatch is in child-visible or immutable fields; editorial native-Uzbek assessment; selected-branch E2 A/B continuity. None of these claims can be inferred from this aborted test. Another POST requires **separate explicit scope/authorization** because the prior one-shot POST was consumed, even though it incurred no reported provider work.
