# 04 — Memory and Choice Rules

## Memory purpose (MVP)
Memory is not scoring, not ranking, and not punishment/reward.
Its role is continuity and gentle emotional consequence across episodes.

## Choice design rules
- Both choices must be acceptable.
- No trick choices.
- No high-stakes danger.
- No shame framing.
- Each choice has a clear small consequence.
- Choices may include `resolution_text` for a short narrative consequence beat shown after confirmation.

## Allowed StatePatch keys
- `last_event`
- `new_friend`
- `hero_trait`
- `open_arc`
- `relationship_updates`
- `canon_updates`

## Disallowed StatePatch content
- unsafe labels about child identity;
- moral judgment labels;
- permanent negative identity markers;
- sensitive personal data.

## Episode continuity rules
- Episode 2 should reference Episode 1 selected choice naturally.
- Avoid giant recap blocks.
- Avoid complex lore dumps in MVP.
- Preserve simple “world remembers choice” behavior.


## Canon invariants and counterfactual branch merges (2026-11-09)
- Immutable identities (hero name/type and established world identity) must not be overwritten by proposed canon_updates. The normalized main hero is authoritative.
- If a selected option records a method, location, status or relationship, the common state_patch/merge_state must not write a contradictory value over it. Both routes may legitimately converge, but only after a plausible event; semantic time and spatial transitions still require full-path reading.
- Preserving an intentionally open object arc (for example Temur's lost road book) is correct continuity, not automatically an unfinished-story defect.
- Cross-language packages retain the same stable story/part/decision/choice IDs and canon *key names*. Human-readable values are not forced to identical prose or one language.
- Numerical branch-length or sentence-length differences trigger a review signal only; they are not canon errors or an excuse to pad text.
See 13_CANON_AND_LITERARY_ACCEPTANCE_WORKFLOW_V2.md and the read-only check:story-canon-literary command.
