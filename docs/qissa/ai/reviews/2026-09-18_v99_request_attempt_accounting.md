# QISSA v99 — HTTP request-attempt accounting checkpoint (2026-09-18)

## Why this change exists

Issue #217: in the split story pipeline the historical `X-QISSA-Provider-Calls` counter counted orchestration stages, not actual outgoing HTTP attempts. In particular, concurrent semantic safety plus moderation were counted as one, and correction/narrow adjudication inside `evaluateStorySafety` was not independently represented. Historical headers, including v96/v97 diagnostic runs, **cannot** be interpreted or retroactively recalculated as actual HTTP requests, billed invocations, token counts or invoices.

## Contract for v99 and later

- `X-QISSA-OpenAI-Request-Attempts` is the canonical request-local count for a provider-eligible generation. It increments exactly once immediately before every outgoing `fetch` to OpenAI in either active split or shared safety/repair transport, after request serialization. It includes Architect, Narrator, text Repair, optional retry/escalation, semantic classifier and its consistency correction, moderation, narrow humiliation/fear adjudication, and independent moderation-fear adjudication when invoked. An HTTP error or abort still counts as an attempted request; a local pre-dispatch failure does not count. The value is **not** proof of successful, completed or billable calls.
- `X-QISSA-Provider-Calls` is retained as a compatibility alias with the same corrected value on these v99 response paths. Its pre-v99 values were stage counts, not HTTP attempt counts. Both attempt headers are per-response diagnostics, not permanent cost records.
- The existing `X-QISSA-Daily-Used`, `X-QISSA-Global-Daily-Used` and `qissa_provider_daily_usage.story_generation_claims` remain request **admissions**. They are separate from OpenAI HTTP attempts, and neither number is an invoice, cost estimate, token count or provider billing reconciliation.
- Concurrent semantic safety and moderation use `Promise.allSettled` to await both *already-started* checks before building the final count or failing closed. No extra call is launched by this change; any nested correction that the existing safety contract schedules is counted before returning. Failed safety/moderation still produces the existing safe fallback.
- Pre-admission responses may omit request-attempt headers; they never enter the provider-eligible block. A missing header must not be interpreted as a measured zero or used for billing claims.

## Provider-free proof and release boundary

The CI regression `scripts/check-openai-request-attempts.mjs` intercepts every OpenAI `fetch` using synthetic fixtures. It exercises Architect and Repair HTTP failures, clean semantic safety, consistency correction, nested humiliation/fear decisions, independent moderation, moderation-fear adjudication, an abort, and a concurrently failing moderation request while safety performs its correction. It asserts the observer count equals intercepted network attempts. It does not measure real provider traffic or prices.

No production story AI activation, model/effort switch, E2, TTS or paid live request is part of v99. Runtime Story AI must stay OFF and fail closed throughout deployment. The new accounting does not prove first-pass E1 length, literary quality, natural Uzbek, branch continuity or beta readiness. Issue #216 and independent native-human editorial review remain outstanding; family beta stays NO-GO pending full E1/A/B E2 acceptance and native review.
