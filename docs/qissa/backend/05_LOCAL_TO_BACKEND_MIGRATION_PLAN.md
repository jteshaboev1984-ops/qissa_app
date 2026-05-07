# QISSA Local-to-Backend Migration Plan

## Stage 0 — Current local prototype
Goal: keep local clickable flow stable.
Files likely touched: none (baseline).
Acceptance criteria: current flow/build/typecheck pass.
Risks: local-only data loss in browser storage.
Rollback: n/a baseline.

## Stage 1 — Backend schema created, app still local
Goal: finalize SQL schema and backend contracts only.
Files likely touched:
- `docs/qissa/backend/*`
- `docs/qissa/backend/schema_draft.sql`
Acceptance criteria: schema/contract docs reviewed; app runtime unchanged.
Risks: schema drift if contracts evolve.
Rollback: docs-only revert.

## Stage 2 — Backend child profile + reader preferences
Goal: move child profile and reader settings persistence to backend.
Files likely touched:
- `src/lib/localPersistence.ts` (adapter split)
- `src/types/qissa.ts`
- future backend adapter files
Acceptance criteria: onboarding/profile/preferences survive multi-device login (when auth exists or temp token strategy).
Risks: partial profile sync issues.
Rollback: feature flag back to local persistence.

## Stage 3 — Backend story sessions and episodes
Goal: persist sessions/episodes backend-side while retaining UX flow.
Files likely touched:
- `src/lib/storyAgent.ts`
- `src/lib/storyStatus.ts`
- contracts files
Acceptance criteria: active session resumes from backend state; no UX flow change.
Risks: stale session resolution conflicts.
Rollback: fallback to local story session adapter.

## Stage 4 — Backend choice confirmation and memory
Goal: persist choice confirmations and memory patch application in backend.
Files likely touched:
- `src/lib/memoryAgent.ts`
- story session data access layer
Acceptance criteria: one confirmed choice per episode enforced server-side.
Risks: duplicate choice races.
Rollback: revert confirmation path to local deterministic logic.

## Stage 5 — Real Story Agent behind Edge Function
Goal: replace local mock generation with edge function call.
Files likely touched:
- `src/lib/storyAgent.ts` (transport layer)
- edge function code (future)
Acceptance criteria: episode payload shape compatible with existing UI.
Risks: latency, generation failures, cost.
Rollback: fallback to local mock generator.

## Stage 6 — Real Safety Agent expansion
Goal: enforce stronger moderation checks and safety review records.
Files likely touched:
- `src/lib/safetyAgent.ts` integration adapter
- future `safety-review` function
Acceptance criteria: blocked/needs-review handling is deterministic.
Risks: false positives/negatives.
Rollback: fail-safe fallback policy + local conservative mode.

## Stage 7 — Optional auth/parent account
Goal: add ownership/authentication controls.
Files likely touched:
- auth layer files (future)
- RLS policies and function auth checks
Acceptance criteria: parent can access only own child profiles/sessions.
Risks: auth migration complexity.
Rollback: keep prototype/local mode for demos, disable backend auth path temporarily.
