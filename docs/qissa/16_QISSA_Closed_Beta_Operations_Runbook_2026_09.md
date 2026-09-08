# QISSA Closed Beta Operations Runbook — September 2026

Status: operational checklist for a small external closed beta. This document is intentionally conservative: it describes what the current production system can prove and what must be verified manually before families are admitted.

## 1. Purpose

This runbook defines how QISSA should be operated during closed beta without silently enabling paid providers, weakening privacy controls, or making unsupported recovery promises.

Production project:

- GitHub repository: `jteshaboev1984-ops/qissa_app`
- Supabase project: `phwakdpxxyncyslvnqht`
- normal Story AI state: **disabled**
- normal provider TTS state: **disabled**
- public beta scope: age **5–7**, RU + UZ Beta, Cozy Forest + Magic Garden + Stars & Space, bedtime series

## 2. Non-negotiable operating rules

1. Do not enable Story AI or provider TTS as part of routine deploy, CI, debugging, or smoke testing.
2. Do not change OpenAI/provider secrets to investigate an unrelated bug.
3. Do not add direct `anon` or `authenticated` database policies just to clear the Supabase `RLS Enabled No Policy` informational notices. The current browser-access model is deliberately fail-closed through Edge Functions.
4. Do not manually edit a family's story rows to “repair” a session. Prefer application-level recovery or deletion/recreation after parent approval.
5. Never copy story text, child/custom hero names, free-form input, or audio content into tickets, analytics, or operational logs.
6. Do not promise restoration from backup until the actual backup/PITR entitlement and a restore procedure have been verified for the production Supabase plan.
7. Full profile deletion is irreversible from the QISSA application boundary. Treat deletion requests as higher priority than story synchronization.

## 3. Known-good production baseline

Current expected functions after the device-bound authorization rollout:

- `story-generate` — v19, JWT verification enabled
- `story-state` — v6, JWT verification enabled
- `audio-request` — v4, JWT verification enabled

Expected database access boundary:

- browser uses the public publishable key only to call Edge Functions;
- trusted persistence/storage access uses the service role inside Edge Functions;
- `installationId` is not sufficient to access persisted family state;
- browser also holds a separate 256-bit `installationAuth` credential;
- only the SHA-256 credential hash is stored in `installation_credentials`;
- direct `anon`/`authenticated` access to `installation_credentials` is revoked.

Expected provider-free family path:

`consent → setup → Episode 1 → one confirmed choice → remembered consequence → Episode 2 → calm ending → reload/continue → optional device narration → parent delete`

## 4. Daily beta health check

Run once before inviting a new batch of families and after any production deployment.

### GitHub

Check:

- latest `main` SHA;
- latest QISSA CI conclusion;
- latest Pages deployment conclusion;
- no unexpected direct commit to `main` after branch protection is enabled;
- no unexpected workflow enabling paid Story AI/TTS.

### Supabase

Check:

- project status is healthy;
- `story-generate`, `story-state`, `audio-request` are ACTIVE;
- versions match the intended release baseline;
- no unexpected growth in `audio_assets` while provider TTS is supposed to be disabled;
- no unexpected `openai-structured` story source during provider-free operation;
- no abnormal accumulation of temporary smoke profiles/sessions/credentials.

### Privacy boundary

Confirm:

- `installation_credentials` remains RLS-enabled;
- `anon` and `authenticated` still have no direct table access;
- provider-free smoke deletion removes the temporary credential with the profile;
- app event payloads contain structural metadata only.

## 5. Required release gates after a normal code change

Before a change reaches production:

1. production dependency audit;
2. repository secret hygiene;
3. backend contract/access checks;
4. installation authorization boundary check;
5. critical offline/reload synchronization check;
6. Story Core continuity;
7. 12-branch closed-beta content matrix;
8. 5–10 minute duration gate and 6–8 minute editorial target;
9. privacy/deletion checks;
10. Audio Agent/device-fallback checks;
11. Story AI safety checks;
12. typecheck and production build.

After a material backend/security change, run a fresh **provider-free production smoke** before declaring the release accepted.

## 6. Provider-free production smoke acceptance

The smoke must stop rather than spend money if Story AI has unexpectedly become active.

Required checks:

- Story live smoke expects `safe-fallback` and fallback reason `ai-disabled` or approved equivalent;
- Audio live smoke expects device fallback and **no provider asset**;
- Closed Beta E2E must pass RU/UZ × 3 worlds × A/B = **12/12**;
- Privacy smoke must pass create → load → delete → confirmed absence → repeat delete;
- temporary installation credentials and test data must be gone afterward.

If a smoke fails, do not weaken the assertion merely to make CI green. Determine whether the product contract, deployment, or the test is stale.

## 7. Incident severity

### P0 — stop beta immediately

Examples:

- one installation can read or mutate another installation's story/progress;
- deletion claims success but family data still loads afterward;
- provider AI/TTS is unexpectedly active and creating uncontrolled spend;
- child story text/name/audio appears in telemetry or public logs;
- production data is being overwritten or broadly lost.

Action:

1. stop onboarding new families;
2. disable the affected capability through the existing provider/feature switch where possible;
3. preserve logs/metadata without copying child story content;
4. identify last known-good GitHub SHA and Edge Function version;
5. roll back the smallest affected component;
6. run provider-free smoke before reopening.

### P1 — beta can continue only with containment

Examples:

