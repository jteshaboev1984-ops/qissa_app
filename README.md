# QISSA App

QISSA is a family storytelling product for children in Central Asia, built around safe bedtime series, one meaningful child choice, and remembered consequences across chapters.

## Current status

The repository is in launch-hardening for a narrow closed beta. The approved beta scope is recorded in `docs/qissa/14_QISSA_Closed_Beta_Scope_2026_09.md`, with the current production baseline in `docs/qissa/15_QISSA_Launch_Baseline_Audit_2026_09.md`.

Closed-beta product slice:

- age **5–7**;
- **Russian** as the primary language and **Uzbek** visible as Beta;
- **Cozy Forest**, **Magic Garden**, and **Stars & Space** as the launch worlds;
- bedtime series by default;
- Episode 1 → one meaningful choice → visible remembered consequence → Episode 2 → calm ending;
- primary editorial target of roughly **6–8 minutes** for the complete bedtime story, inside a hard **5–10 minute** release envelope;
- read and listen modes with remote Audio Agent integration plus safe browser/device narration fallback.

The wider codebase retains additional languages, worlds, modes, Story AI, safety, persistence, and audio foundations for later rollout.

## Cost-safe development policy

Normal development and CI are intentionally zero-cost with respect to Story AI and provider TTS:

- deterministic Story Core/fallback flows are used for routine tests;
- the production Story AI live smoke is **manual-only**;
- provider TTS is not required for routine development;
- real provider acceptance runs are separate release checks;
- do not enable paid provider usage merely to validate layout, navigation, persistence contracts, Story Core continuity, localization, or listening UI.

Once Story AI is deliberately enabled, the closed-beta server guard currently allows:

- up to **5 provider-eligible story claims/day per installation**;
- up to **30 provider-eligible story claims/day project-wide**.

The **30/day project ceiling is temporary closed-beta protection, not a commercial plan limit**. Before wider public or paid launch, it must be replaced with plan/account entitlements plus a separately configurable emergency project circuit breaker. See `docs/qissa/18_QISSA_Cost_Control_and_Monetization_Gate_2026_09.md` and GitHub issue #98.

This is intentional development policy, not a missing integration.

## Local development

```bash
npm ci
npm run dev
```

Useful deterministic validation commands:

```bash
npm run audit:prod
npm run check:secret-hygiene
npm run check:backend-contracts
npm run check:backend-access
npm run check:installation-auth
npm run check:story-service
npm run check:critical-sync-reload
npm run check:story-core
npm run check:beta-content
npm run check:bedtime-duration
npm run check:localized-fallback
npm run check:bedtime-session
npm run check:cosmos-bedtime
npm run check:beta-scope
npm run check:story-cost-guard
npm run check:observability
npm run check:mobile-ux
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
- listening/audio requests (`audio-request`).

Browser clients do not write the family story tables directly. Persisted family operations go through trusted Edge Functions, with device-bound installation authorization protecting state and playback access. Public story tables remain RLS-enabled with no direct browser policies by design.

The frontend can use the deterministic local provider during development and the remote provider for controlled deployment and acceptance testing. Story generation includes a safe fallback path so provider availability does not need to become a child-facing failure.

## Listening

The closed-beta Listening flow is hybrid and cache-first:

1. the family presses Play;
2. the client asks the Audio Agent for an owned approved episode;
3. if a provider audio asset is already available, a signed private URL can be used;
4. if provider TTS is disabled or unavailable, QISSA falls back safely to browser/device narration;
5. playback position and speed can be restored remotely, with local progress retained as an offline safety net.

Provider TTS remains disabled by default for this stage. The current production baseline proves integration, authorization, fallback and resume behavior; it does not yet claim paid provider voice-quality acceptance.

No family voice, voice cloning, microphone capture, payments, or runtime AI image generation are in the closed-beta scope.

## Mobile web baseline

The deployed Pages build includes closed-beta mobile safeguards:

- `viewport-fit=cover`;
- dynamic viewport height handling;
- device safe-area insets;
- bottom navigation clearance above phone home indicators/notches;
- minimum 44 px touch targets on coarse-pointer devices;
- deterministic `check:mobile-ux` coverage in CI and production deployment.

A final physical-device regression is still required before external family admission.

## Deployment

GitHub Pages deployment is defined in `.github/workflows/deploy-pages.yml`. The deployed build uses the configured Supabase story/state/audio endpoints, while paid Story AI acceptance is kept outside ordinary CI.

Normal PR CI and production Pages builds run deterministic product, security, privacy, Story Core, localization, audio and mobile ergonomics gates before release.

## Release discipline

Do not expand age groups, public languages, worlds, AI usage, provider TTS, payments, or runtime AI images merely to increase feature count before the core family loop is proven in closed beta.

Manual QA should prioritize:

- consent → hero/world setup → first story;
- RU and UZ Beta;
- all three public worlds;
- Episode 1 → choice → remembered consequence → Episode 2;
- close/reopen persistence;
- reading/listening behavior;
- real-phone safe areas and touch behavior;
- profile deletion and data cleanup;
- safe fallback behavior.

Additional project specifications, launch records, cost controls and QA material live under `docs/qissa/`.
