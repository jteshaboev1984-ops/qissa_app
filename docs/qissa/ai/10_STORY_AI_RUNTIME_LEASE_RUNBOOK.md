# Story AI runtime acceptance lease (safety runbook)

Scope: Story AI provider calls in `story-generate`, not TTS and not fallback. This is an operational safeguard for controlled live tests, not a substitute for budget ceilings, consent, content safety or independent editorial review.

## Rule

The service-role-only `public.qissa_runtime_flags` row `story_ai_enabled` grants a **maximum 180-second authorization** measured from `updated_at`. The server checks both `enabled=true` and timestamp freshness **on each incoming generation request**, before budget accounting/provider calls. Missing/invalid/future-dated (>30 s skew) timestamps and expired leases fail closed to `safe-fallback` with a diagnostic `X-QISSA-Runtime-AI` reason (`runtime-lease-invalid` or `runtime-lease-expired`). An OFF row always fails closed.

This protects against an abandoned AI-ON state after a chat timeout or an interrupted GitHub workflow. Expiry stops *new* provider-eligible requests; it **does not abort in-flight generations**, automatically change the stored database boolean to false, prevent an administrator from renewing the permit, or establish actual invoice spend. A stale row may still report `enabled=true` when queried directly, so always verify both its timestamp and the effective server gate; reset the stored row to OFF manually in finally/cleanup regardless of the lease.

## Operator procedure for an approved, narrowly scoped live run

1. Obtain explicit scope and maximum provider work for the run. Ensure approved, tested harness, exact deployed SHA and test-data cleanup. Check row is OFF before the run. Do not run multiple parallel sessions.
2. Immediately before the specific acceptance request, explicitly issue a new lease **with a fresh timestamp** from a trusted service-role administrative context:

   ```sql
   update public.qissa_runtime_flags
   set enabled = true, updated_at = clock_timestamp()
   where flag = 'story_ai_enabled';
   ```

   Do not merely set `enabled=true` without updating `updated_at`. Do not update permissions or expose a service-role key to client code.
3. Keep the test within its three-minute admission window. If sequential tests require longer, deliberately stop and re-check scope and current state before renewing; do not implement a background renewal loop. Any new permit needs an explicit operator action. The same request may continue after its admission lease expires.
4. **In a `finally`/always-run cleanup step**, immediately set `enabled=false, updated_at=clock_timestamp()` and verify OFF authoritatively. Remove test profile and installation credential using approved authenticated APIs, and delete temporary triggers/scripts.
5. Log exact deployment SHA, provider-model headers/counters (not invoices), run ID, editor scores and observed rollback/cleanup. If the test or its cleanup fails, treat release as NO-GO; expiry only limits additional admitted requests.

### Avoid operator/runner timing races (2026-09-17 v93 lesson)

A fixed workflow `sleep` is not a dependable synchronization mechanism. In the [v93 audit](reviews/2026-09-17_v93_e1_lease_race_checkpoint.md), the single POST arrived eight seconds before the operator enabled AI; the provider gate correctly returned `runtime-disabled` and no model work occurred. **Never wait until the final few seconds of a sleeping runner step to authorize it.** Chat/tool latency is unpredictable.

For any separately authorized future one-shot test, fully complete provider-free preflight and confirm the deployed SHA while OFF. Prepare a verified immutable single-request trigger, then issue the fresh lease, read back ON and its timestamp, and **immediately dispatch** the one-shot live trigger with no long sleep. If GitHub startup consumes the 180-second lease, let the request fail closed; do not automatically renew or rerun. Observe the claim counter and set OFF promptly after admission, or immediately on a failure; verify OFF and the claim delta regardless of outcome. Record provider-call counts separately from admission claims. This sequencing changes operator procedure only; it does not relax safety or justify extra paid attempts.

## Regression and release controls

`node scripts/check-story-runtime-lease.mjs` tests pure gate behavior at lease boundaries, missing/invalid/future timestamps, and that both story entrypoints read the gate before accounting/provider calls. Official CI runs it on PRs. No SQL migration or new provider request is needed. Deployment is separate from merge; the feature is ineffective until the updated `usage.ts` is actually deployed to the production Edge Function. With production flag currently OFF, deployment should not activate AI.
