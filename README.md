# QISSA App

QISSA is a family storytelling product for children in Central Asia, built around safe bedtime series, one meaningful child choice, and remembered consequences across chapters.

## Current status

The repository is in launch-hardening for a narrow closed beta. The approved beta scope is recorded in `docs/qissa/14_QISSA_Closed_Beta_Scope_2026_09.md`.

Closed-beta product slice:

- age **5–7**;
- **Russian** as the primary language and **Uzbek** visible as Beta;
- **Cozy Forest**, **Magic Garden**, and **Stars & Space** as the launch worlds;
- bedtime series by default;
- Episode 1 → one meaningful choice → visible remembered consequence → Episode 2 → calm ending;
- browser/device narration as the initial listening baseline.

The wider codebase retains additional languages, worlds, modes, Story AI, safety, persistence, and audio foundations for later rollout.

## Cost-safe development policy

Normal development and CI are intentionally zero-cost with respect to Story AI and provider TTS:

- deterministic Story Core/fallback flows are used for routine tests;
- the production Story AI live smoke is **manual-only**;
- provider TTS is not required for routine development;
- real provider acceptance runs are separate release checks;
- do not enable paid provider usage merely to validate layout, navigation, persistence contracts, Story Core continuity, localization, or listening UI.

This is intentional development policy, not a missing integration.

## Local development

```bash
npm ci
npm run dev
```

Useful deterministic validation commands:

```bash
npm run audit:prod
npm run check:backend-contracts
npm run check:story-service
npm run check:story-core
npm run check:localized-fallback
npm run check:bedtime-session
npm run check:cosmos-bedtime
npm run check:beta-scope
npm run check:privacy
npm run check:listening
npm run check:audio-agent
npm run check:story-ai
npm run check:story-copy
npm run check:i18n
npm run typecheck
npm run build
```

## Backend

The deployed architecture uses Supabase Edge Functions for:

- story generation (`story-generate`);
- story/profile/state persistence (`story-state`);
- provider-audio foundation (`audio-request`).

The frontend can use the deterministic local provider during development and the remote provider for controlled deployment and acceptance testing. Story generation includes a safe fallback path so provider availability does not need to become a child-facing failure.

## Listening

The current closed-beta baseline uses browser/device speech synthesis with persisted playback position and reading/listening controls. Provider TTS exists as a backend foundation but remains disabled by default for this stage; it can be introduced later on-demand and cache-first after family feedback justifies the cost.

No family voice, voice cloning, microphone capture, payments, or runtime AI image generation are in the closed-beta scope.

## Deployment

GitHub Pages deployment is defined in `.github/workflows/deploy-pages.yml`. The deployed build uses the configured Supabase story/state endpoints, while paid Story AI acceptance is kept outside ordinary CI.

## Release discipline

Do not expand age groups, public languages, worlds, AI usage, or provider TTS merely to increase feature count before the core family loop is proven in closed beta.

Manual QA should prioritize:

- consent → hero/world setup → first story;
- RU and UZ Beta;
- all three public worlds;
- Episode 1 → choice → remembered consequence → Episode 2;
- close/reopen persistence;
- reading/listening behavior;
- profile deletion and data cleanup;
- safe fallback behavior.

Additional project specifications and QA material live under `docs/qissa/`.
