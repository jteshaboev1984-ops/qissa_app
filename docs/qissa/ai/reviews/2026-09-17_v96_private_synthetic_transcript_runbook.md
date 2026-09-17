# v96 — private, disposable Luna transcript for synthetic story diagnosis

## Why
The v94 E1/A/B acceptance run stopped on E1: semantic safety classified `humiliation`, independent moderation returned `clear`, and the rejected story was not retained. No one can establish from those metadata alone whether this was a true positive or false positive. Never clear a safety flag merely to pass a test.

## Scope and privacy boundaries
- Capture is **OFF by default**; ordinary Story AI requests do not access this table. Runtime Story AI remains OFF between explicitly approved one-shot tests.
- Capture requests need a previously armed, unpredictable UUID header and matching installation UUID in the private database, fresh expiry, unused row and exact synthetic E1 Uzbek/5–7/bedtime/cozy_forest/Malika identity with no memory. A missing/invalid token is rejected **before the normal generation accounting or provider call**.
- Service-role-only table; RLS enabled, no browser SELECT policy. Never expose service-role credentials, capture IDs, installation IDs or raw texts in public workflows, source, logs, HTTP diagnostics, commits, issue comments or build artifacts.
- Successful authorization captures immutable in-memory snapshots: Architect plan/validation; initial Narrator story and choices; validation errors; first and second Repair outputs when used; escalation if used; final semantic-safety verdict and category evidence. A single bounded database write occurs after the normal response decision. The child's returned episode and the block/fallback decision are unchanged.
- If an early provider error prevents a story from being produced, there may be only a partial transcript. Do not infer absent output. Database persistence may fail; report it as unavailable, never leak content into fallback headers or public logs.
- The only allowed test protagonist is the **fictional** Malika. Never copy an actual child's name, memory, series ID, personal facts, or family content into these tests. No user profile or story-library persistence during this smoke.
- No automatic physical deletion is available (`pg_cron` absent). `expires_at` prevents **new claims and writes** after expiry, but **does not delete stored rows or backups**. Manually delete and verify every capture immediately after analysis, even on failure; delete abandoned/expired reservations too. Copies already displayed in this chat or service backups cannot be withdrawn by SQL deletion. Keep any user-facing review confined to synthetic text.

## Operator-only procedure, one explicitly authorized generation admission
1. Confirm `main` SHA, production function SHA/version/JWT, runtime AI OFF, daily aggregate, complete provider-free CI, and a one-shot runner with zero POST retries and no raw-story logs. Agree the cost/test scope; E2, Sol and TTS need separate scope.
2. Apply the reviewed migration with Story AI OFF. Verify RLS, grants and no browser policies before the first diagnostic test.
3. **Privately** arm one row via service-role SQL immediately before the test, with fresh UUIDs from the database. Example for operator SQL only (do not paste its returned IDs into public repository content):

   ```sql
   insert into public.qissa_synthetic_story_diagnostics (capture_id, installation_id, expires_at)
   values (gen_random_uuid(), gen_random_uuid(), now() + interval '20 minutes')
   returning capture_id, installation_id, expires_at;
   ```

4. Send only one direct synthetic `story-generate` request, with matching `installationId`, a fresh `seriesState.id = 'qissa-synthetic-diagnostic-' || <fresh UUID>`, fixed fictional Malika selections, empty memory, synthetic consent and `x-qissa-synthetic-diagnostic-id` as the secret header. Keep both identifiers in the private operator environment, not GitHub Actions log output or persistent workflow inputs. Confirm the AI runtime window is ON **before** initiating the runner, then turn it OFF as soon as admission is observed. No automatic retry. Stop immediately if arming or timing cannot be secured.
5. Confirm response header `X-QISSA-Synthetic-Diagnostic: stored`. Query through trusted operator SQL only. Use `SELECT captured_at, payload FROM public.qissa_synthetic_story_diagnostics WHERE capture_id = <private UUID> AND expires_at > now();` to inspect the original Narrator story, Repair revisions and safety evidence separately. A missing row or `unavailable` header means the text was **not** captured: never guess or request an unapproved second E1.
6. Analyze exact text against the existing safety policy. Distinguish genuine humiliation from harmless shared humor; if unclear, retain the safety block. Record conclusions and numeric/category evidence only in GitHub.
7. Before ending the session, physically delete the precise row and verify zero remaining for that capture ID:

   ```sql
   delete from public.qissa_synthetic_story_diagnostics where capture_id = <private UUID>;
   select count(*) as remaining from public.qissa_synthetic_story_diagnostics where capture_id = <private UUID>;
   ```

   Also remove expired/abandoned synthetic rows after confirming they are not active; do not touch family tables. Confirm Story AI OFF and aggregate claims, then remove any one-shot runner/workflow/trigger and verify clean diff.

## Acceptance / rollback
- Provider-free test must show unauthorized headers fail before `claimStoryGeneration`, valid fixed synthetic context captures distinct immutable stages, bounded payload, no raw text in outputs/logs, and physical deletion instructions.
- CI and typecheck must be GREEN before applying migration or deploying code. Deploy the exact reviewed `main` commit as `story-generate` with `verify_jwt=true`, Story AI OFF; do not run paid tests as part of deployment.
- If privacy or cleanup is uncertain: abort live, keep AI OFF and revert/disable the diagnostic integration. Never downgrade `combineSafety`, moderation, story validators or consent checks.
