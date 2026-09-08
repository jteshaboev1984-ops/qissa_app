# QISSA Closed Beta Backup & Recovery Runbook

Status: launch-hardening / closed beta

Production Supabase project: `phwakdpxxyncyslvnqht` (`ap-south-1`, Postgres 17)

## 1. Why this runbook exists

QISSA is currently on a Supabase **Free** organization plan. Supabase scheduled daily database backups are provided for Pro, Team, and Enterprise projects; Free projects should regularly create their own logical exports. Until the production project is upgraded, the closed-beta recovery point is therefore limited by the most recent manual export.

Important: a database backup does **not** include the actual files stored through Supabase Storage. It only contains database metadata for those objects. QISSA's private `story-audio` bucket must be backed up separately once it contains generated audio.

This runbook intentionally avoids storing production child data, database passwords, service-role keys, provider secrets, or backup archives in GitHub.

## 2. Recovery inventory

Treat the system as four separate recovery assets:

1. **Application source and infrastructure definition** — GitHub `main`.
2. **Database schema and migration history** — repository migrations plus the production Supabase migration history.
3. **Database data** — child profiles, story sessions/episodes/choices, safety records, telemetry, audio metadata, and playback progress.
4. **Supabase Storage objects** — especially the private `story-audio` bucket when provider TTS is enabled.

Edge Functions are recovered from repository source, not from a database dump. Production secrets must be restored manually from a secure secret inventory and must never be committed to the repository.

## 3. Closed-beta backup policy while on Free plan

Create a logical database backup:

- immediately before the first external family enters closed beta;
- immediately before any production migration that changes persistent story/privacy/audio data;
- immediately before a production Edge Function rollout that changes persistence semantics;
- once per day **when closed-beta families have produced new server-side data**;
- immediately before any planned destructive maintenance.

If no production writes occurred since the last verified backup, a duplicate daily export is not required.

Until an automated encrypted off-site process exists, backups are a manual operator responsibility. Store them only in an encrypted, access-controlled off-site location. Do not upload raw dumps to GitHub Actions artifacts, GitHub issues, chat, or a public/shared drive.

### Recovery targets on Free plan

- **RPO:** time since the last successful logical data dump.
- **RTO:** manual; depends on creating/preparing a target project, restoring the dump, redeploying functions, restoring secrets, and running validation.

For a larger public beta, upgrade the backup strategy before scaling usage rather than accepting an unbounded manual RPO.

## 4. Creating a database backup

Prerequisites: Supabase CLI, Docker, and a database connection string stored only in the local shell/session.

Use the Session Pooler connection string by default unless the operator has a reason to use the direct IPv6 connection.

```bash
export QISSA_DB_URL='postgresql://...'
mkdir -p qissa-backup-$(date +%Y%m%d-%H%M)
cd qissa-backup-*

supabase db dump --db-url "$QISSA_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$QISSA_DB_URL" -f schema.sql
supabase db dump --db-url "$QISSA_DB_URL" -f data.sql --use-copy --data-only \
  -x "storage.buckets_vectors" \
  -x "storage.vector_indexes"
```

Do not put `QISSA_DB_URL` into a file in this repository.

After the dump:

1. Verify that `roles.sql`, `schema.sql`, and `data.sql` are non-empty.
2. Record the UTC timestamp and current GitHub `main` SHA beside the encrypted backup, not inside the repository if it would expose sensitive storage details.
3. Encrypt the backup before moving it off the operator machine.
4. Keep at least two recent verified backup generations during active closed beta.

## 5. Storage backup

A Postgres dump cannot restore deleted Storage objects.

Before provider TTS is enabled, confirm whether `story-audio` still contains zero objects. Once audio objects exist, add a separate private-bucket export/copy procedure to every backup cycle.

Storage recovery must preserve:

- bucket privacy;
- object path;
- content type;
- file contents;
- the relationship between the restored `audio_assets.storage_path` values and the actual objects.

Never make `story-audio` public as a recovery shortcut.

## 6. Full recovery to a new Supabase project

Use this path only after confirming the original project cannot be safely recovered in place.

### 6.1 Prepare the target

1. Create the replacement project deliberately; do not create paid resources without explicit cost approval.
2. Prefer the same region and Postgres major version where practical.
3. Confirm required extensions and platform features.
4. Keep application traffic pointed away from the replacement until validation is complete.

### 6.2 Restore database

Use the official dump/restore flow. Do not blindly replay repository migrations on top of a complete schema dump; that can duplicate already-restored DDL.

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$NEW_QISSA_DB_URL"
```

If migration history must be preserved in a new project, export/restore `supabase_migrations` separately using the official Supabase procedure or repair the history only after comparing the restored schema to repository migrations.

### 6.3 Restore Edge Functions

Deploy from the exact validated GitHub revision that corresponds to the backup/recovery decision:

- `story-generate`
- `story-state`
- `audio-request`

Keep JWT verification enabled unless the production contract explicitly changes.

### 6.4 Restore secrets/configuration

Restore from the secure operator inventory, never from Git history:

- Supabase function secrets;
- Story AI enable/disable state;
- provider API keys;
- TTS enable/disable state;
- frontend production environment values.

Default recovery posture is **AI OFF / provider TTS OFF** until deterministic and privacy checks pass.

### 6.5 Restore Storage objects

If `story-audio` contained objects at backup time, recreate the private bucket configuration and restore objects separately. Database metadata without the corresponding object is not a complete restore.

## 7. Post-restore validation order

Run `docs/qissa/ops/post_restore_integrity.sql` against the restored database. Every `integrity` result must be `0` before external traffic is allowed.

Then verify, in order:

1. project status is healthy;
2. expected migrations/schema are present;
3. `story-generate`, `story-state`, and `audio-request` are active with JWT verification;
4. RLS remains enabled on app tables and direct anonymous database access remains fail-closed;
5. privacy consent fields remain consistent;
6. no orphan story/session/choice/safety records exist;
7. at most one non-archived story session exists per child profile;
8. private Storage configuration is correct;
9. deterministic/local QISSA CI is green;
10. production story smoke runs with `expected_source=safe-fallback` while Story AI is intentionally disabled;
11. privacy deletion smoke succeeds;
12. real AI/TTS acceptance is performed only later, manually and with explicit budget approval.

## 8. Current production recovery baseline (2026-09-08)

Read-only verification on production showed:

- project status: `ACTIVE_HEALTHY`;
- database: Postgres `17.6.1.127`;
- 5 child profiles;
- 7 story sessions;
- 13 story episodes;
- 14 story choices;
- 6 confirmed choice events;
- 13 safety reviews;
- 12 voice presets;
- no orphan session/episode/choice/choice-event/safety-review rows;
- no inconsistent stored privacy-consent rows;
- one non-archived session per child profile;
- `app_events`, `audio_assets`, and `playback_progress` were empty at the time of the check.

These row counts are a historical baseline only. Do **not** make a future restore pass/fail decision by requiring the same counts; use the integrity checks and compare counts to the backup being restored.

## 9. Incident rule

During a data-loss or corruption incident, do not manually edit individual production rows to make the UI look correct. Preserve evidence, stop further destructive changes, identify the last known-good backup/revision, restore through a repeatable path, and validate before reopening beta traffic.
