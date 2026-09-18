# QISSA v99 production deployment checkpoint — 2026-09-18

## Scope and preflight

- Base `main` SHA: `dd1f74c1689a186680869235abda244d9197c898` (merged PR #220). The preceding v98 prompt-consistency fix is merged as PR #219.
- PR #220 exact head `61f9588bf7f023867b99c0cc54a9b5859a841d4e` passed official [QISSA CI #567](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35310501953) and [Story Core #348](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35310501956); both concluded success.
- Before deployment, the production `public.qissa_runtime_flags` row `story_ai_enabled` was independently read at `2026-09-18 05:48:18 UTC`: `enabled=false`, last updated `2026-09-18 04:13:55.824333 UTC`. No permission lease was issued.
- The existing production Edge Function was v98, ACTIVE, `verify_jwt=true`, with a one-line import pinned to the preceding main SHA `8bd4b9aed8ca7845a9d4b74a2cd3b6f7d18cb5b8`.

## Deployment and read-back

Deployed **only** the existing `story-generate` Edge Function, preserving `verify_jwt=true`, with its established one-file, commit-pinned entrypoint:

```ts
import 'https://raw.githubusercontent.com/jteshaboev1984-ops/qissa_app/dd1f74c1689a186680869235abda244d9197c898/supabase/functions/story-generate/split-index.ts'
```

Supabase returned ACTIVE v99, `verify_jwt=true`, bundle SHA-256 `80743af0ca207dc5f5d6a7aa6c778ba560a61a5e6e6a3cc027fa5cb191aaaad7`. A separate `get_edge_function` read-back returned the same v99 metadata and exact import string. No database updates, schema/RLS changes, secrets, model/effort switches, TTS activation or other Edge Function deploys were made.

## Postflight / limitations

- Independent read at `2026-09-18 05:49:37 UTC`: `story_ai_enabled=false` with unchanged `updated_at`, i.e. Story AI remained OFF.
- Read-only admissions query: `qissa_provider_daily_usage` has no row for UTC 2026-09-18 at this checkpoint; the 2026-09-17 historical row has 9 generation claims. These are **admissions, not OpenAI HTTP attempts or billed cost**. No paid generation request was sent in this deployment.
- Private diagnostic table `public.qissa_synthetic_story_diagnostics` contains **0 rows** (read-only count).
- Live HTTP smoke was **not completed** in this checkpoint: the available local runtime could not resolve the production Supabase host. Do not assert a post-deployment runtime HTTP PASS on the strength of CI or metadata alone.
- The provider-free CI verifies request-attempt accounting behavior; it does not prove provider billing, story quality, native Uzbek language quality, first-pass E1 length, or E2 continuity. Issue #216 and independent native Uzbek review remain open; E1 plus both real E2 branches require a newly approved and explicitly bounded paid scope. Family beta remains **NO-GO**.

## Next actions (not authorization)

1. Execute a controlled provider-free fallback smoke via the existing authorized GitHub Actions workflow while runtime remains OFF; verify source/reason, claims and cleanup, and record run IDs.
2. Arrange independent native Uzbek age 5–7 editorial review with real human labels; never substitute synthetic fixtures for this review.
3. Only after separately renewed explicit provider-work authorization, prepare one fresh E1 and at most one E2 for each actual A/B choice under `11_DUAL_BRANCH_LIVE_ACCEPTANCE_RUNBOOK.md`. Stop on fallback or missing evidence; disable runtime AI and clean synthetic data in all paths.
