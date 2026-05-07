# 07 — Future Integration Notes

## Goal
Move from local deterministic generation to backend generation without breaking UI contracts.

## Staged implementation path
1. **Stage 1** — Use current local `storyAgent` (today).
2. **Stage 2** — Wrap local `storyAgent` with adapter interface.
3. **Stage 3** — Implement Edge Function `story-generate` using same input/output contract.
4. **Stage 4** — Add real model call behind Edge Function only.
5. **Stage 5** — Enforce Safety Agent decision before saving episode.
6. **Stage 6** — Add fallback handling + audit logs.

## Security/path constraints
- No direct browser-to-model calls.
- Edge Functions are the trusted generation path.
- Service-role usage remains server-side only.
- Keep frontend contract stable during migration.

## Compatibility principle
The local mock response shape and backend response shape must remain contract-compatible to avoid UI flow changes.