- remote resume fails but local story still exists;
- Audio Agent fails but device narration works;
- one beta world has a reproducible content/continuity defect;
- intermittent persistence retry failures that recover after reload.

Action:

- contain the affected feature/world;
- keep device/editorial fallback working;
- fix through normal PR + CI;
- do not enable paid providers as a workaround.

### P2 — normal backlog

Examples:

- cosmetic layout defect;
- awkward but safe copy;
- minor non-blocking performance issue.

## 8. Story persistence recovery

QISSA already keeps critical pending state locally so an offline choice/reset can replay after reload.

Recommended support sequence when a parent reports “QISSA forgot the choice”:

1. Ask them not to create another story yet.
2. Reopen the same browser/device and allow network connectivity.
3. Reload once so the pending synchronization can replay.
4. Confirm whether the remembered choice/next episode returns.
5. If still broken, classify as P1 and investigate structural metadata: installation/session IDs, timestamps, action/error code. Do not request the story text unless a separately approved support process is created.
6. Never repair `canon_state` or choice rows by hand in production as routine support.

## 9. Audio recovery

Current beta-safe behavior is device narration.

If server audio fails while provider TTS is disabled:

- device/browser narration should remain available;
- `audio_assets` should normally remain empty;
- playback progress may be stored remotely and locally;
- changing 0.8×/1.0×/1.2× must not create separate provider assets.

If provider TTS is later enabled deliberately, a separate operational extension is required for provider outage, cache invalidation, cost monitoring and voice QA.

## 10. Parent deletion support

Normal UI path should be used first.

Expected deletion boundary:

- profile;
- story sessions/episodes/choices through cascade/owned deletion path;
- playback progress;
- private provider audio objects/assets if any;
- related technical events;
- installation credential.

After deletion, the application should rotate local installation identity and the deleted snapshot must not load.

If deletion returns an error:

1. do not clear local identity before the server confirms deletion;
2. retry from the same device/session after connectivity is restored;
3. if the error persists, classify P0 for that family until verified;
4. do not claim completion until a read-after-delete check confirms absence.

## 11. Database backup and disaster recovery

### What is proven

QISSA has application-level deletion, deterministic code/migrations in GitHub, versioned Edge Functions, and a known-good production smoke baseline.

### What is not yet proven

The currently available project tooling does **not** expose enough information to confirm the production Supabase backup/PITR entitlement, retention period, or a tested point-in-time restore procedure.

Therefore closed-beta operations must not state “we can always restore your story” or quote a recovery window until this has been manually verified in Supabase.

### Manual pre-beta backup checklist

Before inviting external families, an administrator must open Supabase Dashboard and record in a private operations note:

- whether automated backups are enabled;
- backup frequency and retention;
- whether Point-in-Time Recovery is available/enabled;
- the documented restore procedure for the current plan;
- who is authorized to initiate a restore;
- expected restore impact on writes made after the restore point.

Do not put database dumps or service-role credentials in the public GitHub repository.

### Recovery principle

A database restore affects multiple families and should be a last-resort incident action, not a support mechanism for a single story. Prefer local replay, application-level recovery, or parent-approved recreation for isolated incidents.

## 12. Edge Function rollback map

Current known-good baseline:

- story-generate v19;
- story-state v6;
- audio-request v4;
- application baseline main `7ac5ad8e1a1b65c1c1f7fc8464ba5daac3e041c1` at the device-auth production acceptance.

For rollback:

1. identify the exact last known-good GitHub commit;
2. redeploy only the affected Edge Function from immutable, reviewed source;
3. keep JWT verification enabled;
4. do not change provider switches as part of rollback unless the incident is provider-specific;
5. run provider-free smoke again.

Database schema rollback should not be improvised. Additive security migrations such as `installation_credentials` should normally remain in place even if an application release is rolled back, unless a separately reviewed migration is prepared.

## 13. Paid Story AI acceptance — separate procedure

Do not combine routine beta operations with paid Story AI acceptance.

When the owner explicitly approves the paid test:

- use a small, bounded sample;
- verify RU and UZ;
- cover representative worlds and continuation state;
- record generation source, latency, validation/safety outcome, retries and cost/token metadata where available;
- inspect literary structure and 5–10 minute duration;
- stop if unexpected provider behavior or spend appears.

Until that approval, `openai-structured` is **not** part of routine release acceptance.

## 14. Before admitting the first external family

All of the following must be true:

- GitHub `main` protection is enabled with mandatory PR/CI and no normal force-push/delete path;
- latest provider-free production Story/Audio/E2E/Privacy smokes are green;
- installation credential isolation is green;
- production database is free of new smoke residue;
- backup/PITR status has been manually verified and documented privately;
- real phone/browser UX pass is complete;
- one full story has been timed aloud with natural expressive reading and the child-choice pause;
- parent consent/delete flow has been manually verified from UI;
- local legal/privacy review requirements are understood before any broader public launch.

## 15. Scope freeze during closed-beta hardening

Do not add as launch-hardening work:

- additional age groups;
- additional public languages;
- additional worlds beyond the approved three;
- payments;
- family voice cloning;
- runtime AI-generated images;
- automatic provider TTS enablement;
- multi-agent paid generation chains.

Closed beta should answer one central product question first: **does QISSA reliably become a safe, memorable 6–8 minute bedtime ritual that remembers the child's decision and makes the family want to return?**
