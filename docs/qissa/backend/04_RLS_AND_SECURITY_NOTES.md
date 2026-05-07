# QISSA RLS and Security Notes (Draft)

## Security model direction (future)
- Parent authentication will be introduced in later stage.
- `parent_user_id` on `child_profiles` links ownership.
- Child profile and session access must be owner-scoped.

## Why trusted write path is required
Client should not directly insert or mark AI content as approved because:
- safety state is policy-sensitive;
- content generation and moderation must be centralized;
- direct writes increase tampering risk.

Recommended model:
- child-facing app reads only allowed session data;
- episode generation, safety status writes, and memory patch writes go through edge functions.

## Service role usage
- service role key is server-side only;
- never exposed in browser bundle;
- edge functions execute privileged writes.

## Draft RLS policy approach
- enable RLS on all core tables;
- owner-select/update on `child_profiles` and related rows via joins;
- block direct insert/update on `story_episodes.safety_status` and `safety_reviews` for non-service roles;
- allow app events with constrained insert policy in later diagnostics stage.

Example patterns (draft):
- `child_profiles`: `auth.uid() = parent_user_id` for select/update.
- `story_sessions`: accessible only if linked `child_profile` belongs to `auth.uid()`.
- `story_episodes`/`story_choices`/`story_choice_events`: access through owned session chain.
- `safety_reviews`: no direct client writes.

## Data minimization for children
Store only what MVP needs:
- setup selections;
- story/memory states;
- generated text and choices.

Do not store unnecessary child personal data (legal names, birthdate, school, address, contact data).

## Local prototype vs backend stage
Current prototype:
- localStorage only;
- no auth;
- no backend RLS.

Backend stage:
- ownership checks + RLS;
- trusted generation/safety write path;
- auditability through event and safety review records.

## Future deletion/export needs
Plan future parent controls for:
- delete child profile and related story data;
- export session/episode history.

These controls are future MVP+ scope and should be designed with ownership checks and audit logs.

## Non-legal note
These notes are implementation guidance, not legal/compliance advice.
