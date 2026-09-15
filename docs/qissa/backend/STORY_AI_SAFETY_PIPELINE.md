# QISSA Story AI and Safety Pipeline

## Runtime flow

1. Validate and normalize the request.
2. Compact memory and keep only bounded structured context.
3. Replace the child/hero name with the literal `{{HERO}}` token before any model call.
4. Generate a strict JSON story candidate.
5. Validate shape, length, choices, state patches, vocabulary and continuity requirements.
6. Run the multilingual rule scanner.
7. Run the independent Safety Agent and OpenAI Moderation.
8. Publish only when all layers approve.
9. Retry once when validation or safety fails.
10. Return the deterministic localized fallback after repeated failure.

## Server-only configuration

The client must never receive an OpenAI API key. Configure provider keys/models only as Supabase Edge Function secrets:

- `OPENAI_API_KEY`
- `OPENAI_ARCHITECT_MODEL`
- `OPENAI_NARRATOR_MODEL`
- `OPENAI_SAFETY_MODEL`
- `OPENAI_NARRATOR_ESCALATION_MODEL` (optional; keep empty unless separately approved)

Story AI is fail-closed behind two operator-controlled gates: the reviewed code rollout gate and the service-role-only `qissa_runtime_flags.story_ai_enabled` row. A non-empty `OPENAI_API_KEY` and valid parental privacy consent are also required before any provider call. Browser roles cannot read or change the runtime flag.

## Safe rollout order

1. Deploy the function with AI disabled.
2. Run fallback smoke tests for RU, UZ and KZ.
3. Confirm privacy/compliance requirements for processing children's content and obtain the required data-retention configuration.
4. Add the server-side OpenAI key.
5. Enable AI for internal testing only.
6. Review generated samples and safety/fallback rates.
7. Enable the feature for a small family beta after acceptance criteria pass.

## Privacy rule

The actual custom hero name is never included in the model prompt. The model receives `{{HERO}}`; the Edge Function inserts the locally validated name only after the episode has passed validation and safety checks.

## Failure behavior

The child-facing app receives a valid, calm story even when the provider times out, returns invalid JSON, produces unsafe content, or is disabled. Technical and policy failure details stay in server logs and are not shown to the child.
