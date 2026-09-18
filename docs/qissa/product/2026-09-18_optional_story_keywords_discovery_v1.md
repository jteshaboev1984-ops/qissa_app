# Product discovery: optional parent story ingredients (owner approval pending)

Status: proposal only, related to issue #232. This document does **not** authorize UI, request schema, DB, prompt or production changes, nor any paid generation. The owner wants pre-story choices of keywords without turning a bedtime story into a long questionnaire. Current v104 literary baseline must be reviewed separately so story seeds cannot conceal an underlying plot weakness.

## Existing constraints found in the codebase

- Backend `Language = 'ru' | 'uz' | 'kz'`; current PUBLIC closed-beta languages are **RU and UZ**, not EN. If the feature is eventually released, update RU and UZ copy first and retain KZ contract compatibility without declaring KZ public.
- `stylePackId` already selects a story-world atmosphere (`cozy_forest`, `magic_garden`, `stars_and_space`, etc.). Do not force the parent to choose a contradictory second `place` value (e.g. `space` inside cozy forest). Treat **place as inherited from the existing world selection** rather than another required field.
- Parent consent, existing child-safety gates, established character canon, two in-story E1 choices and E2 continuation stay authoritative. Keywords are OPTIONAL *premise cues*, not E1 branching choices, child profile attributes or invitations to include real child's personal information.

## One-screen proposal (not approved UX copy)

After current world/hero selection and before E1 generation, an optional compact section: **«Добавить детали сказки?»** (candidate RU only; all localized copy requires review). Two independent fields presented as simple single-select chips, both initially unset:

1. **Необычная находка / object:** `strange_key`, `sealed_letter`, `little_bell` (candidate safe enum IDs, not text sent from a child).
2. **Задача героя / goal:** `solve_mystery`, `help_friend`, `discover_secret` (candidate IDs; each needs content-policy and native-language review before release).

The existing `stylePackId` supplies **place**. A prominent **«Удиви меня»** button skips both fields; the normal generate action also works with zero selected cues. A selected clue must feel like a narrative seed, not a demand to describe a prop repeatedly. Do not ask a child to type free text or require another onboarding step. No new friend names chosen from stereotyped animal dictionaries.

Illustrative preview only: `cozy_forest + strange_key + solve_mystery` implies a gentle forest question with a key as a useful clue. Architect must establish what is genuinely at stake, why the key is relevant, what a failed hypothesis teaches, what heroine action changes, what remains unresolved at E1's consequential choice, and an earned, explainable E2 payoff. An unsatisfactory key/leaf/signpost ending previously drafted by us must NOT be treated as canonical or auto-injected. For `help_friend`, the friend needs a concrete fictional want and their own agency, not necessarily another shy singer. No obligatory “good surprise.”

## Implementation design to evaluate separately

- Versioned optional allowlisted enum IDs, never free text in MVP. An absent field must behave exactly like the existing request; unknown IDs and conflicting world/object/goal combinations fail closed with clear parent-facing feedback *before* paid admission. Do not silently override one preference or select an unrelated world.
- Decide where **immutable series-session premise cues** live before touching contracts: E1 receives them once; E2 and retries inherit the same sanitized cues or established canon without re-asking. Do not rewrite already-confirmed stories, relabel existing episode history or persist guesses about the real child. A stable session-level snapshot may be needed, but no new DB column is approved here.
- Expose sanitized cues only to Architect after consent, so the plan owns the relationship between chosen elements, its choices and memory; Narrator and Repair follow that plan. Do not interpolate raw untrusted text into system instructions, do not repeat all words mechanically, and do not weaken existing moderation or budget limits.
- Offline regression matrix before UI release: zero cue / one cue / both cues; incompatible setting cue; malformed ID; missing optional field on legacy request; language RU/UZ and nonpublic KZ compatibility; E1→choice bridge→E2 continuity; after-reload saved sessions; cost/consent failure; word limits, story safety and fallback; choice card meaningfulness and character-name stability. Include unchanged baseline snapshots without the new field.

## Product decision gate

Ask owner to confirm or edit the *two optional categories*, example chip list, button wording, whether discovery belongs in MVP or later, and the rule that place is inherited from the existing world. Do NOT ship before that decision. Then create a distinct implementation PR and a separately authorized one-shot literary A/B comparison with the same age/mood/hero/provider, one story without cues and one story with cues only if cost permission covers BOTH; avoid claiming evidence from unmatched v103/v104 samples. Owner approval of prose is not independent parent/child acceptance. Family beta stays NO-GO.
