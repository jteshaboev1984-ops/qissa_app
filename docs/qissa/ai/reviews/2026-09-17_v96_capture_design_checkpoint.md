# v96 diagnostic capture checkpoint

Prepared private synthetic transcript capture for one operator-armed E1. Final branch diff is intentionally limited to the private capture module/contract, migration, provider-free regression, Story pipeline hooks, package registration and runbook. No provider call is part of this change.

Safety properties: capture is off by default; only a pre-armed UUID + matching installation UUID + exact synthetic Uzbek 5–7 Malika E1 context can claim it; claim happens before generation accounting/provider work; ordinary family requests cannot be captured; snapshots are immutable copies; transcript never goes to response/logs/GitHub; the service-role-only row expires for writes within two hours and must be manually deleted after review. Safety verdicts and fallback behavior are unchanged.

The next live diagnostic, if run, is a separate one-shot scope: one E1 only, no E2/Sol/TTS/retry, Story AI OFF before/after, then private SQL review and immediate row deletion with zero-row verification.
