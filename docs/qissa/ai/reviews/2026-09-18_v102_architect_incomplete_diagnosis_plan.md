# v102 Architect incomplete — bounded diagnostic experiment (2026-09-18)

## Evidence versus hypothesis

The owner rejected v100 first-story quality. v101 first-encounter guidance passed CI, but its one paid-eligible E1 [run 35320984459](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35320984459) ended at `architect:provider-incomplete` after exactly one outgoing OpenAI attempt. The returned fallback does **not** contain the provider's `incomplete_details.reason`; v101 code dropped that value. Therefore `max_output_tokens` is a plausible hypothesis, **NOT a confirmed v101 cause**. Do not retroactively assert otherwise or infer actual provider invoices from claims/attempts.

The OpenAI Responses API documents `status=incomplete`, `incomplete_details.reason` and an output cap that includes reasoning and visible text. v101 Architect's structured schema requires a plan plus two complete distinct choice objects, each with a six-field state patch. New first-story orientation also demands hero origin, named-character introduction and causal beats. An 1800-token output cap may constrain those fields. This is qualitative capacity reasoning, not an exact tokenizer measurement or reproduction of the lost v101 provider payload.

## Reviewed bounded experiment

- Increase Architect `max_output_tokens` from 1800 to **2400**, within the already-tested 4000-per-request five-cent guard. Narrator, Repair, Safety, model (Luna), stage timeout, 124-second overall deadline, 38-second safety reserve, structured schema and validator must remain unchanged. Existing per-request reserve includes the larger maximum; fail closed if the total estimated reserve would exceed USD $0.05. No parallel tests or automatic retries.
- Inspect `incomplete_details.reason` **only through a fixed allowlist**: `max_output_tokens` / `max_tokens` → `max-output-tokens`; `content_filter` → `content-filter`; everything else → `other`. Never emit raw incomplete JSON, error messages, prose, response IDs, child IDs or secrets in diagnostics. Preserve `provider-incomplete` failure class; expose the normalized reason in `X-QISSA-Provider-Incomplete-Reason` on Architect/Narrator fallback only.
- Add a provider-free regression for classification, header wiring, unchanged five-cent ceiling and strict output maximum, and update existing exact Architect-cap assertions. Existing CI must be fully green before production deploy. Story AI remains OFF throughout merge/deploy.

## Acceptance and stop rule

A subsequent separately bounded **single E1** may check whether the output-headroom experiment produces a genuine AI-authored E1. If fallback recurs, retain its fixed reason and stop; no blind paid retry or E2. A successful technical output must still be shown **inline in chat** to owner for literary judgment before E2 A/B. Compare introductions, active causal plot and genuinely distinct choice consequences with owner feedback. The two branches and family beta remain NO-GO until real editorial qualification. Estimated token caps and HTTP attempts are not an invoice; no real payment amount is claimed.
