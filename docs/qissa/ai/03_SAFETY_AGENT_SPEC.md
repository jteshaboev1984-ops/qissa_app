# 03 — Safety Agent Specification

## Scope
Defines future Safety Agent policy and output contract used to validate story JSON before save/publish.

## Current vs future
- Current `src/lib/safetyAgent.ts` is a lightweight local placeholder.
- Future backend Safety Agent must be stricter and policy-driven.

## Blocked/flagged categories
- fear/horror/gore
- adult themes
- humiliation/shaming
- conditional love
- discrimination/stereotypes
- political persuasion
- religious pressure
- unsafe instructions
- bedtime overstimulation
- aggressive punishment
- manipulative guilt

## Output contract
Safety Agent returns:
- `approved: boolean`
- `risk_level: low | medium | high`
- `flags: { ...category booleans... }`
- `required_action: publish | regenerate | fallback | block`

## Action definitions
- `publish`: safe to display and persist.
- `regenerate`: not safe enough; regenerate with stricter constraints.
- `fallback`: replace with known calm safe fallback story.
- `block`: do not display generated output.

## Decision guidance
- Low risk + no critical flags → `publish`
- Medium risk / uncertain context → `regenerate` or `fallback`
- High risk / severe violations → `block` or forced `fallback`

## Fallback principle
If unsafe or uncertain, prefer calm safe fallback story instead of exposing raw unsafe text.
