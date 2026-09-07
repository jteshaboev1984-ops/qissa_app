# QISSA Closed Beta Scope — September 2026

Status: approved working scope for launch hardening.

This file narrows the broader product specifications for the first closed beta. It does not delete later roadmap capabilities.

## Product slice

- Target child age: **5–7 only**.
- Primary experience: **bedtime series**.
- Core loop: **Episode 1 → one meaningful choice → visible remembered consequence → Episode 2 → calm ending**.
- Story memory remains the central product differentiator.

## Languages

- **Russian** — primary closed-beta language.
- **Uzbek (Latin)** — visible as **Beta**.
- **Kazakh** — remains in contracts, localization infrastructure, fallbacks and automated tests, but is not exposed as a public closed-beta option yet.

## Public worlds

The closed beta exposes only:

1. `cozy_forest`
2. `magic_garden`
3. `stars_and_space`

`silk_road` is the next editorial/localization priority and should be brought to flagship quality before expanding the rest of the catalog.

Other style packs remain in the codebase for future releases but are not presented as launch-ready content.

## Onboarding

First launch should optimize time-to-story:

- age is fixed to 5–7 for the closed beta;
- language is selected at app level (RU or UZ Beta);
- onboarding asks for hero and world;
- `series` and `bedtime` are the closed-beta defaults;
- advanced modes remain in domain contracts for later releases.

## AI cost policy

Development must be zero-cost by default with respect to Story AI:

- DEV / normal CI: `QISSA_AI_ENABLED=false` and deterministic Story Core/fallback tests;
- live Story AI smoke: **manual only**;
- before a paid AI test, the operator must explicitly choose the expected generation source;
- closed-beta guardrail: **5 story-generation requests per profile/installation per day** once real AI is enabled;
- fallback content remains the graceful failure mode rather than exposing provider errors to the child.

The Story Agent is a launch capability, not a requirement for every development or CI run.

## Listening cost policy

For development and the first closed-beta validation:

- browser/device narration remains the default playback baseline;
- provider TTS stays disabled by default;
- provider TTS may be enabled later on-demand and cache-first after family feedback justifies the cost;
- no family voice, voice cloning or microphone capture is in the closed-beta scope.

## UX decisions

- choice cards appear directly after the story instead of behind a separate “go to choice” screen;
- interacting with the choice area stops active device narration;
- after confirmation, QISSA explicitly shows that the choice was remembered;
- Home prioritizes the current/remembered story state before setup details;
- legal/privacy details remain accessible at first launch without dominating the whole welcome screen.

## Release discipline

Do not expand languages, age groups, worlds, AI usage or provider TTS merely to increase feature count before the core beta loop is proven with families.

Every normal PR must pass deterministic, zero-cost CI. Paid provider acceptance runs are separate manual release checks.
