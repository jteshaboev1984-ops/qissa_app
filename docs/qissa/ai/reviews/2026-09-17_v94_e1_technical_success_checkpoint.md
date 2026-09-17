# v94 E1 controlled live technical checkpoint — 2026-09-17

**Result:** first confirmed `openai-structured` E1 technical PASS in the current v90–v94 hardening sequence. **Family AI beta remains NO-GO** pending editorial review and independently verified E2(A) and E2(B) continuity. This report contains no raw child-facing prose or credentials.

## Immutable production and authorization

- Production `story-generate` Edge function v94 `ACTIVE`, `verify_jwt=true`; immutable entrypoint references `main` SHA `3dd6d84259e69f62afc8f30b8c2e9f37645ad88a`, merged [PR #210](https://github.com/jteshaboev1984-ops/qissa_app/pull/210).
- Final v94 patch CI: [QISSA CI #540](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35215034852) GREEN, 41 steps; [Story Core #336](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35215034881) GREEN.
- Before live: runtime AI OFF, admission counter 5. Disposable one-shot audit branch `audit/v94-e1-controlled-once-20260917`; provider-free preflight [run 35216740428](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35216740428) GREEN.
- Operator issued and read back a fresh lease at `2026-09-17 11:39:58 UTC`, verified again 11:40:10, then dispatched exactly one LIVE trigger commit `3f5a69fb4957266ba9848179873c66937b51ee67` at 11:40:23 UTC. Stored runtime flag OFF from `2026-09-17 11:40:49 UTC`, independently read back OFF at 12:11 and 12:12 UTC. Admission counter after live: 6 (5 → 6). No automatic retry or subsequent provider requests under this authorization.

## One genuine E1 — technical evidence

- [Live run 35216924913](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/35216924913), single job, LIVE step GREEN, one synthetic Uzbek-Latin age 5–7 series bedtime E1 for placeholder hero Malika and `cozy_forest`; only one POST.
- Response HTTP 200; `x-qissa-generation-source=openai-structured`; runtime header `enabled`; no fallback, empty validation failure trace; safety self-check approved with `required_action=publish` according to the one-shot runner assertions. This is a technical assertion, not native-editorial approval.
- `x-qissa-initial-story-words=228`; `x-qissa-final-story-words=441`; independently parsed published E1 story word count 441, within hard 320–470. Two distinct choice IDs, resolution lengths 30 and 27 words (within 25–60). `last_event` complete bounded sentences in episode and both branches, lengths 79/92/94 characters. Hero restored to Malika; no unresolved `{{HERO}}`. Output source/model consistent: Narrator `gpt-5.6-luna`, escalation `false`, escalation model disabled, blueprint decision local repair `none`; architect elapsed 13,176 ms. No language mismatch or validation errors reported in final response.
- `x-qissa-provider-calls=5` is **the application's technical counter**, not an invoice, exact count of billed HTTP requests, or cost estimate. Code increments for combined parallel safety calls once; a fifth counter unit cannot by itself prove the exact composition of individual Repair, moderation, or fear adjudication calls. The initial-to-final word increase supports that text correction occurred, but no raw intermediate Repair text was retained and exact retry outcomes cannot be reconstructed.
- We did **not** save a copy of the live story, choices, or child-sensitive text. Consequently, the actual wording, pre-choice causal richness, language naturalness, independent editorial score and true price cannot be verified from this run. The accepted output existed only within the in-flight test response.

## Cleanup and release boundary

- Deleted `.github/workflows/TEMP-v94-e1-controlled-once.yml`, `scripts/TEMP-v94-e1-controlled-once.mjs` and `audit/TEMP-v94-e1-trigger.txt` after the consumed run. Comparing cleanup branch HEAD `5789f33abbe5969d14e86efcdcc32f8e6d71b66c` to original `main` `3dd6d84259e69f62afc8f30b8c2e9f37645ad88a` returned `files=[]`. Do not replay or recreate this run as part of its original authorization.
- No production code changes after v94, no model, token, timeout, schema, flag policy, secret, RLS or grant changes; no E2 A/B, Sol, TTS or real-user data modifications.
- Before calling family beta GO: obtain an independently reviewed, privacy-safe Uzbek E1 sample with native-speaker editorial assessment; verify a fresh E1's complete top/A/B choice and memory envelope; test E2(A) and E2(B) from the exact independent selected-branch state and assess consistency, safety, quality and pricing. These require a separate expressly bounded live authorization. Do not infer their success from this E1.
