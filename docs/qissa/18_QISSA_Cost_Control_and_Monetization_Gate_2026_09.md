# QISSA Story AI Cost Control and Monetization Gate — September 2026

Status: **closed-beta operational guard; not a commercial quota design**.

## Current closed-beta limits

QISSA currently protects Story AI with two server-side claim limits before any paid Story provider path can run:

- **5 provider-eligible story claims/day per installation**;
- **30 provider-eligible story claims/day project-wide**.

Story AI remains intentionally disabled for normal launch hardening, so these limits are currently protective infrastructure rather than a live customer entitlement system.

## Important: 30/day is temporary

The **30/day project-wide value is a temporary closed-beta circuit breaker only**. It exists to bound accidental or abusive spend while QISSA is being tested with a small controlled audience.

It must **not** become the permanent production limit and must **not** block normal application use after public launch.

Before QISSA opens a wider public beta, introduces a paid plan/subscription, or materially increases the family count, the universal 30/day value must be replaced by a production entitlement and capacity model.

Tracked implementation gate: **GitHub issue #98 — Replace temporary 30/day global Story AI cap before paid launch**.

## Required production model before paid launch

The future production design should separate three different controls instead of treating one number as all of them:

1. **Plan/account entitlement** — how many AI stories a family is entitled to under free, trial or paid plans.
2. **Abuse/rate protection** — short-window and identity/account protections that stop automation or accidental retry storms.
3. **Emergency project circuit breaker** — an operator-controlled aggregate spend/capacity ceiling for incidents. This should be configurable and set high enough not to become normal customer-facing throttling.

The current 5/day installation limit must be reviewed at the same time. Installation identity is useful for closed beta, but a monetized product should bind entitlement to the authenticated parent/account/subscription rather than treating a browser installation as the commercial billing identity.

## Customer experience requirement

A legitimate paid family must not receive a generic global-limit failure simply because the closed-beta project counter reached 30.

Any future quota exhaustion behavior must be explicit and graceful:

- never corrupt or lose the current story state;
- never silently fail;
- preserve safe deterministic fallback where product policy permits it;
- distinguish a family entitlement limit from a temporary service/capacity incident;
- give paid users a clear next action when their own plan quota is reached;
- keep operator emergency limits separate from advertised plan limits.

## Cost accounting note

A Story AI **claim is not the same thing as one OpenAI HTTP call**. One claimed story can involve generation plus safety/moderation work and may retry within the bounded Story pipeline. Therefore commercial pricing and capacity planning must be based on measured provider cost per completed story/session, not simply on the claim counter.

## Closed-beta rule

Until the monetization/entitlement system is intentionally designed and tested:

- keep the current 30/day project ceiling;
- keep Story AI disabled during routine CI and launch hardening;
- keep paid-capable acceptance manual and bounded;
- do not raise or remove the ceiling merely to make a test pass;
- do not advertise the closed-beta 5/day or 30/day engineering guards as future paid-plan limits.
