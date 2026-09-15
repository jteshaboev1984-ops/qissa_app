# Luna launch-readiness hardening — 2026-09-15

This change set keeps Story AI behind the existing reviewed production rollout gate and does not enable paid generation by itself.

Pre-launch hardening in this branch:

- restores a hidden server-side emergency provider ceiling of 5 story claims per installation per day and 30 claims project-wide per day;
- keeps the product-facing beta quota disabled, so this operational ceiling is not presented as a family plan limit;
- raises the production browser Story timeout to 130 seconds, with a 140-second client hard maximum, so the bounded split pipeline is not abandoned by the browser before the backend finishes;
- keeps that client window below Supabase hosted Edge Functions' 150-second request/worker ceiling;
- corrects `.env.example` so an API key alone is never documented as enabling Story AI;
- keeps Architect, Narrator and Safety defaults on GPT-5.6 Luna and Sol escalation opt-in/disabled by default;
- adds permanent CI assertions for the spend and timeout contracts.

The production rollout code gate remains OFF in this change set. A separate deliberate code-reviewed change is required before any paid acceptance call.
