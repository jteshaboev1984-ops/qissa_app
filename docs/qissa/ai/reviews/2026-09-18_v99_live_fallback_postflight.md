# QISSA v99 live fallback postflight — 2026-09-18 UTC

## Baseline, exact runtime and method

- Repository main before this checkpoint: `233cb28f7135f228e9ee005581513d0d66b88459` (PR #223 merged, provider-free CI #570 GREEN). Production `story-generate` remains ACTIVE **v99**, JWT ON, import pinned to the reviewed functional source SHA `dd1f74c1689a186680869235abda244d9197c898`; the later main commits are docs and audit-helper changes only.
- Production `story_ai_enabled=false` was read authoritatively at `2026-09-18 06:22:34 UTC`. No operator lease was issued. Public smoke uses the stored GitHub Actions publishable/legacy anon key and does not access service-role secrets.
- The available connector had no `workflow_dispatch` action and the local container could not resolve the Supabase host. Instead, a known, manually verified historical **provider-free-only** Story smoke job was re-run with the existing GitHub `rerun_workflow_job` action. Its workflow at `a2873675e4c4aff66cbc4fa5bc04cf6d387eeb49` explicitly sets `QISSA_EXPECTED_GENERATION_SOURCE=safe-fallback`, has no AI toggle, and checks out `240eb40a35c9559806f590d73d1361da833f415a`. Its Story smoke script blob `8cc6b17516a628bfa1e8d46baab0ac7dae12bdb8` is identical to the current main smoke script. The workflow checkout SHA is historical, **but the HTTP requests hit current production v99**; do not misreport the checkout as current main.

## Actual live result — PASS within the provider-free scope

- Workflow run: [34931260626](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/34931260626), **attempt 2** (re-run), new job **105503790561**, success. Prior attempt 1 on 2026-09-15 is historical and not the new evidence.
- Time window: 2026-09-18 approximately `06:24:13–06:24:21 UTC`.
- RU Cozy Forest: `safe-fallback`, `runtime-disabled`, PASS.
- UZ Cozy Forest: `safe-fallback`, `runtime-disabled`, PASS.
- KZ Cozy Forest: `safe-fallback`, `runtime-disabled`, PASS.
- RU Stars & Space: E1 + both fallback-choice continuations, PASS. Workflow logs print the space E1 source but do not print individual continuation source headers; the smoke script itself explicitly asserts expected `safe-fallback` for each branch.
- Source, episode shape, hero resolution, choice counts and relevant fallback story checks passed according to the script. This is **not** an AI-authored E1 or E2 editorial/continuity test and does not exercise the v99 HTTP-attempt counter because all requests stop before admission.

## Independent postflight

- At `2026-09-18 06:24:36 UTC`, authoritative flag read-back remained `enabled=false` with unchanged `updated_at=2026-09-18 04:13:55.824333 UTC`.
- `qissa_provider_daily_usage` still has **no 2026-09-18 row**; prior 2026-09-17 generation claims remain 9. No provider admission was registered in this smoke; admissions are not billing proof.
- Read-only production aggregates after the smoke: 11 profiles, 13 sessions, 22 episodes, 6 installation credentials, 0 private synthetic diagnostic rows. The smoke only calls story generation and does not persist child profiles; the existing known orphan in issue #152 was **not deleted**.
- No new paid AI/TTS/model change, no database mutation, no JWT/secret/config change and no production deployment during the smoke.

## Stop condition / next authorization

The provider-free HTTP milestone is complete. The **full paid A/B and editorial milestone is not**. No fresh paid E1/E2 was attempted: this requires newly agreed maximum provider work/cost beyond three *admissions*, a reviewed one-shot harness with full private E1 envelope capture and authenticated A/B cleanup, no broad concurrent smoke, explicit OFF-on-failure, and an independent native Uzbek editor/parent review. Development daily limit zero is accounting-only and is not a protective spend cap. Do not present CI/static fixtures as real model quality or claim family-beta GO. See `11_DUAL_BRANCH_LIVE_ACCEPTANCE_RUNBOOK.md` and issue #216.
