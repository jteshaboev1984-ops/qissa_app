# QISSA Backend Roadmap (Practical, MVP-Oriented)

## Must-have before real launch
- Finalize and migrate schema from `schema_draft.sql`.
- Implement edge functions: `story-generate`, `story-confirm-choice`, `story-reset`.
- Apply RLS ownership model for parent-scoped data.
- Add robust error handling and retry semantics for generation path.
- Add deterministic safety status handling and review logging.
- Validate API contract parity with current frontend types.

## Nice-to-have later (post-MVP hardening)
- Structured event taxonomy for diagnostics.
- Data retention settings for non-critical events.
- Export and delete workflow for parent-owned child data.
- Observability dashboard for generation latency and safety outcomes.

## Not-now list
- payments/subscriptions;
- social features/gamification;
- marketplace;
- parent voice cloning;
- AI image generation;
- open child chat.

## Deployment considerations
- keep environment keys strictly server-side;
- rollout in stages with feature toggles;
- run migrations in non-prod first, then production;
- verify backward compatibility with current app contracts.

## Manual QA needs
- resume flow after page refresh with backend state;
- series mode: confirm choice then open next episode;
- one-time mode completes without continuation;
- reset preserves child profile and reader settings;
- RU/UZ/KZ content and metadata persist correctly.

## Monitoring/logging later
- track function success/failure rates;
- capture generation latency percentiles;
- monitor safety outcome distributions;
- track duplicate choice conflict rates.

## Cost-control notes for future AI generation
- cache episode generation by session+episode where safe;
- set token/input size budgets per request;
- add regeneration limits and fallback policy;
- log per-call cost metadata for operational review.
