# Seven Roads — Story 1 choice-memory contract

Date: 2026-09-25  
Status: product contract for the authored Seven Roads series

## Purpose

Choices in `Праздник мужества` do **not** decide whether the child receives a good or bad ending. All 16 combinations reach the same approved Story 1 canon ending.

The four decisions build a compact memory profile that later Seven Roads stories can use to change:
- dialogue;
- which character suggests an approach first;
- what a character checks before acting;
- how quickly Temur and Samira trust each other;
- small local scene beats.

They must not create 16 separate future canons or make one choice retroactively “correct”.

## Decision 1 — Temur under pressure

Decision: `temur_forest_escape_method`

- `p3_jump_ditch` → `temurActionStyle = bold_direct`
- `p3_precise_control` → `temurActionStyle = precise_control`

Future use:
- bold_direct: Temur is more likely to suggest a fast direct move when seconds matter;
- precise_control: Temur is more likely to look for a controllable route or exact manoeuvre first.

Do not turn either into a fixed personality trait. It is a remembered tendency, not a label.

## Decision 2 — Samira under uncertainty

Decision: `samira_river_method`

- `p4_marker_then_book` → `samiraDecisionStyle = evidence_first`
- `p4_search_then_marker` → `samiraDecisionStyle = safety_first`

Future use:
- evidence_first: Samira tends to verify signs, maps, records or written clues early;
- safety_first: Samira first inspects the physical situation and avoids committing before the route looks safe.

Both paths remain careful and intelligent.

## Decision 3 — Samira as a rival

Decision: `samira_zaran_wait`

- `p5_leave_immediately` → `samiraRivalryStyle = competition_first`
- `p5_wait_until_visible` → `samiraRivalryStyle = checks_on_temur`

Future use:
- competition_first: Samira is more willing to protect a legitimate competitive advantage;
- checks_on_temur: even while competing, she is more likely to make sure Temur is safe before leaving.

This memory should affect tone and small actions, not moral worth.

## Decision 4 — Temur after Samira's confession

Decision: `temur_trust_response`

- `p6_verify_book` → `temurSamiraTrust = cautious_rebuild`
- `p6_second_chance` → `temurSamiraTrust = second_chance`

Future use:
- cautious_rebuild: Temur cooperates but is more likely to ask for evidence before relying on Samira;
- second_chance: Temur is more willing to accept Samira's word after her voluntary confession.

This is the strongest relationship-memory axis and should be visible in early Story 2 dialogue.

## Story 2 integration rule

A future story should normally surface **one or two** remembered choices in a scene, not all four at once.

Recommended pattern:
1. establish the new plot independently of Story 1 choices;
2. use one remembered tendency to alter who proposes an action or how they approach a problem;
3. use the trust memory to tune dialogue between Temur and Samira;
4. merge back to the common Story 2 plot after the local consequence.

Past choices should create recognition (“the world remembered what I did”), not branching explosion.

## Runtime contract

Story 1 progress already persists:
- `selected_choices`;
- `choice_history`;
- `memory.canonState`;
- `memory.relationshipState`.

`src/features/authoredStory/sevenRoadsStory1Memory.ts` is the canonical adapter from Story 1 choice IDs to the four future-facing memory axes above.
